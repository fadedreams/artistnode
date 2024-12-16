
import Artist from '../models/artist'
import cloudinary from "../cloud/index"
import { uploadImageToCloud, formatArtist } from "../utils/helper"

export const createArtist = async (req, res) => {
    const { name, about, gender } = req.body;
    const { file } = req;

    const newArtist = new Artist({ name, about, gender });

    if (file) {
        const { url, public_id } = await uploadImageToCloud(file.path);
        newArtist.avatar = { url, public_id };
    }
    await newArtist.save();
    res.status(201).json({
        id: newArtist._id,
        name,
        about: about,
        gender,
        avatar: newArtist?.avatar.url
    });
    //res.status(201).json({ 'artist': newArtist });
    //res.status(201).json({ artist: formatArtist(newArtist) });
};

export const updateArtist = async (req, res) => {
    const { name, about, gender } = req.body;
    const { file } = req;

    const { id } = req.params;
    const artist = await Artist.findById(id)
    if (!artist) { return res.status(404).json({ message: `No artist with id: ${id}` }); }

    const public_id = artist.avatar?.public_id;
    if (public_id && file) {
        const { result } = await cloudinary.uploader.destroy(public_id);
        if (result !== "ok") {
            return res.status(500).json({ message: "Error deleting image from cloudinary" });
        }
    }
    if (file) {
        const { url, public_id } = await uploadImageToCloud(file.path);
        artist.avatar = { url, public_id };
    }

    artist.name = name;
    artist.about = about;
    artist.gender = gender;
    await artist.save();

    res.status(201).json({
        id: artist._id,
        name,
        about: about,
        gender,
        avatar: artist?.avatar.url
    });
};

export const removeArtist = async (req, res) => {
    const { id } = req.params;

    //if (!isValidObjectId(id)) return sendError(res, "Invalid request!");
    const artist = await Artist.findById(id);
    console.log(artist)
    if (!artist) return res.status(404).json({ message: "Record not found!" });

    const public_id = artist.avatar?.public_id;

    // remove old image if there was one!
    if (public_id) {
        const { result } = await cloudinary.uploader.destroy(public_id);
        if (result !== "ok") {
            res.status(500).json({ message: "Error deleting image from cloudinary" });
        }
    }

    await Artist.findByIdAndDelete(id);

    res.json({ message: "Record removed successfully." });
};

export const searchArtist = async (req, res) => {
    const { name } = req.query;
    //const result = await Artist.find({ $text: { $search: `"${query.name}"` } });
    if (!name.trim()) return res.json({ results: [] });
    const result = await Artist.find({
        name: { $regex: name, $options: "i" },
    });

    const artist = result.map((artist) => formatArtist(artist));
    res.json({ results: artist });
}

export const getLatestArtist = async (req, res) => {
    const result = await Artist.find().sort({ createdAt: "-1" }).limit(12);

    const artist = result.map((artist) => formatArtist(artist));

    res.json(artist);
};

export const getSingleArtist = async (req, res) => {
    const { id } = req.params;

    //if (!isValidObjectId(id)) res.status(404).json({ message: "Invalid request!" });

    const artist = await Artist.findById(id);
    if (!artist) res.status(404).json({ message: "Record not found!" });
    res.json({ artist: formatArtist(artist) });
};

export const getActors = async (req, res) => {
    const { pageNo, limit } = req.query;

    const artist = await Artist.find({})
        .sort({ createdAt: -1 })
        .skip(parseInt(pageNo) * parseInt(limit))
        .limit(parseInt(limit));

    const profiles = artist.map((artist) => formatArtist(artist));
    res.json({
        profiles,
    });
};


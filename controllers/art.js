
import Art from '../models/art.js'
import cloudinary from "../cloud/index.js"
import { uploadImageToCloud, formatArtist } from "../utils/helper.js"

//export const createArtPrev1 = async (req, res) => {
//const { file } = req;
//if (!file) return sendError(res, "video file is missing!");

//try {
//const { secure_url: url, public_id } = await cloudinary.uploader.upload(
//file.path,
//{
//resource_type: "video",
//}
//);
//res.status(201).json({ url, public_id });
//} catch (error) {
//console.error("Error uploading video:", error);
//res.status(500).json({ error: "Error uploading video" });
//}
//};
export const createArtPrev = async (req, res) => {
  const { file } = req;
  if (!file) return sendError(res, "image file is missing!");

  try {
    const { secure_url: url, public_id } = await cloudinary.uploader.upload(
      file.path,
      {
        resource_type: "image",
      }
    );
    res.status(201).json({ url, public_id });
  } catch (error) {
    console.error("Error uploading image:", error);
    res.status(500).json({ error: "Error uploading image" });
  }
};

export const createArt = async (req, res) => {
  const { file, body } = req;
  const {
    title,
    director,  // Director should be a valid ObjectId
    releaseDate,  // Corrected "releaseDate" field name
    status,
    type,
    artcats,  // Art categories should be an array of strings
    tags,
    artists,  // Artists should be an array of valid ObjectIds
    writers,  // Writers should be an array of valid ObjectIds
    poster,
  } = body;

  const newArt = new Art({
    title,
    director,
    releaseDate,
    status,
    type,
    artcats,
    tags,
    artists,
    writers,
    poster,
  });

  if (file) {
    const { url, public_id } = await uploadImageToCloud(file.path);
    newArt.poster = { url, public_id };
  }

  try {
    await newArt.save();
    res.status(201).json({
      id: newArt._id,
      title: newArt.title,
      // Include other fields as needed in the response
    });
  } catch (error) {
    // Handle the error and send an error response
    console.error("Error creating art:", error);
    res.status(500).json({ error: "Error creating art" });
  }
};

export const updateArt = async (req, res) => {
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

export const removeArt = async (req, res) => {
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

export const searchArt = async (req, res) => {
  const { name } = req.query;
  //const result = await Artist.find({ $text: { $search: `"${query.name}"` } });
  if (!name.trim()) return res.json({ results: [] });
  const result = await Art.find({
    name: { $regex: name, $options: "i" },
  });

  const artist = result.map((artist) => formatArtist(artist));
  res.json({ results: artist });
}

export const getLatestArt = async (req, res) => {
  const result = await Art.find().sort({ createdAt: "-1" }).limit(12);

  const artist = result.map((artist) => formatArtist(artist));

  res.json(artist);
};

export const getSingleArt = async (req, res) => {
  const { id } = req.params;

  //if (!isValidObjectId(id)) res.status(404).json({ message: "Invalid request!" });

  const artist = await Art.findById(id);
  if (!artist) res.status(404).json({ message: "Record not found!" });
  res.json({ artist: formatArtist(artist) });
};

export const getArt = async (req, res) => {
  const { pageNo, limit } = req.query;

  const artist = await Art.find({})
    .sort({ createdAt: -1 })
    .skip(parseInt(pageNo) * parseInt(limit))
    .limit(parseInt(limit));

  const profiles = artist.map((artist) => formatArtist(artist));
  res.json({
    profiles,
  });
};



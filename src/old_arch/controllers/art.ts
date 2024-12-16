
import Art from '@src/models/art'
import Review from '@src/models/review'
import cloudinary from "@src/cloud/index"
import { uploadImageToCloud, averageRatingPipeline } from "../utils/helper"

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
        director,
        releaseDate,
        status,
        type,
        artcats,
        tags,
        artists,
        writers,
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
        const {
            secure_url: url,
            public_id,
            responsive_breakpoints,
        } = await cloudinary.uploader.upload(file.path, {
            transformation: {
                width: 1280,
                height: 720,
            },
            responsive_breakpoints: {
                create_derived: true,
                max_width: 640,
                max_images: 3,
            },
        });

        const finalPoster = { url, public_id, responsive: [] };

        const { breakpoints } = responsive_breakpoints[0];
        if (breakpoints.length) {
            for (let imgObj of breakpoints) {
                const { secure_url } = imgObj;
                finalPoster.responsive.push(secure_url);
            }
        }
        newArt.poster = finalPoster;
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
    const art = await Art.findById(id)
    if (!art) { return res.status(404).json({ message: `No art with id: ${id}` }); }

    const public_id = art.avatar?.public_id;
    if (public_id && file) {
        const { result } = await cloudinary.uploader.destroy(public_id);
        if (result !== "ok") {
            return res.status(500).json({ message: "Error deleting image from cloudinary" });
        }
    }
    if (file) {
        const { url, public_id } = await uploadImageToCloud(file.path);
        art.avatar = { url, public_id };
    }

    art.name = name;
    art.about = about;
    art.gender = gender;
    await art.save();

    res.status(201).json({
        id: art._id,
        name,
        about: about,
        gender,
        avatar: art?.avatar.url
    });
};

export const removeArt = async (req, res) => {
    const { id } = req.params;

    //if (!isValidObjectId(id)) return sendError(res, "Invalid request!");
    const art = await Art.findById(id);
    console.log(art)
    if (!art) return res.status(404).json({ message: "Record not found!" });

    const public_id = art.avatar?.public_id;

    // remove old image if there was one!
    if (public_id) {
        const { result } = await cloudinary.uploader.destroy(public_id);
        if (result !== "ok") {
            res.status(500).json({ message: "Error deleting image from cloudinary" });
        }
    }

    await Art.findByIdAndDelete(id);

    res.json({ message: "Record removed successfully." });
};

export const searchArt = async (req, res) => {
    const { name } = req.query;
    //const result = await Art.find({ $text: { $search: `"${query.name}"` } });
    if (!name.trim()) return res.json({ results: [] });
    const result = await Art.find({
        name: { $regex: name, $options: "i" },
    });

    res.json({ art });
}

export const getLatestArt = async (req, res) => {
    const result = await Art.find().sort({ createdAt: "-1" }).limit(12);

    res.json(art);
};

export const getSingleArt = async (req, res) => {
    const { idr } = req.params;

    // mongoose.Types.ObjectId(id)

    if (!isValidObjectId(idr))
        return sendError(res, "Art id is not valid!");

    const art = await Art.findById(idr).populate(
        "director writers cast.actor"
    );

    const [aggregatedResponse] = await Review.aggregate(
        averageRatingPipeline(art._id)
    );

    const reviews = {};

    if (aggregatedResponse) {
        const { ratingAvg, reviewCount } = aggregatedResponse;
        reviews.ratingAvg = parseFloat(ratingAvg).toFixed(1);
        reviews.reviewCount = reviewCount;
    }

    const {
        title,
        storyLine,
        cast,
        writers,
        director,
        releseDate,
        genres,
        tags,
        language,
        poster,
        trailer,
        type,
    } = art;

    res.json({
        art: {
            idr,
            title,
            storyLine,
            releseDate,
            genres,
            tags,
            language,
            type,
            poster: poster?.url,
            trailer: trailer?.url,
            cast: cast.map((c) => ({
                id: c._id,
                profile: {
                    id: c.actor._id,
                    name: c.actor.name,
                    avatar: c.actor?.avatar?.url,
                },
                leadActor: c.leadActor,
                roleAs: c.roleAs,
            })),
            writers: writers.map((w) => ({
                id: w._id,
                name: w.name,
            })),
            director: {
                id: director._id,
                name: director.name,
            },
            reviews: { ...reviews },
        },
    });
};

export const getArt = async (req, res) => {
    const { pageNo, limit } = req.query;

    const art = await Art.find({})
        .sort({ createdAt: -1 })
        .skip(parseInt(pageNo) * parseInt(limit))
        .limit(parseInt(limit));

    res.json({
        art,
    });
};



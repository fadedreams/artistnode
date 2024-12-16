import crypto from "crypto";
import cloudinary from "../cloud/index";
import Review from "../models/review";

export const sendError = (res, error, statusCode = 401) =>
    res.status(statusCode).json({ error });


export const handleNotFound = (req, res) => {
    sendError(res, "Not found", 404);
};

export const uploadImageToCloud = async (file) => {
    const { secure_url: url, public_id } = await cloudinary.uploader.upload(
        file,
        { gravity: "face", height: 500, width: 500, crop: "thumb" }
    );

    return { url, public_id }
};

export const formatArtist = (actor) => {
    const { name, gender, about, _id, avatar } = actor;
    return {
        id: _id,
        name,
        about,
        gender,
        avatar: avatar?.url,
    };
};


export const getAverageRatings = async (artId) => {
    const [aggregatedResponse] = await Review.aggregate(
        this.averageRatingPipeline(artId)
    );
    const reviews = {};

    if (aggregatedResponse) {
        const { ratingAvg, reviewCount } = aggregatedResponse;
        reviews.ratingAvg = parseFloat(ratingAvg).toFixed(1);
        reviews.reviewCount = reviewCount;
    }

    return reviews;
};

// averageRatingPipeline.js
export const averageRatingPipeline = (artId) => [
    {
        $lookup: {
            from: "Review",
            localField: "rating",
            foreignField: "_id",
            as: "avgRat",
        },
    },
    {
        $match: { parentArt: artId },
    },
    {
        $group: {
            _id: null,
            ratingAvg: {
                $avg: "$rating",
            },
            reviewCount: {
                $sum: 1,
            },
        },
    },
];

// relatedArtAggregation.js
export const relatedArtAggregation = (tags, artId) => [
    {
        $lookup: {
            from: "Art",
            localField: "tags",
            foreignField: "_id",
            as: "relatedArts",
        },
    },
    {
        $match: {
            tags: { $in: [...tags] },
            _id: { $ne: artId },
        },
    },
    {
        $project: {
            title: 1,
            poster: "$poster.url",
            responsivePosters: "$poster.responsive",
        },
    },
    {
        $limit: 5,
    },
];

export const topRatedArtsPipeline = (type) => {
    const matchOptions = {
        reviews: { $exists: true },
        status: { $eq: "public" },
    };

    if (type) matchOptions.type = { $eq: type };

    return [
        {
            $lookup: {
                from: "Art",
                localField: "reviews",
                foreignField: "_id",
                as: "topRated",
            },
        },
        {
            $match: matchOptions,
        },
        {
            $project: {
                title: 1,
                poster: "$poster.url",
                responsivePosters: "$poster.responsive",
                reviewCount: { $size: "$reviews" },
            },
        },
        {
            $sort: {
                reviewCount: -1,
            },
        },
        {
            $limit: 5,
        },
    ];
};


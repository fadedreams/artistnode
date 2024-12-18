import { Request, Response } from 'express';
import cloudinary from 'cloudinary';
import Review from '@src/infrastructure/persistence/models/reviewModel';

export const sendError = (res: Response, error: string, statusCode: number = 401): Response =>
    res.status(statusCode).json({ error });

export const handleNotFound = (req: Request, res: Response): void => {
    sendError(res, "Not found", 404);
};

export const uploadImageToCloud = async (file: Express.Multer.File): Promise<{ url: string, public_id: string }> => {
    const { secure_url: url, public_id } = await cloudinary.v2.uploader.upload(
        file.path,
        { gravity: "face", height: 500, width: 500, crop: "thumb" }
    );

    return { url, public_id };
};

export const formatArtist = (actor: { name: string, gender: string, about: string, _id: string, avatar?: { url: string } }): { id: string, name: string, about: string, gender: string, avatar?: string } => {
    const { name, gender, about, _id, avatar } = actor;
    return {
        id: _id,
        name,
        about,
        gender,
        avatar: avatar?.url,
    };
};

export const getAverageRatings = async (artId: string): Promise<{ ratingAvg: string, reviewCount: number }> => {
    const [aggregatedResponse] = await Review.aggregate(
        averageRatingPipeline(artId)
    );
    const reviews: { ratingAvg?: string, reviewCount?: number } = {};

    if (aggregatedResponse) {
        const { ratingAvg, reviewCount } = aggregatedResponse;
        reviews.ratingAvg = parseFloat(ratingAvg).toFixed(1);
        reviews.reviewCount = reviewCount;
    }

    return reviews as { ratingAvg: string, reviewCount: number };
};

export const averageRatingPipeline = (artId: string): object[] => [
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
            ratingAvg: { $avg: "$rating" },
            reviewCount: { $sum: 1 },
        },
    },
];

export const relatedArtAggregation = (tags: string[], artId: string): object[] => [
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

export const topRatedArtsPipeline = (type: string | undefined): object[] => {
    const matchOptions: { reviews: { $exists: boolean }, status: { $eq: string }, type?: { $eq: string } } = {
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


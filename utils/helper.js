import crypto from "crypto";
import cloudinary from "../cloud/index.js";
import Review from "../models/review.js";

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


export const getAverageRatings = async (movieId) => {
  const [aggregatedResponse] = await Review.aggregate(
    this.averageRatingPipeline(movieId)
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
export const averageRatingPipeline = (movieId) => [
  {
    $lookup: {
      from: "Review",
      localField: "rating",
      foreignField: "_id",
      as: "avgRat",
    },
  },
  {
    $match: { parentMovie: movieId },
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

// relatedMovieAggregation.js
export const relatedMovieAggregation = (tags, movieId) => [
  {
    $lookup: {
      from: "Movie",
      localField: "tags",
      foreignField: "_id",
      as: "relatedMovies",
    },
  },
  {
    $match: {
      tags: { $in: [...tags] },
      _id: { $ne: movieId },
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

export const topRatedMoviesPipeline = (type) => {
  const matchOptions = {
    reviews: { $exists: true },
    status: { $eq: "public" },
  };

  if (type) matchOptions.type = { $eq: type };

  return [
    {
      $lookup: {
        from: "Movie",
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


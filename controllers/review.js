
import { isValidObjectId } from "mongoose";
import Art from "../models/art.js";
import Review from "../models/review.js";
import { getAverageRatings } from "../utils/helper.js";

export const addReview = async (req, res) => {
  const { artId } = req.params;
  const { content, rating } = req.body;
  const userId = req.user._id;

  if (!req.user.isVerified)
    return res.status(401).json({ message: "Please verify your email!" });

  //if (!isValidObjectId(artId)) res.status(400).json({ message: "Invalid ID!" });

  const art = await Art.findOne({ _id: artId, status: "public" });
  if (!art) res.status(404).json({ message: "Art not found!" });

  const isAlreadyReviewed = await Review.findOne({
    owner: userId,
    parentMovie: art._id,
  });
  if (isAlreadyReviewed)
    return res.status(400).json({ message: "You have already reviewed!" });

  // create and update review.
  const newReview = new Review({
    owner: userId,
    parentMovie: art._id,
    content,
    rating,
  });

  // updating review for the art.
  art.reviews.push(newReview._id);
  await art.save();

  // saving the new review
  await newReview.save();

  const reviews = await getAverageRatings(art._id);

  res.json({ message: "Your review has been added.", reviews });
};

export const updateReview = async (req, res) => {
  const { reviewId } = req.params;
  const { content, rating } = req.body;
  const userId = req.user._id;

  //if (!isValidObjectId(reviewId)) res.status(400).json({ message: "Invalid ID!" });

  const review = await Review.findOne({ owner: userId, _id: reviewId });
  if (!review) return res.status(404).json({ message: "Review not found!" });

  review.content = content;
  review.rating = rating;

  await review.save();

  res.json({ message: "Your review has been updated." });
};

export const removeReview = async (req, res) => {
  const { reviewId } = req.params;
  const userId = req.user._id;

  //if (!isValidObjectId(reviewId)) res.status(400).json({ message: "Invalid ID!" });

  const review = await Review.findOne({ owner: userId, _id: reviewId });
  if (!review) return res.status(404).json({ message: "Review not found!" });

  const art = await Art.findById(review.parentMovie).select("reviews");
  art.reviews = art.reviews.filter((rId) => rId.toString() !== reviewId);

  await Review.findByIdAndDelete(reviewId);

  await art.save();

  res.json({ message: "Review removed successfully." });
};

export const getReviewsByArt = async (req, res) => {
  const { artId } = req.params;

  //if (!isValidObjectId(artId)) res.status(400).json({ message: "Invalid ID!" });

  const art = await Art.findById(artId)
    .populate({
      path: "reviews",
      populate: {
        path: "owner",
        select: "name",
      },
    })
    .select("reviews title");

  const reviews = art.reviews.map((r) => {
    const { owner, content, rating, _id: reviewID } = r;
    const { name, _id: ownerId } = owner;

    return {
      id: reviewID,
      owner: {
        id: ownerId,
        name,
      },
      content,
      rating,
    };
  });

  res.json({ art: { reviews, title: art.title } });
};


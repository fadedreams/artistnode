import mongoose from 'mongoose';

const reviewSchema = mongoose.Schema({
  // owner parentArt rating content
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  parentArt: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Art",
    required: true,
  },
  content: {
    type: String,
    trim: true,
  },
  rating: {
    type: Number,
    required: true,
  },
});

const Review = mongoose.model("Review", reviewSchema);

export default Review; // Default export

// If you prefer named exports, you can do both:
// export { Review, reviewSchema };

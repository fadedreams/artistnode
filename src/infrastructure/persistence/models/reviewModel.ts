import mongoose, { Schema } from 'mongoose';

const reviewSchema = new Schema({
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

export default Review;


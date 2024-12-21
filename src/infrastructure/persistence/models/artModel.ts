import mongoose, { Schema } from 'mongoose';

const artSchema = new Schema(
    {
        title: {
            type: String,
            trim: true,
            required: false,
        },
        director: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Artist",
        },
        releaseDate: {
            type: Date,
            required: false,
        },
        status: {
            type: String,
            required: false,
            enum: ["public", "private"],
        },
        type: {
            type: String,
            required: false,
        },
        artcats: {
            type: [String],
            required: true,
        },
        tags: {
            type: [String],
            required: false,
        },
        artists: [
            {
                artist: { type: mongoose.Schema.Types.ObjectId, ref: "Artist" },
                roleAs: String,
                leaderArtist: Boolean,
            },
        ],
        writers: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Artist",
            },
        ],
        poster: {
            type: {
                url: String,
                public_id: String,
                responsive: [String],
            },
            required: false,
        },
        reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: "Review" }],
    },
    {
        timestamps: true,
        toJSON: {
            transform: (doc, ret) => {
                // Remove Mongoose internal properties that can't be serialized
                delete ret._id;  // _id is a special field in Mongoose documents
                delete ret.__v;   // __v is the version key Mongoose adds by default
                delete ret.toPrimitive;  // Ensure to delete toPrimitive if it exists
                return ret;
            },
        },
    }
);

const Art = mongoose.model("Art", artSchema);
export default Art;

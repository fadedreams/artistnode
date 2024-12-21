import mongoose, { Schema } from 'mongoose';

const replacer = (key: string, value: any) => {
    if (typeof value === 'object' && value !== null) {
        const descriptor = Object.getOwnPropertyDescriptor(value, 'toPrimitive');
        if (descriptor && typeof descriptor.value === 'function') {
            const newValue = { ...value };
            delete newValue.toPrimitive;
            return newValue;
        }
    }
    return value;
};

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
            //enum: artcats,
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
    { timestamps: true }
);

const serializedSchema = JSON.stringify(artSchema, replacer);

const Art = mongoose.model("Art", artSchema);

export default Art;

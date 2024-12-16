import mongoose from "mongoose";

const artistSchema = mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
    },
    about: {
      type: String,
      trim: true,
      required: false,
    },
    gender: {
      type: String,
      trim: true,
      required: false,
    },
    avatar: {
      type: Object,
      url: String,
      public_id: String,
    },
  },
  { timestamps: true }
);

artistSchema.index({ name: "text" });

const Artist = mongoose.model("Artist", artistSchema);

export default Artist;


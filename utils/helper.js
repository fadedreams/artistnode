import crypto from "crypto";
import cloudinary from "../cloud/index.js";
//import Review from "../models/review";

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



import jwt from 'jsonwebtoken';
import User from '../models/user.js'

export const isAuth = async (req, res, next) => {
  const token = req.headers?.authorization;
  if (!token) {
    res.status(401).json({ error });
  }
  const jwtToken = token.split("Bearer ")[1];

  if (!jwtToken) {
    res.status(401).json("Invalid token!");
  }
  const decode = jwt.verify(jwtToken, process.env.JWT_SECRET);
  const { userId } = decode;
  const user = await User.findById(userId);
  if (!user) {
    res.status(401).json("unauthorized access!");
  }
  req.user = user;
  next();
};

export const isAdmin = async (req, res, next) => {
  const { user } = req;
  if (user.role !== "admin") {
    res.status(401).json("unauthorized access!");
  }
  next();
};

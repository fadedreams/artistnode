
import jwt from 'jsonwebtoken';
import User from '../models/user.js'

export const create = async (req, res) => {
    const { email, password, role } = req.body;

    const oldUser = await User.findOne({ email });

    if (oldUser) return res.status(400).json({ message: "User already exists!" });

    const newUser = new User({ email, password, role });
    await newUser.save();

    res.status(201).json({
        user: {
            id: newUser._id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
        },
    });
};

export const signIn = async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User doesn't exist!" });

    const matched = await user.comparePassword(password);
    if (!matched) return res.status(400).json({ message: "Incorrect password!" });

    const { _id, name, role, isVerified } = user;

    const jwtToken = jwt.sign({ userId: _id }, process.env.JWT_SECRET);


    res.json({
        user: { id: _id, name, email, role, token: jwtToken, isVerified },
    });
};

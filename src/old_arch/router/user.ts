import express from 'express';
const router = express.Router();

import {
    create, // Import the create function
    signIn,
    //verifyEmail,
    //resendEmailVerificationToken,
    //forgetPassword,
} from '@src/controllers/user';

import {
    userValidator,
    validate,
    signInValidator,
} from '@src/middlewares/validator'; // Import your controllers with ES6 syntax
import { isAuth } from '../middlewares/auth';
router.post('/create', userValidator, validate, create);
router.post('/signin', signInValidator, validate, signIn);

router.get("/isauth", isAuth, (req, res) => {
    const { user } = req;
    res.json({
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            isVerified: user.isVerified,
            role: user.role,
        },
    });
});

router.get("/isauth", isAuth, (req, res) => {
    const { user } = req;
    res.json({
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            isVerified: user.isVerified,
            role: user.role,
        },
    });
});

export default router;


import express from 'express';
import { create, signIn } from '@src/infrastructure/web/controllers/user';

import { userValidator, validate, signInValidator } from '@src/infrastructure/web/middlewares/validator';
import { isAuth } from '@src/infrastructure/web/middlewares/auth';

const router = express.Router();

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

export default router;


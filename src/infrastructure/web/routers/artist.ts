import express from 'express';
import { create, signIn } from '@src/infrastructure/web/controllers/user';
import { createArtist } from '@src/infrastructure/web/controllers/artist';

import { userValidator, validate, artistInfoValidator } from '@src/infrastructure/web/middlewares/validator';

import { isAuth, isAdmin } from '@src/infrastructure/web/middlewares/auth';

const router = express.Router();
// router.post('/create', isAuth, isAdmin, artistInfoValidator, validate, createArtist);
router.post('/create', isAuth, isAdmin, validate, createArtist);


export default router;


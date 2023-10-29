import express from 'express';
const router = express.Router();
import * as artCtrl from '../controllers/art.js';
import { artistInfoValidator, validate } from '../middlewares/validator.js';
import { uploadImage, uploadVideo } from '../middlewares/multer.js';
import { isAuth, isAdmin } from '../middlewares/auth.js';

//router.post('/create', isAuth, isAdmin, uploadImage.single('avatar'), artistInfoValidator, validate, artistCtrl.createArtist);
router.post('/uploadartprev', uploadImage.single('image'), artCtrl.createArtPrev);
router.post('/create', uploadImage.single('poster'), artCtrl.createArt);
//router.post('/uploadartprev1', uploadVideo.single('video'), artCtrl.createArtPrev1);
//router.post('/uploadart', uploadImage.single('avatar'), artistInfoValidator, validate, artistCtrl.createArtist);
//router.post('/update/:id', isAuth, isAdmin, uploadImage.single('avatar'), artistInfoValidator, validate, artistCtrl.updateArtist);
//router.delete("/:id", isAuth, isAdmin, artistCtrl.removeArtist);

//router.get("/search", artistCtrl.searchActor);
//router.get("/latest", artistCtrl.getLatestActors);
//router.get("/:id", artistCtrl.getSingleActor);

export default router;




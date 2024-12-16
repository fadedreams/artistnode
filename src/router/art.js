import express from 'express';
const router = express.Router();
import * as artCtrl from '../controllers/art.js';
import { artistInfoValidator, validate } from '../middlewares/validator.js';
import { uploadImage, uploadVideo } from '../middlewares/multer.js';
import { isAuth, isAdmin } from '../middlewares/auth.js';

//router.post('/create', isAuth, isAdmin, uploadImage.single('avatar'), artistInfoValidator, validate, artistCtrl.createArtist);
router.post('/uploadartprev', uploadImage.single('image'), artCtrl.createArtPrev);
router.post('/create', isAuth, isAdmin, uploadImage.single('poster'), artCtrl.createArt);
router.post('/update/:id', isAuth, isAdmin, uploadImage.single('avatar'), artistInfoValidator, validate, artCtrl.updateArt);
//router.post('/uploadartprev1', uploadVideo.single('video'), artCtrl.createArtPrev1);
router.delete("/:id", isAuth, isAdmin, artCtrl.removeArt);

router.get("/search", artCtrl.searchArt);
router.get("/latest", artCtrl.getLatestArt);
router.get("/:id", artCtrl.getArt);

export default router;




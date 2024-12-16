import express from 'express';
const router = express.Router();
import * as artCtrl from '@src/controllers/art';
import { artistInfoValidator, validate } from '@src/middlewares/validator';
import { uploadImage, uploadVideo } from '@src/middlewares/multer';
import { isAuth, isAdmin } from '@src/middlewares/auth';

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




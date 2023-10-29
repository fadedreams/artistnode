import express from 'express';
const router = express.Router();
import * as artistCtrl from '../controllers/artist.js';
import { artistInfoValidator, validate } from '../middlewares/validator.js';
import { uploadImage } from '../middlewares/multer.js';
import { isAuth, isAdmin } from '../middlewares/auth.js';

router.post('/create', isAuth, isAdmin, uploadImage.single('avatar'), artistInfoValidator, validate, artistCtrl.createArtist);
router.post('/update/:id', isAuth, isAdmin, uploadImage.single('avatar'), artistInfoValidator, validate, artistCtrl.updateArtist);
router.delete("/:id", isAuth, isAdmin, artistCtrl.removeArtist);

router.get("/search", artistCtrl.searchArtist);
router.get("/latest", artistCtrl.getLatestArtist);
router.get("/:id", artistCtrl.getSingleArtist);

export default router;



import express from 'express';
const router = express.Router();
import * as artistCtrl from '../controllers/artist.js';
import { artistInfoValidator, validate } from '../middlewares/validator.js';
import { uploadImage } from '../middlewares/multer.js';
import { isAuth, isAdmin } from '../middlewares/auth.js';

router.post('/create', isAuth, isAdmin, uploadImage.single('avatar'), artistInfoValidator, validate, artistCtrl.createArtist);
router.post('/update/:id', isAuth, isAdmin, uploadImage.single('avatar'), artistInfoValidator, validate, artistCtrl.updateArtist);
router.delete("/:id", isAuth, isAdmin, artistCtrl.removeArtist);

router.get("/search", artistCtrl.searchActor);
router.get("/latest", artistCtrl.getLatestActors);
router.get("/:id", artistCtrl.getSingleActor);

export default router;



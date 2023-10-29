import express from 'express';
const router = express.Router();
import * as artistCtrl from '../controllers/artist.js';
import { artistInfoValidator, validate } from '../middlewares/validator.js';
import { uploadImage } from '../middlewares/multer.js';

router.post('/create', uploadImage.single('avatar'), artistInfoValidator, validate, artistCtrl.createArtist);
router.post('/update/:id', uploadImage.single('avatar'), artistInfoValidator, validate, artistCtrl.updateArtist);

router.delete("/:id", artistCtrl.removeArtist);
router.get("/search", artistCtrl.searchActor);
//router.get("/search", isAuth, isAdmin, searchActor);
router.get("/latest", artistCtrl.getLatestActors);
//router.get("/actors", isAuth, isAdmin, getActors);
router.get("/:id", artistCtrl.getSingleActor);

export default router;



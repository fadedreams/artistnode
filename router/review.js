
import express from 'express';
const router = express.Router();
import * as reviewCtrl from '../controllers/review.js';
import { validateRatings, validate } from '../middlewares/validator.js';
import { uploadImage } from '../middlewares/multer.js';
import { isAuth, isAdmin } from '../middlewares/auth.js';

router.post("/:id", isAuth, validateRatings, validate, reviewCtrl.addReview);
router.patch("/:id", isAuth, validateRatings, validate, reviewCtrl.updateReview);
router.delete("/:id", isAuth, reviewCtrl.removeReview);
router.get("/:id", reviewCtrl.getReviewsByArt);

export default router;





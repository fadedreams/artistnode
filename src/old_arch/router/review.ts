
import express from 'express';
const router = express.Router();
import * as reviewCtrl from '@src/controllers/review';
import { validateRatings, validate } from '@src/middlewares/validator';
import { uploadImage } from '@src/middlewares/multer';
import { isAuth, isAdmin } from '@src/middlewares/auth';

router.post("/:id", isAuth, validateRatings, validate, reviewCtrl.addReview);
router.patch("/:id", isAuth, validateRatings, validate, reviewCtrl.updateReview);
router.delete("/:id", isAuth, reviewCtrl.removeReview);
router.get("/:id", reviewCtrl.getReviewsByArt);

export default router;





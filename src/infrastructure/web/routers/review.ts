import { Router } from 'express';
import ReviewController from '@src/infrastructure/web/controllers/review';
import { Logger } from 'winston';
import { isAuth } from '@src/infrastructure/web/middlewares/auth';
import { validateRatings, validate } from '@src/infrastructure/web/middlewares/validator';

const reviewRouter = (logger: Logger) => {
    const reviewController = new ReviewController(logger);
    const router = Router();

    router.post('/:id', isAuth, validateRatings, validate, async (req, res, next) => {
        try {
            await reviewController.addReview(req, res);
        } catch (error) {
            next(error);
        }
    });

    router.patch('/:id', isAuth, validateRatings, validate, async (req, res, next) => {
        try {
            await reviewController.updateReview(req, res);
        } catch (error) {
            next(error);
        }
    });

    router.delete('/:id', isAuth, async (req, res, next) => {
        try {
            await reviewController.removeReview(req, res);
        } catch (error) {
            next(error);
        }
    });

    router.get('/:id', async (req, res, next) => {
        try {
            await reviewController.getReviewsByArt(req, res);
        } catch (error) {
            next(error);
        }
    });

    return router;
};

export default reviewRouter;

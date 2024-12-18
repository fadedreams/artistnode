import { Router } from 'express';
import ReviewController from '@src/infrastructure/web/controllers/review';
import { Logger } from 'winston';
import { isAuth } from '@src/infrastructure/web/middlewares/auth'; // Adjust the path to your middlewares
import { validateRatings, validate } from '@src/infrastructure/web/middlewares/validator'; // Adjust path to validator

const reviewRouter = (logger: Logger) => {
    const reviewController = new ReviewController(logger);
    const router = Router();

    // Review Routes with Middleware
    router.post('/:id', isAuth, validateRatings, validate, reviewController.addReview); // Add a review
    router.patch('/:id', isAuth, validateRatings, validate, reviewController.updateReview); // Update a review
    router.delete('/:id', isAuth, reviewController.removeReview); // Remove a review
    router.get('/:id', reviewController.getReviewsByArt); // Get reviews by artist

    return router;
};

export default reviewRouter;


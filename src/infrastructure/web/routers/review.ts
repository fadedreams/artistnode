import { Router } from 'express';
import ReviewController from '@src/infrastructure/web/controllers/review';
import { Logger } from 'winston';
import { isAuth } from '@src/infrastructure/web/middlewares/auth';
import { validateRatings, validate } from '@src/infrastructure/web/middlewares/validator';

const reviewRouter = (logger: Logger, redisState: any) => {
    const reviewController = new ReviewController(logger);
    const router = Router();

    // Utility function to check cache
    const getCachedData = async (cacheKey: string) => {
        if (redisState.status.connected) {
            try {
                const cachedData = await redisState.client.get(cacheKey);
                if (cachedData) {
                    logger.info('Returning cached data from Redis.');
                    return JSON.parse(cachedData);
                }
            } catch (redisError) {
                logger.warn('Redis error occurred while checking cache.', redisError);
            }
        } else {
            logger.warn('Redis is not connected. Skipping cache lookup.');
        }
        return null;
    };

    // Utility function to set cache
    const setCache = async (cacheKey: string, data: any) => {
        if (redisState.status.connected) {
            try {
                await redisState.client.set(cacheKey, JSON.stringify(data), { EX: 3600 });
                logger.info('Cached data in Redis.');
            } catch (cacheError) {
                logger.warn('Failed to cache data in Redis.', cacheError);
            }
        }
    };

    // Add review
    router.post('/:id', isAuth, validateRatings, validate, async (req, res, next) => {
        try {
            await reviewController.addReview(req, res);
        } catch (error) {
            next(error);
        }
    });

    // Update review
    router.patch('/:id', isAuth, validateRatings, validate, async (req, res, next) => {
        try {
            await reviewController.updateReview(req, res);
        } catch (error) {
            next(error);
        }
    });

    // Remove review
    router.delete('/:id', isAuth, async (req, res, next) => {
        try {
            await reviewController.removeReview(req, res);
        } catch (error) {
            next(error);
        }
    });

    // Get reviews by art (with caching)
    router.get('/:id', async (req, res, next) => {
        try {
            const cacheKey = `reviews:art:${req.params.id}`; // Cache based on art ID
            const cachedData = await getCachedData(cacheKey);
            if (cachedData) {
                return;
            }

            await reviewController.getReviewsByArt(req, res);

            // After getting the result, cache it
            const result = res.locals.reviewsData; // Assuming the result is set in res.locals
            await setCache(cacheKey, result);

            // Send the response
            res.json(result);
        } catch (error) {
            next(error);
        }
    });

    return router;
};

export default reviewRouter;

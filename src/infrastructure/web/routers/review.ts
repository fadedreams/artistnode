import { Router } from 'express';
import ReviewController from '@src/infrastructure/web/controllers/review';
import { Logger } from 'winston';
import { isAuth } from '@src/infrastructure/web/middlewares/auth';
import { validateRatings, validate } from '@src/infrastructure/web/middlewares/validator';
import { Client } from '@elastic/elasticsearch'; // Import Elasticsearch Client type

const reviewRouter = (logger: Logger, redisState: any, elk_client: Client | null) => {
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
            const reviewData = req.body;

            // Log the review creation to Elasticsearch
            if (elk_client) {
                try {
                    await elk_client.index({
                        index: 'reviews', // Index name for reviews
                        body: {
                            ...reviewData,
                            timestamp: new Date().toISOString(),
                        },
                    });
                    logger.info('Logged review creation to Elasticsearch.');
                } catch (elkError) {
                    logger.warn('Failed to log review creation to Elasticsearch.', elkError);
                }
            }

            await reviewController.addReview(req, res);
        } catch (error) {
            next(error);
        }
    });

    // Update review
    router.patch('/:id', isAuth, validateRatings, validate, async (req, res, next) => {
        try {
            const reviewId = req.params.id;
            const updatedData = req.body;

            // Log the review update to Elasticsearch
            if (elk_client) {
                try {
                    await elk_client.index({
                        index: 'reviews', // Index name for reviews
                        body: {
                            reviewId,
                            ...updatedData,
                            timestamp: new Date().toISOString(),
                        },
                    });
                    logger.info('Logged review update to Elasticsearch.');
                } catch (elkError) {
                    logger.warn('Failed to log review update to Elasticsearch.', elkError);
                }
            }

            await reviewController.updateReview(req, res);
        } catch (error) {
            next(error);
        }
    });

    // Remove review
    router.delete('/:id', isAuth, async (req, res, next) => {
        try {
            const reviewId = req.params.id;

            // Log the review deletion to Elasticsearch
            if (elk_client) {
                try {
                    await elk_client.index({
                        index: 'reviews', // Index name for reviews
                        body: {
                            reviewId,
                            action: 'deleted',
                            timestamp: new Date().toISOString(),
                        },
                    });
                    logger.info('Logged review deletion to Elasticsearch.');
                } catch (elkError) {
                    logger.warn('Failed to log review deletion to Elasticsearch.', elkError);
                }
            }

            await reviewController.removeReview(req, res);
        } catch (error) {
            next(error);
        }
    });

    // Get reviews by art (with caching)
    router.get('/:id', async (req, res, next): Promise<void> => {
        try {
            const cacheKey = `reviews:art:${req.params.id}`; // Cache based on art ID
            const cachedData = await getCachedData(cacheKey);
            if (cachedData) {
                return res.json(cachedData); // Return cached data if available
            }

            // Fetch data from the database or Elasticsearch
            let reviewsData;
            if (elk_client) {
                try {
                    // Query Elasticsearch for reviews
                    const result = await elk_client.search({
                        index: 'reviews', // Index name for reviews
                        body: {
                            query: {
                                match: { artId: req.params.id }, // Match reviews by art ID
                            },
                        },
                    });
                    reviewsData = result.hits.hits.map((hit: any) => hit._source);
                    logger.info(`Fetched ${reviewsData.length} reviews for art ${req.params.id} from Elasticsearch.`);
                } catch (elkError) {
                    logger.warn('Failed to fetch reviews from Elasticsearch. Falling back to database.', elkError);
                    reviewsData = await reviewController.getReviewsByArt(req, res); // Fallback to database
                }
            } else {
                reviewsData = await reviewController.getReviewsByArt(req, res); // Fetch from database
            }

            // Cache the result
            await setCache(cacheKey, reviewsData);

            // Send the response
            res.json(reviewsData);
        } catch (error) {
            next(error);
        }
    });

    return router;
};

export default reviewRouter;

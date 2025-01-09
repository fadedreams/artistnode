import { Router, Request, Response, NextFunction } from 'express';
import ReviewController from '@src/infrastructure/web/controllers/review';
import { Logger } from 'winston';
import { isAuth } from '@src/infrastructure/web/middlewares/auth';
import { validateRatings, validate } from '@src/infrastructure/web/middlewares/validator';
import { Client } from '@elastic/elasticsearch';
import ElasticsearchConnection from '@src/infrastructure/persistence/ElasticsearchConnection';

export class ReviewRouter {
    private router: Router;
    private logger: Logger;
    private reviewController: ReviewController;
    private redisState: any;
    private elasticsearchConnection: ElasticsearchConnection | null = null;

    constructor(logger: Logger, redisState: any) {
        this.router = Router();
        this.logger = logger;
        this.redisState = redisState;
        this.reviewController = new ReviewController(logger);

        this.initializeRoutes();
    }

    private async getElasticsearchClient(): Promise<Client | null> {
        if (!this.elasticsearchConnection) {
            this.elasticsearchConnection = new ElasticsearchConnection(this.logger);
        }

        await this.elasticsearchConnection.retryConnection();
        return this.elasticsearchConnection.getClient();
    }

    private logToWinston(data: any, action: string): void {
        this.logger.info(`Fallback logging to Winston: ${action}`, { data });
    }

    private initializeRoutes() {
        // Utility function to check cache
        const getCachedData = async (cacheKey: string) => {
            if (this.redisState.status.connected) {
                try {
                    const cachedData = await this.redisState.client.get(cacheKey);
                    if (cachedData) {
                        this.logger.info('Returning cached data from Redis.');
                        return JSON.parse(cachedData);
                    }
                } catch (redisError) {
                    this.logger.warn('Redis error occurred while checking cache.', redisError);
                }
            } else {
                this.logger.warn('Redis is not connected. Skipping cache lookup.');
            }
            return null;
        };

        // Utility function to set cache
        const setCache = async (cacheKey: string, data: any) => {
            if (this.redisState.status.connected) {
                try {
                    await this.redisState.client.set(cacheKey, JSON.stringify(data), { EX: 3600 });
                    this.logger.info('Cached data in Redis.');
                } catch (cacheError) {
                    this.logger.warn('Failed to cache data in Redis.', cacheError);
                }
            }
        };

        // Add review
        this.router.post('/:id', isAuth, validateRatings, validate, async (req, res, next) => {
            try {
                const reviewData = req.body;

                // Log the review creation to Elasticsearch
                const elk_client = await this.getElasticsearchClient();
                if (elk_client) {
                    try {
                        await elk_client.index({
                            index: 'reviews', // Index name for reviews
                            body: {
                                ...reviewData,
                                timestamp: new Date().toISOString(),
                            },
                        });
                        this.logger.info('Logged review creation to Elasticsearch.');
                    } catch (elkError) {
                        this.logger.warn('Failed to log review creation to Elasticsearch. Falling back to Winston.', elkError);
                        this.logToWinston(reviewData, 'review_creation'); // Fallback to Winston
                    }
                } else {
                    this.logToWinston(reviewData, 'review_creation'); // Fallback to Winston
                }

                await this.reviewController.addReview(req, res);
            } catch (error) {
                next(error);
            }
        });

        // Update review
        this.router.patch('/:id', isAuth, validateRatings, validate, async (req, res, next) => {
            try {
                const reviewId = req.params.id;
                const updatedData = req.body;

                // Log the review update to Elasticsearch
                const elk_client = await this.getElasticsearchClient();
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
                        this.logger.info('Logged review update to Elasticsearch.');
                    } catch (elkError) {
                        this.logger.warn('Failed to log review update to Elasticsearch. Falling back to Winston.', elkError);
                        this.logToWinston({ reviewId, ...updatedData }, 'review_update'); // Fallback to Winston
                    }
                } else {
                    this.logToWinston({ reviewId, ...updatedData }, 'review_update'); // Fallback to Winston
                }

                await this.reviewController.updateReview(req, res);
            } catch (error) {
                next(error);
            }
        });

        // Remove review
        this.router.delete('/:id', isAuth, async (req, res, next) => {
            try {
                const reviewId = req.params.id;

                // Log the review deletion to Elasticsearch
                const elk_client = await this.getElasticsearchClient();
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
                        this.logger.info('Logged review deletion to Elasticsearch.');
                    } catch (elkError) {
                        this.logger.warn('Failed to log review deletion to Elasticsearch. Falling back to Winston.', elkError);
                        this.logToWinston({ reviewId, action: 'deleted' }, 'review_deletion'); // Fallback to Winston
                    }
                } else {
                    this.logToWinston({ reviewId, action: 'deleted' }, 'review_deletion'); // Fallback to Winston
                }

                await this.reviewController.removeReview(req, res);
            } catch (error) {
                next(error);
            }
        });

        // Get reviews by art (with caching)
        this.router.get('/:id', async (req, res, next) => {
            const hr = async (req, res, next) => {
                try {
                    const cacheKey = `reviews:art:${req.params.id}`; // Cache based on art ID
                    const cachedData = await getCachedData(cacheKey);
                    if (cachedData) {
                        return res.json(cachedData); // Return cached data if available
                    }

                    // Fetch data from the database or Elasticsearch
                    let reviewsData;
                    const elk_client = await this.getElasticsearchClient();
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
                            this.logger.info(`Fetched ${reviewsData.length} reviews for art ${req.params.id} from Elasticsearch.`);
                        } catch (elkError) {
                            this.logger.warn('Failed to fetch reviews from Elasticsearch. Falling back to database.', elkError);
                            reviewsData = await this.reviewController.getReviewsByArt(req, res); // Fallback to database
                        }
                    } else {
                        reviewsData = await this.reviewController.getReviewsByArt(req, res); // Fetch from database
                    }

                    // Cache the result
                    await setCache(cacheKey, reviewsData);

                    // Send the response
                    res.json(reviewsData);
                } catch (error) {
                    next(error);
                }
            };
            hr(req, res, next);
        });
    }

    public getRouter(): Router {
        return this.router;
    }

    public async closeElasticsearchConnection(): Promise<void> {
        if (this.elasticsearchConnection) {
            await this.elasticsearchConnection.close();
            this.elasticsearchConnection = null;
            this.logger.info('Elasticsearch connection closed.');
        }
    }
}

export default (logger: Logger, redisState: any) => {
    const reviewRouterInstance = new ReviewRouter(logger, redisState);
    return reviewRouterInstance.getRouter();
};

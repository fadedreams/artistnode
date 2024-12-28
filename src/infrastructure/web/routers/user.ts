import express, { Router, Request, Response, NextFunction } from 'express';
import { Logger } from 'winston';
import { UserController } from '@src/infrastructure/web/controllers/user';
import { userValidator, validate, signInValidator } from '@src/infrastructure/web/middlewares/validator';
import { isAuth } from '@src/infrastructure/web/middlewares/auth';
import { Client } from '@elastic/elasticsearch';

class UserRouter {
    private router: Router;
    private logger: Logger;
    private userController: UserController;
    private redisState: any;
    private elk_client: Client | null; // Add Elasticsearch client

    constructor(logger: Logger, redisState: any, elk_client: Client | null) {
        this.router = express.Router();
        this.logger = logger;
        this.redisState = redisState;
        this.elk_client = elk_client; // Initialize Elasticsearch client
        this.userController = new UserController(logger);

        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.logger.info('Initializing user routes');

        this.router.get('/h', (req, res) => {
            res.status(200).json({ message: 'Server is healthy!' });
        });

        this.router.post('/create', userValidator, validate, async (req, res, next) => {
            try {
                await this.userController.create(req, res);
            } catch (error) {
                next(error);
            }
        });

        this.router.post('/signin', signInValidator, validate, async (req, res, next) => {
            try {
                await this.userController.signIn(req, res);
            } catch (error) {
                next(error);
            }
        });

        this.router.get(
            '/isauth',
            isAuth,
            async (req: Request, res: Response, next: NextFunction) => {
                try {
                    const userId = req.user?.id; // Assuming `req.user` contains user information
                    const cacheKey = `user:${userId}:auth`;

                    let userData;

                    if (this.redisState.status.connected) {
                        try {
                            // Attempt to check the Redis cache
                            const cachedData = await this.redisState.client.get(cacheKey);
                            if (cachedData) {
                                this.logger.info('Returning cached user data from Redis.');
                                res.json(JSON.parse(cachedData)); // Send cached data response
                                return; // Ensure no further code runs
                            }
                        } catch (redisError) {
                            this.logger.warn('Redis error occurred, continuing without cache.', redisError);
                        }
                    } else {
                        this.logger.warn('Redis is not connected. Skipping cache lookup.');
                    }

                    // Fetch user data directly (fallback if Redis is not connected or data is not cached)
                    userData = {
                        id: req.user._id,
                        name: req.user.name,
                        email: req.user.email,
                        isVerified: req.user.isVerified,
                        role: req.user.role,
                    };

                    // Try to cache the data if Redis is connected
                    if (this.redisState.status.connected) {
                        try {
                            await this.redisState.client.set(cacheKey, JSON.stringify(userData), { EX: 3600 });
                            this.logger.info('Cached user data in Redis.');
                        } catch (cacheError) {
                            this.logger.warn('Failed to cache user data in Redis.', cacheError);
                        }
                    }

                    // Example: Log user data to Elasticsearch if elk_client is available
                    if (this.elk_client) {
                        try {
                            await this.elk_client.index({
                                index: 'user_logs', // Ensure this matches the index name
                                body: {
                                    userId: userData.id,
                                    action: 'isauth',
                                    timestamp: new Date().toISOString(),
                                },
                            });
                            this.logger.info('Logged user data to Elasticsearch.');
                        } catch (elkError) {
                            this.logger.warn('Failed to log user data to Elasticsearch.', elkError);
                        }
                    }

                    res.json(userData); // Send user data response
                } catch (error) {
                    next(error); // Use next() to pass errors to the global error handler
                }
            }
        );
    }

    private isAuthHandler = (req: Request, res: Response) => {
        const { user } = req;
        this.logger.info('isauth endpoint accessed', { user: user?.id });

        res.json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                isVerified: user.isVerified,
                role: user.role,
            },
        });
    };

    public getRouter(): Router {
        return this.router;
    }
}

export default (logger: Logger, redisState: any, elk_client: Client | null) => {
    const userRouterInstance = new UserRouter(logger, redisState, elk_client);
    return userRouterInstance.getRouter();
};

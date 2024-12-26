import express, { Router, Request, Response, NextFunction } from 'express';
import { Logger } from 'winston';
import { UserController } from '@src/infrastructure/web/controllers/user';
import { userValidator, validate, signInValidator } from '@src/infrastructure/web/middlewares/validator';
import { isAuth } from '@src/infrastructure/web/middlewares/auth';

import { redisClient, redisStatus } from '@src/infrastructure/persistence/RedisConnection';


class UserRouter {
    private router: Router;
    private logger: Logger;
    private userController: UserController;

    constructor(logger: Logger) {
        this.router = express.Router();
        this.logger = logger;
        this.userController = new UserController(logger);

        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.logger.info('Initializing user routes');

        this.router.get('/h', (req, res) => {
            res.status(200).json({ message: 'Server is healthy!' });
        });
        // this.router.post('/create', userValidator, validate, this.userController.create);
        this.router.post('/create', userValidator, validate, async (req, res, next) => {
            try {
                await this.userController.create(req, res);
            } catch (error) {
                next(error);
            }
        });
        // this.router.post('/signin', signInValidator, validate, this.userController.signIn);
        this.router.post('/signin', signInValidator, validate, async (req, res, next) => {
            try {
                await this.userController.signIn(req, res);
            } catch (error) {
                next(error);
            }
        });
        // this.router.get('/isauth', isAuth, this.isAuthHandler);
        // this.router.get('/isauth', isAuth, async (req, res, next) => {
        //     try {
        //         this.isAuthHandler(req, res);
        //     } catch (error) {
        //         next(error);
        //     }
        // });

        this.router.get(
            '/isauth',
            isAuth,
            async (req: Request, res: Response, next: NextFunction) => {
                try {
                    const userId = req.user?.id; // Assuming `req.user` contains user information
                    const cacheKey = `user:${userId}:auth`;

                    let userData;

                    if (redisStatus?.connected) {
                        try {
                            // Attempt to check the Redis cache
                            const cachedData = await redisClient.get(cacheKey);
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
                    if (redisStatus?.connected) {
                        try {
                            await redisClient.set(cacheKey, JSON.stringify(userData), { EX: 3600 });
                            this.logger.info('Cached user data in Redis.');
                        } catch (cacheError) {
                            this.logger.warn('Failed to cache user data in Redis.', cacheError);
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

export default (logger: Logger) => {
    const userRouterInstance = new UserRouter(logger);
    return userRouterInstance.getRouter();
};


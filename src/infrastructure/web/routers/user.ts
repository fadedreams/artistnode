import express, { Router, Request, Response, NextFunction } from 'express';
import { Logger } from 'winston';
import { create, signIn } from '@src/infrastructure/web/controllers/user';
import { userValidator, validate, signInValidator } from '@src/infrastructure/web/middlewares/validator';
import { isAuth } from '@src/infrastructure/web/middlewares/auth';

class UserRouter {
    private router: Router;
    private logger: Logger;

    constructor(logger: Logger) {
        this.router = express.Router();
        this.logger = logger;

        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.logger.info('Initializing user routes');

        // this.router.post('/create', userValidator, validate, this.wrapRoute(create));
        // this.router.post('/signin', signInValidator, validate, this.wrapRoute(signIn));

        this.router.post('/create', userValidator, validate, create);
        this.router.post('/signin', signInValidator, validate, signIn);
        this.router.get('/isauth', isAuth, this.isAuthHandler);
    }

    // private wrapRoute(handler: Function) {
    //     return async (req: Request, res: Response, next: NextFunction) => {
    //         try {
    //             await handler(req, res, next);
    //         } catch (error) {
    //             this.logger.error('Error in route handler', { error });
    //             res.status(500).json({ error: 'Internal Server Error' });
    //         }
    //     };
    // }

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


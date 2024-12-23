import express, { Router, Request, Response, NextFunction } from 'express';
import { Logger } from 'winston';
import { UserController } from '@src/infrastructure/web/controllers/user';
import { userValidator, validate, signInValidator } from '@src/infrastructure/web/middlewares/validator';
import { isAuth } from '@src/infrastructure/web/middlewares/auth';

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
        this.router.get('/isauth', isAuth, async (req, res, next) => {
            try {
                this.isAuthHandler(req, res);
            } catch (error) {
                next(error);
            }
        });
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


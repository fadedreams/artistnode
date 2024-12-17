import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import session from 'express-session';
import RedisStore from 'connect-redis';
import promBundle from 'express-prom-bundle';

import { Database as DatabaseInterface } from '@src/domain/interfaces/Database';
import { createClient } from 'redis';

import userRouter from '@src/infrastructure/web/routers/user';
import artistRouter from '@src/infrastructure/web/routers/artist';
import { Logger } from 'winston';

const metricsMiddleware = promBundle({
    includeMethod: true,
    includePath: true,
});

export default class App {
    private app: Application;
    private port: number;
    private database: DatabaseInterface;
    private logger: Logger;

    constructor(database: DatabaseInterface, logger: Logger) {
        this.app = express();
        this.port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
        this.database = database;
        this.logger = logger;

        this.initializeMiddlewares();
        this.initializeRoutes();
    }

    private initializeMiddlewares() {
        this.app.use(cors());
        this.app.use(express.json());
        this.app.use(metricsMiddleware);
        this.app.get('/metrics', metricsMiddleware.metricsMiddleware);

        // Initialize Redis client and store
        const redisClient = createClient();
        redisClient.connect().catch((err) => this.logger.error('Redis connection error', err));

        const redisStore = new RedisStore({
            client: redisClient,
            prefix: 'myapp:',
        });

        this.app.use(
            session({
                store: redisStore,
                resave: false,
                saveUninitialized: false,
                secret: 'secret',
                cookie: {
                    maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // 10 years
                    httpOnly: true,
                    sameSite: 'lax',
                    secure: false,
                },
            })
        );

        this.logger.info('Middlewares initialized');
    }

    private initializeRoutes() {
        this.app.use('/api/user', userRouter);
        this.app.use('/api/artist', artistRouter(this.logger));
        // this.app.use('/api/user', userRouter(this.logger));
        this.logger.info('Routes initialized');
    }

    public async start() {
        dotenv.config();
        try {
            await this.database.connect();
            this.logger.info('Database connected successfully');

            this.app.listen(this.port, () => {
                this.logger.info(`Server is running on port ${this.port}`);
            });
        } catch (error) {
            this.logger.error('Failed to connect to the database:', error);
        }
    }
}


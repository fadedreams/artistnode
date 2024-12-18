// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

import express, { Application } from 'express';
import cors from 'cors';

import session from 'express-session';
import RedisStore from 'connect-redis';
import promBundle from 'express-prom-bundle';

import { Database as DatabaseInterface } from '@src/domain/interfaces/Database';
import { createClient } from 'redis';

import userRouter from '@src/infrastructure/web/routers/user';
import artistRouter from '@src/infrastructure/web/routers/artist';
import artRouter from '@src/infrastructure/web/routers/art';
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
        this.app.use('/api/artist', artistRouter(this.logger));
        this.app.use('/api/art', artRouter(this.logger));
        this.app.use('/api/user', userRouter(this.logger));
        this.logger.info('Routes initialized');
    }

    public async start() {

        // Access the database connection string from the environment variables
        const databaseUrl = process.env.DB_URI;

        // Check if the environment variable is defined
        if (!databaseUrl) {
            console.error('DB_URI is not defined. Please set the environment variable.');
            process.exit(1); // Exit the process if DB_URI is missing
        }

        // Log the database connection string for debugging purposes
        console.log('Database connection string:', databaseUrl);

        try {
            // Attempt to connect to the database
            await this.database.connect();
            this.logger.info('Database connected successfully');

            // Start the server and listen on the specified port
            this.app.listen(this.port, () => {
                this.logger.info(`Server is running on port ${this.port}`);
            });
        } catch (error) {
            // Log any errors that occur during the startup process
            this.logger.error('Failed to connect to the database:', error);
        }
    }
}


import dotenv from 'dotenv';
dotenv.config();

import express, { Application } from 'express';
import cors from 'cors';
import session from 'express-session';
import RedisStore from 'connect-redis';
import promBundle from 'express-prom-bundle';

import { Database as DatabaseInterface } from '@src/domain/interfaces/Database';
import { RedisClientType, createClient } from 'redis';

import userRouter from '@src/infrastructure/web/routers/user';
import artistRouter from '@src/infrastructure/web/routers/artist';
import artRouter from '@src/infrastructure/web/routers/art';
import reviewRouter from '@src/infrastructure/web/routers/review';

import { Logger } from 'winston';

// Import the DatabaseProviderFactory correctly
import DatabaseProviderFactory from '@src/infrastructure/persistence/DatabaseProvider';

const metricsMiddleware = promBundle({
    includeMethod: true,
    includePath: true,
});

export default class App {
    private app: Application;
    private port: number;
    private database: DatabaseInterface | null;
    private logger: Logger;
    private redisClient: RedisClientType;

    constructor(logger: Logger) {
        this.app = express();
        this.port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
        this.logger = logger;

        // Initialize database and Redis internally
        this.database = null;  // Set default to null
        this.redisClient = createClient();  // Initialize Redis client

        this.initializeDatabase();
        this.initializeMiddlewares();
        this.initializeRoutes();
    }

    private initializeDatabase() {
        // Initialize the database if needed (you can modify this according to your actual DB initialization logic)
        if (process.env.DB_URI) {
            // Use the DatabaseProviderFactory correctly
            this.database = DatabaseProviderFactory.createInstance();
            this.logger.info('Database connection initialized');
        } else {
            this.logger.warn('Database URI is not provided, skipping database initialization');
        }
    }

    private initializeMiddlewares() {
        this.app.use(cors());
        this.app.use(express.json());
        this.app.use(metricsMiddleware);
        this.app.get('/metrics', metricsMiddleware.metricsMiddleware);

        if (this.redisClient) {
            const redisStore = new RedisStore({
                client: this.redisClient,
                prefix: 'myapp:',
            });

            this.app.use(
                session({
                    store: redisStore,
                    resave: false,
                    saveUninitialized: false,
                    secret: process.env.SESSION_SECRET || 'defaultSecret',
                    cookie: {
                        maxAge: 1000 * 60 * 60 * 24 * 365 * 10,
                        httpOnly: true,
                        sameSite: 'lax',
                        secure: process.env.NODE_ENV === 'production',
                    },
                })
            );
        }

        this.logger.info('Middlewares initialized');
    }

    private initializeRoutes() {
        this.app.use('/api/artist', artistRouter(this.logger));
        this.app.use('/api/art', artRouter(this.logger));
        this.app.use('/api/user', userRouter(this.logger));
        this.app.use('/api/review', reviewRouter(this.logger));

        this.logger.info('Routes initialized');
    }

    private validateEnvVariables() {
        const requiredEnvVariables = [
            'JWT_SECRET',
            'PORT',
            'MINIO_SERVER',
            'MINIO_USER',
            'MINIO_PASS',
        ];

        const missingEnvVariables = requiredEnvVariables.filter((envVar) => !process.env[envVar]);

        if (missingEnvVariables.length > 0) {
            throw new Error(
                `Missing required environment variables: ${missingEnvVariables.join(', ')}`
            );
        }
    }

    public async start() {
        this.validateEnvVariables();

        if (this.database) {
            try {
                await this.database.connect();
                this.logger.info('Database connected successfully');
            } catch (error) {
                this.logger.error('Failed to connect to the database:', error);
                process.exit(1);
            }
        }

        // Initialize Redis connection
        this.redisClient.connect().catch((err) => {
            this.logger.error('Redis connection error:', err);
        });

        const server = this.app.listen(this.port, () => {
            this.logger.info(`Server is running on port ${this.port}`);
        });

        // Handle graceful shutdown
        process.on('SIGTERM', async () => {
            this.logger.info('Received SIGTERM, shutting down gracefully...');
            await this.gracefulShutdown();
            server.close(() => {
                this.logger.info('Server closed.');
                process.exit(0);
            });
        });

        process.on('SIGINT', async () => {
            this.logger.info('Received SIGINT, shutting down gracefully...');
            await this.gracefulShutdown();
            server.close(() => {
                this.logger.info('Server closed.');
                process.exit(0);
            });
        });
    }

    private async gracefulShutdown() {
        try {
            if (this.redisClient) {
                this.logger.info('Closing Redis connection...');
                await this.redisClient.quit();
                this.logger.info('Redis connection closed.');
            }

            if (this.database) {
                this.logger.info('Disconnecting from the database...');
                await this.database.disconnect();
                this.logger.info('Database disconnected.');
            }
        } catch (error) {
            this.logger.error('Error during shutdown:', error);
        }
    }
}

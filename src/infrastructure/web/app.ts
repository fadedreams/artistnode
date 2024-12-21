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

// Import the circuit breaker library
import CircuitBreaker from 'opossum';

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
    private redisCircuitBreaker: CircuitBreaker;
    private dbCircuitBreaker: CircuitBreaker;

    constructor(logger: Logger) {
        this.app = express();
        this.port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
        this.logger = logger;

        // Initialize database and Redis internally
        this.database = null;  // Set default to null
        this.redisClient = createClient();  // Initialize Redis client

        // Initialize circuit breakers
        this.redisCircuitBreaker = new CircuitBreaker(() => this.connectRedis(), {
            timeout: 5000, // Timeout after 5 seconds
            errorThresholdPercentage: 50, // Open the circuit after 50% failures
            resetTimeout: 30000, // Reset circuit after 30 seconds
        });

        this.dbCircuitBreaker = new CircuitBreaker(() => this.initializeDatabase(), {
            timeout: 5000, // Timeout after 5 seconds
            errorThresholdPercentage: 50, // Open the circuit after 50% failures
            resetTimeout: 30000, // Reset circuit after 30 seconds
        });

        this.initializeMiddlewares();
        this.initializeRoutes();
    }

    private async connectRedis() {
        // Ensure this returns a Promise to handle the Redis connection asynchronously
        try {
            await this.redisClient.connect();
            this.logger.info('Redis connected successfully');
        } catch (error) {
            this.logger.error('Failed to connect to Redis:', error);
            throw error; // Circuit breaker will handle this error
        }
    }

    private async initializeDatabase() {
        // Ensure this returns a Promise for database connection initialization
        if (process.env.DB_URI) {
            try {
                this.database = DatabaseProviderFactory.createInstance();
                await this.database.connect(); // Assuming this.connect() returns a Promise
                this.logger.info('Database connection initialized');
            } catch (error) {
                this.logger.error('Failed to connect to the database:', error);
                throw error; // Circuit breaker will handle this error
            }
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
                // Wrap the database connection in the circuit breaker
                await this.dbCircuitBreaker.fire();
                this.logger.info('Database connected successfully');
            } catch (error) {
                this.logger.error('Failed to connect to the database:', error);
                process.exit(1);
            }
        }

        // Initialize Redis connection wrapped with the circuit breaker
        try {
            await this.redisCircuitBreaker.fire();
        } catch (err) {
            this.logger.error('Redis connection error:', err);
        }

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

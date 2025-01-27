import dotenv from 'dotenv';
dotenv.config();

import express, { Application, NextFunction, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import promBundle from 'express-prom-bundle';
import mongoose from 'mongoose';

import userRouter from '@src/infrastructure/web/routers/user';
import artistRouter from '@src/infrastructure/web/routers/artist';
import artRouter from '@src/infrastructure/web/routers/art';
import reviewRouter, { ReviewRouter } from '@src/infrastructure/web/routers/review';

import { Logger } from 'winston';
import { ValidationError, DatabaseError } from '@src/domain/errors/CustomErrors'

// Import the new Database class
import Database from '@src/infrastructure/persistence/DatabaseConnection';
// import ElasticsearchConnection from '@src/infrastructure/persistence/ElasticsearchConnection';
import RedisConnection from '@src/infrastructure/persistence/RedisConnection';
import MinIOConnection from '@src/infrastructure/persistence/minioConnection';

const metricsMiddleware = promBundle({
    includeMethod: true,
    includePath: true,
});

// Configuration object for environment variables
export const config = {
    jwtSecret: process.env.JWT_SECRET,
    dbUri: process.env.DB_URI,
    port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
    minio: {
        server: process.env.MINIO_SERVER,
        port: process.env.MINIO_PORT,
        user: process.env.MINIO_USER,
        pass: process.env.MINIO_PASS,
    },
    redis: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
        password: process.env.REDIS_PASSWORD,
        url: process.env.REDIS_URL,
    },
    elasticsearch: {
        url: process.env.ELASTICSEARCH_URL,
        username: process.env.ELASTICSEARCH_USERNAME,
        password: process.env.ELASTICSEARCH_PASSWORD,
    },
};

export default class App {
    private app: Application;
    private port: number;
    private logger: Logger;
    private database: Database;
    // private elasticsearchConnection: ElasticsearchConnection;
    private redisConnection: RedisConnection;
    private minio: MinIOConnection;
    private reviewRouterInstance: ReviewRouter; // Store the ReviewRouter instance

    constructor(logger: Logger) {
        this.app = express();
        this.port = config.port;
        this.logger = logger;

        // Initialize the Database
        // this.database = new Database(logger, config.dbUri, 5, 2000, 30000);
        this.database = Database.getInstance(logger, config.dbUri, 5, 2000, 30000);
        this.database.monitorConnection(); // Call monitorConnection to handle reconnection logic

        // Initialize Elasticsearch and Redis connections
        // this.elasticsearchConnection = new ElasticsearchConnection(this.logger);
        this.redisConnection = new RedisConnection(this.logger);

        // Initialize MinIOConnection
        this.minio = new MinIOConnection(
            process.env.MINIO_SERVER || 'localhost:9000',
            process.env.MINIO_USER as string,
            process.env.MINIO_PASS as string
        );
        this.reviewRouterInstance = new ReviewRouter(logger, this.redisConnection);
        this.initializeMiddlewares();
        this.initializeRoutes();
    }

    private initializeMiddlewares() {
        this.app.use(cors());
        this.app.use(express.json());
        this.app.use(metricsMiddleware);
        this.app.get('/metrics', metricsMiddleware.metricsMiddleware);

        // Rate limiting configuration
        const limiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 100, // Limit each IP to 100 requests per windowMs
            message: 'Too many requests from this IP, please try again after 15 minutes',
        });

        // Apply the rate limiter to all requests
        this.app.use(limiter);

        // Centralized error handling
        this.app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
            if (err instanceof ValidationError) {
                this.logger.warn('Validation error:', err);
                res.status(400).json({ error: err.message });
            } else if (err instanceof DatabaseError) {
                this.logger.error('Database error:', err);
                res.status(503).json({ error: 'Service Unavailable' });
            } else {
                this.logger.error('Unhandled error:', err);
                res.status(500).json({ error: 'Internal Server Error' });
            }
        });
        this.logger.info('Middlewares initialized');
    }

    private initializeRoutes() {
        // Get the Elasticsearch client
        // const elk_client = this.elasticsearchConnection.getClient();

        // Define routes
        this.app.use('/api/artist', artistRouter(this.logger, this.redisConnection));
        this.app.use('/api/art', artRouter(this.logger, this.redisConnection));
        // this.app.use('/api/user', userRouter(this.logger, this.redisConnection, elk_client));
        this.app.use('/api/user', userRouter(this.logger, this.redisConnection));
        // this.app.use('/api/review', reviewRouter(this.logger, this.redisConnection, elk_client));
        // this.app.use('/api/review', reviewRouter(this.logger, this.redisConnection));
        this.app.use('/api/review', this.reviewRouterInstance.getRouter());

        // Health check endpoint
        this.app.get('/health', async (req, res) => {
            const status = {
                database: this.database.isConnected,
                redis: this.redisConnection.getStatus().connected,
                // elasticsearch: this.elasticsearchConnection.getStatus().connected,
            };

            const isHealthy = Object.values(status).every((s) => s);
            res.status(isHealthy ? 200 : 503).json({ status });
        });

        this.logger.info('Routes initialized');
    }

    private validateEnvVariables(): void {
        const envConfig = {
            required: [
                'JWT_SECRET',
                'DB_URI',
                'PORT',
                'MINIO_SERVER',
                'MINIO_PORT',
                'MINIO_USER',
                'MINIO_PASS',
                'REDIS_HOST',
                'REDIS_PORT',
                'REDIS_URL',
                'ELASTICSEARCH_URL',
                'ELASTICSEARCH_USERNAME',
                'ELASTICSEARCH_PASSWORD',
            ],
            optional: [
                'REDIS_PASSWORD',
            ],
        };

        const missingEnvVariables = envConfig.required.filter((envVar) => !process.env[envVar]);

        if (missingEnvVariables.length > 0) {
            throw new Error(
                `Missing required environment variables: ${missingEnvVariables.join(', ')}. ` +
                'Please check your .env file or environment configuration.'
            );
        }

        this.logger.info('All required environment variables are present.');
    }

    private async checkRedisConnection(): Promise<void> {
        this.logger.info('Redis connection status:', this.redisConnection.getStatus());

        const client = this.redisConnection.getClient();
        if (client) {
            try {
                await client.set('myKey', 'myValue');
                this.logger.info('Key set successfully.');

                const value = await client.get('myKey');
                this.logger.info('Value retrieved:', value);
            } catch (error) {
                this.logger.error('Error using Redis:', error);
            }
        } else {
            this.logger.error('Redis client is not connected.');
        }
    }

    // private async checkElasticsearchConnection(): Promise<void> {
    //     if (!this.elasticsearchConnection.getStatus().connected) {
    //         await this.elasticsearchConnection.retryConnection();
    //     }
    //
    //     const elk_client = this.elasticsearchConnection.getClient();
    //     if (elk_client) {
    //         this.logger.info('Elasticsearch client is ready.');
    //     } else {
    //         this.logger.error('Failed to connect to Elasticsearch.');
    //     }
    // }

    private async connectToDatabase(): Promise<void> {
        try {
            await this.database.connectWithRetry();
            this.logger.info('Database connected successfully');
        } catch (error) {
            this.logger.error('Failed to connect to the database', { error: error.message });
            // process.exit(1);
        }
    }

    private async checkMinioConnection(): Promise<void> {
        try {
            this.logger.info('Attempting to connect to MinIO...');

            // Connect to MinIO with retries
            await this.minio.connectWithRetry();
            this.logger.info('Successfully connected to MinIO.');

            // Start monitoring the MinIO connection
            this.minio.monitorConnection();
            this.logger.info('Started monitoring MinIO connection.');
        } catch (error) {
            this.logger.error('Failed to connect to MinIO:', error);

            // Optionally, you can retry the connection or exit the application
            this.logger.info('Retrying MinIO connection in 5 seconds...');
            await new Promise((resolve) => setTimeout(resolve, 5000));
            await this.checkMinioConnection(); // Retry the connection
        }
    }

    private async startServer(): Promise<void> {
        const server = this.app.listen(this.port, () => {
            this.logger.info('Server is running', { port: this.port });
        });

        // Handle graceful shutdown
        process.on('SIGTERM', async () => {
            this.logger.info('Received SIGTERM, shutting down gracefully...');
            await this.gracefulShutdown();
            server.close(() => {
                this.logger.info('Server closed.');
                // process.exit(0);
            });
        });

        process.on('SIGINT', async () => {
            this.logger.info('Received SIGINT, shutting down gracefully...');
            await this.gracefulShutdown();
            server.close(() => {
                this.logger.info('Server closed.');
                // process.exit(0);
            });
        });
    }

    public async start(): Promise<void> {
        this.validateEnvVariables();

        await this.connectToDatabase();
        await this.checkRedisConnection();
        // await this.checkElasticsearchConnection();
        await this.checkMinioConnection();
        await this.startServer();
    }

    private async gracefulShutdown(): Promise<void> {
        try {
            this.logger.info('Disconnecting from the database...');
            await mongoose.disconnect();
            this.logger.info('Database disconnected.');

            // Close the Redis connection
            if (this.redisConnection.getClient()) {
                this.logger.info('Closing Redis connection...');
                await this.redisConnection.disconnect();
                this.logger.info('Redis connection closed.');
            }

            // Close the Elasticsearch connection
            this.logger.info('Closing Elasticsearch connection...');
            await this.reviewRouterInstance.closeElasticsearchConnection();
            this.logger.info('Elasticsearch connection closed.');

            // Close the MinIO connection
            this.logger.info('Closing MinIO connection...');
            await this.minio.close();
            this.logger.info('MinIO connection closed.');
        } catch (error) {
            this.logger.error('Error during shutdown:', { error: error });
        }
    }
}

import dotenv from 'dotenv';
dotenv.config();

import express, { Application } from 'express';
import cors from 'cors';
import promBundle from 'express-prom-bundle';
import mongoose from 'mongoose';

import userRouter from '@src/infrastructure/web/routers/user';
import artistRouter from '@src/infrastructure/web/routers/artist';
import artRouter from '@src/infrastructure/web/routers/art';
import reviewRouter from '@src/infrastructure/web/routers/review';

import { Logger } from 'winston';

// Import the new Database class
import Database from '@src/infrastructure/persistence/DatabaseConnection';

import redisState from '@src/infrastructure/persistence/RedisConnection';
import ElasticsearchConnection from '@src/infrastructure/persistence/ElasticsearchConnection';
import MinIOConnection from '@src/infrastructure/persistence/minioConnection';

const metricsMiddleware = promBundle({
    includeMethod: true,
    includePath: true,
});

export default class App {
    private app: Application;
    private port: number;
    private logger: Logger;
    private database: Database;
    private elasticsearchConnection: ElasticsearchConnection; // Add Elasticsearch connection

    constructor(logger: Logger) {
        this.app = express();
        this.port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
        this.logger = logger;

        // Initialize the Database (Database is now a class, so we instantiate it)
        this.database = new Database(process.env.DB_URI,  // MongoDB URI (or fallback to default)
            5,                   // Max retries
            2000,                // Retry delay in ms
            30000                // Circuit breaker cooldown in ms
        );

        this.database.monitorConnection();  // Call monitorConnection to handle reconnection logic

        // Initialize Elasticsearch connection
        this.elasticsearchConnection = new ElasticsearchConnection(this.logger);

        this.initializeMiddlewares();
        this.initializeRoutes();
    }

    private initializeMiddlewares() {
        this.app.use(cors());
        this.app.use(express.json());
        this.app.use(metricsMiddleware);
        this.app.get('/metrics', metricsMiddleware.metricsMiddleware);

        this.logger.info('Middlewares initialized');
    }

    private initializeRoutes() {
        // Get the Elasticsearch client
        const elk_client = this.elasticsearchConnection.getClient();

        // Pass redisState and elk_client to routers
        this.app.use('/api/artist', artistRouter(this.logger, redisState));
        this.app.use('/api/art', artRouter(this.logger, redisState));
        this.app.use('/api/user', userRouter(this.logger, redisState, elk_client));
        this.app.use('/api/review', reviewRouter(this.logger, redisState));

        this.logger.info('Routes initialized');
    }

    private validateEnvVariables() {
        const requiredEnvVariables = [
            'JWT_SECRET',
            'PORT',
            'MINIO_SERVER',
            'MINIO_USER',
            'MINIO_PASS',
            'ELASTICSEARCH_URL', // Ensure Elasticsearch URL is required
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

        // Connect to MongoDB
        try {
            await this.database.connectWithRetry();
            this.logger.info('Database connected successfully');
        } catch (error) {
            this.logger.error('Failed to connect to the database:', error);
            process.exit(1);
        }

        // Connect to Redis
        // (async () => {
        //     if (!redisState.status.connected) {
        //         console.log('Retrying Redis connection...');
        //         await redisState.connectWithRetry();
        //     }
        // })();
        // Check the connection status
        console.log('Redis connection status:', redisState.getStatus());

        const client = redisState.getClient();

        if (client) {
            try {
                // Example: Set a key in Redis
                await client.set('myKey', 'myValue');
                console.log('Key set successfully.');

                // Example: Get a key from Redis
                const value = await client.get('myKey');
                console.log('Value retrieved:', value);
            } catch (error) {
                console.error('Error using Redis:', error);
            }
        } else {
            console.error('Redis client is not connected.');
        }

        // Retry Elasticsearch connection if not connected
        if (!this.elasticsearchConnection.getStatus().connected) {
            await this.elasticsearchConnection.retryConnection();
        }

        // Get the Elasticsearch client
        const elk_client = this.elasticsearchConnection.getClient();
        if (elk_client) {
            // console.log('Elasticsearch client is ready:', elk_client);
            console.log('Elasticsearch client is ready:');
        } else {
            console.error('Failed to connect to Elasticsearch.');
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
            this.logger.info('Disconnecting from the database...');
            await mongoose.disconnect();  // Disconnect Mongoose properly
            this.logger.info('Database disconnected.');

            // Close the Redis connection
            if (redisState.client) {
                this.logger.info('Closing Redis connection...');
                await redisState.client.quit();
                this.logger.info('Redis connection closed.');
            }

        } catch (error) {
            this.logger.error('Error during shutdown:', error);
        }
    }
}

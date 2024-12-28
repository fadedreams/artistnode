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
import ElasticsearchConnection from '@src/infrastructure/persistence/ElasticsearchConnection';
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
    private elasticsearchConnection: ElasticsearchConnection;
    private redisConnection: RedisConnection;

    constructor(logger: Logger) {
        this.app = express();
        this.port = config.port;
        this.logger = logger;

        // Initialize the Database
        this.database = new Database(logger, config.dbUri, 5, 2000, 30000);
        this.database.monitorConnection(); // Call monitorConnection to handle reconnection logic

        // Initialize Elasticsearch and Redis connections
        this.elasticsearchConnection = new ElasticsearchConnection(this.logger);
        this.redisConnection = new RedisConnection(this.logger);

        this.initializeMiddlewares();
        this.initializeRoutes();
    }

    private initializeMiddlewares() {
        this.app.use(cors());
        this.app.use(express.json());
        this.app.use(metricsMiddleware);
        this.app.get('/metrics', metricsMiddleware.metricsMiddleware);

        // Centralized error handling
        this.app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
            this.logger.error('Unhandled error:', err);
            res.status(500).json({ error: 'Internal Server Error' });
        });

        this.logger.info('Middlewares initialized');
    }

    private initializeRoutes() {
        // Get the Elasticsearch client
        const elk_client = this.elasticsearchConnection.getClient();

        // Define routes
        this.app.use('/api/artist', artistRouter(this.logger, this.redisConnection));
        this.app.use('/api/art', artRouter(this.logger, this.redisConnection));
        this.app.use('/api/user', userRouter(this.logger, this.redisConnection, elk_client));
        this.app.use('/api/review', reviewRouter(this.logger, this.redisConnection));

        // Health check endpoint
        this.app.get('/health', async (req, res) => {
            const status = {
                database: this.database.isConnected,
                redis: this.redisConnection.getStatus().connected,
                elasticsearch: this.elasticsearchConnection.getStatus().connected,
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

    private async checkElasticsearchConnection(): Promise<void> {
        if (!this.elasticsearchConnection.getStatus().connected) {
            await this.elasticsearchConnection.retryConnection();
        }

        const elk_client = this.elasticsearchConnection.getClient();
        if (elk_client) {
            this.logger.info('Elasticsearch client is ready.');
        } else {
            this.logger.error('Failed to connect to Elasticsearch.');
        }
    }

    private async connectToDatabase(): Promise<void> {
        try {
            await this.database.connectWithRetry();
            this.logger.info('Database connected successfully');
        } catch (error) {
            this.logger.error('Failed to connect to the database', { error: error.message });
            process.exit(1);
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

    public async start(): Promise<void> {
        this.validateEnvVariables();

        await this.connectToDatabase();
        await this.checkRedisConnection();
        await this.checkElasticsearchConnection();
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

            // Close Elasticsearch connection (if applicable)
            if (this.elasticsearchConnection.getClient()) {
                this.logger.info('Closing Elasticsearch connection...');
                // Add Elasticsearch cleanup logic here
                this.logger.info('Elasticsearch connection closed.');
            }

            // Close MinIO connection (if applicable)
            // Add MinIO cleanup logic here
        } catch (error) {
            this.logger.error('Error during shutdown:', { error: error });
        }
    }
}

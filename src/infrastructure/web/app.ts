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
// import { connectWithRetryRedis } from '@src/infrastructure/persistence/RedisConnection';  // Import Redis connection logic
import MinIOConnection from '@src/infrastructure/persistence/minioConnection'; // Update path as needed

const metricsMiddleware = promBundle({
    includeMethod: true,
    includePath: true,
});

export default class App {
    private app: Application;
    private port: number;
    private logger: Logger;
    private database: Database;
    // private minio: MinIOConnection;

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

        // Initialize MinIOConnection
        // this.minio = new MinIOConnection(
        //     process.env.MINIO_SERVER || 'localhost:9000',
        //     process.env.MINIO_USER as string,
        //     process.env.MINIO_PASS as string
        // );

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

        // Connect to MongoDB
        try {
            await this.database.connectWithRetry();
            this.logger.info('Database connected successfully');
        } catch (error) {
            this.logger.error('Failed to connect to the database:', error);
            process.exit(1);
        }

        // await connectWithRetryRedis();

        // Connect to MinIO with retries
        // await this.minio.connectWithRetry();
        // this.minio.monitorConnection();  // Start monitoring the MinIO connection

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

        } catch (error) {
            this.logger.error('Error during shutdown:', error);
        }
    }
}

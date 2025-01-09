import mongoose from 'mongoose';
import { Logger } from 'winston';

class Database {
    private static instance: Database;
    private databaseUrl: string;
    private maxRetries: number;
    private retryDelay: number;
    private currentRetries: number;
    private circuitState: 'closed' | 'open' | 'half-open';
    private circuitBreakerCooldown: number;
    private lastFailureTime: number;
    private logger: Logger;
    private healthCheckInterval: NodeJS.Timeout | null = null;
    public isConnected: boolean = false;

    private constructor(
        logger: Logger,
        databaseUrl: string = process.env.DB_URI || 'mongodb://localhost:27017/artistdb1',
        maxRetries: number = 5,
        retryDelay: number = 2000,
        circuitBreakerCooldown: number = 30000,
        healthCheckIntervalMs: number = 10000
    ) {
        this.logger = logger;
        this.databaseUrl = databaseUrl;
        this.maxRetries = maxRetries;
        this.retryDelay = retryDelay;
        this.circuitState = 'closed';
        this.circuitBreakerCooldown = circuitBreakerCooldown;
        this.lastFailureTime = 0;
        this.currentRetries = 0;
        this.connectWithRetry();
        this.startHealthCheck(healthCheckIntervalMs);
    }

    public static getInstance(
        logger: Logger,
        databaseUrl?: string,
        maxRetries?: number,
        retryDelay?: number,
        circuitBreakerCooldown?: number,
        healthCheckIntervalMs?: number
    ): Database {
        if (!Database.instance) {
            Database.instance = new Database(
                logger,
                databaseUrl,
                maxRetries,
                retryDelay,
                circuitBreakerCooldown,
                healthCheckIntervalMs
            );
        }
        return Database.instance;
    }

    private async connect() {
        try {
            this.logger.info('Attempting to connect to MongoDB...');
            await mongoose.connect(this.databaseUrl);
            this.logger.info('Connected to MongoDB');
            this.isConnected = true;
            this.currentRetries = 0;
            this.circuitState = 'closed';
        } catch (error: any) {
            this.logger.error('Error connecting to MongoDB:', error.message);
            this.isConnected = false;
            throw error;
        }
    }

    public async connectWithRetry() {
        if (this.circuitState === 'open') {
            const timeSinceLastFailure = Date.now() - this.lastFailureTime;
            if (timeSinceLastFailure < this.circuitBreakerCooldown) {
                this.logger.info(`Circuit is open. Retry cooldown active. Retrying in ${this.circuitBreakerCooldown / 1000} seconds...`);
                await new Promise((resolve) => setTimeout(resolve, this.circuitBreakerCooldown));
                this.circuitState = 'half-open';
            } else {
                this.logger.info('Cooldown period over, retrying connection...');
                this.circuitState = 'half-open';
            }
        }

        if (this.circuitState === 'closed' || this.circuitState === 'half-open') {
            try {
                await this.connect();
                this.currentRetries = 0;
                this.lastFailureTime = 0;
            } catch (error) {
                this.currentRetries++;
                this.logger.info(
                    `Retry attempt ${this.currentRetries}/${this.maxRetries} failed. Retrying in ${this.retryDelay / 1000} seconds...`
                );
                await new Promise((resolve) => setTimeout(resolve, this.retryDelay));

                if (this.currentRetries >= this.maxRetries) {
                    this.logger.error('Max retry attempts reached. Opening the circuit.');
                    this.circuitState = 'open';
                    this.lastFailureTime = Date.now();
                }
            }
        }
    }

    private startHealthCheck(intervalMs: number): void {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
        }

        this.healthCheckInterval = setInterval(async () => {
            if (!mongoose.connection || mongoose.connection.readyState !== 1) {
                this.logger.error('MongoDB connection is not active.');
                this.isConnected = false;
                await this.connectWithRetry();
                return;
            }

            try {
                await mongoose.connection.db.admin().ping();
                this.logger.info('MongoDB health check successful.');
                this.isConnected = true;
            } catch (error) {
                this.logger.error('MongoDB health check failed:', error);
                this.isConnected = false;
                await this.connectWithRetry();
            }
        }, intervalMs);
    }

    public stopHealthCheck(): void {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
        }
    }

    public monitorConnection() {
        mongoose.connection.on('disconnected', async () => {
            this.logger.warn('MongoDB connection lost. Attempting to reconnect...');
            this.isConnected = false;
            await this.connectWithRetry();
        });

        mongoose.connection.on('error', (error: any) => {
            this.logger.error('MongoDB encountered an error:', error.message);
            this.isConnected = false;
        });

        mongoose.connection.on('connected', () => {
            this.logger.info('MongoDB reconnected');
            this.isConnected = true;
        });

        mongoose.connection.on('reconnected', () => {
            this.logger.info('MongoDB reconnected');
            this.isConnected = true;
        });

        mongoose.connection.on('close', () => {
            this.logger.info('MongoDB connection closed');
            this.isConnected = false;
        });
    }
}

export default Database;

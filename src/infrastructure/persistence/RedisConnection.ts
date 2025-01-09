import { createClient, RedisClientType } from '@redis/client';
import { Logger } from 'winston';

class RedisConnection {
    private client: RedisClientType | null = null;
    private status: { connected: boolean } = { connected: false };
    private healthCheckInterval: NodeJS.Timeout | null = null;
    private logger: Logger;

    constructor(logger: Logger) {
        this.logger = logger;
        this.connectWithRetry(); // Automatically initialize Redis connection on instantiation
    }

    public async connectWithRetry(maxRetries: number = 10): Promise<void> {
        let retries = 0;
        this.client = null;

        while (retries < maxRetries) {
            retries++;
            this.logger.info(`Redis connection attempt ${retries}/${maxRetries}`);
            let client = null;
            client = await this.connectToRedis();

            if (client) {
                this.client = client;
                this.startHealthCheck();
                return;
            }

            this.logger.info(`Retry attempt ${retries} failed. Retrying in 1 second...`);
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        this.logger.error('Unable to connect to Redis after multiple attempts.');
    }

    private async connectToRedis(): Promise<RedisClientType | null> {
        const client = createClient({
            url: process.env.REDIS_URL || 'redis://localhost:6379',
        }) as RedisClientType;

        client.on('error', (err) => {
            if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
                this.logger.info('Redis connection error detected. Retrying...');
            }
            this.status.connected = false;
        });

        try {
            this.logger.info('Attempting to connect to Redis...');
            await client.connect();
            this.logger.info('Connected to Redis');
            this.status.connected = true;
            return client;
        } catch (error) {
            this.logger.error('Error connecting to Redis:', error.message);
            this.status.connected = false;
            return null;
        }
    }

    private startHealthCheck(): void {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
        }

        this.healthCheckInterval = setInterval(async () => {
            if (!this.client) {
                this.logger.error('Redis client is not initialized.');
                this.status.connected = false;
                return;
            }

            try {
                await this.client.ping();
                this.logger.info('Redis health check successful.');
            } catch (error) {
                this.logger.error('Redis health check failed:', error);
                this.status.connected = false;
                this.client = null;
                clearInterval(this.healthCheckInterval!);
                this.connectWithRetry();
            }
        }, 10000);
    }

    public getClient(): RedisClientType | null {
        return this.client;
    }

    public getStatus(): { connected: boolean } {
        return this.status;
    }

    public async disconnect(): Promise<void> {
        if (this.client) {
            await this.client.quit();
            this.client = null;
            this.status.connected = false;
            this.logger.info('Redis connection closed.');
        }
    }

    public stopHealthCheck(): void {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
        }
    }
}

// Export the class instead of a singleton instance
export default RedisConnection;

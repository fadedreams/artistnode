import { createClient, RedisClientType } from '@redis/client';

class RedisConnection {
    private client: RedisClientType | null = null;
    private status: { connected: boolean } = { connected: false };
    private healthCheckInterval: NodeJS.Timeout | null = null;

    constructor() {
        this.connectWithRetry(); // Automatically initialize Redis connection on instantiation
    }

    // Method to initialize Redis connection with retries
    public async connectWithRetry(maxRetries: number = 10): Promise<void> {
        let retries = 0;
        this.client = null;

        while (retries < maxRetries) {
            retries++;
            console.log(`Redis connection attempt ${retries}/${maxRetries}`);
            let client = null;
            client = await this.connectToRedis();

            if (client) {
                this.client = client; // Set the connected Redis client
                this.startHealthCheck(); // Start health check after successful connection
                return;
            }

            console.log(`Retry attempt ${retries} failed. Retrying in 1 second...`);
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        console.error('Unable to connect to Redis after multiple attempts.');
    }

    // Method to attempt connection to Redis
    private async connectToRedis(): Promise<RedisClientType | null> {
        const client = createClient({
            url: process.env.REDIS_URL || 'redis://localhost:6379', // Use environment variable or fallback to localhost
        }) as RedisClientType;

        client.on('error', (err) => {
            if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
                console.log('Redis connection error detected. Retrying...');
            }
            this.status.connected = false; // Update status on error
        });

        try {
            console.log('Attempting to connect to Redis...');
            await client.connect();
            console.log('Connected to Redis');
            this.status.connected = true; // Update status on successful connection
            return client;
        } catch (error) {
            console.error('Error connecting to Redis:', error.message);
            this.status.connected = false; // Update status on failure
            return null;
        }
    }

    // Method to start health check
    private startHealthCheck(): void {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
        }

        this.healthCheckInterval = setInterval(async () => {
            if (!this.client) {
                console.error('Redis client is not initialized.');
                this.status.connected = false;
                return;
            }

            try {
                await this.client.ping(); // Simple ping to check health
                console.log('Redis health check successful.');
            } catch (error) {
                console.error('Redis health check failed:', error);
                this.status.connected = false;
                this.client = null;
                clearInterval(this.healthCheckInterval!);
                this.connectWithRetry(); // Retry connection if health check fails
            }
        }, 10000); // Check every 10 seconds
    }

    // Method to get the Redis client
    public getClient(): RedisClientType | null {
        return this.client;
    }

    // Method to check the connection status
    public getStatus(): { connected: boolean } {
        return this.status;
    }

    // Method to close the Redis connection
    public async disconnect(): Promise<void> {
        if (this.client) {
            await this.client.quit();
            this.client = null;
            this.status.connected = false;
            console.log('Redis connection closed.');
        }
    }

    // Method to stop health check
    public stopHealthCheck(): void {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
        }
    }
}

// Create a singleton instance of RedisConnection
const redisState = new RedisConnection();

export default redisState;

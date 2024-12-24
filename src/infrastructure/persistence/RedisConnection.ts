import { createClient } from '@redis/client';

let redisStatus = { connected: false }; // Shared status variable to track Redis connection status
let redisClient; // Redis client instance

// Function to attempt connection to Redis and return true/false
async function connectToRedis() {
    const client = createClient({
        url: 'redis://localhost:6379', // Adjust to the correct Redis server URL
    });

    client.on('error', (err) => {
        console.error('Redis Client Error:', err);
        if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
            console.log('Error detected. Will retry connection in the main loop.');
        }
        redisStatus.connected = false; // Update status on error
    });

    try {
        console.log('Attempting to connect to Redis...');
        await client.connect();
        console.log('Connected to Redis');
        redisStatus.connected = true; // Update status on successful connection
        return client;
    } catch (error) {
        console.error('Error connecting to Redis:', error.message);
        redisStatus.connected = false; // Update status on failure
        return null;
    }
}

// Function to connect with retries and export the Redis client
export async function connectWithRetryRedis() {
    let retries = 0;
    const maxRetries = 10;

    while (retries < maxRetries) {
        retries++;
        console.log(`Redis connection attempt ${retries}/${maxRetries}`);
        const client = await connectToRedis();

        if (client) {
            redisClient = client; // Set the connected Redis client
            return;
        }

        console.log(`Retry attempt ${retries} failed. Retrying in 1 second...`);
        await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    console.error('Unable to connect to Redis after multiple attempts.');
}

// Export the Redis client and status
export { redisClient, redisStatus };

// Initialize Redis connection
connectWithRetryRedis();

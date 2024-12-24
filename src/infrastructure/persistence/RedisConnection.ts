import { createClient } from '@redis/client';

let redisStatus = { connected: false }; // Shared status variable to track Redis connection status

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
        return { success: true, client };
    } catch (error) {
        console.error('Error connecting to Redis:', error.message);
        redisStatus.connected = false; // Update status on failure
        return { success: false, client };
    }
}

// Function to attempt reconnection when an error occurs
async function reconnectToRedis() {
    let retryAttempts = 0;
    const maxRetries = 5; // Max retry attempts before giving up

    while (1) {
        retryAttempts++;
        console.log(`Retry attempt ${retryAttempts}...`);

        try {
            const newClient = createClient({
                url: 'redis://localhost:6379',
            });

            await newClient.connect();
            console.log('Reconnected to Redis');
            redisStatus.connected = true; // Update status on successful reconnection
            return newClient;
        } catch (error) {
            console.error(`Retry ${retryAttempts} failed:`, error.message);
            redisStatus.connected = false; // Update status on failure
            if (retryAttempts >= maxRetries) {
                console.log('Max retry attempts reached. Giving up.');
                break;
            }
        }

        await new Promise((resolve) => setTimeout(resolve, 2000));
    }
    return null;
}

// Infinite loop for retry logic
export async function connectWithRetryRedis() {
    let result;
    let client;
    let retries = 0;
    const maxRetries = 10;

    do {
        retries++;
        console.log(`Attempt ${retries}/${maxRetries}`);
        result = await connectToRedis();

        if (result.success) {
            client = result.client;
            console.log('Connection successful');
            break;
        } else {
            console.log(`Retry attempt ${retries}/${maxRetries} failed. Retrying...`);
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }
    } while (!result.success && retries < maxRetries);

    if (client) {
        client.on('error', async (err) => {
            console.error('Redis Client Error:', err);
            if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
                console.log('Reconnecting due to error...');
                const reconnectedClient = await reconnectToRedis();
                if (reconnectedClient) {
                    client = reconnectedClient;
                    console.log('Reconnected successfully');
                } else {
                    console.log('Unable to reconnect. Retrying...');
                }
            }
        });

        client.on('end', () => {
            console.log('Redis connection closed.');
            redisStatus.connected = false; // Update status on disconnection
        });
    }
}

// Export the Redis status so it can be used elsewhere
export { redisStatus };

connectWithRetryRedis();

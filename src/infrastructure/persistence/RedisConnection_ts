import { createClient } from '@redis/client';

// Function to attempt connection to Redis and return true/false
async function connectToRedis() {
    const client = createClient({
        // url: 'redis://localhost:6379'
        url: process.env.REDIS_URL || 'redis://localhost:6379',
    });

    // Handling the error event to prevent crashes and retry connection
    client.on('error', (err) => {
        console.error('Redis Client Error:', err);
        // Only retry on connection errors
        if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
            console.log('Error detected. Will retry connection in the main loop.');
        }
    });

    try {
        console.log('Attempting to connect to Redis...');
        await client.connect();
        console.log('Connected to Redis');
        return { success: true, client }; // Return client along with success
    } catch (error) {
        console.error('Error connecting to Redis:', error.message);
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
            // Create a new client for each retry attempt
            const newClient = createClient({
                url: 'redis://localhost:6379' // Adjust to the correct Redis server URL
            });

            // Try connecting with the new client
            await newClient.connect();
            console.log('Reconnected to Redis');
            return newClient; // Return the newly connected client
        } catch (error) {
            console.error(`Retry ${retryAttempts} failed:`, error.message);
            if (retryAttempts >= maxRetries) {
                console.log('Max retry attempts reached. Giving up.');
                break;
            }
        }

        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for 2 seconds before retrying
    }
    return null; // Return null if all retries fail
}

// Infinite loop for retry logic
async function connectWithRetry() {
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
            break; // Exit loop once connected
        } else {
            console.log(`Retry attempt ${retries}/${maxRetries} failed. Retrying...`);
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 1 second before retrying
        }

    } while (!result.success && retries < maxRetries); // Stop after max retries

    if (client) {
        // Monitor the client for unexpected errors
        client.on('error', async (err) => {
            console.error('Redis Client Error:', err);
            if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
                console.log('Reconnecting due to error...');
                const reconnectedClient = await reconnectToRedis();
                if (reconnectedClient) {
                    client = reconnectedClient; // Update the client if reconnected successfully
                    console.log('Reconnected successfully');
                } else {
                    console.log('Unable to reconnect. Retrying...');
                }
            }
        });

        client.on('end', () => {
            console.log('Redis connection closed.');
        });
    }
}

connectWithRetry();

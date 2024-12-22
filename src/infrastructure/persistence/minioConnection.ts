import { Client } from 'minio';

// Define the MinIO connection class with retry logic
export default class MinIOConnection {
    private minioClient: Client;
    private maxRetries: number;
    private retryDelay: number;  // Retry delay in milliseconds

    constructor(
        private minioServer: string,
        private minioUser: string,
        private minioPass: string,
        maxRetries: number = 5,
        retryDelay: number = 2000 // Default retry delay of 2 seconds
    ) {
        this.maxRetries = maxRetries;
        this.retryDelay = retryDelay;

        // Initialize MinIO client
        this.minioClient = new Client({
            endPoint: minioServer,
            port: 9000,
            useSSL: false,
            accessKey: minioUser,
            secretKey: minioPass,
        });
    }

    // Attempt to connect to MinIO
    private async connectToMinIO(): Promise<{ success: boolean; client?: Client }> {
        try {
            console.log('Attempting to connect to MinIO...');
            // MinIO doesn't have a built-in "connect" method, but you can verify connectivity by listing buckets
            const buckets = await this.minioClient.listBuckets();
            console.log('Connected to MinIO');
            return { success: true, client: this.minioClient };
        } catch (error) {
            console.error('Error connecting to MinIO:', error.message);
            return { success: false };
        }
    }

    // Reconnect logic for MinIO
    private async reconnectToMinIO(): Promise<Client | null> {
        let retryAttempts = 0;

        while (retryAttempts < this.maxRetries) {
            retryAttempts++;
            console.log(`MinIO reconnect attempt ${retryAttempts}...`);

            const result = await this.connectToMinIO();

            if (result.success) {
                return result.client!;
            }

            console.error(`MinIO reconnect attempt ${retryAttempts} failed`);
            await new Promise(resolve => setTimeout(resolve, this.retryDelay)); // Wait before retrying
        }

        console.log('Max retry attempts reached for MinIO. Giving up.');
        return null;
    }

    // Main method to handle retry attempts for MinIO connection
    public async connectWithRetry(): Promise<Client | null> {
        let retries = 0;
        let client: Client | null = null;

        while (retries < this.maxRetries) {
            retries++;
            console.log(`MinIO connection attempt ${retries}/${this.maxRetries}`);

            const result = await this.connectToMinIO();

            if (result.success) {
                client = result.client!;
                console.log('Connected to MinIO');
                break;
            } else {
                console.log(`MinIO connection attempt ${retries} failed. Retrying...`);
                await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retrying
            }
        }

        return client; // Return null if connection fails after max retries
    }
}

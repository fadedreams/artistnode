import { Client } from 'minio';

export default class MinIOConnection {
    private minioClient: Client;
    private maxRetries: number;
    private retryDelay: number;  // Retry delay in milliseconds
    private isConnected: boolean = false;  // Track the connection status

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
            port: 9000,  // Default port, can be overridden by environment
            useSSL: false,  // Assuming no SSL, set true if SSL is used
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

            // Re-initialize the client
            this.minioClient = new Client({
                endPoint: process.env.MINIO_SERVER || 'localhost',
                port: process.env.MINIO_PORT ? Number(process.env.MINIO_PORT) : 9000,
                useSSL: false,
                accessKey: process.env.MINIO_USER,
                secretKey: process.env.MINIO_PASS,
            });

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

        while (1) {
            retries++;
            console.log(`MinIO connection attempt ${retries}/${this.maxRetries}`);

            const result = await this.connectToMinIO();

            if (result.success) {
                client = result.client!;
                this.isConnected = true;  // Update connection status
                console.log('Connected to MinIO');
                break;
            } else {
                console.log(`MinIO connection attempt ${retries} failed. Retrying...`);
                await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retrying
            }
        }

        return client; // Return null if connection fails after max retries
    }

    // Monitor connection periodically to check if it's still active
    public async monitorConnection(): Promise<void> {
        setInterval(async () => {
            if (this.isConnected) {
                try {
                    // Check if MinIO is still connected by listing buckets
                    await this.minioClient.listBuckets();
                    console.log('MinIO connection is still active.');
                } catch (error) {
                    console.error('MinIO connection failed, attempting to reconnect...');
                    this.isConnected = false;  // Update connection status to disconnected
                    await this.connectWithRetry();  // Attempt to reconnect
                }
            }
        }, 15000); // Check every 15 seconds (adjustable interval)
    }

    // Helper function to reset client state if needed
    public resetClient() {
        console.log('Resetting MinIO client...');
        this.minioClient = new Client({
            endPoint: process.env.MINIO_SERVER || 'localhost',
            port: process.env.MINIO_PORT ? Number(process.env.MINIO_PORT) : 9000,
            useSSL: false,
            accessKey: process.env.MINIO_USER,
            secretKey: process.env.MINIO_PASS,
        });
    }

    // Getter to check if MinIO is connected
    public getConnectionStatus(): boolean {
        return this.isConnected;
    }
}

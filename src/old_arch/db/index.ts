import mongoose from 'mongoose';

class Database {
    private databaseUrl: string; // MongoDB URL
    private maxRetries: number; // Maximum retry attempts
    private retryDelay: number; // Delay between retries (in ms)
    private currentRetries: number; // Current retry count

    constructor() {
        this.databaseUrl = 'mongodb://localhost:27017/artistdb1'; // Update with your MongoDB URL
        this.maxRetries = 5; // Maximum retry attempts
        this.retryDelay = 2000; // Delay between retries (in ms)
        this.currentRetries = 0;
        this.connectWithRetry();
    }

    // Function to connect to MongoDB
    private async connect() {
        try {
            console.log('Attempting to connect to MongoDB...');
            await mongoose.connect(this.databaseUrl); // No need for options in modern versions of mongoose
            console.log('Connected to MongoDB');
            this.currentRetries = 0; // Reset retry count on successful connection
        } catch (error: any) {
            console.error('Error connecting to MongoDB:', error.message);
            throw error; // Re-throw error for retry handling
        }
    }

    // Retry logic for MongoDB connection
    private async connectWithRetry() {
        while (this.currentRetries < this.maxRetries) {
            try {
                await this.connect();
                break; // Exit loop on successful connection
            } catch (error) {
                this.currentRetries++;
                console.log(
                    `Retry attempt ${this.currentRetries}/${this.maxRetries} failed. Retrying in ${this.retryDelay / 1000} seconds...`
                );
                await new Promise((resolve) => setTimeout(resolve, this.retryDelay));
            }
        }

        if (this.currentRetries >= this.maxRetries) {
            console.error('Max retry attempts reached. Unable to connect to MongoDB.');
        }
    }

    // Monitor disconnection and reconnect
    public monitorConnection() {
        mongoose.connection.on('disconnected', async () => {
            console.warn('MongoDB connection lost. Attempting to reconnect...');
            await this.connectWithRetry();
        });

        mongoose.connection.on('error', (error: any) => {
            console.error('MongoDB encountered an error:', error.message);
        });
    }
}

// Instantiate the Database class to initiate connection
const dbInstance = new Database();
dbInstance.monitorConnection();

export default mongoose;

import mongoose from 'mongoose';

class Database {
    private databaseUrl: string;
    private maxRetries: number;
    private retryDelay: number;
    private currentRetries: number;

    // Exportable variable to track MongoDB connection status
    public static isConnected: boolean = false; // Initially set to false

    constructor() {
        this.databaseUrl = 'mongodb://localhost:27017/artistdb1'; // Your MongoDB URL
        this.maxRetries = 5;
        this.retryDelay = 2000; // Delay between retries (in ms)
        this.currentRetries = 0;
        this.connectWithRetry();
    }

    private async connect() {
        try {
            console.log('Attempting to connect to MongoDB...');
            await mongoose.connect(this.databaseUrl); // No options needed here
            console.log('Connected to MongoDB');
            Database.isConnected = true;  // Set the status to true on successful connection
            this.currentRetries = 0; // Reset retry count on successful connection
        } catch (error: any) {
            console.error('Error connecting to MongoDB:', error.message);
            Database.isConnected = false;  // Set the status to false on failure
            throw error;
        }
    }

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

    public monitorConnection() {
        mongoose.connection.on('disconnected', async () => {
            console.warn('MongoDB connection lost. Attempting to reconnect...');
            Database.isConnected = false;  // Update the status when disconnected
            await this.connectWithRetry();
        });

        mongoose.connection.on('error', (error: any) => {
            console.error('MongoDB encountered an error:', error.message);
            Database.isConnected = false;  // Update the status on error
        });

        mongoose.connection.on('connected', () => {
            Database.isConnected = true;  // Update the status when connected
            console.log('MongoDB reconnected');
        });
    }
}

export default Database;
export { Database };  // Export the Database class so we can access isConnected status from other modules

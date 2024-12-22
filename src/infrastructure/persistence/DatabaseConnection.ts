import mongoose from 'mongoose';

class Database {
    private databaseUrl: string;
    private maxRetries: number;
    private retryDelay: number;
    private currentRetries: number;
    private circuitState: 'closed' | 'open' | 'half-open';  // State of the circuit breaker
    private circuitBreakerCooldown: number;  // Cooldown time in ms
    private lastFailureTime: number;  // Time of last failure

    // Exportable variable to track MongoDB connection status
    public static isConnected: boolean = false; // Initially set to false

    // Constructor accepting connection configuration parameters
    constructor(
        databaseUrl: string = process.env.DB_URI || 'mongodb://localhost:27017/artistdb1',
        maxRetries: number = 5,
        retryDelay: number = 2000, // Delay between retries (in ms)
        circuitBreakerCooldown: number = 30000 // Cooldown time for circuit breaker (30 seconds)
    ) {
        this.databaseUrl = databaseUrl;
        this.maxRetries = maxRetries;
        this.retryDelay = retryDelay;
        this.circuitState = 'closed';  // Initial state of the circuit breaker is 'closed'
        this.circuitBreakerCooldown = circuitBreakerCooldown;
        this.lastFailureTime = 0;  // Initialize time of last failure
        this.currentRetries = 0;
        this.connectWithRetry();
    }

    // Function to connect to MongoDB
    private async connect() {
        try {
            console.log('Attempting to connect to MongoDB...');
            await mongoose.connect(this.databaseUrl); // No options needed here
            console.log('Connected to MongoDB');
            Database.isConnected = true;  // Set the status to true on successful connection
            this.currentRetries = 0; // Reset retry count on successful connection
            this.circuitState = 'closed';  // Close the circuit on successful connection
        } catch (error: any) {
            console.error('Error connecting to MongoDB:', error.message);
            Database.isConnected = false;  // Set the status to false on failure
            throw error;
        }
    }

    // Function to handle retries and implement the circuit breaker pattern
    public async connectWithRetry() {
        if (this.circuitState === 'open') {
            const timeSinceLastFailure = Date.now() - this.lastFailureTime;
            if (timeSinceLastFailure < this.circuitBreakerCooldown) {
                console.log(`Circuit is open. Retry cooldown active. Retrying in ${this.circuitBreakerCooldown / 1000} seconds...`);
                await new Promise(resolve => setTimeout(resolve, this.circuitBreakerCooldown));
                this.circuitState = 'half-open';  // Half-open to test reconnection
            } else {
                console.log('Cooldown period over, retrying connection...');
                this.circuitState = 'half-open';
            }
        }

        // If circuit is closed or half-open, attempt connection
        if (this.circuitState === 'closed' || this.circuitState === 'half-open') {
            try {
                await this.connect();
                this.currentRetries = 0;  // Reset retries on successful connection
                this.lastFailureTime = 0; // Reset last failure time on success
            } catch (error) {
                this.currentRetries++;
                console.log(
                    `Retry attempt ${this.currentRetries}/${this.maxRetries} failed. Retrying in ${this.retryDelay / 1000} seconds...`
                );
                await new Promise((resolve) => setTimeout(resolve, this.retryDelay));

                // If max retries reached, open the circuit
                if (this.currentRetries >= this.maxRetries) {
                    console.error('Max retry attempts reached. Opening the circuit.');
                    this.circuitState = 'open';  // Open the circuit if retries are exhausted
                    this.lastFailureTime = Date.now();  // Set the failure time for cooldown
                }
            }
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

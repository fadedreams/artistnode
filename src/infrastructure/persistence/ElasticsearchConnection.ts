import { Client } from '@elastic/elasticsearch';

class ElasticsearchConnection {
    private client: Client | null = null;
    private status: { connected: boolean } = { connected: false };
    private healthCheckInterval: NodeJS.Timeout | null = null;

    constructor() {
        this.retryConnection(); // Automatically start retrying the connection when instantiated
    }

    // Method to retry connection until successful
    public async retryConnection(): Promise<void> {
        while (!this.status.connected) {
            console.log('Retrying Elasticsearch connection...');

            // Create a new Client instance
            const client = new Client({
                node: process.env.ELASTICSEARCH_URL,  // Elasticsearch URL from environment variables
                auth: {
                    username: process.env.ELASTICSEARCH_USERNAME,  // Optional, if security is enabled
                    password: process.env.ELASTICSEARCH_PASSWORD,  // Optional, if security is enabled
                }
            });

            try {
                console.log('Attempting to connect to Elasticsearch...');
                const health = await client.cat.health();
                console.log('Elasticsearch connection successful:', health);
                this.client = client; // Set the client
                this.status.connected = true; // Update connection status

                // Start periodic health checks
                this.startHealthCheck();
            } catch (error) {
                console.error('Error connecting to Elasticsearch:', error); // Log the full error object
                this.client = null; // Reset the client
                this.status.connected = false; // Update connection status
                await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds before retrying
            }
        }
    }

    // Method to start periodic health checks
    private startHealthCheck(): void {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval); // Clear any existing interval
        }

        this.healthCheckInterval = setInterval(async () => {
            if (!this.client) {
                console.error('Elasticsearch client is not initialized.');
                this.status.connected = false;
                return;
            }

            try {
                await this.client.cat.health(); // Perform a health check
                console.log('Elasticsearch health check successful.');
            } catch (error) {
                console.error('Elasticsearch health check failed:', error);
                this.status.connected = false;
                this.client = null; // Reset the client
                clearInterval(this.healthCheckInterval!); // Stop the health check interval
                this.retryConnection(); // Attempt to reconnect
            }
        }, 10000); // Check every 10 seconds
    }

    // Method to get the Elasticsearch client
    public getClient(): Client | null {
        return this.client;
    }

    // Method to check the connection status
    public getStatus(): { connected: boolean } {
        return this.status;
    }

    // Method to stop health checks (e.g., during shutdown)
    public stopHealthCheck(): void {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
        }
    }
}

export default ElasticsearchConnection;

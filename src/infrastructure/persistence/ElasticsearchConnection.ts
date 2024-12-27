import { Client } from '@elastic/elasticsearch';

class ElasticsearchConnection {
    private client: Client | null = null;
    private status: { connected: boolean } = { connected: false };

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
            } catch (error) {
                console.error('Error connecting to Elasticsearch:', error); // Log the full error object
                this.client = null; // Reset the client
                this.status.connected = false; // Update connection status
                await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds before retrying
            }
        }
    }

    // Method to get the Elasticsearch client
    public getClient(): Client | null {
        return this.client;
    }

    // Method to check the connection status
    public getStatus(): { connected: boolean } {
        return this.status;
    }
}

export default ElasticsearchConnection;

import { Client } from '@elastic/elasticsearch';

class ElasticsearchConnection {
    private client: Client;

    constructor() {
        this.client = new Client({
            node: process.env.ELASTICSEARCH_URL,  // Elasticsearch URL from environment variables
            auth: {
                username: process.env.ELASTICSEARCH_USERNAME,  // Optional, if security is enabled
                password: process.env.ELASTICSEARCH_PASSWORD,  // Optional, if security is enabled
            }
        });

        this.checkConnection(); // Check connection when the instance is created
    }

    private async checkConnection() {
        try {
            const health = await this.client.cat.health();
            console.log('Elasticsearch connection successful:', health);
        } catch (error) {
            console.error('Failed to connect to Elasticsearch:', error);
        }
    }

    public getClient(): Client {
        return this.client;
    }
}

export default ElasticsearchConnection;

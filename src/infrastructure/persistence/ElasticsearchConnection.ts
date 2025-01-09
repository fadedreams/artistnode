import { Client } from '@elastic/elasticsearch';
import { Logger } from 'winston';

class ElasticsearchConnection {
    private client: Client | null = null;
    private status: { connected: boolean } = { connected: false };
    private healthCheckInterval: NodeJS.Timeout | null = null;
    private logger: Logger;

    constructor(logger: Logger) {
        this.logger = logger;
        this.retryConnection();
    }

    public async retryConnection(): Promise<void> {
        while (!this.status.connected) {
            this.logger.info('Retrying Elasticsearch connection...');

            const client = new Client({
                node: process.env.ELASTICSEARCH_URL,
                auth: {
                    username: process.env.ELASTICSEARCH_USERNAME,
                    password: process.env.ELASTICSEARCH_PASSWORD,
                }
            });

            try {
                this.logger.info('Attempting to connect to Elasticsearch...');
                const health = await client.cat.health();
                this.logger.info('Elasticsearch connection successful:', health);
                this.client = client;
                this.status.connected = true;
                this.startHealthCheck();
            } catch (error) {
                this.logger.error('Error connecting to Elasticsearch:', error);
                this.client = null;
                this.status.connected = false;
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
    }

    private startHealthCheck(): void {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
        }

        this.healthCheckInterval = setInterval(async () => {
            if (!this.client) {
                this.logger.error('Elasticsearch client is not initialized.');
                this.status.connected = false;
                return;
            }

            try {
                await this.client.cat.health();
                this.logger.info('Elasticsearch health check successful.');
            } catch (error) {
                this.logger.error('Elasticsearch health check failed:', error);
                this.status.connected = false;
                this.client = null;
                clearInterval(this.healthCheckInterval!);
                this.retryConnection();
            }
        }, 10000);
    }

    public getClient(): Client | null {
        return this.client;
    }

    public getStatus(): { connected: boolean } {
        return this.status;
    }

    public stopHealthCheck(): void {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
        }
    }
    public async close(): Promise<void> {
        if (this.client) {
            try {
                await this.client.close();
                this.logger.info('Elasticsearch connection closed.');
            } catch (error) {
                this.logger.error('Error closing Elasticsearch connection:', error);
            } finally {
                this.client = null;
                this.status.connected = false;
                this.stopHealthCheck();
            }
        }
    }
}

export default ElasticsearchConnection;

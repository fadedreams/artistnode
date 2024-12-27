import winston from 'winston';
import { ElasticsearchTransport } from 'winston-elasticsearch'; // Import ElasticsearchTransport

class WinstonLogger {
    private logger: winston.Logger;

    constructor() {
        // Elasticsearch Transport Options
        const esTransportOptions = {
            level: 'info', // Log level to send to Elasticsearch
            clientOpts: {
                // node: 'http://localhost:9200', // Elasticsearch URL
                node: process.env.ELASTICSEARCH_URL, // Elasticsearch URL
                auth: {
                    username: 'elastic', // Optional, if security is enabled
                    password: 'pass', // Optional, if security is enabled
                },
            },
            indexPrefix: 'artistnode-logs', // Custom index prefix
        };

        // Create Elasticsearch Transport
        const esTransport = new ElasticsearchTransport(esTransportOptions);

        // Create Winston Logger with Elasticsearch transport
        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json() // Log in JSON format
            ),
            transports: [
                new winston.transports.Console(), // Console transport for debugging
                new winston.transports.File({ filename: 'combined.log' }), // File transport (optional)
                esTransport, // Elasticsearch transport
            ],
        });
    }

    public getLogger(): winston.Logger {
        return this.logger;
    }
}

// Create and export the logger instance
const loggerInstance = new WinstonLogger();
export default loggerInstance.getLogger();

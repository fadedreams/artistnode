import winston from 'winston';
import { ElasticsearchTransport } from 'winston-elasticsearch';

class WinstonLogger {
    private static instance: WinstonLogger;
    private logger: winston.Logger;

    private constructor() {
        // Elasticsearch Transport Options
        const esTransportOptions = {
            level: 'info', // Log level to send to Elasticsearch
            clientOpts: {
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

    public static getInstance(): WinstonLogger {
        if (!WinstonLogger.instance) {
            WinstonLogger.instance = new WinstonLogger();
        }
        return WinstonLogger.instance;
    }

    public getLogger(): winston.Logger {
        return this.logger;
    }
}

export default WinstonLogger.getInstance().getLogger();

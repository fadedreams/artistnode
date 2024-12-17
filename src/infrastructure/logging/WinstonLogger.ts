import winston from 'winston';

class WinstonLogger {
    private logger: winston.Logger;

    constructor() {
        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.json(),
            transports: [
                new winston.transports.Console(),
                new winston.transports.File({ filename: 'combined.log' }),
            ],
        });
    }

    public getLogger(): winston.Logger {
        return this.logger;
    }
}

const loggerInstance = new WinstonLogger();
export default loggerInstance.getLogger();


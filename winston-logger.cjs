const winston = require('winston');

class WinstonLogger {
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

  getLogger() {
    return this.logger;
  }
}

module.exports = { WinstonLogger };

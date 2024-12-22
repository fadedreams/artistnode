import App from '@src/infrastructure/web/app';
import logger from '@src/infrastructure/logging/WinstonLogger';

// Create App instance without redisClient as a parameter
const app = new App(logger);

app.start();

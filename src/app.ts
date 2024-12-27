import App from '@src/infrastructure/web/app';
import logger from '@src/infrastructure/logging/WinstonLogger';
const app = new App(logger);
app.start();

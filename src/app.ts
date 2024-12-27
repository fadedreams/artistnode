import App from '@src/infrastructure/web/app';
import logger from '@src/infrastructure/logging/WinstonLogger';
import ElasticsearchConnection from '@src/infrastructure/persistence/ElasticsearchConnection';
const elkClient = new ElasticsearchConnection();
const app = new App(logger, elkClient);
app.start();

import App from '@src/infrastructure/web/app';
import DatabaseProviderFactory from '@src/infrastructure/persistence/DatabaseProvider';
import logger from '@src/infrastructure/logging/WinstonLogger';

const db = DatabaseProviderFactory.createInstance();

const app = new App(db, logger);

app.start();


import App from '@src/infrastructure/web/app';
import DatabaseProviderFactory from '@src/infrastructure/persistence/DatabaseProvider';
import logger from '@src/infrastructure/logging/WinstonLogger';

// Create an instance of the DatabaseProvider
const db = DatabaseProviderFactory.createInstance();

// Pass the db and logger instances when creating the App
const app = new App(db, logger); // Inject Database and Logger

app.start();


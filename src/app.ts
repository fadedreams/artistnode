import App from '@src/infrastructure/web/app';
import DatabaseProviderFactory from '@src/infrastructure/persistence/DatabaseProvider';

// Create an instance of the DatabaseProvider
const db = DatabaseProviderFactory.createInstance();

// Pass the db instance when creating the App
const app = new App(db); // Inject the Database instance here

app.start();

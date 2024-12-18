
import mongoose from 'mongoose';
import { Database as DatabaseInterface } from '@src/domain/interfaces/Database';

class DatabaseProvider implements DatabaseInterface {
    private databaseUrl: string;

    constructor(databaseUrl: string) {
        this.databaseUrl = databaseUrl;
    }

    async connect(): Promise<void> {
        const options = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        };

        try {
            await mongoose.connect(this.databaseUrl, options);
            console.log('Connected to the database');
        } catch (error) {
            console.error('Error connecting to the database:', error);
            throw new Error('Database connection failed');
        }
    }
}

export default class DatabaseProviderFactory {
    static createInstance(): DatabaseProvider {
        // const databaseUrl = 'mongodb://localhost:27017/artistdb1';
        const databaseUrl = process.env.DB_URI;
        return new DatabaseProvider(databaseUrl);
    }
}



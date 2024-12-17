import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import session from 'express-session';
import RedisStore from 'connect-redis';
import promBundle from 'express-prom-bundle';

import { Database as DatabaseInterface } from '@src/domain/interfaces/Database';
import { createClient } from 'redis';

import userRouter from '@src/infrastructure/web/routers/user';  // Import the user router
import artistRouter from '@src/infrastructure/web/routers/artist';  // Import the user router


const metricsMiddleware = promBundle({
    includeMethod: true,
    includePath: true,
});

export default class App {
    private app: Application;
    private port: number;
    private database: DatabaseInterface;

    constructor(database: DatabaseInterface) {
        this.app = express();
        this.port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
        this.database = database; // Inject the database here

        this.initializeMiddlewares();
        this.initializeRoutes();
    }

    private initializeMiddlewares() {
        this.app.use(cors());
        this.app.use(express.json());
        this.app.use(metricsMiddleware);
        this.app.get('/metrics', metricsMiddleware.metricsMiddleware);

        // Initialize Redis client and store
        const redisClient = createClient();
        redisClient.connect().catch(console.error);

        const redisStore = new RedisStore({
            client: redisClient,
            prefix: 'myapp:',
        });

        // Initialize session storage
        this.app.use(
            session({
                store: redisStore,
                resave: false,
                saveUninitialized: false,
                secret: 'secret',
                cookie: {
                    maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // 10 years
                    httpOnly: true,
                    sameSite: 'lax',
                    secure: false,
                },
            })
        );
    }

    private initializeRoutes() {
        this.app.use('/api/artist', artistRouter);  // Add the user router under the '/api/user' path
        this.app.use('/api/user', userRouter);  // Add the user router under the '/api/user' path
    }

    public async start() {
        dotenv.config();
        try {
            // Ensure the database connection is established before starting the app
            await this.database.connect();

            this.app.listen(this.port, () => {
                console.log(`Server is running on port ${this.port}`);
            });
        } catch (error) {
            console.error('Failed to connect to the database:', error);
        }
    }
}


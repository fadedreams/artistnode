import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import session from 'express-session';
import Redis from 'ioredis';
import connectRedis from 'connect-redis';
import { createClient } from "redis"
import RedisStore from "connect-redis"
import '@src/db/index';  // Import the db connection file


import promBundle from 'express-prom-bundle';

import { WinstonLogger } from '@src/winston-logger.cjs'; // Adjust the path as necessary
const logger = new WinstonLogger().getLogger();
// Log a message at the info level
// logger.info('App is starting');



const metricsMiddleware = promBundle({
    includeMethod: true,
    includePath: true,
});


dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use(metricsMiddleware);
app.get('/metrics', metricsMiddleware.metricsMiddleware);

// Initialize client.
let redisClient = createClient()
redisClient.connect().catch(console.error)

// Initialize store.
let redisStore = new RedisStore({
    client: redisClient,
    prefix: "myapp:",
})

// Initialize sesssion storage.
app.use(
    session({
        store: redisStore,
        resave: false, // required: force lightweight session keep alive (touch)
        saveUninitialized: false, // recommended: only save session when data exists
        secret: "secret",
        cookie: {
            maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // 10 years
            httpOnly: true,
            sameSite: 'lax', // csrf
            secure: false, // cookie only works in https
        },
    })
)
// app.use(
//   session({
//     name: 'qid',
//     store: redisStore,
//     proxy: true,
//     cookie: {
//       maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // 10 years
//       httpOnly: true,
//       sameSite: 'lax', // csrf
//       secure: false, // cookie only works in https
//     },
//     saveUninitialized: false,
//     secret: 'secret',
//     resave: false,
//   })
// );

// Import the user routes
import userRouter from './router/user';
import artistRouter from './router/artist';
import artRouter from './router/art';
import revRouter from './router/review';

// Use the user routes in your app
app.use("/api/user", userRouter);
app.use("/api/artist", artistRouter);
app.use("/api/art", artRouter);
app.use("/api/rev", revRouter);

// Other app configurations and middleware here

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});


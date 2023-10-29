import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();
import db from './db/index.js';

const app = express();
app.use(cors());
app.use(express.json());

// Import the user routes
import userRouter from './router/user.js';
import artistRouter from './router/artist.js';
import artRouter from './router/art.js';

// Use the user routes in your app
app.use("/api/user", userRouter);
app.use("/api/artist", artistRouter);
app.use("/api/art", artRouter);

// Other app configurations and middleware here

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});


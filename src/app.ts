import express, { Express } from 'express';
import userRouter from './routes/userRouter';

const app: Express = express();

app.use(userRouter);

export default app;

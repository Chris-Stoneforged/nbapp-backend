import express, { Express } from 'express';
import authRouter from './routes/authRouter';
import cookieParser from 'cookie-parser';

const app: Express = express();

app.use(express.json());
app.use(cookieParser());
app.use(authRouter);

export default app;

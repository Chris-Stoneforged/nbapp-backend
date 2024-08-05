import express, { Express } from 'express';
import authRouter from './routes/authRouter';
import cookieParser from 'cookie-parser';
import errorHandler from './middleware/errors';

const app: Express = express();

app.use(express.json());
app.use(cookieParser());
app.use(authRouter);
app.use(errorHandler);

export default app;

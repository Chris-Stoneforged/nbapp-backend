import express, { Express } from 'express';
import authRouter from './routes/authRouter';

const app: Express = express();

app.use(express.json());
app.use(authRouter);

export default app;

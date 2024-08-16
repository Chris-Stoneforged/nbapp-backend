import express, { Express } from 'express';
import authRouter from './routes/authRouter';
import tournamentRouter from './routes/tournatmentRouter';
import adminRouter from './routes/adminRouter';
import bracketRouter from './routes/bracketRouter';
import cookieParser from 'cookie-parser';
import errorHandler from './middleware/errors';

const app: Express = express();

app.use(express.json());
app.use(cookieParser());
app.use('/api', authRouter);
app.use('/api', tournamentRouter);
app.use('/api', bracketRouter);
app.use('/api/admin', adminRouter);
app.use(errorHandler);

export default app;

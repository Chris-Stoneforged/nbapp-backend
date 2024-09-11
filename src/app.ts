import express, { Express } from 'express';
import authRouter from './routes/authRouter';
import tournamentRouter from './routes/tournatmentRouter';
import adminRouter from './routes/adminRouter';
import bracketRouter from './routes/bracketRouter';
import cookieParser from 'cookie-parser';
import errorHandler from './middleware/errors';
import Sentry from '@sentry/node';
import './instrument';

const app: Express = express();

app.get('/debug-sentry', function mainHandler(req, res) {
  throw new Error('My first Sentry error!');
});

// Routes
app.use('/api', authRouter);
app.use('/api', tournamentRouter);
app.use('/api', bracketRouter);
app.use('/api/admin', adminRouter);

// Sentry
Sentry.setupExpressErrorHandler(app);

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(errorHandler);

export default app;

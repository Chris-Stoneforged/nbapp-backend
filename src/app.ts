import './instrument';
import express, { Express } from 'express';
import authRouter from './routes/authRouter';
import tournamentRouter from './routes/tournatmentRouter';
import adminRouter from './routes/adminRouter';
import bracketRouter from './routes/bracketRouter';
import cookieParser from 'cookie-parser';
import errorHandler from './middleware/errors';
import rateLimiter from './middleware/rateLimit';
import * as Sentry from '@sentry/node';

const app: Express = express();

app.get('/debug-sentry', function mainHandler(req, res) {
  throw new Error('My first Sentry error!');
});

app.use(rateLimiter({ hitLimit: 2, timeOutMillis: 10000 }));
app.use(express.json());

// Routes
app.use('/api', authRouter);
app.use('/api', tournamentRouter);
app.use('/api', bracketRouter);
app.use('/api/admin', adminRouter);

// Sentry
Sentry.setupExpressErrorHandler(app);

// Middleware
app.use(cookieParser());
app.use(errorHandler);

export default app;

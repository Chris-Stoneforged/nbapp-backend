import express, { Router } from 'express';
import {
  getAvailableBrackets,
  getBracketStateForUser,
  getNextPredictionToMake,
  makePrediction,
} from '../controllers/bracketController';
import { isUserAuthenticated } from '../middleware/auth';
import errorSafe from '../errors/errorHandler';

const router: Router = express.Router();
router
  .route('/v1/bracket/prediction/next')
  .get(errorSafe(isUserAuthenticated, getNextPredictionToMake));
router
  .route('/v1/bracket/prediction/make')
  .post(errorSafe(isUserAuthenticated, makePrediction));
router
  .route('/v1/bracket/state/:id')
  .get(errorSafe(isUserAuthenticated, getBracketStateForUser));
router
  .route('/v1/bracket/available')
  .get(errorSafe(isUserAuthenticated, getAvailableBrackets));

export default router;

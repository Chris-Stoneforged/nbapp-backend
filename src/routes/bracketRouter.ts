import express, { Router } from 'express';
import {
  getNextPredictionToMake,
  makePrediction,
} from '../controllers/bracketController';
import { isUserAuthenticated } from '../middleware/auth';

const router: Router = express.Router();
router
  .route('/bracket/prediction/next')
  .get(isUserAuthenticated, getNextPredictionToMake);
router
  .route('/bracket/prediction/make')
  .post(isUserAuthenticated, makePrediction);

export default router;

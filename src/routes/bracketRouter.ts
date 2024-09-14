import express, { Router } from 'express';
import { getAvailableBrackets } from '../controllers/bracketController';
import { isUserAuthenticated } from '../middleware/auth';
import errorSafe from '../errors/errorHandler';

const router: Router = express.Router();
router
  .route('/v1/brackets')
  .get(errorSafe(isUserAuthenticated, getAvailableBrackets));

export default router;

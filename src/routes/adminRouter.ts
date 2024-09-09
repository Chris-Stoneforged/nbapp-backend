import express, { Router } from 'express';
import { isUserAuthenticated, isAdmin } from '../middleware/auth';
import { udpateBracket } from '../controllers/bracketController';
import errorSafe from '../errors/errorHandler';
import { setScoreValue } from '../controllers/scoreController';

const router: Router = express.Router();
router
  .route('/update-bracket')
  .post(errorSafe(isUserAuthenticated, isAdmin, udpateBracket));
router
  .route('/update-score')
  .post(errorSafe(isUserAuthenticated, isAdmin, setScoreValue));

export default router;

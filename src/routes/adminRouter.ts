import express, { Router } from 'express';
import { isUserAuthenticated, isAdmin } from '../middleware/auth';
import { udpateBracket } from '../controllers/bracketController';
import errorSafe from '../errors/errorHandler';

const router: Router = express.Router();
router
  .route('/update-bracket')
  .post(errorSafe(isUserAuthenticated, isAdmin, udpateBracket));

export default router;

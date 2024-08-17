import express, { Router } from 'express';
import { isUserAuthenticated, isAdmin } from '../middleware/auth';
import { udpateBracket } from '../controllers/bracketController';

const router: Router = express.Router();
router
  .route('/update-bracket')
  .post(isUserAuthenticated, isAdmin, udpateBracket);

export default router;

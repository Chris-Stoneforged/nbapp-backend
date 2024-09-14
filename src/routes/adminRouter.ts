import express, { Router } from 'express';
import { isUserAuthenticated, isAdmin } from '../middleware/auth';
import { deleteBracket, udpateBracket } from '../controllers/bracketController';
import errorSafe from '../errors/errorHandler';

const router: Router = express.Router();
router
  .route('/v1/bracket/set')
  .post(errorSafe(isUserAuthenticated, isAdmin, udpateBracket));
router
  .route('/v1/bracket/:id')
  .delete(errorSafe(isUserAuthenticated, isAdmin, deleteBracket));

export default router;

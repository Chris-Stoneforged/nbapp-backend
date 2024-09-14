import errorSafe from '../errors/errorHandler';
import {
  getTournaments,
  login,
  logout,
  register,
} from '../controllers/userController';
import { isUserAuthenticated } from '../middleware/auth';
import express, { Router } from 'express';

const router: Router = express.Router();
router.route('/v1/user/register').post(errorSafe(register));
router.route('/v1/user/login').post(errorSafe(login));
router.route('/v1/user/logout').post(errorSafe(isUserAuthenticated, logout));
router
  .route('/v1/user/tournaments')
  .get(errorSafe(isUserAuthenticated, getTournaments));

export default router;

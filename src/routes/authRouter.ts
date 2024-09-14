import errorSafe from '../errors/errorHandler';
import { login, logout, register } from '../controllers/authController';
import { isUserAuthenticated } from '../middleware/auth';
import express, { Router } from 'express';

const router: Router = express.Router();
router.route('/v1/register').post(errorSafe(register));
router.route('/v1/login').post(errorSafe(login));
router.route('/v1/logout').post(errorSafe(isUserAuthenticated, logout));

export default router;

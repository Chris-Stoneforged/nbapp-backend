import errorSafe from '../errors/errorHandler';
import { login, logout, register } from '../controllers/authController';
import { isUserAuthenticated } from '../middleware/auth';
import express, { Router } from 'express';

const router: Router = express.Router();
router.route('/register').post(errorSafe(register));
router.route('/login').post(errorSafe(login));
router.route('/logout').post(errorSafe(isUserAuthenticated, logout));

export default router;

import express, { Router } from 'express';
import { login, logout, register } from '../controllers/authController';
import { isUserAuthenticated } from '../middleware/auth';

const router: Router = express.Router();
router.route('/register').post(register);
router.route('/login').post(login);
router.route('/logout').post(isUserAuthenticated, logout);

export default router;

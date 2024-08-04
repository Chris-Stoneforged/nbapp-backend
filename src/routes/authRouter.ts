import express, { Router } from 'express';
import { register } from '../controllers/authController';

const router: Router = express.Router();
router.route('/register').post(register);

export default router;

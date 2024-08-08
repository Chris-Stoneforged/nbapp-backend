import express, { Router } from 'express';
import {
  createTournament,
  getTournamentInviteCode,
  joinTournament,
  leaveTournament,
} from '../controllers/tournamentController';
import { isUserAuthenticated } from '../middleware/auth';

const router: Router = express.Router();
router.route('/tournament/create').post(isUserAuthenticated, createTournament);
router
  .route('/tournament/join/:code')
  .post(isUserAuthenticated, joinTournament);
router.route('/tournament/leave').post(isUserAuthenticated, leaveTournament);
router
  .route('/tournament/generate-invite-code')
  .post(isUserAuthenticated, getTournamentInviteCode);

export default router;

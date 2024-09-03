import express, { Router } from 'express';
import {
  createTournament,
  getTeamMembers,
  getTournamentInviteCode,
  getUsersTournaments,
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
router.route('/tournament/members').get(isUserAuthenticated, getTeamMembers);
router
  .route('/tournament/tournaments')
  .get(isUserAuthenticated, getUsersTournaments);

export default router;

import express, { Router } from 'express';
import {
  createTournament,
  getInviteCodeInfo,
  getTeamMembers,
  getTournamentInviteCode,
  getUsersTournaments,
  joinTournament,
  leaveTournament,
} from '../controllers/tournamentController';
import { isUserAuthenticated } from '../middleware/auth';
import errorSafe from '../errors/errorHandler';

const router: Router = express.Router();
router
  .route('/tournament/create')
  .post(errorSafe(isUserAuthenticated, createTournament));
router
  .route('/tournament/join/:code')
  .post(errorSafe(isUserAuthenticated, joinTournament));
router
  .route('/tournament/leave')
  .post(errorSafe(isUserAuthenticated, leaveTournament));
router
  .route('/tournament/generate-invite-code')
  .post(errorSafe(isUserAuthenticated, getTournamentInviteCode));
router
  .route('/tournament/members')
  .get(errorSafe(isUserAuthenticated, getTeamMembers));
router
  .route('/tournament/tournaments')
  .get(errorSafe(isUserAuthenticated, getUsersTournaments));
router
  .route('/tournament/invite/:code')
  .get(errorSafe(isUserAuthenticated, getInviteCodeInfo));

export default router;

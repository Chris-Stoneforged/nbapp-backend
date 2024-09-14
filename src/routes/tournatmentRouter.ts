import express, { Router } from 'express';
import {
  createTournament,
  getInviteCodeInfo,
  getTournamentDetails,
  getTournamentInviteCode,
  getUsersTournaments,
  joinTournament,
  leaveTournament,
} from '../controllers/tournamentController';
import { isUserAuthenticated } from '../middleware/auth';
import errorSafe from '../errors/errorHandler';

const router: Router = express.Router();
router
  .route('/v1/tournament/create')
  .post(errorSafe(isUserAuthenticated, createTournament));
router
  .route('/v1/tournament/join/:code')
  .post(errorSafe(isUserAuthenticated, joinTournament));
router
  .route('/v1/tournament/leave/:id')
  .post(errorSafe(isUserAuthenticated, leaveTournament));
router
  .route('/v1/tournament/generate-invite-code/:id')
  .post(errorSafe(isUserAuthenticated, getTournamentInviteCode));
router
  .route('/v1/tournament/:id')
  .get(errorSafe(isUserAuthenticated, getTournamentDetails));
router
  .route('/v1/tournaments')
  .get(errorSafe(isUserAuthenticated, getUsersTournaments));
router
  .route('/v1/tournament/invite/:code')
  .get(errorSafe(isUserAuthenticated, getInviteCodeInfo));

export default router;

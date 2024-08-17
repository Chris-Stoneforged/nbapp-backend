export type MatchupData = {
  id: number;
  round: number;
  teamA?: string;
  teamB?: string;
  winner?: string;
  advancesTo?: number;
};

export type BracketData = {
  matchups: MatchupData[];
};

export type MatchupState = MatchupData & { predictedWinner?: string };

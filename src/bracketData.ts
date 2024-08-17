export type MatchupData = {
  id: number;
  round: number;
  team_a?: string;
  team_b?: string;
  winner_plays?: number;
};

export type BracketData = {
  matchups: MatchupData[];
};

export type MatchupState = MatchupData & { predictedWinner?: string };

export type MatchupData = {
  id: number;
  round: number;
  team_a?: string;
  team_b?: string;
  winner?: string;
  advances_to?: number;
};

export type BracketData = {
  bracketId: number;
  bracketName: string;
  matchups: MatchupData[];
};

export type MatchupState = MatchupData & { predictedWinner?: string };

import { BracketData } from './bracketData';

export default function validateBracketJson(
  bracketData: BracketData
): [boolean, string] {
  const idSet = new Set();
  const roundCounts = new Map<number, number>();
  const roundTeams = new Map<number, Set<string>>();
  const advancesTos = new Map<number, number>();
  let highestRound = 0;

  for (const matchUp of bracketData.matchups) {
    idSet.add(matchUp.id);

    // Check no duplicate teams
    const teamSet = roundTeams.get(matchUp.round) || new Set<string>();
    if (matchUp.team_a) {
      if (teamSet.has(matchUp.team_a)) {
        return [
          false,
          `${matchUp.team_a} appears in multiple matchups in round`,
        ];
      }
      teamSet.add(matchUp.team_a);
    }
    if (matchUp.team_b) {
      if (teamSet.has(matchUp.team_b)) {
        return [
          false,
          `${matchUp.team_b} appears in multiple matchups in round`,
        ];
      }
      teamSet.add(matchUp.team_b);
    }

    roundTeams.set(matchUp.round, teamSet);
    roundCounts.set(matchUp.round, (roundCounts.get(matchUp.round) || 0) + 1);

    const nextMatchup = bracketData.matchups.find(
      (m) => m.id === matchUp.advances_to
    );

    // Check advance_to is set correctly
    if (matchUp.advances_to) {
      advancesTos.set(
        matchUp.advances_to,
        (advancesTos.get(matchUp.advances_to) || 0) + 1
      );

      if (!nextMatchup) {
        return [false, 'Invalid advance_tos'];
      }

      if (nextMatchup.round !== matchUp.round + 1) {
        return [false, 'Invalid advance_tos'];
      }

      // Check that a team in the next round can't be set if the winner for current matchup hasn't
      if (nextMatchup.round > 1 && !matchUp.winner) {
        if (
          nextMatchup.team_a &&
          (nextMatchup.team_a === matchUp.team_a ||
            nextMatchup.team_a === matchUp.team_b)
        ) {
          return [false, 'Team set, but previous round winner was not decided'];
        }
        if (
          nextMatchup.team_b &&
          (nextMatchup.team_b === matchUp.team_a ||
            nextMatchup.team_b === matchUp.team_b)
        ) {
          return [false, 'Team set, but previous round winner was not decided'];
        }
      }
    }

    // Check winners are valid
    if (matchUp.winner) {
      if (!matchUp.team_a || !matchUp.team_b) {
        return [false, 'Winner specified but both teams are not set'];
      }

      if (
        matchUp.winner !== matchUp.team_a &&
        matchUp.winner !== matchUp.team_b
      ) {
        return [false, 'Winner is not either of the two set teams'];
      }

      if (
        matchUp.winner !== nextMatchup.team_a &&
        matchUp.winner !== nextMatchup.team_b
      ) {
        return [false, 'Winner specified, but does not appear in next round'];
      }
    }

    if (matchUp.round > highestRound) {
      highestRound = matchUp.round;
    }
  }

  // Unique ids
  if (idSet.size !== bracketData.matchups.length) {
    return [false, 'Matchup Ids are not unique'];
  }

  // Correct number of matchups
  let numberOfMatchups = roundCounts.get(highestRound);
  if (numberOfMatchups !== 1) {
    return [false, 'More than one final matchup'];
  }

  const finalMatchup = bracketData.matchups.find(
    (matchup) => matchup.round === highestRound
  );
  if (finalMatchup.advances_to) {
    return [false, 'Final matchup has an advance_to set'];
  }

  for (let i = highestRound - 1; i > 0; i--) {
    const matchupCount = roundCounts.get(i);
    if (matchupCount !== numberOfMatchups * 2) {
      return [false, 'Round numbers are incorrect'];
    }
    numberOfMatchups = matchupCount;
  }

  // exactly 2 of each 'advances to' for each round
  let validAdvanceTos = true;
  advancesTos.forEach((value) => {
    if (value !== 2) {
      validAdvanceTos = false;
    }
  });

  if (!validAdvanceTos) {
    return [false, 'Invalid advance_tos'];
  }

  return [true, 'Valid bracket'];
}

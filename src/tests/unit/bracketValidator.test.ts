import { BracketData } from '../../utils/bracketData';
import validateBracketJson from '../../utils/bracketValidator';

describe('Bracket Validator', () => {
  test('Valid bracket', () => {
    const bracket = {
      bracketName: 'test',
      matchups: [
        {
          id: 1,
          round: 1,
          team_a: 'Lakers',
          team_b: 'Suns',
          advances_to: 5,
        },
        {
          id: 2,
          round: 1,
          team_a: 'Mavericks',
          team_b: 'Timberwolves',
          advances_to: 5,
        },
        {
          id: 3,
          round: 1,
          team_a: 'Pelicans',
          team_b: 'Kings',
          advances_to: 6,
        },
        {
          id: 4,
          round: 1,
          team_a: 'Nuggets',
          team_b: 'Thunder',
          advances_to: 6,
        },
        {
          id: 5,
          round: 2,
          advances_to: 7,
        },
        {
          id: 6,
          round: 2,
          advances_to: 7,
        },
        {
          id: 7,
          round: 3,
        },
      ],
    };

    const [result] = validateBracketJson(bracket as BracketData);
    expect(result).toBe(true);
  });

  test('Duplicate ids', () => {
    const bracket = {
      bracketName: 'test',
      matchups: [
        {
          id: 2,
          round: 1,
          team_a: 'Lakers',
          team_b: 'Suns',
          advances_to: 5,
        },
        {
          id: 2,
          round: 1,
          team_a: 'Mavericks',
          team_b: 'Timberwolves',
          advances_to: 5,
        },
        {
          id: 3,
          round: 1,
          team_a: 'Pelicans',
          team_b: 'Kings',
          advances_to: 6,
        },
        {
          id: 4,
          round: 1,
          team_a: 'Nuggets',
          team_b: 'Thunder',
          advances_to: 6,
        },
        {
          id: 5,
          round: 2,
          advances_to: 7,
        },
        {
          id: 6,
          round: 2,
          advances_to: 7,
        },
        {
          id: 7,
          round: 3,
        },
      ],
    };

    const [result] = validateBracketJson(bracket as BracketData);
    expect(result).toBe(false);
  });

  test('Duplicate teams in round', () => {
    const bracket = {
      bracketName: 'test',
      matchups: [
        {
          id: 1,
          round: 1,
          team_a: 'Lakers',
          team_b: 'Suns',
          advances_to: 5,
        },
        {
          id: 2,
          round: 1,
          team_a: 'Lakers',
          team_b: 'Timberwolves',
          advances_to: 5,
        },
        {
          id: 3,
          round: 1,
          team_a: 'Pelicans',
          team_b: 'Kings',
          advances_to: 6,
        },
        {
          id: 4,
          round: 1,
          team_a: 'Nuggets',
          team_b: 'Thunder',
          advances_to: 6,
        },
        {
          id: 5,
          round: 2,
          advances_to: 7,
        },
        {
          id: 6,
          round: 2,
          advances_to: 7,
        },
        {
          id: 7,
          round: 3,
        },
      ],
    };

    const [result] = validateBracketJson(bracket as BracketData);
    expect(result).toBe(false);
  });

  test('Incorrect numbers of rounds', () => {
    const bracket = {
      bracketName: 'test',
      matchups: [
        {
          id: 3,
          round: 1,
          team_a: 'Pelicans',
          team_b: 'Kings',
          advances_to: 6,
        },
        {
          id: 4,
          round: 1,
          team_a: 'Nuggets',
          team_b: 'Thunder',
          advances_to: 6,
        },
        {
          id: 5,
          round: 2,
          advances_to: 7,
        },
        {
          id: 6,
          round: 2,
          advances_to: 7,
        },
        {
          id: 7,
          round: 3,
        },
      ],
    };

    const [result] = validateBracketJson(bracket as BracketData);
    expect(result).toBe(false);
  });

  test('Inconsistent number of advance_tos', () => {
    const bracket = {
      bracketName: 'test',
      matchups: [
        {
          id: 1,
          round: 1,
          team_a: 'Lakers',
          team_b: 'Suns',
          advances_to: 5,
        },
        {
          id: 2,
          round: 1,
          team_a: 'Mavericks',
          team_b: 'Timberwolves',
          advances_to: 6,
        },
        {
          id: 3,
          round: 1,
          team_a: 'Pelicans',
          team_b: 'Kings',
          advances_to: 6,
        },
        {
          id: 4,
          round: 1,
          team_a: 'Nuggets',
          team_b: 'Thunder',
          advances_to: 6,
        },
        {
          id: 5,
          round: 2,
          advances_to: 7,
        },
        {
          id: 6,
          round: 2,
          advances_to: 7,
        },
        {
          id: 7,
          round: 3,
        },
      ],
    };

    const [result] = validateBracketJson(bracket as BracketData);
    expect(result).toBe(false);
  });

  test('advance_to points to no existing matchup', () => {
    const bracket = {
      bracketName: 'test',
      matchups: [
        {
          id: 1,
          round: 1,
          team_a: 'Lakers',
          team_b: 'Suns',
          advances_to: 5,
        },
        {
          id: 2,
          round: 1,
          team_a: 'Mavericks',
          team_b: 'Timberwolves',
          advances_to: 5,
        },
        {
          id: 3,
          round: 1,
          team_a: 'Pelicans',
          team_b: 'Kings',
          advances_to: 6,
        },
        {
          id: 4,
          round: 1,
          team_a: 'Nuggets',
          team_b: 'Thunder',
          advances_to: 6,
        },
        {
          id: 5,
          round: 2,
          advances_to: 8,
        },
        {
          id: 6,
          round: 2,
          advances_to: 8,
        },
        {
          id: 7,
          round: 3,
        },
      ],
    };

    const [result] = validateBracketJson(bracket as BracketData);
    expect(result).toBe(false);
  });

  test('advance_to points to matchup in further round', () => {
    const bracket = {
      bracketName: 'test',
      matchups: [
        {
          id: 1,
          round: 1,
          team_a: 'Lakers',
          team_b: 'Suns',
          advances_to: 5,
        },
        {
          id: 2,
          round: 1,
          team_a: 'Mavericks',
          team_b: 'Timberwolves',
          advances_to: 5,
        },
        {
          id: 3,
          round: 1,
          team_a: 'Pelicans',
          team_b: 'Kings',
          advances_to: 7,
        },
        {
          id: 4,
          round: 1,
          team_a: 'Nuggets',
          team_b: 'Thunder',
          advances_to: 7,
        },
        {
          id: 5,
          round: 2,
          advances_to: 7,
        },
        {
          id: 6,
          round: 2,
          advances_to: 7,
        },
        {
          id: 7,
          round: 3,
        },
      ],
    };

    const [result] = validateBracketJson(bracket as BracketData);
    expect(result).toBe(false);
  });

  test('Wrong winner declared', () => {
    const bracket = {
      bracketName: 'test',
      matchups: [
        {
          id: 1,
          round: 1,
          team_a: 'Lakers',
          team_b: 'Suns',
          advances_to: 5,
          winner: 'Mavericks',
        },
        {
          id: 2,
          round: 1,
          team_a: 'Mavericks',
          team_b: 'Timberwolves',
          advances_to: 5,
        },
        {
          id: 3,
          round: 1,
          team_a: 'Pelicans',
          team_b: 'Kings',
          advances_to: 6,
        },
        {
          id: 4,
          round: 1,
          team_a: 'Nuggets',
          team_b: 'Thunder',
          advances_to: 6,
        },
        {
          id: 5,
          round: 2,
          advances_to: 7,
        },
        {
          id: 6,
          round: 2,
          advances_to: 7,
        },
        {
          id: 7,
          round: 3,
        },
      ],
    };

    const [result] = validateBracketJson(bracket as BracketData);
    expect(result).toBe(false);
  });

  test('Winner set but not both teams', () => {
    const bracket = {
      bracketName: 'test',
      matchups: [
        {
          id: 1,
          round: 1,
          team_a: 'Lakers',
          team_b: 'Suns',
          advances_to: 5,
          winner: 'Lakers',
        },
        {
          id: 2,
          round: 1,
          team_a: 'Mavericks',
          team_b: 'Timberwolves',
          advances_to: 5,
        },
        {
          id: 3,
          round: 1,
          team_a: 'Pelicans',
          team_b: 'Kings',
          advances_to: 6,
        },
        {
          id: 4,
          round: 1,
          team_a: 'Nuggets',
          team_b: 'Thunder',
          advances_to: 6,
        },
        {
          id: 5,
          round: 2,
          team_a: 'Lakers',
          advances_to: 7,
          winner: 'Lakers',
        },
        {
          id: 6,
          round: 2,
          advances_to: 7,
        },
        {
          id: 7,
          round: 3,
        },
      ],
    };

    const [result] = validateBracketJson(bracket as BracketData);
    expect(result).toBe(false);
  });

  test('Winner set but is not in next round', () => {
    const bracket = {
      bracketName: 'test',
      matchups: [
        {
          id: 1,
          round: 1,
          team_a: 'Lakers',
          team_b: 'Suns',
          advances_to: 5,
          winner: 'Lakers',
        },
        {
          id: 2,
          round: 1,
          team_a: 'Mavericks',
          team_b: 'Timberwolves',
          advances_to: 5,
        },
        {
          id: 3,
          round: 1,
          team_a: 'Pelicans',
          team_b: 'Kings',
          advances_to: 6,
        },
        {
          id: 4,
          round: 1,
          team_a: 'Nuggets',
          team_b: 'Thunder',
          advances_to: 6,
        },
        {
          id: 5,
          round: 2,
          advances_to: 7,
        },
        {
          id: 6,
          round: 2,
          advances_to: 7,
        },
        {
          id: 7,
          round: 3,
        },
      ],
    };

    const [result] = validateBracketJson(bracket as BracketData);
    expect(result).toBe(false);
  });

  test('Next round team set, but winner in previous round not set', () => {
    const bracket = {
      bracketName: 'test',
      matchups: [
        {
          id: 1,
          round: 1,
          team_a: 'Lakers',
          team_b: 'Suns',
          advances_to: 5,
        },
        {
          id: 2,
          round: 1,
          team_a: 'Mavericks',
          team_b: 'Timberwolves',
          advances_to: 5,
        },
        {
          id: 3,
          round: 1,
          team_a: 'Pelicans',
          team_b: 'Kings',
          advances_to: 6,
        },
        {
          id: 4,
          round: 1,
          team_a: 'Nuggets',
          team_b: 'Thunder',
          advances_to: 6,
        },
        {
          id: 5,
          round: 2,
          team_a: 'Lakers',
          advances_to: 7,
        },
        {
          id: 6,
          round: 2,
          advances_to: 7,
        },
        {
          id: 7,
          round: 3,
        },
      ],
    };

    const [result] = validateBracketJson(bracket as BracketData);
    expect(result).toBe(false);
  });
});

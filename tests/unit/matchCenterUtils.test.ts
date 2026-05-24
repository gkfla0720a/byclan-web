import {
  normalizeWinningTeam,
  isCompletedSetStatus,
  isActiveSetStatus,
  inferTeamLetter,
  getComboIdFromRaceCards,
  getRemainingRequiredCombos,
} from '@/utils/matchCenter';

describe('matchCenter utils normalization', () => {
  test('normalizeWinningTeam handles supabase/frontend variants', () => {
    expect(normalizeWinningTeam('A')).toBe('A');
    expect(normalizeWinningTeam('team_a')).toBe('A');
    expect(normalizeWinningTeam('B')).toBe('B');
    expect(normalizeWinningTeam('team_b')).toBe('B');
    expect(normalizeWinningTeam('DRAW')).toBeNull();
    expect(normalizeWinningTeam(null)).toBeNull();
  });

  test('status helpers handle multilingual variants', () => {
    expect(isCompletedSetStatus('completed')).toBe(true);
    expect(isCompletedSetStatus('완료')).toBe(true);
    expect(isCompletedSetStatus('pending_review')).toBe(false);

    expect(isActiveSetStatus('completed')).toBe(false);
    expect(isActiveSetStatus('완료')).toBe(false);
    expect(isActiveSetStatus('in_progress')).toBe(true);
  });

  test('inferTeamLetter works with team id arrays', () => {
    expect(inferTeamLetter('u1', ['u1'], ['u2'])).toBe('A');
    expect(inferTeamLetter('u2', ['u1'], ['u2'])).toBe('B');
    expect(inferTeamLetter('u3', ['u1'], ['u2'])).toBeNull();
  });

  test('race combo helpers normalize PTZ -> PZT', () => {
    expect(getComboIdFromRaceCards(['Protoss', 'Terran', 'Zerg'])).toBe('PZT');
    const remaining = getRemainingRequiredCombos([
      { combo_code: 'PTZ', race_cards: null },
      { combo_code: 'PPP', race_cards: null },
    ]);
    expect(remaining).toEqual(expect.arrayContaining(['PPT', 'PPZ', 'RANDOM']));
    expect(remaining).not.toContain('PZT');
    expect(remaining).not.toContain('PPP');
  });
});

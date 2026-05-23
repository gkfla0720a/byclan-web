/**
 * @file matchMaking.test.ts
 * @description 팀 빌딩 알고리즘 및 매치 유형 테스트
 */

import { buildTeams, MATCH_TYPES } from '@/utils/matchMaking';
import * as profilesModule from '@/utils/profiles';

// getPlayerMmr 모킹
jest.mock('@/utils/profiles', () => ({
  getPlayerMmr: jest.fn((player) => player.mmr || 0),
}));

const mockGetPlayerMmr = profilesModule.getPlayerMmr as jest.MockedFunction<typeof profilesModule.getPlayerMmr>;

describe('matchMaking utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('MATCH_TYPES', () => {
    it('모든 매치 유형이 정의되어야 한다', () => {
      expect(MATCH_TYPES['3v3']).toBeDefined();
      expect(MATCH_TYPES['4v4']).toBeDefined();
      expect(MATCH_TYPES['5v5']).toBeDefined();
      expect(MATCH_TYPES['1v1']).toBeDefined();
      expect(MATCH_TYPES['2v2']).toBeDefined();
    });

    it('각 매치 유형이 필수 속성을 가져야 한다', () => {
      Object.values(MATCH_TYPES).forEach((matchType) => {
        expect(matchType).toHaveProperty('label');
        expect(matchType).toHaveProperty('minPlayers');
        expect(matchType).toHaveProperty('perTeam');
        expect(matchType).toHaveProperty('isLadder');
        expect(matchType).toHaveProperty('format');
      });
    });

    it('래더 매치 유형이 올바르게 표시되어야 한다', () => {
      expect(MATCH_TYPES['3v3'].isLadder).toBe(true);
      expect(MATCH_TYPES['4v4'].isLadder).toBe(true);
      expect(MATCH_TYPES['5v5'].isLadder).toBe(true);
      expect(MATCH_TYPES['1v1'].isLadder).toBe(false);
      expect(MATCH_TYPES['2v2'].isLadder).toBe(false);
    });

    it('minPlayers가 perTeam * 2과 같아야 한다', () => {
      Object.entries(MATCH_TYPES).forEach(([key, matchType]) => {
        expect(matchType.minPlayers).toBe(matchType.perTeam * 2);
      });
    });
  });

  describe('buildTeams - 입력 검증', () => {
    it('인원이 부족하면 null을 반환해야 한다', () => {
      const players = [
        { id: '1', mmr: 1000 },
        { id: '2', mmr: 900 },
      ];
      const result = buildTeams(players, 3, 'balance');
      expect(result).toBeNull();
    });

    it('빈 배열이면 null을 반환해야 한다', () => {
      const result = buildTeams([], 3, 'balance');
      expect(result).toBeNull();
    });

    it('정확히 필요한 인원이면 팀을 구성해야 한다', () => {
      const players = [
        { id: '1', mmr: 1000 },
        { id: '2', mmr: 900 },
        { id: '3', mmr: 800 },
        { id: '4', mmr: 700 },
      ];
      const result = buildTeams(players, 2, 'balance');
      expect(result).not.toBeNull();
      expect(result!.teamA).toHaveLength(2);
      expect(result!.teamB).toHaveLength(2);
    });

    it('필요한 인원보다 많으면 앞의 인원만 사용해야 한다', () => {
      const players = [
        { id: '1', mmr: 1000 },
        { id: '2', mmr: 900 },
        { id: '3', mmr: 800 },
        { id: '4', mmr: 700 },
        { id: '5', mmr: 600 },
        { id: '6', mmr: 500 },
      ];
      const result = buildTeams(players, 2, 'balance');
      expect(result).not.toBeNull();
      expect(result!.teamA).toHaveLength(2);
      expect(result!.teamB).toHaveLength(2);
      // 처음 4명만 사용되어야 함
      const usedIds = [
        ...result!.teamA.map(p => p.id),
        ...result!.teamB.map(p => p.id),
      ];
      expect(usedIds.some(id => id === '5' || id === '6')).toBe(false);
    });
  });

  describe('buildTeams - balance 옵션', () => {
    beforeEach(() => {
      mockGetPlayerMmr.mockImplementation((player) => player.mmr || 0);
    });

    it('MMR 차이를 최소화한 팀을 구성해야 한다', () => {
      const players = [
        { id: '1', mmr: 1000 },
        { id: '2', mmr: 900 },
        { id: '3', mmr: 100 },
        { id: '4', mmr: 200 },
      ];
      const result = buildTeams(players, 2, 'balance');

      expect(result).not.toBeNull();
      if (result) {
        const avgTeamA = (result.teamA[0].mmr + result.teamA[1].mmr) / 2;
        const avgTeamB = (result.teamB[0].mmr + result.teamB[1].mmr) / 2;
        
        // TeamA는 [1, 4] 또는 [2, 3], TeamB는 반대가 되어 균형 잡힐 것
        const diff = Math.abs(avgTeamA - avgTeamB);
        
        // 최적의 배치는 [1, 4]와 [2, 3] (각각 평균 600)
        expect(diff).toBeLessThanOrEqual(50);
      }
    });

    it('모든 플레이어가 어느 팀에 배치되어야 한다', () => {
      const players = [
        { id: '1', mmr: 1000 },
        { id: '2', mmr: 900 },
        { id: '3', mmr: 800 },
        { id: '4', mmr: 700 },
      ];
      const result = buildTeams(players, 2, 'balance');

      expect(result).not.toBeNull();
      if (result) {
        const allPlayers = [...result.teamA, ...result.teamB];
        const ids = allPlayers.map(p => p.id).sort();
        expect(ids).toEqual(['1', '2', '3', '4']);
      }
    });
  });

  describe('buildTeams - top 옵션', () => {
    beforeEach(() => {
      mockGetPlayerMmr.mockImplementation((player) => player.mmr || 0);
    });

    it('MMR 높은 순서로 teamA를 구성해야 한다', () => {
      const players = [
        { id: '1', mmr: 1000 },
        { id: '2', mmr: 900 },
        { id: '3', mmr: 100 },
        { id: '4', mmr: 200 },
      ];
      const result = buildTeams(players, 2, 'top');

      expect(result).not.toBeNull();
      if (result) {
        // teamA는 [1, 2] (높은 MMR)
        expect(result.teamA.map(p => p.id).sort()).toEqual(['1', '2']);
        // teamB는 [3, 4] (낮은 MMR)
        expect(result.teamB.map(p => p.id).sort()).toEqual(['3', '4']);
      }
    });
  });

  describe('buildTeams - bottom 옵션', () => {
    beforeEach(() => {
      mockGetPlayerMmr.mockImplementation((player) => player.mmr || 0);
    });

    it('MMR 낮은 순서로 teamA를 구성해야 한다', () => {
      const players = [
        { id: '1', mmr: 1000 },
        { id: '2', mmr: 900 },
        { id: '3', mmr: 100 },
        { id: '4', mmr: 200 },
      ];
      const result = buildTeams(players, 2, 'bottom');

      expect(result).not.toBeNull();
      if (result) {
        // teamA는 [3, 4] (낮은 MMR)
        expect(result.teamA.map(p => p.id).sort()).toEqual(['3', '4']);
        // teamB는 [1, 2] (높은 MMR)
        expect(result.teamB.map(p => p.id).sort()).toEqual(['1', '2']);
      }
    });
  });

  describe('buildTeams - 3v3 매치 구성', () => {
    beforeEach(() => {
      mockGetPlayerMmr.mockImplementation((player) => player.mmr || 0);
    });

    it('3v3 매치를 구성해야 한다', () => {
      const players = Array.from({ length: 6 }, (_, i) => ({
        id: String(i + 1),
        mmr: 1000 - i * 100,
      }));

      const result = buildTeams(players, 3, 'balance');

      expect(result).not.toBeNull();
      expect(result!.teamA).toHaveLength(3);
      expect(result!.teamB).toHaveLength(3);
    });

    it('4v4 매치를 구성해야 한다', () => {
      const players = Array.from({ length: 8 }, (_, i) => ({
        id: String(i + 1),
        mmr: 1000 - i * 100,
      }));

      const result = buildTeams(players, 4, 'balance');

      expect(result).not.toBeNull();
      expect(result!.teamA).toHaveLength(4);
      expect(result!.teamB).toHaveLength(4);
    });
  });

  describe('buildTeams - 예외 처리', () => {
    it('정의되지 않은 sortOption은 undefined를 반환해야 한다', () => {
      const players = [
        { id: '1', mmr: 1000 },
        { id: '2', mmr: 900 },
        { id: '3', mmr: 800 },
        { id: '4', mmr: 700 },
      ];
      const result = buildTeams(players, 2, 'unknown');
      expect(result).toBeUndefined();
    });

    it('플레이어 MMR이 undefined면 0으로 처리해야 한다', () => {
      const players = [
        { id: '1', mmr: 1000 },
        { id: '2' }, // mmr undefined
        { id: '3', mmr: 100 },
        { id: '4' }, // mmr undefined
      ];
      mockGetPlayerMmr.mockImplementation((player) => player.mmr || 0);

      const result = buildTeams(players, 2, 'top');
      expect(result).not.toBeNull();
    });
  });
});

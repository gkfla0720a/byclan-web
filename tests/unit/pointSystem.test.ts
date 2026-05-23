/**
 * @file pointSystem.test.ts
 * @description 포인트 시스템 유틸리티 테스트
 */

import {
  RANK_BONUS,
  DAILY_BONUS_AMOUNT,
  MATCH_REWARD_AMOUNT,
  DISCORD_CHECKIN_AMOUNT,
  grantPoints,
  deductPoints,
  checkAndGrantDailyBonus,
  grantMatchParticipationBonus,
} from '@/utils/pointSystem';

// Supabase 모킹은 jest.setup.js에서 이미 처리됨
import { supabase } from '@/supabase';

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('pointSystem utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('포인트 상수 검증', () => {
    describe('RANK_BONUS', () => {
      it('모든 직급별 보상이 정의되어야 한다', () => {
        expect(RANK_BONUS.rookie).toBe(1000);
        expect(RANK_BONUS.member).toBe(3000);
        expect(RANK_BONUS.elite).toBe(6000);
        expect(RANK_BONUS.admin).toBe(11000);
      });

      it('보상이 양수여야 한다', () => {
        Object.values(RANK_BONUS).forEach(bonus => {
          expect(bonus).toBeGreaterThan(0);
        });
      });

      it('직급이 올라갈수록 보상이 증가해야 한다', () => {
        expect(RANK_BONUS.rookie).toBeLessThan(RANK_BONUS.member);
        expect(RANK_BONUS.member).toBeLessThan(RANK_BONUS.elite);
        expect(RANK_BONUS.elite).toBeLessThan(RANK_BONUS.admin);
      });
    });

    describe('보상 상수들', () => {
      it('일일 보상이 정의되어야 한다', () => {
        expect(DAILY_BONUS_AMOUNT).toBe(500);
      });

      it('매치 참여 보상이 정의되어야 한다', () => {
        expect(MATCH_REWARD_AMOUNT).toBe(500);
      });

      it('디스코드 체크인 보상이 정의되어야 한다', () => {
        expect(DISCORD_CHECKIN_AMOUNT).toBe(1000);
      });
    });
  });

  describe('grantPoints', () => {
    it('유효한 파라미터로 포인트를 지급해야 한다', async () => {
      const userId = 'user-123';
      const amount = 100;
      const reason = '테스트 포인트 지급';

      // Supabase 모킹 설정
      mockSupabase.from = jest.fn((table) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { id: userId, clan_point: 1000 },
              error: null,
            }),
            update: jest.fn().mockReturnThis(),
          };
        }
        if (table === 'point_logs' || table === 'notifications') {
          return {
            insert: jest.fn().mockResolvedValue({ error: null }),
          };
        }
        return { error: new Error('Unknown table') };
      });

      const result = await grantPoints(mockSupabase as any, userId, amount, reason);

      expect(result.ok).toBe(true);
      expect(result.newBalance).toBe(1100); // 1000 + 100
      expect(result.error).toBeNull();
    });

    it('잘못된 파라미터는 거절해야 한다', async () => {
      const result1 = await grantPoints(mockSupabase as any, '', 100, 'test');
      expect(result1.ok).toBe(false);
      expect(result1.error).toBeTruthy();

      const result2 = await grantPoints(mockSupabase as any, 'user-123', -100, 'test');
      expect(result2.ok).toBe(false);
      expect(result2.error).toBeTruthy();

      const result3 = await grantPoints(mockSupabase as any, 'user-123', 0, 'test');
      expect(result3.ok).toBe(false);
      expect(result3.error).toBeTruthy();
    });

    it('지급 유형과 연관 ID를 기록해야 한다', async () => {
      const userId = 'user-123';
      const matchId = 'match-456';
      const insertMock = jest.fn().mockResolvedValue({ error: null });

      mockSupabase.from = jest.fn((table) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { clan_point: 1000 },
              error: null,
            }),
            update: jest.fn().mockReturnThis(),
          };
        }
        if (table === 'point_logs') {
          return { insert: insertMock };
        }
        if (table === 'notifications') {
          return { insert: jest.fn().mockResolvedValue({ error: null }) };
        }
        return {};
      });

      await grantPoints(
        mockSupabase as any,
        userId,
        500,
        '매치 참여 보상',
        'match_reward',
        matchId,
      );

      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: userId,
          amount: 500,
          type: 'match_reward',
          related_id: matchId,
          reason: '매치 참여 보상',
        }),
      );
    });

    it('현재 포인트가 없어도 포인트를 지급할 수 있어야 한다', async () => {
      mockSupabase.from = jest.fn((table) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { clan_point: null }, // null일 때 0으로 처리
              error: null,
            }),
            update: jest.fn().mockReturnThis(),
          };
        }
        if (table === 'point_logs' || table === 'notifications') {
          return {
            insert: jest.fn().mockResolvedValue({ error: null }),
          };
        }
        return {};
      });

      const result = await grantPoints(mockSupabase as any, 'user-123', 100, 'test');

      expect(result.ok).toBe(true);
      expect(result.newBalance).toBe(100);
    });
  });

  describe('deductPoints', () => {
    it('잔액이 충분하면 포인트를 차감해야 한다', async () => {
      const userId = 'user-123';
      const amount = 100;

      mockSupabase.from = jest.fn((table) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { id: userId, clan_point: 1000 },
              error: null,
            }),
            update: jest.fn().mockReturnThis(),
          };
        }
        if (table === 'point_logs' || table === 'notifications') {
          return {
            insert: jest.fn().mockResolvedValue({ error: null }),
          };
        }
        return {};
      });

      const result = await deductPoints(mockSupabase as any, userId, amount, '테스트 차감');

      expect(result.ok).toBe(true);
      expect(result.newBalance).toBe(900); // 1000 - 100
      expect(result.error).toBeNull();
    });

    it('잔액이 부족하면 차감하지 않아야 한다', async () => {
      mockSupabase.from = jest.fn((table) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { clan_point: 50 }, // 100보다 적음
              error: null,
            }),
            update: jest.fn().mockReturnThis(),
          };
        }
        return {};
      });

      const result = await deductPoints(mockSupabase as any, 'user-123', 100, '테스트 차감');

      expect(result.ok).toBe(false);
      expect(result.newBalance).toBe(50); // 변경 없음
      expect(result.error).toContain('부족');
    });

    it('포인트 로그에 음수를 기록해야 한다', async () => {
      const insertMock = jest.fn().mockResolvedValue({ error: null });

      mockSupabase.from = jest.fn((table) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { clan_point: 1000 },
              error: null,
            }),
            update: jest.fn().mockReturnThis(),
          };
        }
        if (table === 'point_logs') {
          return { insert: insertMock };
        }
        if (table === 'notifications') {
          return { insert: jest.fn().mockResolvedValue({ error: null }) };
        }
        return {};
      });

      await deductPoints(mockSupabase as any, 'user-123', 100, '배팅', 'bet_deduct');

      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: -100, // 음수로 기록
        }),
      );
    });
  });

  describe('checkAndGrantDailyBonus', () => {
    it('첫 로그인이면 일일 보상을 지급해야 한다', async () => {
      const userId = 'user-123';
      const todayStr = new Date().toISOString().slice(0, 10);

      mockSupabase.from = jest.fn((table) => {
        if (table === 'profile_meta') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
              data: { last_daily_bonus_at: '2026-05-20' }, // 어제
              error: null,
            }),
            upsert: jest.fn().mockResolvedValue({ error: null }),
          };
        }
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { clan_point: 1000 },
              error: null,
            }),
            update: jest.fn().mockReturnThis(),
          };
        }
        if (table === 'point_logs' || table === 'notifications') {
          return {
            insert: jest.fn().mockResolvedValue({ error: null }),
          };
        }
        return {};
      });

      // grantPoints도 모킹되어 있으므로 직접 테스트
      // (실제로는 checkAndGrantDailyBonus가 grantPoints를 호출함)
      const result = await checkAndGrantDailyBonus(mockSupabase as any, userId);

      expect(result.granted).toBe(true);
      expect(result.amount).toBe(DAILY_BONUS_AMOUNT);
    });

    it('오늘 이미 보상을 받았으면 지급하지 않아야 한다', async () => {
      const userId = 'user-123';
      const todayStr = new Date().toISOString().slice(0, 10);

      mockSupabase.from = jest.fn((table) => {
        if (table === 'profile_meta') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
              data: { last_daily_bonus_at: todayStr }, // 오늘
              error: null,
            }),
          };
        }
        return {};
      });

      const result = await checkAndGrantDailyBonus(mockSupabase as any, userId);

      expect(result.granted).toBe(false);
      expect(result.amount).toBe(0);
    });

    it('첫 로그인 시 last_daily_bonus_at을 업데이트해야 한다', async () => {
      const userId = 'user-123';
      const upsertMock = jest.fn().mockResolvedValue({ error: null });

      mockSupabase.from = jest.fn((table) => {
        if (table === 'profile_meta') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
              data: { last_daily_bonus_at: '2026-05-20' },
              error: null,
            }),
            upsert: upsertMock,
          };
        }
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { clan_point: 1000 },
              error: null,
            }),
            update: jest.fn().mockReturnThis(),
          };
        }
        if (table === 'point_logs' || table === 'notifications') {
          return {
            insert: jest.fn().mockResolvedValue({ error: null }),
          };
        }
        return {};
      });

      const todayStr = new Date().toISOString().slice(0, 10);
      await checkAndGrantDailyBonus(mockSupabase as any, userId);

      expect(upsertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: userId,
          last_daily_bonus_at: todayStr,
        }),
        expect.any(Object),
      );
    });
  });

  describe('grantMatchParticipationBonus', () => {
    it('매치 ID가 필요해야 한다', async () => {
      const result = await grantMatchParticipationBonus(
        mockSupabase as any,
        'user-123',
        '',
      );

      expect(result.ok).toBe(false);
    });

    it('사용자 ID가 필요해야 한다', async () => {
      const result = await grantMatchParticipationBonus(
        mockSupabase as any,
        '',
        'match-123',
      );

      expect(result.ok).toBe(false);
    });
  });

  describe('테스트 데이터 플래그', () => {
    it('테스트 데이터로 포인트를 지급할 수 있어야 한다', async () => {
      const insertMock = jest.fn().mockResolvedValue({ error: null });

      mockSupabase.from = jest.fn((table) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { clan_point: 1000 },
              error: null,
            }),
            update: jest.fn().mockReturnThis(),
          };
        }
        if (table === 'point_logs') {
          return { insert: insertMock };
        }
        if (table === 'notifications') {
          return { insert: jest.fn().mockResolvedValue({ error: null }) };
        }
        return {};
      });

      await grantPoints(
        mockSupabase as any,
        'user-123',
        100,
        '테스트',
        'manual',
        null,
        true, // isTestData
      );

      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          is_test_data: true,
        }),
      );
    });
  });
});

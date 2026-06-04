// 파일명: @/views/MemberList.tsx

'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/supabase';
import type { QueryData } from '@supabase/supabase-js';
import { isCurrentViewerTestAccount } from '@/utils/testData';
import { getCached, setCached } from '@/utils/queryCache';
import { LADDER_MEMBER_ROLES } from '@/types';
import { RACE_CODES, type RaceCode, type UserRole } from '@/types/primitives';

interface MemberRow {
  user_id: string;
  by_id: string | null;
  role: string | null;
  race: RaceCode | null;
  tier: string | null;
  total_mmr: number | null;
  personal_mmr: number | null;
  team_mmr: number | null;
  is_test_account: boolean;
  is_test_account_active: boolean;
}

const MEMBER_LIST_CACHE_KEY = 'members_list';

const getMemberListCacheKey = () => {
  return isCurrentViewerTestAccount()
    ? `${MEMBER_LIST_CACHE_KEY}:test`
    : `${MEMBER_LIST_CACHE_KEY}:normal`;
};

const isRaceCode = (value: string | null): value is RaceCode => {
  return value !== null && (RACE_CODES as readonly string[]).includes(value);
};

const isLadderMemberRole = (value: string | null): value is UserRole => {
  return value !== null && LADDER_MEMBER_ROLES.includes(value as UserRole);
};

const memberListQuery = () =>
  supabase
    .from('profiles')
    .select(`
      user_id,
      by_id,
      role,
      race,
      ladder_rankings(tier, personal_mmr, team_mmr, total_mmr),
      profile_meta(is_test_account, is_test_account_active)
    `)
    .neq('role', 'guest')
    .neq('role', 'ghost')
    .neq('role', 'applicant')
    .neq('role', 'banned');

type MemberListQueryRow = QueryData<ReturnType<typeof memberListQuery>>[number];

const firstOrNull = <T,>(value: T | T[] | null | undefined): T | null => {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
};

const toMemberRow = (row: MemberListQueryRow): MemberRow => {
  const ladder = firstOrNull(row.ladder_rankings);
  const meta = firstOrNull(row.profile_meta);

  return {
    user_id: row.user_id,
    by_id: row.by_id,
    role: row.role,
    race: isRaceCode(row.race) ? row.race : null,
    tier: ladder?.tier ?? 'Unranked',
    personal_mmr: ladder?.personal_mmr ?? 0,
    team_mmr: ladder?.team_mmr ?? 0,
    total_mmr: ladder?.total_mmr ?? 0,
    is_test_account: meta?.is_test_account ?? false,
    is_test_account_active: meta?.is_test_account_active ?? false,
  };
};

const fetchMemberData = async (): Promise<MemberRow[]> => {
  const { data, error } = await memberListQuery();

  if (error) {
    throw error;
  }

  const isTestViewer = isCurrentViewerTestAccount();

  return (data ?? [])
    .map(toMemberRow)
    .filter((member) =>
      isTestViewer
        ? member.is_test_account && member.is_test_account_active
        : !member.is_test_account
    )
    .filter((member) => isLadderMemberRole(member.role));
};

export default function MemberList() {
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      if (Array.isArray(cached)) {
        setMembers(cached as MemberRow[]);
        setLoading(false);
        return;
      }

      try {
        const members = await fetchMemberData();

        setCached(cacheKey, members);
        setMembers(members);
      } catch (err) {
        console.error('클랜원 목록 로드 실패:', err);
        setError(err instanceof Error ? err : new Error('클랜원 목록 로드 실패'));
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // 검색어 필터링 계산 연산
  const filteredMembers = members.filter((member) => {
    const nickname = member.by_id || '';
    return nickname.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const totalMembers = members.length;

  if (loading) return <div className="text-center py-12 text-cyan-400 font-mono">[ LOADING CLAN MEMBERS... ]</div>;
  if (error) return <div className="text-center py-12 text-red-400 font-bold">클랜원 목록을 불러오지 못했습니다.</div>;

  return (
    <div className="w-full max-w-5xl mx-auto mt-4 sm:mt-8 space-y-6 sm:space-y-8">
      {/* 타이틀 판넬 */}
      <div className="relative neon-panel rounded-3xl overflow-hidden px-6 py-4 text-center">
        <h2 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-linear-to-r from-cyan-100 to-blue-400">
          클랜원 명단
        </h2>
      </div>

      {/* 대시보드 스탯 및 검색창 바 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        <div className="md:col-span-1">
          <StatCard label="총 인원" value={`${totalMembers}명`} accent="text-white" />
        </div>

        <div className="md:col-span-2 neon-panel rounded-2xl p-4 flex flex-col justify-center h-full">
          <label htmlFor="member-search" className="text-xs text-cyan-100/55 uppercase tracking-[0.25em] mb-2 block">
            클랜원 검색
          </label>
          <input
            id="member-search"
            type="text"
            placeholder="닉네임을 입력하세요..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-cyan-400/20 bg-slate-950/80 px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-cyan-400/60 transition-colors"
          />
        </div>
      </div>

      {/* 정렬된 단일 명단 그리드 테이블 */}
      <div className="neon-panel rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 bg-slate-950/60 border-b border-cyan-400/15">
          <h4 className="text-lg font-bold text-white">클랜원 목록</h4>
          <span className="text-sm text-cyan-200/80">
            {searchTerm ? `검색 결과 ${filteredMembers.length}명` : `총 ${totalMembers}명`}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full table-fixed text-sm">
            <colgroup>
              <col className="w-[24%]" />
              <col className="w-[16%]" />
              <col className="w-[15%]" />
              <col className="w-[15%]" />
              <col className="w-[15%]" />
              <col className="w-[15%]" />
            </colgroup>
            <thead>
              <tr className="text-slate-400 border-b border-cyan-400/15 bg-slate-900/30">
                <th className="px-4 py-3 text-left font-bold">닉네임</th>
                <th className="px-4 py-3 text-left font-bold">티어</th>
                <th className="px-4 py-3 text-left font-bold">총 MMR</th>
                <th className="px-4 py-3 text-left font-bold">개인 MMR</th>
                <th className="px-4 py-3 text-left font-bold">팀 MMR</th>
                <th className="px-4 py-3 text-left font-bold">주종</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((member) => (
                <tr key={member.user_id} className="hover:bg-cyan-400/5 transition-colors border-b border-slate-900">
                  <td className="px-4 py-3 text-white font-semibold">
                    <span className="truncate block">{member.by_id || '[닉네임 없음]'}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-300 font-medium">{member.tier}</td>
                  <td className="px-4 py-3 text-cyan-300 font-bold">{member.total_mmr}점</td>
                  <td className="px-4 py-3 text-slate-300">{member.personal_mmr}점</td>
                  <td className="px-4 py-3 text-slate-300">{member.team_mmr}점</td>
                  <td className="px-4 py-3 text-slate-400 font-mono">{member.race || 'Random'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredMembers.length === 0 && (
        <div className="text-center py-12 text-gray-500 font-medium">
          {searchTerm ? '검색 결과와 일치하는 클랜원이 없습니다.' : '클랜원이 없습니다.'}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="neon-panel rounded-2xl p-4 flex flex-col justify-center h-full">
      <div className="text-xs text-cyan-100/55 uppercase tracking-[0.25em]">{label}</div>
      <div className={`mt-2 text-3xl font-black ${accent}`}>{value}</div>
    </div>
  );
}
// 파일명: @/views/MemberList.tsx

'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/supabase';
import { isCurrentViewerTestAccount } from '@/utils/testData';
import { getCached, setCached } from '@/utils/queryCache';
import { LADDER_MEMBER_ROLES } from '@/types';
import type { RaceCode } from '@/types/primitives';


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

const CACHE_KEY = 'members_list';

/**
 * Supabase의 3개 분리 테이블을 개별 fetch 후 유기적으로 병합(Join)합니다.
 */
const fetchMemberData = async () => {
  // 1. 기본 프로필 로드 (제명/비회원 차단)
  const ProfilesData = await supabase
    .from('profiles')
    .select('user_id, by_id, role, race')
    .neq('role', 'guest')
    .neq('role', 'ghost')
    .neq('role', 'applicant')
    .neq('role', 'banned');

  // 2. 래더 점수 정보 전체 로드
  const LadderRankingsData = await supabase
    .from('ladder_rankings')
    .select('user_id, tier, personal_mmr, team_mmr, total_mmr');

  // 3. 테스트 계정 여부 메타데이터 로드
  const ProfileMetaData = await supabase
    .from('profile_meta')
    .select('user_id, is_test_account, is_test_account_active');

  // 에러 통합 체크
  const hasError = ProfilesData.error || LadderRankingsData.error || ProfileMetaData.error;
  if (hasError) {
    return { data: null, error: hasError };
  }

  // [교정] 데이터가 유실되지 않도록 완벽하게 인메모리 매핑 처리를 수행합니다.
  const JoinedData = (ProfilesData.data || []).map((profile) => {
    const ladder = LadderRankingsData.data?.find((l) => l.user_id === profile.user_id);
    const meta = ProfileMetaData.data?.find((m) => m.user_id === profile.user_id);

    return {
      user_id: profile.user_id,
      by_id: profile.by_id,
      role: profile.role,
      race: profile.race as RaceCode | null,
      tier: ladder?.tier ?? 'Unranked',
      personal_mmr: ladder?.personal_mmr ?? 0,
      team_mmr: ladder?.team_mmr ?? 0,
      total_mmr: ladder?.total_mmr ?? 0,
      is_test_account: meta?.is_test_account ?? false,
      is_test_account_active: meta?.is_test_account_active ?? true,
    };
  });

  // 테스트 계정 필터링 처리
  const isTestViewer = isCurrentViewerTestAccount();
  const filteredData = JoinedData.filter((m) =>
    isTestViewer
      ? m.is_test_account === true && m.is_test_account_active === true
      : !m.is_test_account
  );

  return { data: filteredData, error: null };
};

export default function MemberList() {
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      
      const cached = getCached(CACHE_KEY);
      if (cached) {
        setMembers(cached);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await fetchMemberData();
        if (error) throw error;

        // [교정] 부모로부터 온 명확한 정식 역할 리스트(LADDER_MEMBER_ROLES)를 매핑 기준으로 사용
        const processed = (data || []).filter(
          (member) => member && member.user_id && member.role && LADDER_MEMBER_ROLES.includes(member.role as any)
        );

        setCached(CACHE_KEY, processed);
        setMembers(processed);
      } catch (err: any) {
        console.error('클랜원 목록 로드 실패:', err);
        setError(err);
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
          <label className="text-xs text-cyan-100/55 uppercase tracking-[0.25em] mb-2 block">클랜원 검색</label>
          <input
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
            {searchTerm ? `검색 결과 ${filteredMembers.length}명` : `총 {totalMembers}명`}
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
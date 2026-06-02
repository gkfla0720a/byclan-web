// 파일명: @/views/MemberList.tsx

'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/supabase';
import { isCurrentViewerTestAccount } from '@/utils/testData';
import { getCached, setCached } from '@/utils/queryCache';
import { LADDER_MEMBER_ROLES } from '@/types'
import type { RaceCode } from '@/types/primitives';

const CACHE_KEY = 'members_list';

/**
 * Supabase에서 순수 클랜원 정보를 가져옵니다.
 * [변경] 티어, 개인MMR, 팀MMR, 총MMR을 모두 가져오도록 쿼리를 정비합니다.
 */
const fetchMetaData = async () => {
  const joinedResult = await supabase
    .from('profiles')
    .select(`
      id, by_id, role, race, tier,
      ladder_rankings(personal_mmr, team_mmr, total_mmr),
      profile_meta(is_test_account, is_test_account_active)
    `)
    .neq('role', 'guest')
    .neq('role', 'ghost')
    .neq('role', 'applicant')
    .neq('role', 'banned');

  if (!joinedResult.error) {
    const isTestViewer = isCurrentViewerTestAccount();
    return {
      ...joinedResult,
      data: (joinedResult.data || [])
        .map(m => ({
          ...m,
          personal_mmr: (m.ladder_rankings as any)?.personal_mmr ?? 0,
          team_mmr: (m.ladder_rankings as any)?.team_mmr ?? 0,
          total_mmr: (m.ladder_rankings as any)?.total_mmr ?? 0,
          is_test_account: (m.profile_meta as any)?.is_test_account ?? false,
          is_test_account_active: (m.profile_meta as any)?.is_test_account_active ?? true,
        }))
        .filter(m => isTestViewer
          ? (m.is_test_account === true && m.is_test_account_active === true)
          : !m.is_test_account
        ),
    };
  }
  return { data: null, error: new Error('profiles 테이블 조회 실패') };
};

export default function MemberList() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  
  /** [추가] 사용자가 입력한 검색어를 저장할 상태 공간 */
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
        const { data, error } = await fetchMetaData();
        if (error) throw error;

        // 등급 제한 필터링만 거친 순수 데이터 저장
        const processed = (data || []).filter((member) => member && member.id && member.role && LADDER_MEMBER_ROLES.includes(member.role));
        
        setCached(CACHE_KEY, processed);
        setMembers(processed);
      } catch (err) {
        console.error('클랜원 목록 로드 실패:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  /** [추가] 검색어에 맞게 실시간으로 필터링된 멤버 리스트 계산 */
  const filteredMembers = members.filter((member) => {
    const nickname = member.by_id || '';
    // 소문자 대문자 구별 없이 검색이 잘 되도록 처리합니다.
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

      {/* 요약 통계와 검색창 레이아웃 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        <div className="md:col-span-1">
          <StatCard label="총 인원" value={`${totalMembers}명`} accent="text-white" />
        </div>
        
        {/* [추가] 닉네임 검색 인풋창 */}
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

      {/* 단일화된 테이블 */}
      <div className="neon-panel rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 bg-slate-950/60 border-b border-cyan-400/15">
          <h4 className="text-lg font-bold text-white">클랜원 목록</h4>
          <span className="text-sm text-cyan-200/80">
            {searchTerm ? `검색 결과 ${filteredMembers.length}명` : `총 ${totalMembers}명`}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full table-fixed text-sm">
            {/* [변경] 지정해주신 새로운 컬럼 비율에 맞게 조정 */}
            <colgroup>
              <col className="w-[24%]" /> {/* 닉네임 */}
              <col className="w-[16%]" /> {/* 티어 */}
              <col className="w-[15%]" /> {/* 총 MMR */}
              <col className="w-[15%]" /> {/* 개인 MMR */}
              <col className="w-[15%]" /> {/* 팀 MMR */}
              <col className="w-[15%]" /> {/* 주종 */}
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
              {/* [변경] 원본 members 대신 필터링된 리스트를 반복문으로 돌립니다. */}
              {filteredMembers.map((member) => {
                return (
                  <tr key={member.id} className="hover:bg-cyan-400/5 transition-colors border-b border-slate-900">
                    {/* 닉네임 */}
                    <td className="px-4 py-3 text-white font-semibold">
                      <div className="flex items-center gap-2">
                        <span className="truncate">{member.by_id || '[닉네임 없음]'}</span>
                      </div>
                    </td>
                    {/* 티어 */}
                    <td className="px-4 py-3 text-slate-300 font-medium">
                      {member.tier || 'Unranked'}
                    </td>
                    {/* 총 MMR */}
                    <td className="px-4 py-3 text-cyan-300 font-bold">
                      {member.total_mmr}점
                    </td>
                    {/* 개인 MMR */}
                    <td className="px-4 py-3 text-slate-300">
                      {member.personal_mmr}점
                    </td>
                    {/* 팀 MMR */}
                    <td className="px-4 py-3 text-slate-300">
                      {member.team_mmr}점
                    </td>
                    {/* 주종족 */}
                    <td className="px-4 py-3 text-slate-400 font-mono">
                      {(member.race as RaceCode) || 'Terran'}
                    </td>
                  </tr>
                );
              })}
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

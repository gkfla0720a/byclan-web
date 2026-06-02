// 파일명: src/view/MemberList.tsx

'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/supabase';
import { ROLE_PERMISSIONS } from '@/types/permissions';
import { isCurrentViewerTestAccount, isMarkedTestAccount } from '@/utils/testData';
import { getCached, setCached } from '@/utils/queryCache';

const CACHE_KEY = 'members_list';

// 1. 명단을 나눌 기준 바구니를 정의합니다.
const ROLE_SECTIONS = [
  { key: 'leadership', title: '운영진', roles: ['developer', 'master', 'admin'] },
  { key: 'veteran', title: '베테랑 클랜원', roles: ['veteran'] },
  { key: 'members', title: '클랜원', roles: ['member', 'rookie'] },
];

const PLAYABLE_LADDER_MEMBER_ROLES = ['developer', 'master', 'admin', 'veteran', 'member', 'rookie'];

const normalizeUrl = (url: string) => {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
};

const applyDemoStreamers = (memberList: any[]) => {
  if (memberList.some((member) => member.is_streamer)) {
    return memberList;
  }
  return memberList.map((member, index) => {
    if (index > 2) return member;
    return {
      ...member,
      is_streamer: true,
      streamer_platform: 'SOOP',
      streamer_url: 'https://www.sooplive.co.kr',
      demo_streamer: true,
    };
  });
};

// Supabase에서 데이터를 가져오는 독립적인 순수 함수
const fetchMetaData = async () => {
  const joinedResult = await supabase
    .from('profiles')
    .select(`
      id, by_id, role, race,
      ladder_rankings(personal_mmr, total_mmr),
      profile_meta(is_streamer, streamer_platform, streamer_url, is_test_account, is_test_account_active)
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
          total_mmr: (m.ladder_rankings as any)?.total_mmr ?? 0,
          is_streamer: (m.profile_meta as any)?.is_streamer ?? false,
          streamer_platform: (m.profile_meta as any)?.streamer_platform ?? null,
          streamer_url: (m.profile_meta as any)?.streamer_url ?? null,
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

  // [교정] 깔끔하게 하나로 정리된 데이터 로드 로직
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      
      // 1. 캐시 확인
      const cached = getCached(CACHE_KEY);
      if (cached) {
        setMembers(cached);
        setLoading(false);
        return;
      }

      // 2. 캐시 없으면 DB 요청
      try {
        const { data, error } = await fetchMetaData();
        if (error) throw error;

        const processed = applyDemoStreamers(
          (data || []).filter((member) => member && member.id && member.role && PLAYABLE_LADDER_MEMBER_ROLES.includes(member.role))
        );
        
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

  // [교정] 사라졌던 실시간 계산 변수들을 다시 안전하게 배치합니다.
  const totalMembers = members.length;
  const streamerCount = members.filter((member) => Boolean(member.is_streamer)).length;

  // [교정] 전체 멤버를 운영진/베테랑/일반 그룹으로 자동 분류해주는 로직입니다.
  const groupedMembers = ROLE_SECTIONS.map((section) => ({
    ...section,
    members: members.filter((member) => section.roles.includes(member.role)),
  })).filter((section) => section.members.length > 0);

  const getRoleMeta = (role: string) => ROLE_PERMISSIONS[role] || { name: role || '알 수 없음', color: '#C7CEEA' };

  if (loading) return <div className="text-center py-12 text-cyan-400 font-mono">[ LOADING CLAN MEMBERS... ]</div>;
  if (error) return <div className="text-center py-12 text-red-400 font-bold">클랜원 목록을 불러오지 못했습니다.</div>;

  return (
    <div className="w-full max-w-5xl mx-auto mt-4 sm:mt-8 space-y-6 sm:space-y-8">
      {/* 상단 레이아웃 */}
      <div className="relative neon-panel rounded-3xl overflow-hidden px-6 py-4 text-center">
        <h2 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-linear-to-r from-cyan-100 to-blue-400">
          클랜원 명단
        </h2>
      </div>

      {/* 요약 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard label="총 인원" value={`${totalMembers}명`} accent="text-white" />
        <StatCard label="BJ / 스트리머" value={`${streamerCount}명`} accent="text-pink-400" />
      </div>

      {/* 직책별 명단 테이블 */}
      <div className="space-y-6">
        {groupedMembers.map((section) => (
          <section key={section.key} className="neon-panel rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 bg-slate-950/60 border-b border-cyan-400/15">
              <h4 className="text-lg font-bold text-white">{section.title}</h4>
              <span className="text-sm text-cyan-200/80">{section.members.length}명</span>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full table-fixed text-sm">
                <colgroup>
                  <col className="w-[30%]" />
                  <col className="w-[28%]" />
                  <col className="w-[16%]" />
                  <col className="w-[16%]" />
                  <col className="w-[10%]" />
                </colgroup>
                <thead>
                  <tr className="text-slate-400 border-b border-cyan-400/15">
                    <th className="px-4 py-3 text-left font-bold">닉네임</th>
                    <th className="px-4 py-3 text-left font-bold">등급</th>
                    <th className="px-4 py-3 text-left font-bold">종족</th>
                    <th className="px-4 py-3 text-left font-bold">MMR</th>
                    <th className="px-4 py-3 text-left font-bold">BJ</th>
                  </tr>
                </thead>
                <tbody>
                  {/* [교정] 사라졌던 유저별 반복문(.map)을 다시 복구했습니다. */}
                  {section.members.map((member) => {
                    const roleMeta = getRoleMeta(member.role);
                    const roleColor = roleMeta.color || '#C7CEEA';
                    const streamerUrl = normalizeUrl(member.streamer_url);

                    return (
                      <tr key={member.id} className="hover:bg-cyan-400/5 transition-colors border-b border-slate-900">
                        {/* 닉네임 */}
                        <td className="px-4 py-3 text-white font-semibold">
                          <div className="flex items-center gap-2">
                            <span className="truncate">{member.by_id || '[닉네임 없음]'}</span>
                            {isMarkedTestAccount(member) && (
                              <span className="text-[10px] text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded">TEST</span>
                            )}
                          </div>
                        </td>
                        {/* 등급 배지 */}
                        <td className="px-4 py-3">
                          <span
                            className="inline-flex px-2.5 py-1 rounded-full text-xs font-bold"
                            style={{
                              backgroundColor: `${roleColor}18`,
                              color: roleColor,
                              border: `1px solid ${roleColor}45`,
                            }}
                          >
                            {roleMeta.name}
                          </span>
                        </td>
                        {/* 종족 */}
                        <td className="px-4 py-3 text-slate-300">{member.race || 'Terran'}</td>
                        {/* MMR */}
                        <td className="px-4 py-3 text-cyan-300 font-bold">
                          {(member.total_mmr ?? member.personal_mmr ?? 0)}점
                        </td>
                        {/* BJ 링크 */}
                        <td className="px-4 py-3">
                          {member.is_streamer ? (
                            <div className="flex items-center gap-2">
                              <span className="text-pink-300 font-semibold">BJ</span>
                              <a
                                href={streamerUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-pink-400/35 bg-pink-400/10 text-pink-200 hover:bg-pink-400/20"
                              >
                                ▶
                              </a>
                            </div>
                          ) : (
                            <span className="text-slate-500">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="neon-panel rounded-2xl p-4">
      <div className="text-xs text-cyan-100/55 uppercase tracking-[0.25em]">{label}</div>
      <div className={`mt-2 text-3xl font-black ${accent}`}>{value}</div>
    </div>
  );
}

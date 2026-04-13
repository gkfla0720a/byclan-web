/**
 * 파일명: ClanMembers.js
 *
 * 역할:
 *   클랜원 명단 페이지 컴포넌트입니다.
 *   운영진·정예 길드원·일반 길드원 세 섹션으로 멤버를 분류하여 테이블로 보여줍니다.
 *
 * 주요 기능:
 *   - profiles 테이블에서 visitor·applicant·expelled를 제외한 멤버를 불러옵니다.
 *   - streamer 관련 컬럼이 없는 경우 자동으로 폴백(fallback) 쿼리를 실행합니다.
 *   - 관리 권한(member.manage)이 있는 사용자에게만 인라인 등급 변경 드롭다운을 표시합니다.
 *   - 스트리머 멤버는 방송 플랫폼 링크 버튼을 표시하며, 실제 스트리머가 없으면 데모 데이터를 적용합니다.
 *   - 총 인원·정예·스트리머 수를 StatCard로 요약합니다.
 *
 * 사용 방법:
 *   import ClanMembers from './ClanMembers';
 *   <ClanMembers />
 */
'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/supabase';
import { PermissionChecker, ROLE_PERMISSIONS } from '../utils/permissions';
import { filterVisibleTestAccounts, isMarkedTestAccount } from '@/app/utils/testData';

const ROLE_SECTIONS = [
  { key: 'leadership', title: '운영진', roles: ['developer', 'master', 'admin'] },
  { key: 'elite', title: '정예 길드원', roles: ['elite'] },
  { key: 'members', title: '길드원', roles: ['member', 'rookie', 'associate'] },
];

const VISIBLE_MEMBER_ROLES = ['developer', 'master', 'admin', 'elite', 'member', 'rookie', 'associate'];
const INLINE_ROLE_OPTIONS = [
  { value: 'applicant', label: '신규 가입자' },
  { value: 'member', label: '일반 클랜원' },
  { value: 'rookie', label: '신입 길드원' },
  { value: 'elite', label: '정예 길드원' },
  { value: 'admin', label: '관리자' },
];

/**
 * URL 문자열을 정규화합니다.
 * http:// 또는 https://로 시작하지 않으면 https://를 앞에 붙입니다.
 * @param {string} url - 원본 URL 문자열
 * @returns {string} 정규화된 URL
 */
function normalizeUrl(url) {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
}

/**
 * 멤버 목록에 is_streamer 필드가 하나도 없을 경우,
 * 앞의 3명에게 임시(데모) 스트리머 정보를 부여합니다.
 * @param {Array} memberList - profiles 배열
 * @returns {Array} 데모 스트리머 정보가 추가된 배열
 */
function applyDemoStreamers(memberList) {
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
}

/**
 * 역할 문자열을 UI/권한 체크에 맞는 소문자 형식으로 정규화합니다.
 * member 자체가 null이면 null을 반환합니다.
 * @param {object} member - profiles 레코드
 * @returns {object|null}
 */
function normalizeMemberRole(member) {
  if (!member) return null;
  const normalizedRole = member?.role?.trim?.().toLowerCase?.();
  return {
    ...member,
    role: normalizedRole || member?.role || '',
  };
}

/**
 * profiles 조회를 시도하고, streamer 컬럼이 없으면 해당 컬럼을 제외해 재시도합니다.
 * @returns {{ data: object[]|null, error: object|null }}
 */
async function fetchMembersWithSchemaFallback() {
  const candidates = [
    'id, by_id, discord_id, role, race, intro, clan_point, is_streamer, streamer_platform, streamer_url',
    'id, by_id, discord_id, role, race, intro, clan_point',
  ];

  for (const columns of candidates) {
    const result = await filterVisibleTestAccounts(
      supabase
        .from('profiles')
        .select(columns)
        .neq('role', 'visitor')
        .neq('role', 'applicant')
        .neq('role', 'expelled')
        .order('clan_point', { ascending: false })
    );

    if (!result.error) {
      return result;
    }

    const message = `${result.error?.message || ''} ${result.error?.details || ''} ${result.error?.hint || ''}`.toLowerCase();
    const isMissingColumn =
      result.error?.code === '42703' ||
      result.error?.code === 'PGRST204' ||
      message.includes('does not exist') ||
      message.includes('could not find');

    if (!isMissingColumn) {
      return result;
    }
  }

  return { data: null, error: new Error('profiles 테이블 조회 실패: clan_point 컬럼을 찾지 못했습니다. CLAN-POINT-COLUMN-RENAME.sql을 실행했는지 확인하세요.') };
}

/**
 * ClanMembers 컴포넌트
 *
 * 클랜원 명단을 직책별로 분류하여 테이블로 렌더링합니다.
 * 관리 권한이 있으면 인라인 드롭다운으로 등급을 변경할 수 있습니다.
 *
 * @returns {JSX.Element} 클랜원 명단 UI
 */
export default function ClanMembers() {
  console.log("🔥 [1단계] ClanMembers 컴포넌트 렌더링 시작");
  /** DB에서 불러온 멤버 배열 */
  const [members, setMembers] = useState([]);
  /** 데이터 로딩 여부 */
  const [loading, setLoading] = useState(true);
  /** 데이터 로딩 에러 상태 */
  const [error, setError] = useState(null);
  /** 현재 로그인한 사용자의 역할(role) */
  const [currentRole, setCurrentRole] = useState(null);
  /** 현재 등급 변경 처리 중인 멤버의 id (처리 완료 시 null) */
  const [updatingMemberId, setUpdatingMemberId] = useState(null);
  /** 현재 로그인한 사용자의 ID */
  const [currentUserId, setCurrentUserId] = useState(null);

  /**
   * 컴포넌트 마운트 시 현재 로그인 사용자 역할과 멤버 목록을 병렬로 불러옵니다.
   * streamer 컬럼이 없을 경우 해당 컬럼을 제외하고 재시도합니다.
   */
  useEffect(() => {
    const loadCurrentUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      // 현재 사용자 ID와 역할을 상태로 저장합니다.
      setCurrentUserId(user.id);
      setCurrentRole(profile?.role?.trim?.().toLowerCase?.() || null);
    };

    const fetchMembers = async () => {
      try {
        const { data, error } = await fetchMembersWithSchemaFallback();

        if (error) throw error;

        setMembers(
          applyDemoStreamers(
            (data || [])
              .map(normalizeMemberRole)
              .filter((member) => member && member.id && VISIBLE_MEMBER_ROLES.includes(member.role))
          )
        );
      } catch (error) {
        console.error('클랜원 목록 로드 실패:', error);
        setError(error);
        setMembers([]);
      } finally {
        setLoading(false);
      }
    };

    loadCurrentUserRole();
    fetchMembers();
  }, []);

  /** 멤버 총 인원 수 */
  const totalMembers = members.length;
  /** 정예 길드원(elite) 수 */
  const eliteCount = members.filter((member) => member.role === 'elite').length;
  /** BJ/스트리머로 등록된 멤버 수 */
  const streamerCount = members.filter((member) => Boolean(member.is_streamer)).length;
  /** ROLE_SECTIONS 정의에 따라 멤버를 직책별로 묶은 배열 (멤버 없는 섹션은 제거) */
  const groupedMembers = ROLE_SECTIONS.map((section) => ({
    ...section,
    members: members.filter((member) => section.roles.includes(member.role)),
  })).filter((section) => section.members.length > 0);

  const getRoleMeta = (role) => ROLE_PERMISSIONS[role] || { name: role || '알 수 없음', color: '#C7CEEA', icon: '👤' };
  const canManageMembers = PermissionChecker.hasPermission(currentRole, 'member.manage');

  /**
   * 인라인 드롭다운에서 멤버 등급을 변경합니다.
   * developer·master 등급 변경은 이 화면에서 차단됩니다.
   * @param {object} member - 등급을 변경할 멤버 객체
   * @param {string} nextRole - 변경할 새 역할값
   */
  const handleInlineRoleChange = async (member, nextRole) => {
    if (!canManageMembers || !nextRole || nextRole === member.role) return;

    if (member.role === 'developer') {
      alert('개발자 등급은 이 화면에서 변경할 수 없습니다.');
      return;
    }

    if (member.role === 'master' || nextRole === 'master') {
      alert('마스터 변경은 길드원 관리 화면에서 진행하세요.');
      return;
    }

    const confirmed = window.confirm(`${member.by_id || '[by_id 없음]'}의 등급을 ${ROLE_PERMISSIONS[nextRole]?.name || nextRole}(으)로 변경하시갬습니까?`);
    if (!confirmed) return;

    try {
      setUpdatingMemberId(member.id);
      const { error } = await supabase
        .from('profiles')
        .update({ role: nextRole })
        .eq('id', member.id);

      if (error) throw error;

      setMembers((prev) => prev.map((item) => item.id === member.id ? { ...item, role: nextRole } : item));
    } catch (error) {
      alert(`등급 변경 실패: ${error.message}`);
    } finally {
      setUpdatingMemberId(null);
    }
  };


  if (loading) {
    return <div className="text-center py-12 text-cyan-400 font-mono">[ LOADING CLAN MEMBERS... ]</div>;
  }

  if (error) {
    return (
      <div className="text-center py-12 space-y-2">
        <p className="text-red-400 font-bold">클랜원 목록을 불러오지 못했습니다.</p>
        <p className="text-slate-400 text-sm font-mono">{error?.message || String(error)}</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto animate-fade-in-down mt-4 sm:mt-8 space-y-6 sm:space-y-8">
      <div className="relative neon-panel rounded-3xl overflow-hidden px-6 py-4 sm:px-8 sm:py-5 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.18),transparent_38%)] pointer-events-none" />
        <h2 className="relative text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-100 via-cyan-300 to-blue-400 drop-shadow-lg">
          클랜원 명단
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="총 인원" value={`${totalMembers}명`} accent="text-white" />
        <StatCard label="정예 길드원" value={`${eliteCount}명`} accent="text-cyan-400" />
        <StatCard label="BJ / 스트리머" value={`${streamerCount}명`} accent="text-pink-400" />
      </div>

      <div className="space-y-6">
        {groupedMembers.map((section) => (
          <section key={section.key} className="neon-panel rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-cyan-400/15 bg-slate-950/60">
              <h4 className="text-lg font-bold text-white tracking-wide">{section.title}</h4>
              <span className="text-sm text-cyan-200/80">{section.members.length}명</span>
            </div>

            <div className="overflow-x-auto">
              <table className="neon-table min-w-full table-fixed text-sm">
                <colgroup>
                  <col className={canManageMembers ? 'w-[18%]' : 'w-[22%]'} />
                  <col className={canManageMembers ? 'w-[18%]' : 'w-[24%]'} />
                  <col className={canManageMembers ? 'w-[16%]' : 'w-[18%]'} />
                  <col className={canManageMembers ? 'w-[10%]' : 'w-[12%]'} />
                  <col className={canManageMembers ? 'w-[10%]' : 'w-[12%]'} />
                  <col className={canManageMembers ? 'w-[10%]' : 'w-[12%]'} />
                  {canManageMembers && <col className="w-[18%]" />}
                </colgroup>
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left font-bold">닉네임</th>
                    <th className="px-4 py-3 text-left font-bold">디스코드</th>
                    <th className="px-4 py-3 text-left font-bold">직책</th>
                    <th className="px-4 py-3 text-left font-bold">종족</th>
                    <th className="px-4 py-3 text-left font-bold">MMR</th>
                    <th className="px-4 py-3 text-left font-bold">BJ</th>
                    {canManageMembers && <th className="px-4 py-3 text-left font-bold">관리</th>}
                  </tr>
                </thead>
                <tbody>
                  {section.members.map((member) => {
                    const roleMeta = getRoleMeta(member.role);
                    const roleColor = roleMeta.color || '#C7CEEA';
                    const streamerUrl = normalizeUrl(member.streamer_url);
                    const isMe = member.id === currentUserId; // 현재 행이 로그인한 사용자 자신의 정보인지 여부

                    return (
                      <tr key={member.id} className="hover:bg-cyan-400/4 transition-colors">
                        <td className="px-4 py-3 text-white font-semibold align-middle">
                          <div className="flex items-center gap-2">
                            <span className="truncate">{member.by_id || <span className="text-red-400 text-xs">[by_id 없음]</span>}</span>
                            {isMe && (
                              <span className="text-[10px] bg-cyan-500 text-slate-950 px-1.5 py-0.5 rounded font-black animate-pulse">
                                나
                              </span>
                            )}
                            {isMarkedTestAccount(member) && <span className="text-[10px] text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded">TEST</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-300 truncate align-middle">{member.discord_id || '-'}</td>
                        <td className="px-4 py-3 align-middle">
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
                          <td className="px-4 py-3 text-slate-300 align-middle">{member.race || 'Terran'}</td>
                          <td className="px-4 py-3 text-cyan-300 font-bold align-middle whitespace-nowrap">{member.clan_point ?? 0}점</td>
                          <td className="px-4 py-3 text-slate-200 align-middle">
                          {member.is_streamer ? (
                            <div className="flex items-center gap-2">
                              <span className="text-pink-300 font-semibold">BJ</span>
                              <a
                                href={streamerUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-pink-400/35 bg-pink-400/10 text-pink-200 hover:bg-pink-400/20 hover:text-white transition-colors"
                                title={`${member.streamer_platform || 'SOOP'} 링크 열기`}
                              >
                                ▶
                              </a>
                              {member.demo_streamer && <span className="text-[10px] text-slate-400">임시</span>}
                            </div>
                          ) : (
                            <span className="text-slate-500">-</span>
                          )}
                        </td>
                        {canManageMembers && (
                          <td className="px-4 py-3 align-middle">
                            {member.role === 'developer' || member.role === 'master' ? (
                              <span className="text-xs text-slate-500">고정</span>
                            ) : (
                              <select
                                value={member.role}
                                disabled={updatingMemberId === member.id}
                                onChange={(event) => handleInlineRoleChange(member, event.target.value)}
                                className="w-full rounded-lg border border-cyan-400/15 bg-slate-950/70 px-2 py-2 text-xs text-slate-100 outline-none focus:border-cyan-300"
                              >
                                {INLINE_ROLE_OPTIONS.map((option) => (
                                  <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                              </select>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>

      {!loading && !error && members.length === 0 && <div className="text-center py-12 text-gray-500">클랜원이 없습니다.</div>}
    </div>
  );
}

/**
 * StatCard 컴포넌트
 *
 * 레이블과 숫자 값을 강조 색상으로 표시하는 통계 카드입니다.
 *
 * @param {string} label - 카드 상단에 표시할 레이블 텍스트
 * @param {string} value - 카드 중앙에 크게 표시할 값 (예: "12명")
 * @param {string} accent - 값 텍스트에 적용할 Tailwind 색상 클래스 (예: "text-cyan-400")
 * @returns {JSX.Element} 통계 카드 UI
 */
function StatCard({ label, value, accent }) {
  return (
    <div className="neon-panel rounded-2xl p-4">
      <div className="text-xs text-cyan-100/55 uppercase tracking-[0.25em]">{label}</div>
      <div className={`mt-2 text-3xl font-black ${accent}`}>{value}</div>
    </div>
  );
}
'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/supabase';
import { ROLE_PERMISSIONS } from '../utils/permissions';
import { filterVisibleTestAccounts, isMarkedTestAccount } from '@/app/utils/testData';

const ROLE_SECTIONS = [
  { key: 'leadership', title: '운영진', roles: ['developer', 'master', 'admin'] },
  { key: 'elite', title: '정예 길드원', roles: ['elite'] },
  { key: 'members', title: '길드원', roles: ['associate', 'rookie'] },
];

function normalizeUrl(url) {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
}

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

export default function ClanMembers() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const primaryResult = await filterVisibleTestAccounts(
          supabase
            .from('profiles')
            .select('id, ByID, discord_name, role, race, intro, ladder_points, is_streamer, streamer_platform, streamer_url')
            .neq('role', 'visitor')
            .neq('role', 'applicant')
            .neq('role', 'expelled')
            .order('ladder_points', { ascending: false })
        );

        if (primaryResult.error) {
          const message = `${primaryResult.error.message || ''} ${primaryResult.error.details || ''}`.toLowerCase();
          if (primaryResult.error.code === '42703' || message.includes('does not exist')) {
            const fallbackResult = await filterVisibleTestAccounts(
              supabase
                .from('profiles')
                .select('id, ByID, discord_name, role, race, intro, ladder_points')
                .neq('role', 'visitor')
                .neq('role', 'applicant')
                .neq('role', 'expelled')
                .order('ladder_points', { ascending: false })
            );

            if (fallbackResult.error) throw fallbackResult.error;
            setMembers(applyDemoStreamers(fallbackResult.data || []));
            return;
          }

          throw primaryResult.error;
        }

        setMembers(applyDemoStreamers(primaryResult.data || []));
      } catch (error) {
        console.error('클랜원 목록 로드 실패:', error);
        setMembers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, []);

  const totalMembers = members.length;
  const eliteCount = members.filter((member) => member.role === 'elite').length;
  const streamerCount = members.filter((member) => Boolean(member.is_streamer)).length;
  const groupedMembers = ROLE_SECTIONS.map((section) => ({
    ...section,
    members: members.filter((member) => section.roles.includes(member.role)),
  })).filter((section) => section.members.length > 0);

  const getRoleMeta = (role) => ROLE_PERMISSIONS[role] || { name: role, color: '#C7CEEA', icon: '👤' };

  if (loading) {
    return <div className="text-center py-12 text-cyan-400 font-mono">[ LOADING CLAN MEMBERS... ]</div>;
  }

  return (
    <div className="w-full max-w-5xl mx-auto animate-fade-in-down mt-4 sm:mt-8 space-y-6 sm:space-y-8">
      <div className="relative neon-panel rounded-3xl overflow-hidden p-8 sm:p-12 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.18),transparent_38%)] pointer-events-none" />
        <h2 className="relative text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-100 via-cyan-300 to-blue-400 mb-4 drop-shadow-lg">
          클랜원 명단
        </h2>
        <p className="relative text-slate-200 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
          기계적인 패널 감성과 네온 라인 톤으로, 현재 활동 중인 ByClan 멤버를 직책별 표 형식으로 정리했습니다.
        </p>
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
              <table className="neon-table min-w-full text-sm">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left font-bold">닉네임</th>
                    <th className="px-4 py-3 text-left font-bold">디스코드</th>
                    <th className="px-4 py-3 text-left font-bold">직책</th>
                    <th className="px-4 py-3 text-left font-bold">종족</th>
                    <th className="px-4 py-3 text-left font-bold">포인트</th>
                    <th className="px-4 py-3 text-left font-bold">BJ</th>
                  </tr>
                </thead>
                <tbody>
                  {section.members.map((member) => {
                    const roleMeta = getRoleMeta(member.role);
                    const streamerUrl = normalizeUrl(member.streamer_url);

                    return (
                      <tr key={member.id} className="hover:bg-cyan-400/4 transition-colors">
                        <td className="px-4 py-3 text-white font-semibold">
                          <div className="flex items-center gap-2">
                            <span>{member.ByID || member.discord_name || '이름 없음'}</span>
                            {isMarkedTestAccount(member) && <span className="text-[10px] text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded">TEST</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-300">{member.discord_name || '-'}</td>
                        <td className="px-4 py-3">
                          <span
                            className="inline-flex px-2.5 py-1 rounded-full text-xs font-bold"
                            style={{
                              backgroundColor: `${roleMeta.color}18`,
                              color: roleMeta.color,
                              border: `1px solid ${roleMeta.color}45`,
                            }}
                          >
                            {roleMeta.name}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-300">{member.race || 'Terran'}</td>
                        <td className="px-4 py-3 text-cyan-300 font-bold">{member.ladder_points || 1000}P</td>
                        <td className="px-4 py-3 text-slate-200">
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
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>

      {members.length === 0 && <div className="text-center py-12 text-gray-500">클랜원이 없습니다.</div>}
    </div>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div className="neon-panel rounded-2xl p-4">
      <div className="text-xs text-cyan-100/55 uppercase tracking-[0.25em]">{label}</div>
      <div className={`mt-2 text-3xl font-black ${accent}`}>{value}</div>
    </div>
  );
}
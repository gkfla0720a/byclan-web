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
            setMembers(fallbackResult.data || []);
            return;
          }

          throw primaryResult.error;
        }

        setMembers(primaryResult.data || []);
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
      <div className="relative bg-gray-800 rounded-2xl overflow-hidden border border-gray-700 shadow-2xl p-8 sm:p-12 text-center">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-700/40 to-transparent pointer-events-none" />
        <h2 className="relative text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-cyan-400 to-blue-500 mb-4 drop-shadow-lg">
          클랜원 명단
        </h2>
        <p className="relative text-gray-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
          현재 활동 중인 ByClan 멤버를 직책별로 정리했습니다.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="총 인원" value={`${totalMembers}명`} accent="text-white" />
        <StatCard label="정예 길드원" value={`${eliteCount}명`} accent="text-cyan-400" />
        <StatCard label="BJ / 스트리머" value={`${streamerCount}명`} accent="text-pink-400" />
      </div>

      <div className="space-y-6">
        {groupedMembers.map((section) => (
          <section key={section.key} className="rounded-xl border border-gray-700 bg-gray-900/30 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 bg-gray-900/60">
              <h4 className="text-lg font-bold text-white">{section.title}</h4>
              <span className="text-sm text-gray-400">{section.members.length}명</span>
            </div>

            <div className="divide-y divide-gray-800">
              {section.members.map((member) => {
                const roleMeta = getRoleMeta(member.role);
                const streamerUrl = normalizeUrl(member.streamer_url);

                return (
                  <div key={member.id} className="px-5 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="text-2xl shrink-0">{roleMeta.icon}</div>
                      <div className="min-w-0">
                        <div className="text-white font-bold flex items-center gap-2 flex-wrap">
                          <span className="truncate">{member.ByID || member.discord_name || '이름 없음'}</span>
                          {isMarkedTestAccount(member) && <span className="text-[10px] text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded">TEST</span>}
                          {member.is_streamer && <span className="text-[10px] text-pink-300 border border-pink-500/40 px-1.5 py-0.5 rounded">{member.streamer_platform || 'STREAMER'}</span>}
                        </div>
                        <div className="text-sm text-gray-400 truncate">{member.discord_name || '디스코드명 미등록'}</div>
                        {member.is_streamer && streamerUrl && (
                          <a
                            href={streamerUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-pink-300 hover:text-pink-200 underline break-all"
                          >
                            {streamerUrl}
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 md:justify-end">
                      <span
                        className="px-2 py-1 rounded-full text-xs font-bold"
                        style={{
                          backgroundColor: `${roleMeta.color}20`,
                          color: roleMeta.color,
                          border: `1px solid ${roleMeta.color}50`,
                        }}
                      >
                        {roleMeta.name}
                      </span>
                      <span className="text-sm font-bold text-cyan-400">{member.ladder_points || 1000}P</span>
                      <span className="text-xs text-gray-500">{member.race || 'Terran'}</span>
                    </div>
                  </div>
                );
              })}
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
    <div className="rounded-xl border border-gray-700 bg-gray-900/50 p-4">
      <div className="text-xs text-gray-500 uppercase tracking-widest">{label}</div>
      <div className={`mt-2 text-3xl font-black ${accent}`}>{value}</div>
    </div>
  );
}
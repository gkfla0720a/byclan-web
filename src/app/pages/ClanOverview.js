'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabase';
import { ROLE_PERMISSIONS } from '../utils/permissions';
import { filterVisibleTestAccounts, isMarkedTestAccount } from '@/app/utils/testData';

const ROLE_SECTIONS = [
  { key: 'leadership', title: '운영진', roles: ['developer', 'master', 'admin'] },
  { key: 'elite', title: '정예 길드원', roles: ['elite'] },
  { key: 'members', title: '길드원', roles: ['associate', 'rookie'] },
];

function isBjMember(member) {
  const source = [member?.ByID, member?.discord_name, member?.intro]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return source.includes('bj');
}

// 길드원 리스트 컴포넌트
function GuildMemberList() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const { data, error } = await filterVisibleTestAccounts(supabase
        .from('profiles')
        .select('*')
        .neq('role', 'visitor')
        .neq('role', 'applicant')
        .neq('role', 'expelled')
        .order('ladder_points', { ascending: false }));
      
      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('길드원 목록 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role) => {
    return ROLE_PERMISSIONS[role]?.color || '#C7CEEA';
  };

  const getRoleIcon = (role) => {
    return ROLE_PERMISSIONS[role]?.icon || '👤';
  };

  const getRoleName = (role) => {
    return ROLE_PERMISSIONS[role]?.name || role;
  };

  const totalMembers = members.length;
  const eliteCount = members.filter((member) => member.role === 'elite').length;
  const bjCount = members.filter((member) => isBjMember(member)).length;
  const groupedMembers = ROLE_SECTIONS.map((section) => ({
    ...section,
    members: members.filter((member) => section.roles.includes(member.role)),
  })).filter((section) => section.members.length > 0);

  if (loading) {
    return (
      <div className="text-center py-12 text-cyan-400 font-mono">
        [ LOADING GUILD MEMBERS... ]
      </div>
    );
  }

  return (
    <div className="bg-gray-800 border border-cyan-500/30 rounded-xl overflow-hidden shadow-2xl">
      <div className="bg-gradient-to-r from-cyan-600/20 to-purple-600/20 p-6 border-b border-cyan-500/30">
        <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
          🎭 클랜원 명단
        </h3>
        <p className="text-gray-400 text-sm mt-1">현재 활동 중인 멤버를 직책 기준으로 정리했습니다.</p>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="rounded-xl border border-gray-700 bg-gray-900/50 p-4">
            <div className="text-xs text-gray-500 uppercase tracking-widest">총 인원</div>
            <div className="mt-2 text-3xl font-black text-white">{totalMembers}명</div>
          </div>
          <div className="rounded-xl border border-gray-700 bg-gray-900/50 p-4">
            <div className="text-xs text-gray-500 uppercase tracking-widest">정예 길드원</div>
            <div className="mt-2 text-3xl font-black text-cyan-400">{eliteCount}명</div>
          </div>
          <div className="rounded-xl border border-gray-700 bg-gray-900/50 p-4">
            <div className="text-xs text-gray-500 uppercase tracking-widest">BJ</div>
            <div className="mt-2 text-3xl font-black text-yellow-400">{bjCount}명</div>
          </div>
        </div>

        <div className="space-y-6">
          {groupedMembers.map((section) => (
            <section key={section.key} className="rounded-xl border border-gray-700 bg-gray-900/30 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 bg-gray-900/60">
                <h4 className="text-lg font-bold text-white">{section.title}</h4>
                <span className="text-sm text-gray-400">{section.members.length}명</span>
              </div>

              <div className="divide-y divide-gray-800">
                {section.members.map((member) => (
                  <div key={member.id} className="px-5 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="text-2xl shrink-0">{getRoleIcon(member.role)}</div>
                      <div className="min-w-0">
                        <div className="text-white font-bold flex items-center gap-2 flex-wrap">
                          <span className="truncate">{member.ByID || member.discord_name || '이름 없음'}</span>
                          {isMarkedTestAccount(member) && (
                            <span className="text-[10px] text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded">TEST</span>
                          )}
                          {isBjMember(member) && (
                            <span className="text-[10px] text-pink-300 border border-pink-500/40 px-1.5 py-0.5 rounded">BJ</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-400 truncate">{member.discord_name || '디스코드명 미등록'}</div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 md:justify-end">
                      <span
                        className="px-2 py-1 rounded-full text-xs font-bold"
                        style={{
                          backgroundColor: `${getRoleColor(member.role)}20`,
                          color: getRoleColor(member.role),
                          border: `1px solid ${getRoleColor(member.role)}50`,
                        }}
                      >
                        {getRoleName(member.role)}
                      </span>
                      <span className="text-sm font-bold text-cyan-400">{member.ladder_points || 1000}P</span>
                      <span className="text-xs text-gray-500">{member.race || 'Terran'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
        
        {members.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            길드원이 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}

function ClanOverview() {
  return (
    <div className="w-full max-w-5xl mx-auto animate-fade-in-down mt-4 sm:mt-8 space-y-6 sm:space-y-8">
      <div className="relative bg-gray-800 rounded-2xl overflow-hidden border border-gray-700 shadow-2xl p-8 sm:p-12 text-center group">
         <div className="absolute inset-0 bg-gradient-to-b from-gray-700/40 to-transparent pointer-events-none"></div>
         <h2 className="relative text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600 mb-4 drop-shadow-lg">최강의 스타크래프트 빠른무한 클랜, ByClan</h2>
         <p className="relative text-gray-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">바이클랜은 스타크래프트 빠른무한(빨무)을 즐기는 유저들이 모인 명실상부 최고의 클랜입니다.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
         <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 text-center">
            <span className="text-4xl mb-3 block">🎮</span>
            <h3 className="text-lg font-bold text-white">메인 게임</h3>
            <p className="text-gray-400 text-sm">빠른무한 (Fast Infinite)</p>
         </div>
         <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 text-center">
            <span className="text-4xl mb-3 block">👑</span>
            <h3 className="text-lg font-bold text-white">리더십</h3>
            <p className="text-gray-400 text-sm">운영진 체제</p>
         </div>
         <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 text-center">
            <span className="text-4xl mb-3 block">⚔️</span>
            <h3 className="text-lg font-bold text-white">활동</h3>
            <p className="text-gray-400 text-sm">자체 래더 및 내전</p>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h3 className="text-lg font-bold text-cyan-400 mb-3">클랜 운영 방향</h3>
          <ul className="space-y-2 text-sm text-gray-300 leading-relaxed">
            <li>• ByClan은 빠른무한을 오래 즐기는 유저들이 꾸준히 모여 래더와 내전을 함께 운영하는 클랜입니다.</li>
            <li>• 활동의 중심은 레더 경쟁, 디스코드 소통, 팀 단위 플레이 적응에 있습니다.</li>
            <li>• 운영진과 정예 멤버가 신규 인원 적응을 돕고, 활동 흐름은 공지와 알림을 통해 관리됩니다.</li>
          </ul>
        </div>
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h3 className="text-lg font-bold text-cyan-400 mb-3">멤버 구성 안내</h3>
          <ul className="space-y-2 text-sm text-gray-300 leading-relaxed">
            <li>• 운영진, 정예 길드원, 일반 길드원 구성을 기준으로 역할이 나뉘며 리스트도 같은 기준으로 정리됩니다.</li>
            <li>• 상단 요약에서는 전체 인원과 정예 길드원 수, BJ 표기가 있는 멤버 수를 빠르게 확인할 수 있습니다.</li>
            <li>• 멤버 목록은 순위 번호 대신 ByID와 직책, 포인트 중심으로 확인할 수 있도록 단순화했습니다.</li>
          </ul>
        </div>
      </div>

      {/* 길드원 리스트 추가 */}
      <GuildMemberList />
    </div>
  );
}

export default ClanOverview;

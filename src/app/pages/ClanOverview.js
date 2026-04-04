'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabase';
import { ROLE_PERMISSIONS } from '../utils/permissions';

// 길드원 리스트 컴포넌트
function GuildMemberList() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      console.log('🔍 길드원 목록 조회 시작...');
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('role', 'visitor')
        .neq('role', 'applicant')
        .neq('role', 'expelled')
        .order('ladder_points', { ascending: false });

      console.log('🔍 길드원 목록 결과:', { data, error });
      
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
          🎭 길드원 명단
        </h3>
        <p className="text-gray-400 text-sm mt-1">랭킹별 길드원 리스트</p>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((member, index) => (
            <div 
              key={member.id} 
              className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 hover:border-cyan-500/50 transition-all hover:scale-105 cursor-pointer"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="text-3xl">{getRoleIcon(member.role)}</div>
                <div className="flex-1">
                  <div className="text-white font-bold text-lg">{member.ByID}</div>
                  <div className="text-gray-400 text-sm">{member.discord_name}</div>
                </div>
                <div className="text-2xl font-bold text-cyan-400">
                  #{index + 1}
                </div>
              </div>
              
              <div className="flex items-center justify-between mb-2">
                <span 
                  className="px-2 py-1 rounded-full text-xs font-bold"
                  style={{ 
                    backgroundColor: getRoleColor(member.role) + '20',
                    color: getRoleColor(member.role),
                    border: `1px solid ${getRoleColor(member.role)}50`
                  }}
                >
                  {getRoleName(member.role)}
                </span>
                <div className="text-cyan-400 text-sm font-bold">
                  {member.ladder_points || 1000}P
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <span className="text-yellow-400">🏆</span>
                  {member.race || 'Terran'}
                </span>
                <span className="flex items-center gap-1">
                  <span className="text-green-400">📅</span>
                  {new Date(member.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            </div>
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
      
      {/* 길드원 리스트 추가 */}
      <GuildMemberList />
    </div>
  );
}

export default ClanOverview;

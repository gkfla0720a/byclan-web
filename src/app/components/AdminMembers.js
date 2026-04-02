'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabase';

export default function AdminMembers() {
  const [members, setMembers] = useState([]);
  const [myRole, setMyRole] = useState('');
  const [loading, setLoading] = useState(true);

  // 등급별 한글 명칭
  const roleLabels = {
    master: "👑 클랜 마스터",
    admin: "🛠️ 운영진",
    elite: "⚔️ 정예 클랜원",
    member: "🛡️ 일반 클랜원",
    rookie: "🌱 신입 클랜원",
    associate: "👀 준회원",
    guest: "👤 방문자"
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // 1. 내 정보 확인
      const { data: { user } } = await supabase.auth.getUser();
      const { data: myProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      setMyRole(myProfile?.role || 'guest');

      // 2. 전체 회원 목록 가져오기
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setMembers(data || []);
    } catch (e) {
      console.error("데이터 로드 실패:", e.message);
    } finally {
      setLoading(false);
    }
  };

  const updateRole = async (id, newRole) => {
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', id);
    if (!error) {
      alert("등급이 성공적으로 변경되었습니다.");
      fetchData();
    }
  };

  if (loading) return <div className="py-20 text-center text-gray-500 font-mono">LOADING MEMBERS...</div>;

  return (
    <div className="w-full max-w-5xl mx-auto py-8 px-4 animate-fade-in-down">
      <div className="flex justify-between items-center mb-8 border-b border-gray-700 pb-4">
        <h2 className="text-3xl font-black text-white">ByClan 회원 등급 관리</h2>
        <div className="bg-gray-800 px-4 py-2 rounded-lg border border-gray-700">
           <span className="text-gray-400 text-xs font-bold mr-2">내 직급:</span>
           <span className="text-yellow-500 font-bold">{roleLabels[myRole.toLowerCase()] || "확인 불가"}</span>
        </div>
      </div>

      <div className="bg-gray-800 rounded-2xl overflow-hidden border border-gray-700 shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-900 text-cyan-400 text-xs font-black uppercase tracking-widest border-b border-gray-700">
              <th className="py-4 px-6 text-center">닉네임</th>
              <th className="py-4 px-6 text-center">현재 등급</th>
              <th className="py-4 px-6 text-center">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {members.map((m) => (
              <tr key={m.id} className="hover:bg-gray-700/30 transition-colors">
                <td className="py-4 px-6 text-center">
                  <div className="font-bold text-white">
                    {/* ✨ 변수명 불일치 해결: 있는 이름부터 출력 */}
                    {m.ByID || m.nickname || m.full_name || "이름 미설정"}
                  </div>
                  <div className="text-[10px] text-gray-500 font-mono mt-0.5">{m.discord_name || m.discord_n || "디스코드 미연결"}</div>
                </td>
                <td className="py-4 px-6 text-center">
                  <span className="px-3 py-1 bg-gray-900 border border-gray-600 rounded-full text-xs text-gray-300">
                    {roleLabels[m.role?.toLowerCase()] || m.role}
                  </span>
                </td>
                <td className="py-4 px-6 text-center">
                  <select 
                    value={m.role} 
                    onChange={(e) => updateRole(m.id, e.target.value)}
                    className="bg-gray-900 border border-gray-600 text-xs text-white p-1.5 rounded-md focus:border-yellow-500 outline-none"
                  >
                    {Object.keys(roleLabels).map(role => (
                      <option key={role} value={role}>{roleLabels[role]}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
            {members.length === 0 && (
              <tr>
                <td colSpan="3" className="py-20 text-center text-gray-600 italic">표시할 회원이 없습니다. RLS 설정을 확인하세요.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

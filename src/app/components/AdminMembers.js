'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabase';

export default function AdminMembers() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const roleLabels = {
    master: "👑 마스터", admin: "🛠️ 운영진", elite: "⚔️ 정예",
    member: "🛡️ 일반", rookie: "🌱 신입", associate: "👀 준회원", guest: "👤 방문자"
  };

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setMembers(data || []);
    } catch (e) { console.error(e.message); } finally { setLoading(false); }
  };

  const updateRole = async (id, newRole) => {
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', id);
    if (!error) { alert("등급 변경 완료!"); fetchData(); }
  };

  if (loading) return <div className="py-20 text-center text-gray-500 font-mono animate-pulse">OPTIMIZING DATA...</div>;

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4 animate-fade-in">
      <h2 className="text-2xl font-black text-white mb-6 border-b border-gray-700 pb-4">회원 등급 관리</h2>

      <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 shadow-2xl">
        <table className="w-full text-left">
          <thead className="bg-gray-900 text-cyan-400 text-[10px] font-black uppercase tracking-widest">
            <tr>
              <th className="py-4 px-4 text-center">닉네임(ByID)</th>
              <th className="py-4 px-4 text-center">등급</th>
              <th className="py-4 px-4 text-center">설정</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700 text-sm">
            {members.map((m) => (
              <tr key={m.id} className="hover:bg-gray-700/30 transition-colors">
                <td className="py-4 px-4 text-center font-bold text-white">
                  {m.ByID || '-'}
                  <div className="text-[10px] text-gray-600 font-normal">{m.discord_name || '-'}</div>
                </td>
                <td className="py-4 px-4 text-center">
                  <span className="px-2 py-1 bg-gray-900 border border-gray-700 rounded-full text-[10px] text-gray-400 whitespace-nowrap">
                    {roleLabels[m.role?.toLowerCase()] || m.role}
                  </span>
                </td>
                <td className="py-4 px-4 text-center">
                  <select 
                    value={m.role} 
                    onChange={(e) => updateRole(m.id, e.target.value)}
                    className="bg-gray-900 border border-gray-700 text-[10px] text-white p-1 rounded focus:border-cyan-500 outline-none"
                  >
                    {Object.keys(roleLabels).map(role => <option key={role} value={role}>{roleLabels[role]}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

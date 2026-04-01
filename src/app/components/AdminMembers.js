'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabase';

export default function AdminMembers() {
  const [members, setMembers] = useState([]);
  const [myRole, setMyRole] = useState(null); // 내 현재 직급 저장
  const [loading, setLoading] = useState(true);
  
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ nickname: '', role: '' });
  const [isSaving, setIsSaving] = useState(false);

  // 직급별 권한 수치화 (숫자가 높을수록 상위 권한)
  const powerLevel = {
    master: 100,
    admin: 80,
    elite: 60,
    member: 40,
    rookie: 20,
    visitor: 10,
    expelled: 0 // 제명
  };

  const roleStyles = {
    master: "bg-yellow-500 text-black border border-yellow-300",
    admin: "bg-orange-600 text-white border border-orange-400",
    elite: "bg-purple-600 text-white border border-purple-400",
    member: "bg-blue-600 text-white border border-blue-400",
    rookie: "bg-emerald-600 text-white border border-emerald-400",
    visitor: "bg-gray-700 text-gray-300 border border-gray-500",
    expelled: "bg-red-900 text-red-300 border border-red-700 line-through"
  };

  const roleLabels = {
    master: "클랜 마스터",
    admin: "운영진",
    elite: "정예 클랜원",
    member: "일반 클랜원",
    rookie: "신입 클랜원",
    visitor: "방문자",
    expelled: "제명됨"
  };

  useEffect(() => {
    checkAdminAndFetch();
  }, []);

  const checkAdminAndFetch = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        const currentRole = profile?.role?.trim().toLowerCase();
        
        // 마스터 또는 운영진만 이 페이지 접근 가능
        if (['master', 'admin'].includes(currentRole)) {
          setMyRole(currentRole);
          await fetchMembers();
        }
      }
    } catch (err) {
      console.error("권한 확인 에러:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, nickname, role, created_at')
      .order('created_at', { ascending: true });

    if (!error) setMembers(data);
  };

  const handleEditClick = (member) => {
    setEditingId(member.id);
    setEditForm({ nickname: member.nickname, role: member.role || 'visitor' });
  };

  const handleSaveClick = async (id) => {
    try {
      setIsSaving(true);
      const { error } = await supabase
        .from('profiles')
        .update({ nickname: editForm.nickname, role: editForm.role })
        .eq('id', id);

      if (error) throw error;
      alert('상태가 정상적으로 업데이트되었습니다.');
      setEditingId(null);
      await fetchMembers();
    } catch (error) {
      alert('수정 실패: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="text-center py-24 text-gray-500 font-mono">[ ACCESSING CLAN DATABASE... ]</div>;
  if (!myRole) return <div className="text-center py-24 text-red-400 font-bold">⚠️ 접근 권한이 없습니다.</div>;

  return (
    <div className="w-full max-w-6xl mx-auto py-8 px-4 animate-fade-in-down font-sans">
      <div className="flex items-center justify-between mb-8 border-b border-gray-700 pb-5">
        <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-600">
          ByClan 회원 등급 관리
        </h2>
        <span className="bg-gray-800 text-yellow-500 px-3 py-1 rounded border border-gray-600 text-sm font-bold">
          내 직급: {roleLabels[myRole]}
        </span>
      </div>

      <div className="bg-gray-800 rounded-2xl border border-gray-700 shadow-2xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-900/70 text-sky-300 text-sm border-b border-gray-700">
            <tr>
              <th className="py-4 px-6 font-bold">닉네임</th>
              <th className="py-4 px-6 font-bold">현재 등급</th>
              <th className="py-4 px-6 font-bold text-center">관리</th>
            </tr>
          </thead>
          
          <tbody className="text-gray-100 text-sm divide-y divide-gray-700/50">
            {members.map((member) => {
              // 핵심 로직: 내가 이 사람을 수정할 수 있는가?
              // 1. 마스터는 본인 제외 모두 수정 가능 (마스터 양도 포함)
              // 2. 운영진은 자신보다 낮은 등급(elite 이하)만 수정 가능
              const canEdit = myRole === 'master' || (myRole === 'admin' && powerLevel[member.role] < powerLevel['admin']);

              return (
                <tr key={member.id} className="hover:bg-gray-700/30 transition-colors">
                  <td className="py-4 px-6 font-medium">
                    {editingId === member.id ? (
                      <input 
                        type="text" 
                        value={editForm.nickname} 
                        onChange={(e) => setEditForm({...editForm, nickname: e.target.value})}
                        className="w-full p-2 rounded bg-gray-900 border border-gray-600 text-white"
                      />
                    ) : member.nickname}
                  </td>

                  <td className="py-4 px-6">
                    {editingId === member.id ? (
                      <select 
                        value={editForm.role} 
                        onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                        className="w-full p-2 rounded bg-gray-900 border border-gray-600 text-white"
                      >
                        {/* 마스터는 모든 옵션 부여 가능, 운영진은 마스터/운영진 옵션 숨김 */}
                        {Object.keys(roleLabels).map(roleKey => {
                          if (myRole === 'admin' && powerLevel[roleKey] >= powerLevel['admin']) return null;
                          return <option key={roleKey} value={roleKey}>{roleLabels[roleKey]}</option>
                        })}
                      </select>
                    ) : (
                      <span className={`px-3 py-1 rounded text-[10px] font-black uppercase tracking-tighter ${roleStyles[member.role] || roleStyles.visitor}`}>
                        {roleLabels[member.role] || "미지정"}
                      </span>
                    )}
                  </td>

                  <td className="py-4 px-6 text-center">
                    {editingId === member.id ? (
                      <div className="flex gap-2 justify-center">
                        <button onClick={() => handleSaveClick(member.id)} disabled={isSaving} className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded">저장</button>
                        <button onClick={() => setEditingId(null)} className="px-3 py-1.5 bg-gray-600 text-white text-xs font-bold rounded">취소</button>
                      </div>
                    ) : (
                      canEdit && (
                        <button onClick={() => handleEditClick(member)} className="px-3 py-1.5 border border-gray-600 text-gray-300 hover:border-yellow-500 text-xs font-bold rounded">
                          변경/제명
                        </button>
                      )
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

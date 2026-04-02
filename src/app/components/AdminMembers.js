'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabase';

export default function AdminMembers() {
  const [members, setMembers] = useState([]);
  const [myRole, setMyRole] = useState(null);
  const [myId, setMyId] = useState(null); // ✅ 내 고유 ID 저장용 상태 추가
  const [loading, setLoading] = useState(true);
  
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ nickname: '', role: '' });
  const [isSaving, setIsSaving] = useState(false);

// 1. 권한 레벨 추가 (신입 클랜원보다 낮은 15 정도 부여)
  const powerLevel = {
    master: 100, admin: 80, elite: 60, member: 40, rookie: 20, associate: 15, guest: 10, expelled: 0
  };

  // 2. 뱃지 스타일 추가 (준회원은 청록색 느낌)
  const roleStyles = {
    master: "bg-yellow-500 text-black border border-yellow-300",
    admin: "bg-orange-600 text-white border border-orange-400",
    elite: "bg-purple-600 text-white border border-purple-400",
    member: "bg-blue-600 text-white border border-blue-400",
    rookie: "bg-emerald-600 text-white border border-emerald-400",
    associate: "bg-teal-800 text-teal-300 border border-teal-600", // ✅ 추가됨
    guest: "bg-gray-700 text-gray-300 border border-gray-500",
    expelled: "bg-red-900 text-red-300 border border-red-700 line-through"
  };

  // 3. 한글 라벨 추가
  const roleLabels = {
    master: "클랜 마스터", admin: "운영진", elite: "정예 클랜원", member: "일반 클랜원", rookie: "신입 클랜원", associate: "준회원", guest: "방문자", expelled: "제명됨"
  };

  useEffect(() => {
    checkAdminAndFetch();
  }, []);

  const checkAdminAndFetch = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        setMyId(user.id); // 내 ID 저장
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        const currentRole = profile?.role?.trim().toLowerCase();
        
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
    setEditForm({ nickname: member.nickname, role: member.role || 'guest' });
  };

  const handleSaveClick = async (id) => {
    try {
      setIsSaving(true);

      // ✅ [핵심 로직] 마스터 위임(Handover) 시퀀스
      if (myRole === 'master' && editForm.role === 'master') {
        const confirmHandover = window.confirm(
          `⚠️ 경고: [${editForm.nickname}]님에게 클랜 마스터 권한을 위임하시겠습니까?\n이 작업이 완료되면 본인은 [운영진]으로 즉시 강등되며 되돌릴 수 없습니다.`
        );
        
        if (!confirmHandover) {
          setIsSaving(false);
          return; // 취소하면 중단
        }

        // 1. 대상 유저를 마스터로 승급
        const { error: targetError } = await supabase
          .from('profiles')
          .update({ nickname: editForm.nickname, role: 'master' })
          .eq('id', id);
        if (targetError) throw targetError;

        // 2. 나 자신을 운영진(admin)으로 강등
        const { error: selfError } = await supabase
          .from('profiles')
          .update({ role: 'admin' })
          .eq('id', myId);
        if (selfError) throw selfError;

        alert('클랜 마스터 권한 위임이 완료되었습니다. 이용을 위해 페이지를 새로고침합니다.');
        window.location.reload(); // 내 권한이 바뀌었으므로 새로고침
        return;
      }

      // 일반적인 수정 로직
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
              // ✅ 본인 계정인지 확인
              const isMe = member.id === myId;
              
              // ✅ 본인은 수정 불가. 다른 사람은 직급 비교 로직 통과 시 수정 가능
              const canEdit = !isMe && (myRole === 'master' || (myRole === 'admin' && powerLevel[member.role] < powerLevel['admin']));

              return (
                <tr key={member.id} className={`transition-colors ${isMe ? 'bg-gray-700/20' : 'hover:bg-gray-700/30'}`}>
                  <td className="py-4 px-6 font-medium">
                    {editingId === member.id ? (
                      <input 
                        type="text" 
                        value={editForm.nickname} 
                        onChange={(e) => setEditForm({...editForm, nickname: e.target.value})}
                        className="w-full p-2 rounded bg-gray-900 border border-gray-600 text-white"
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        {member.nickname}
                        {isMe && <span className="text-[10px] bg-gray-600 text-gray-300 px-2 py-0.5 rounded-full">나</span>}
                      </div>
                    )}
                  </td>

                  <td className="py-4 px-6">
                    {editingId === member.id ? (
                      <select 
                        value={editForm.role} 
                        onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                        className="w-full p-2 rounded bg-gray-900 border border-gray-600 text-white"
                      >
                        {Object.keys(roleLabels).map(roleKey => {
                          if (myRole === 'admin' && powerLevel[roleKey] >= powerLevel['admin']) return null;
                          return <option key={roleKey} value={roleKey}>{roleLabels[roleKey]}</option>
                        })}
                      </select>
                    ) : (
                      <span className={`px-3 py-1 rounded text-[10px] font-black uppercase tracking-tighter ${roleStyles[member.role] || roleStyles.guest}`}>
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
                    ) : isMe ? (
                      // ✅ 본인 계정일 경우 관리 버튼 대신 안내 문구 표시
                      <span className="text-xs text-gray-500 bg-gray-900 border border-gray-700 px-3 py-1.5 rounded cursor-not-allowed">
                        본인(수정 불가)
                      </span>
                    ) : canEdit ? (
                      <button onClick={() => handleEditClick(member)} className="px-3 py-1.5 border border-gray-600 text-gray-300 hover:border-yellow-500 text-xs font-bold rounded transition-colors">
                        변경/제명
                      </button>
                    ) : (
                      <span className="text-xs text-gray-600">-</span>
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
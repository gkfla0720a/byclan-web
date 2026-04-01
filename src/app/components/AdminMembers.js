'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabase';

export default function AdminMembers() {
  const [members, setMembers] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // 수정 상태 관리를 위한 state
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ nickname: '', role: '' });
  const [isSaving, setIsSaving] = useState(false);

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
        
        // 지난 대화에서 배운 안전한 비교 방식 (공백 제거 및 소문자화)
        if (profile?.role?.trim().toLowerCase() === 'admin') {
          setIsAdmin(true);
          await fetchMembers(); // 관리자일 때만 멤버 목록 로드
        }
      }
    } catch (err) {
      console.error("권한 확인 에러:", err);
    } finally {
      setLoading(false);
    }
  };

  // 모든 회원 목록 가져오기 함수
  const fetchMembers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, nickname, role, created_at')
      .order('created_at', { ascending: true }); // 가입일 순 정렬

    if (error) {
      console.error("목록 불러오기 에러:", error);
    } else {
      setMembers(data);
    }
  };

  // [수정] 버튼 클릭 시
  const handleEditClick = (member) => {
    setEditingId(member.id);
    setEditForm({ nickname: member.nickname, role: member.role || 'member' });
  };

  // 수정 내용 입력 핸들러
  const handleInputChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  // [저장] 버튼 클릭 시 (Supabase DB 업데이트)
  const handleSaveClick = async (id) => {
    try {
      setIsSaving(true);
      // RLS 정책(image_1) 덕분에 관리자만 이 업데이트가 가능합니다.
      const { error } = await supabase
        .from('profiles')
        .update({ 
          nickname: editForm.nickname, 
          role: editForm.role 
        })
        .eq('id', id);

      if (error) {
        throw error;
      }

      alert('회원 정보가 성공적으로 수정되었습니다.');
      setEditingId(null); // 수정 모드 종료
      await fetchMembers(); // 목록 새로고침
    } catch (error) {
      console.error('수정 실패:', error);
      alert('수정에 실패했습니다: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  // 로딩 중 UI
  if (loading) return (
    <div className="text-center py-24 text-gray-500 animate-pulse font-mono">
      [ SYSTEM: SECURE CONNECTION ESTABLISHING... ]
    </div>
  );
  
  // 관리자가 아닐 때 UI
  if (!isAdmin) return (
    <div className="text-center py-24 text-red-400 font-bold bg-gray-900 rounded-xl border border-red-900/50 m-4">
      ⚠️ 접근 권한이 없습니다. 운영진 전용 페이지입니다.
    </div>
  );

  // === 메인 관리자 UI ===
  return (
    <div className="w-full max-w-6xl mx-auto py-8 px-4 animate-fade-in-down font-sans">
      
      {/* 헤더 영역 */}
      <div className="flex items-center justify-between mb-8 border-b border-gray-700 pb-5">
        <div>
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-600 drop-shadow-md">
            ByClan 운영진 전용: 클랜원 관리
          </h2>
          <p className="text-gray-400 mt-1">클랜원의 역할(admin, member 등)을 부여하고 관리합니다.</p>
        </div>
        <div className="text-xs text-gray-600 font-mono bg-gray-800 px-3 py-1 rounded">
          SECURE_ADMIN_PANEL_v1.0
        </div>
      </div>

      {/* 회원 목록 테이블 */}
      <div className="bg-gray-800 rounded-2xl border border-gray-700 shadow-2xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          {/* 테이블 헤더 - 메인 페이지 느낌의 Sky-Blue 색상 활용 */}
          <thead className="bg-gray-900/70 text-sky-300 text-sm border-b border-gray-700">
            <tr>
              <th className="py-4 px-6 font-bold truncate">닉네임</th>
              <th className="py-4 px-6 font-bold">고유 ID (UUID)</th>
              <th className="py-4 px-6 font-bold">역할 (Role)</th>
              <th className="py-4 px-6 font-bold hidden sm:table-cell">가입일</th>
              <th className="py-4 px-6 font-bold text-center">관리</th>
            </tr>
          </thead>
          
          {/* 테이블 바디 */}
          <tbody className="text-gray-100 text-sm divide-y divide-gray-700/50">
            {members.map((member) => (
              <tr key={member.id} className="hover:bg-gray-700/30 transition-colors">
                
                {/* 닉네임 (수정 모드 분기) */}
                <td className="py-4 px-6 font-medium">
                  {editingId === member.id ? (
                    <input 
                      type="text" 
                      name="nickname"
                      value={editForm.nickname} 
                      onChange={handleInputChange}
                      className="w-full p-2 rounded bg-gray-900 border border-gray-600 focus:border-yellow-500 focus:outline-none text-white"
                    />
                  ) : (
                    member.nickname
                  )}
                </td>

                {/* ID - 너무 기니까 앞부분만 표시 */}
                <td className="py-4 px-6 font-mono text-gray-500 text-xs">
                  {member.id.substring(0, 8)}...
                </td>

                {/* 역할 (수정 모드 분기 및 배지 디자인) */}
                <td className="py-4 px-6">
                  {editingId === member.id ? (
                    <select 
                      name="role"
                      value={editForm.role} 
                      onChange={handleInputChange}
                      className="w-full p-2 rounded bg-gray-900 border border-gray-600 focus:border-yellow-500 focus:outline-none text-white"
                    >
                      <option value="admin">admin (운영진)</option>
                      <option value="member">member (정회원)</option>
                      <option value="guest">guest (손님)</option>
                    </select>
                  ) : (
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      member.role === 'admin' ? 'bg-yellow-900 text-yellow-300 border border-yellow-700' :
                      member.role === 'member' ? 'bg-sky-900 text-sky-300 border border-sky-700' :
                      'bg-gray-700 text-gray-300'
                    }`}>
                      {member.role || 'member'}
                    </span>
                  )}
                </td>

                {/* 가입일 */}
                <td className="py-4 px-6 text-gray-400 text-xs hidden sm:table-cell font-mono">
                  {new Date(member.created_at).toLocaleDateString()}
                </td>

                {/* 관리 버튼 (수정 모드 분기) */}
                <td className="py-4 px-6 text-center">
                  {editingId === member.id ? (
                    <div className="flex gap-2 justify-center">
                      <button 
                        onClick={() => handleSaveClick(member.id)} 
                        disabled={isSaving}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded transition-colors disabled:opacity-50"
                      >
                        {isSaving ? '저장중..' : '저장'}
                      </button>
                      <button 
                        onClick={() => setEditingId(null)} 
                        className="px-3 py-1.5 bg-gray-600 hover:bg-gray-500 text-white text-xs font-bold rounded transition-colors"
                      >
                        취소
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => handleEditClick(member.id)} 
                      className="px-3 py-1.5 border border-gray-600 text-gray-300 hover:border-yellow-500 hover:text-yellow-400 text-xs font-bold rounded transition-colors"
                    >
                      수정
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* 멤버가 없을 때 표시 */}
        {members.length === 0 && (
          <div className="text-center py-16 text-gray-500 font-mono">
            [ SYSTEM: NO MEMBERS FOUND IN DATABASE ]
          </div>
        )}
      </div>
    </div>
  );
}

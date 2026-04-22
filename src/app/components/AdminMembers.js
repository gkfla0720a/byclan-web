/**
 * @file AdminMembers.js
 * @역할 운영진 전용 기밀 게시판 컴포넌트 (단순 버전)
 * @주요기능
 *   - 운영진(developer/master/admin) 권한 여부를 확인한 후 게시글 목록을 표시
 *   - 새로운 기밀 문서 작성 및 저장
 *   - 작성자 역할 뱃지 표시 (색상 구분)
 * @사용방법 운영진 전용 탭에서 렌더링됩니다. 권한 없는 유저에게는 접근 차단 화면을 보여줍니다.
 * @관련컴포넌트 AdminBoard.js (더 완성된 최신 버전)
 */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import logger from '@/app/utils/errorLogger';
import { supabase } from '@/supabase';
import { isRelationshipError } from '../utils/retry';

/**
 * AdminBoard 컴포넌트
 * 운영진 전용 기밀 게시판을 렌더링합니다.
 * developer, master, admin 등급만 접근 가능합니다.
 */
export default function AdminBoard() {
  /** 게시글 목록을 저장하는 상태 */
  const [posts, setPosts] = useState([]);
  /** 현재 유저가 관리자 권한을 가졌는지 여부 */
  const [isAdmin, setIsAdmin] = useState(false);
  /** 데이터를 불러오는 중인지 여부 */
  const [loading, setLoading] = useState(true);
  /** 현재 로그인한 유저의 프로필 정보 */
  const [myProfile, setMyProfile] = useState(null);

  /** 새 글 작성 폼이 열려 있는지 여부 */
  const [isWriting, setIsWriting] = useState(false);
  /** 새 글 제목과 내용을 담는 상태 */
  const [newPost, setNewPost] = useState({ title: '', content: '' });
  /** 글 저장 요청이 진행 중인지 여부 (중복 클릭 방지) */
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * 현재 로그인 유저의 권한을 확인하고, 권한이 있으면 게시글을 불러옵니다.
   * @async
   */
  const checkAdminAndFetch = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, by_id, role') // nickname 대신 by_id 사용 (DB 구조에 맞춤)
          .eq('id', user.id)
          .single();
        
        setMyProfile(profile);
        /** 역할 문자열을 소문자로 정규화하여 비교 */
        const currentRole = profile?.role?.trim().toLowerCase();
        
        // ✨ 최고 개발자(developer) 권한 추가
        if (['developer', 'master', 'admin'].includes(currentRole)) {
          setIsAdmin(true);
          await fetchPosts(); 
        }
      }
    } catch (err) {
      logger.error('권한 확인 에러', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 컴포넌트가 처음 화면에 표시될 때 권한 확인 및 데이터 로드를 실행합니다.
   */
  useEffect(() => {
    checkAdminAndFetch();
  }, [checkAdminAndFetch]);

  /**
   * Supabase에서 기밀 게시글 목록을 불러옵니다.
   * 작성자 정보(by_id, role)를 JOIN하여 가져오며,
   * 관계 에러 발생 시 작성자 정보 없이 폴백 쿼리를 실행합니다.
   * @async
   */
  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('admin_posts')
      .select(`
        id, 
        title, 
        content, 
        created_at,
        profiles:author_id ( by_id, role ) 
      `)
      .order('created_at', { ascending: false }); 

    if (error) {
      logger.error('목록 불러오기 에러', error);
      if (isRelationshipError(error)) {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('admin_posts')
          .select('id, title, content, created_at')
          .order('created_at', { ascending: false });
        if (fallbackError) {
          logger.error('목록 폴백 쿼리 에러', fallbackError);
        } else {
          setPosts(fallbackData || []);
        }
      }
    } else {
      setPosts(data);
    }
  };

  /**
   * 새 기밀 문서를 폼 제출 시 Supabase에 저장합니다.
   * 제목 또는 내용이 비어있으면 저장하지 않습니다.
   * @async
   * @param {React.FormEvent} e - 폼 제출 이벤트
   */
  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPost.title.trim() || !newPost.content.trim()) return;

    try {
      setIsSubmitting(true);
      const { error } = await supabase
        .from('admin_posts')
        .insert({ 
          title: newPost.title, 
          content: newPost.content,
          author_id: myProfile.id
        });

      if (error) throw error;
      
      alert('기밀 문서가 정상적으로 기록되었습니다.');
      setNewPost({ title: '', content: '' }); 
      setIsWriting(false); 
      await fetchPosts(); 
    } catch (error) {
      alert('기록 실패: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  /** 역할별 CSS 뱃지 색상 클래스 매핑 */
  const roleStyles = {
    developer: "bg-cyan-500 text-black border border-cyan-300", // ✨ 개발자 스타일 추가
    master: "bg-yellow-500 text-black border border-yellow-300",
    admin: "bg-orange-600 text-white border border-orange-400",
    elite: "bg-purple-600 text-white border border-purple-400",
    member: "bg-blue-600 text-white border border-blue-400",
    rookie: "bg-emerald-600 text-white border border-emerald-400"
  };

  /** 역할 코드를 한국어 표시 이름으로 변환하는 매핑 테이블 */
  const roleLabels = { 
    developer: "개발자", master: "클랜 마스터", admin: "운영진", elite: "정예", 
    member: "일반", rookie: "신입"
  };

  if (loading) return (
    <div className="text-center py-24 text-gray-500 animate-pulse font-mono tracking-widest">
      [ ACCESSING SECURE SERVER... ]
    </div>
  );
  
  if (!isAdmin) return (
    <div className="w-full max-w-4xl mx-auto my-20 bg-gray-900 rounded-3xl p-16 text-center border-4 border-red-950/70 shadow-2xl">
      <div className="text-7xl mb-6">🚫</div>
      <h2 className="text-4xl font-black text-red-500 mb-6 uppercase tracking-tighter">Access Denied</h2>
      <p className="text-gray-400">인가되지 않은 유저의 접근입니다. 모든 시도는 기록됩니다.</p>
    </div>
  );

  return (
    <div className="w-full max-w-5xl mx-auto py-8 px-4 animate-fade-in font-sans mb-10">
      
      <div className="flex flex-col sm:flex-row items-center justify-between mb-10 border-b border-yellow-700/30 pb-8">
        <div>
          <h2 className="text-3xl font-black text-white">🔐 운영진 기밀 게시판</h2>
          <p className="text-gray-500 mt-2 text-sm">최고 보안 등급(LEVEL 5) 문서가 보관되는 구역입니다.</p>
        </div>
        {!isWriting && (
          <button 
            onClick={() => setIsWriting(true)} 
            className="mt-4 sm:mt-0 px-8 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-black rounded-full shadow-lg transition-transform hover:scale-105"
          >
            ✍️ 새 기밀 기록
          </button>
        )}
      </div>

      {isWriting && (
        <div className="bg-gray-800 rounded-2xl p-8 border border-yellow-600 shadow-2xl mb-10 animate-fade-in">
          <form onSubmit={handleCreatePost} className="space-y-4">
            <input 
              type="text" value={newPost.title} onChange={(e) => setNewPost({...newPost, title: e.target.value})} 
              placeholder="문서 제목" className="w-full p-4 rounded-xl bg-gray-900 border border-gray-700 text-white font-bold"
            />
            <textarea 
              value={newPost.content} onChange={(e) => setNewPost({...newPost, content: e.target.value})} 
              placeholder="내용을 입력하세요..." rows="8" 
              className="w-full p-4 rounded-xl bg-gray-900 border border-gray-700 text-white resize-none"
            />
            <div className="flex gap-2 justify-end">
              <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-emerald-600 text-white font-bold rounded-lg uppercase text-xs">Confirm</button>
              <button type="button" onClick={() => setIsWriting(false)} className="px-6 py-2 bg-gray-700 text-white font-bold rounded-lg uppercase text-xs">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-6">
        {posts.map((post) => (
          <div key={post.id} className="bg-gray-900/50 p-7 rounded-2xl border border-gray-800 hover:border-yellow-600/30 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <h4 className="text-xl font-bold text-gray-100 group-hover:text-yellow-500 transition-colors">{post.title}</h4>
              <span className="text-[10px] text-gray-600 font-mono italic">{new Date(post.created_at).toLocaleString()}</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-wrap mb-6">{post.content}</p>
            <div className="flex items-center gap-2 border-t border-gray-800 pt-4">
              <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${roleStyles[post.profiles?.role] || 'bg-gray-700'}`}>
                {roleLabels[post.profiles?.role] || "Unknown"}
              </span>
              <span className="text-xs text-gray-500 font-bold">Writer: {post.profiles?.by_id}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
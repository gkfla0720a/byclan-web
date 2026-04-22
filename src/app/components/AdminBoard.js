/**
 * @file AdminBoard.js
 * @역할 운영진 전용 기밀 게시판 컴포넌트 (완성 버전)
 * @주요기능
 *   - developer / master / admin 등급만 접근 가능한 보안 게시판
 *   - 기밀 문서(게시글) 목록 조회 및 신규 작성
 *   - 테스트 데이터 필터링 (filterVisibleTestData 적용)
 *   - 역할별 색상 뱃지 표시 (ROLE_PERMISSIONS 기반)
 *   - 길드원 관리 탭으로 이동하는 바로가기 버튼
 * @사용방법
 *   관리자 탭 메뉴에서 렌더링됩니다.
 *   권한 없는 유저는 "CLASSIFIED INFORMATION" 차단 화면을 봅니다.
 * @관련컴포넌트 AdminMembers.js (구버전), GuildManagement.js (길드원 관리 탭)
 */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import logger from '@/app/utils/errorLogger';
import { supabase } from '@/supabase';
import { filterVisibleTestData } from '@/app/utils/testData';
import { ROLE_PERMISSIONS } from '../utils/permissions';
import { useNavigate } from '../hooks/useNavigate';
import { isRelationshipError } from '../utils/retry';

/**
 * AdminBoard 컴포넌트
 * 운영진 전용 기밀 게시판을 렌더링합니다.
 * developer, master, admin 등급만 접근 가능합니다.
 */
export default function AdminBoard() {
  /** 페이지 전환(탭 이동)을 위한 내비게이션 함수 */
  const navigateTo = useNavigate();
  logger.info('AdminBoard 컴포넌트 렌더링됨.');

  /** 기밀 게시글 목록을 저장하는 상태 */
  const [posts, setPosts] = useState([]);
  /** 현재 유저가 관리자(운영진) 권한을 가졌는지 여부 */
  const [isAdmin, setIsAdmin] = useState(false);
  /** 데이터를 불러오는 중인지 여부 (로딩 스피너 표시에 사용) */
  const [loading, setLoading] = useState(true);
  /** 현재 로그인한 유저의 프로필 정보 (id, by_id, role 등) */
  const [myProfile, setMyProfile] = useState(null);

  // 글쓰기 상태 관리
  /** 새 글 작성 폼이 화면에 표시되는지 여부 */
  const [isWriting, setIsWriting] = useState(false);
  /** 새 글의 제목(title)과 내용(content)을 담는 상태 */
  const [newPost, setNewPost] = useState({ title: '', content: '' });
  /** 글 저장 API 요청이 진행 중인지 여부 (버튼 중복 클릭 방지) */
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * 현재 로그인 유저의 권한을 확인하고, 운영진이면 게시글 목록을 불러옵니다.
   * @async
   */
  const checkAdminAndFetch = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, by_id, role')
          .eq('id', user.id)
          .single();

        setMyProfile(profile);
        /** 역할 문자열을 소문자로 정규화하여 정확히 비교 */
        const currentRole = profile?.role?.trim().toLowerCase();

        logger.info('AdminBoard 권한 체크', { userId: user.id, currentRole });

        // 중요: 개발자, 마스터, 운영진 등급만 이 게시판 접근 허용
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
   * 컴포넌트가 처음 화면에 마운트될 때 권한 확인 및 게시글 데이터를 로드합니다.
   */
  useEffect(() => {
    checkAdminAndFetch();
  }, [checkAdminAndFetch]);

  /**
   * Supabase에서 기밀 게시글 목록을 불러옵니다.
   * 테스트 데이터는 필터링되며, 관계 에러 발생 시 폴백 쿼리를 실행합니다.
   * @async
   */
  const fetchPosts = async () => {
    const { data, error } = await filterVisibleTestData(supabase
      .from('admin_posts')
      .select(`
        id, 
        title, 
        content, 
        created_at,
        profiles:author_id ( by_id, role ) 
      `)
      .order('created_at', { ascending: false })); 

    if (error) {
      logger.error('목록 불러오기 에러', error);
      if (isRelationshipError(error)) {
        const { data: fallbackData, error: fallbackError } = await filterVisibleTestData(supabase
          .from('admin_posts')
          .select('id, title, content, created_at')
          .order('created_at', { ascending: false }));
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
   * 글쓰기 폼의 입력값을 newPost 상태에 반영합니다.
   * name 속성을 이용해 title/content 두 필드를 하나의 핸들러로 처리합니다.
   * @param {React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>} e - 입력 변경 이벤트
   */
  const handleInputChange = (e) => {
    setNewPost({ ...newPost, [e.target.name]: e.target.value });
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
          author_id: myProfile.id,
          is_test_data: Boolean(myProfile?.is_test_account),
          is_test_data_active: Boolean(myProfile?.is_test_account),
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

  /**
   * ROLE_PERMISSIONS에 없는 역할(guest, expelled)에 대한 폴백 메타데이터
   * color: CSS 색상 코드, name: 한국어 역할 이름
   */
  const fallbackRoleMeta = {
    guest: { name: '방문자', color: '#9CA3AF' },
    expelled: { name: '제명', color: '#F87171' },
  };

  /**
   * 역할 문자열을 받아 해당 역할의 메타데이터(이름, 색상)를 반환합니다.
   * ROLE_PERMISSIONS에 없는 역할(guest, expelled 등)은 fallbackRoleMeta를 사용합니다.
   * @param {string} role - 역할 문자열 (예: 'admin', 'master')
   * @returns {{ name: string, color: string }} 역할 표시 이름과 색상
   */
  const getRoleMeta = (role) => ROLE_PERMISSIONS[role] || fallbackRoleMeta[role] || { name: role || '알 수 없음', color: '#9CA3AF' };

  if (loading) return (
    <div className="text-center py-24 text-gray-500 animate-pulse font-mono">
      [ SYSTEM: SECURE CONNECTION ESTABLISHING... ]
    </div>
  );
  
  if (!isAdmin) return (
    <div className="w-full max-w-4xl mx-auto my-20 bg-gray-900 rounded-3xl p-16 text-center border-4 border-red-950/70 shadow-[0_0_60px_rgba(185,28,28,0.2)] animate-pulse">
      <div className="text-7xl mb-6">⚠️</div>
      <h2 className="text-4xl font-black text-red-400 mb-6 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]">
        CLASSIFIED INFORMATION <br/> (접근 불가)
      </h2>
      <p className="text-red-100/70 text-lg leading-relaxed max-w-xl mx-auto">
        이곳은 클랜 마스터 및 운영진 전용 기밀 구역입니다. 인가되지 않은 요원의 접근은 기록되며 즉시 차단됩니다.
      </p>
    </div>
  );

  return (
    <div className="w-full max-w-5xl mx-auto py-8 px-4 animate-fade-in-down font-sans mb-10">
      
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-10 border-b-2 border-yellow-700/50 pb-6 shadow-[0_4px_10px_-4px_rgba(234,179,8,0.2)]">
        <div>
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-100 to-yellow-600 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            🔐 ByClan 운영진 전용 기밀 게시판
          </h2>
          <p className="text-gray-400 mt-2 text-sm sm:text-base leading-relaxed break-keep">이곳의 내용은 외부 유출을 엄금합니다. 클랜 마스터 및 운영진만 열람 및 작성이 가능합니다.</p>
        </div>
        <div className="flex flex-wrap gap-3 justify-center sm:justify-end">
          {navigateTo && (
            <button
              onClick={() => navigateTo('길드원 관리')}
              className="flex items-center gap-2 px-6 py-3 bg-cyan-500/10 border border-cyan-400/30 text-cyan-200 text-base font-bold rounded-full shadow-[0_0_15px_rgba(34,211,238,0.12)] transition-transform hover:scale-105"
            >
              <span>👥</span> 길드원 관리
            </button>
          )}
          {!isWriting && (
            <button 
              onClick={() => setIsWriting(true)} 
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-gray-950 text-base font-bold rounded-full shadow-[0_0_15px_rgba(234,179,8,0.4)] transition-transform hover:scale-105"
            >
              <span>✍️</span> 기밀 기록하기
            </button>
          )}
        </div>
      </div>

      {isWriting && (
        <div className="bg-gray-800 rounded-2xl p-8 border-2 border-yellow-700 shadow-2xl mb-10 animate-fade-in-down">
          <h3 className="text-xl font-bold text-yellow-300 mb-6 flex items-center gap-2"><span>#</span> 새로운 기밀 문서 작성</h3>
          <form onSubmit={handleCreatePost} className="space-y-5">
            <input 
              type="text" name="title" value={newPost.title} onChange={handleInputChange} 
              placeholder="문서 제목을 입력하세요" required 
              className="w-full p-4 rounded-xl bg-gray-900 border border-gray-700 focus:border-yellow-500 focus:outline-none text-white font-semibold text-lg"
            />
            <textarea 
              name="content" value={newPost.content} onChange={handleInputChange} 
              placeholder="내용을 기록하세요 (클랜 규칙 위반자, 매너 체크, 운영 회의 안건 등)" required rows="10" 
              className="w-full p-4 rounded-xl bg-gray-900 border border-gray-700 focus:border-yellow-500 focus:outline-none text-white text-base leading-relaxed"
            />
            <div className="flex gap-3 justify-end pt-3">
              <button 
                type="submit" disabled={isSubmitting}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-base font-bold rounded-xl disabled:opacity-50"
              >
                {isSubmitting ? '저장중..' : '문서 기록 완료'}
              </button>
              <button 
                type="button" onClick={() => setIsWriting(false)} 
                className="px-6 py-2.5 bg-gray-600 hover:bg-gray-500 text-white text-base font-bold rounded-xl"
              >
                취소
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-6">
        {posts.map((post) => (
          <div key={post.id} className="bg-gray-800 p-7 rounded-2xl border border-gray-700/70 shadow-xl relative group hover:border-gray-600/50 transition-colors">
            
            <div className="absolute top-5 right-6 text-gray-500 text-xs font-mono">
              {new Date(post.created_at).toLocaleString()}
            </div>

            {/* ✅ 치명적 오류 수정 완료: </div> 를 </h4> 로 변경 */}
            <h4 className="text-xl sm:text-2xl font-bold text-gray-100 mb-5 group-hover:text-yellow-400 transition-colors">
              {post.title}
            </h4>

            <p className="text-gray-300 text-base leading-relaxed whitespace-pre-wrap mb-6 break-words">
              {post.content}
            </p>

            <div className="flex items-center gap-3 pt-5 border-t border-gray-700/50 mt-auto bg-gray-900/40 p-3 rounded-lg">
              <span
                className="px-3 py-1 rounded-md text-[10px] font-black tracking-tight"
                style={{
                  backgroundColor: `${getRoleMeta(post.profiles?.role).color}22`,
                  color: getRoleMeta(post.profiles?.role).color,
                  border: `1px solid ${getRoleMeta(post.profiles?.role).color}55`,
                }}
              >
                {getRoleMeta(post.profiles?.role).name}
              </span>
              <span className="font-semibold text-gray-200 text-sm">
                작성자: {post.profiles?.by_id || '[by_id 없음]'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {posts.length === 0 && !isWriting && (
        <div className="text-center py-24 text-gray-500 font-mono bg-gray-950/50 rounded-2xl border-2 border-dashed border-gray-700 m-4 shadow-[inset_0_0_30px_rgba(0,0,0,0.5)]">
          [ SYSTEM: NO CLASSIFIED POSTS FOUND ]
        </div>
      )}
    </div>
  );
}
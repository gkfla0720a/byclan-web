'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabase';
import { filterVisibleTestData } from '@/app/utils/testData';

export default function AdminBoard() {
  console.log('📍 AdminBoard 컴포넌트 렌더링됨!');

  const [posts, setPosts] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [myProfile, setMyProfile] = useState(null);

  // 글쓰기 상태 관리
  const [isWriting, setIsWriting] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

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
          .select('id, ByID, discord_name, role')
          .eq('id', user.id)
          .single();

        setMyProfile(profile);
        const currentRole = profile?.role?.trim().toLowerCase();

        // 디버그 로그
        console.log('🔐 AdminBoard 권한 체크:', {
          userId: user.id,
          profile,
          rawRole: profile?.role,
          currentRole,
          isAdmin: ['developer', 'master', 'admin'].includes(currentRole)
        });

        // 중요: 개발자, 마스터, 운영진 등급만 이 게시판 접근 허용
        if (['developer', 'master', 'admin'].includes(currentRole)) {
          setIsAdmin(true);
          await fetchPosts();
        }
      }
    } catch (err) {
      console.error("권한 확인 에러:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    const { data, error } = await filterVisibleTestData(supabase
      .from('admin_posts')
      .select(`
        id, 
        title, 
        content, 
        created_at,
        profiles:author_id ( ByID, discord_name, role ) 
      `)
      .order('created_at', { ascending: false })); 

    if (error) {
      console.error("목록 불러오기 에러:", error);
    } else {
      setPosts(data);
    }
  };

  const handleInputChange = (e) => {
    setNewPost({ ...newPost, [e.target.name]: e.target.value });
  };

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

  // ✅ 누락되었던 전체 직급별 색상과 라벨을 모두 추가했습니다.
  const roleStyles = {
    master: "bg-yellow-500 text-black border border-yellow-300",
    admin: "bg-orange-600 text-white border border-orange-400",
    elite: "bg-purple-600 text-white border border-purple-400",
    member: "bg-blue-600 text-white border border-blue-400",
    rookie: "bg-emerald-600 text-white border border-emerald-400",
    associate: "bg-teal-800 text-teal-300 border border-teal-600",
    guest: "bg-gray-700 text-gray-300 border border-gray-500",
    expelled: "bg-red-900 text-red-300 border border-red-700 line-through"
  };

  const roleLabels = { 
    master: "클랜 마스터", admin: "운영진", elite: "정예", 
    member: "일반 클랜원", rookie: "신입", associate: "테스트신청자", guest: "방문자", expelled: "제명" 
  };

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
      
      <div className="flex items-center justify-between mb-10 border-b-2 border-yellow-700/50 pb-6 shadow-[0_4px_10px_-4px_rgba(234,179,8,0.2)]">
        <div>
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-100 to-yellow-600 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            🔐 ByClan 운영진 전용 기밀 게시판
          </h2>
          <p className="text-gray-400 mt-2 text-sm sm:text-base leading-relaxed break-keep">이곳의 내용은 외부 유출을 엄금합니다. 클랜 마스터 및 운영진만 열람 및 작성이 가능합니다.</p>
        </div>
        {!isWriting && (
          <button 
            onClick={() => setIsWriting(true)} 
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-gray-950 text-base font-bold rounded-full shadow-[0_0_15px_rgba(234,179,8,0.4)] transition-transform hover:scale-105"
          >
            <span>✍️</span> 기밀 기록하기
          </button>
        )}
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
              {/* ✅ roleStyles.guest가 정상적으로 적용되도록 수정 완료 */}
              <span className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-tighter ${roleStyles[post.profiles?.role] || roleStyles.guest}`}>
                {roleLabels[post.profiles?.role] || "알 수 없음"}
              </span>
              <span className="font-semibold text-gray-200 text-sm">
                작성자: {post.profiles?.ByID || post.profiles?.discord_name || "알 수 없는 요원"}
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
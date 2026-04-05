'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabase';
import { isRelationshipError } from '../utils/retry';

export default function AdminBoard() {
  const [posts, setPosts] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [myProfile, setMyProfile] = useState(null);

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
          .select('id, ByID, role') // nickname 대신 ByID 사용 (DB 구조에 맞춤)
          .eq('id', user.id)
          .single();
        
        setMyProfile(profile);
        const currentRole = profile?.role?.trim().toLowerCase();
        
        // ✨ 최고 개발자(developer) 권한 추가
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
    const { data, error } = await supabase
      .from('admin_posts')
      .select(`
        id, 
        title, 
        content, 
        created_at,
        profiles:author_id ( ByID, role ) 
      `)
      .order('created_at', { ascending: false }); 

    if (error) {
      console.error("목록 불러오기 에러:", error);
      if (isRelationshipError(error)) {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('admin_posts')
          .select('id, title, content, created_at')
          .order('created_at', { ascending: false });
        if (fallbackError) {
          console.error("목록 폴백 쿼리 에러:", fallbackError);
        } else {
          setPosts(fallbackData || []);
        }
      }
    } else {
      setPosts(data);
    }
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

  const roleStyles = {
    developer: "bg-cyan-500 text-black border border-cyan-300", // ✨ 개발자 스타일 추가
    master: "bg-yellow-500 text-black border border-yellow-300",
    admin: "bg-orange-600 text-white border border-orange-400",
    elite: "bg-purple-600 text-white border border-purple-400",
    member: "bg-blue-600 text-white border border-blue-400",
    rookie: "bg-emerald-600 text-white border border-emerald-400"
  };

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
              <span className="text-xs text-gray-500 font-bold">Writer: {post.profiles?.ByID}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
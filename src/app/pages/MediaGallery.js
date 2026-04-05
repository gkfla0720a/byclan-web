'use client';

import React, { useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from '@/supabase';
import { filterVisibleTestData } from '@/app/utils/testData';

const MEDIA_BACKGROUNDS = {
  공지: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=600&auto=format&fit=crop',
  게시글: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?q=80&w=600&auto=format&fit=crop',
  매치: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=600&auto=format&fit=crop',
};

function formatDate(dateString) {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function MediaGallery() {
  const [mediaItems, setMediaItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMediaItems = async () => {
      if (!isSupabaseConfigured) {
        setMediaItems([]);
        setLoading(false);
        return;
      }

      try {
        const [noticeResult, postResult, matchResult] = await Promise.all([
          filterVisibleTestData(
            supabase
              .from('admin_posts')
              .select('id, title, created_at')
              .order('created_at', { ascending: false })
              .limit(2)
          ),
          filterVisibleTestData(
            supabase
              .from('posts')
              .select('id, title, author_name, created_at')
              .order('created_at', { ascending: false })
              .limit(2)
          ),
          filterVisibleTestData(
            supabase
              .from('ladder_matches')
              .select('id, match_type, status, created_at, map_name')
              .order('created_at', { ascending: false })
              .limit(2)
          ),
        ]);

        const items = [
          ...(noticeResult.data || []).map((item) => ({
            id: `notice-${item.id}`,
            type: '공지',
            title: item.title,
            subtitle: '운영진님이 등록한 공지',
            date: item.created_at,
            img: MEDIA_BACKGROUNDS.공지,
          })),
          ...(postResult.data || []).map((item) => ({
            id: `post-${item.id}`,
            type: '게시글',
            title: item.title,
            subtitle: `${item.author_name || '클랜원'}님이 남긴 글`,
            date: item.created_at,
            img: MEDIA_BACKGROUNDS.게시글,
          })),
          ...(matchResult.data || []).map((item) => ({
            id: `match-${item.id}`,
            type: '매치',
            title: `${item.match_type || '래더'} ${item.status || '기록'}`,
            subtitle: item.map_name ? `${item.map_name} 기준 기록` : '맵 정보 등록 대기',
            date: item.created_at,
            img: MEDIA_BACKGROUNDS.매치,
          })),
        ]
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 6);

        setMediaItems(items);
      } catch (error) {
        console.error('미디어 갤러리 로딩 실패:', error);
        setMediaItems([]);
      } finally {
        setLoading(false);
      }
    };

    loadMediaItems();
  }, []);

  return (
    <div className="w-full max-w-6xl mx-auto animate-fade-in-down mt-4 sm:mt-8">
      <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 border-b border-gray-700 pb-4">🎬 미디어 갤러리</h2>
      <p className="text-sm text-gray-400 mb-6">클랜 내부에 실제로 쌓인 공지, 게시글, 경기 기록을 아카이브 카드 형식으로 모아 보여줍니다.</p>
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 shadow-xl animate-pulse">
              <div className="w-full aspect-video bg-gray-700" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-700 rounded" />
                <div className="h-3 bg-gray-800 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : mediaItems.length === 0 ? (
        <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-xl p-8 text-center text-gray-400">
          아직 축적된 아카이브가 없습니다. 공지, 게시글, 경기 기록이 쌓이면 이곳에 자동으로 정리됩니다.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {mediaItems.map((item) => (
            <div key={item.id} className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 shadow-xl">
              <img src={item.img} className="w-full aspect-video object-cover opacity-70" alt={item.title} />
              <div className="p-4">
                <div className="text-[11px] text-cyan-400 font-bold mb-1">{item.type}</div>
                <h3 className="text-white font-bold line-clamp-2 min-h-[3rem]">{item.title}</h3>
                <p className="text-gray-400 text-xs mt-2 line-clamp-2">{item.subtitle}</p>
                <p className="text-gray-500 text-xs mt-3">{formatDate(item.date)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MediaGallery;

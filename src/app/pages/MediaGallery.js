/**
 * 파일명: MediaGallery.js
 *
 * 역할:
 *   클랜 내부에 쌓인 공지·게시글·경기 기록을 이미지 카드 형태로 모아 보여주는
 *   미디어 갤러리 페이지 컴포넌트입니다.
 *
 * 주요 기능:
 *   - admin_posts, posts, ladder_matches 테이블에서 각 2건씩 최신 데이터를 불러옵니다.
 *   - 세 테이블 데이터를 합쳐 날짜순 정렬 후 최대 6개 카드를 그리드로 표시합니다.
 *   - 각 카드 배경 이미지는 콘텐츠 유형(공지·게시글·매치)에 따라 다른 Unsplash 이미지를 사용합니다.
 *   - 로딩 중에는 animate-pulse 스켈레톤 카드를 표시합니다.
 *
 * 사용 방법:
 *   import MediaGallery from './MediaGallery';
 *   <MediaGallery />
 */
'use client';

import React, { useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from '@/supabase';
import { filterVisibleTestData } from '@/app/utils/testData';

/**
 * 파일명: MediaGallery.js (계속)
 * 콘텐츠 유형별 배경 이미지 URL 매핑
 */
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

/**
 * MediaGallery 컴포넌트
 * @returns {JSX.Element} 미디어 갤러리 그리드 UI
 */
function MediaGallery() {
  /** DB에서 조합한 미디어 아이템 배열 (최대 6개) */
  const [mediaItems, setMediaItems] = useState([]);
  /** 데이터 로딩 여부 */
  const [loading, setLoading] = useState(true);

  /** 컴포넌트 마운트 시 세 테이블을 병렬 조회하여 미디어 목록을 구성합니다 */
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
              .select('id, title, created_at, profiles!user_id(by_id)')
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
            subtitle: `${item.profiles?.by_id || '클랜원'}님이 남긴 글`,
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

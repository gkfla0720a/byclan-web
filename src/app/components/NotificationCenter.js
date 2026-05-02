/**
 * @file NotificationCenter.js
 *
 * @역할
 *   로그인한 사용자의 알림 목록을 보여주는 알림함(받은 알림 페이지) 컴포넌트입니다.
 *   Supabase의 notifications 테이블에서 현재 사용자의 알림을 불러와 표시합니다.
 *
 * @주요기능
 *   - 컴포넌트 마운트 시 Supabase에서 현재 유저의 알림을 최신순으로 조회
 *   - 페이지 접속 즉시 모든 알림을 읽음(is_read: true) 처리
 *   - 가입 신청자(applicant) 역할인 경우 심사 안내 배너를 상단에 추가로 표시
 *   - 읽지 않은 알림은 노란 테두리·밝은 제목으로 강조, 읽은 알림은 회색으로 표시
 *   - 알림이 없을 때는 빈 상태 안내 메시지 표시
 *
 * @관련컴포넌트
 *   - supabase (@/supabase): 알림 데이터 조회 및 읽음 처리
 *   - useNavigate (../hooks/useNavigate): 가입 안내·홈 페이지 이동
 *
 * @사용방법
 *   <NotificationCenter profile={profile} />
 *   - profile: 현재 로그인 유저의 프로필 객체 ({ role, ... })
 *              가입 신청자(applicant)이면 심사 안내 배너가 표시됩니다.
 */
'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabase';
import { useNavigate } from '../hooks/useNavigate';

/**
 * NotificationCenter 컴포넌트
 *
 * 로그인한 사용자의 알림 목록(알림함)을 표시하는 컴포넌트입니다.
 *
 * @param {{ profile: object|null }} props
 * @param {object|null} props.profile - 현재 로그인 유저의 프로필 (role 필드 사용)
 * @returns {JSX.Element} 알림함 UI
 */
export default function NotificationCenter({ profile }) {
  /** 페이지 이동 함수 */
  const navigateTo = useNavigate();
  /** 불러온 알림 목록 배열. 초기값은 빈 배열. */
  const [notifications, setNotifications] = useState([]);
  /** 알림 데이터 로딩 중 여부. true이면 로딩 메시지를 표시. */
  const [loading, setLoading] = useState(true);

  /** 현재 사용자가 가입 신청자(applicant) 역할인지 여부. true이면 심사 안내 배너를 표시. */
  const isApplicant = profile?.role === 'applicant';

  /**
   * 컴포넌트가 처음 화면에 나타날 때(마운트 시) 한 번 실행됩니다.
   * 1. 현재 로그인한 유저의 ID를 가져옵니다.
   * 2. notifications 테이블에서 해당 유저의 알림을 최신순으로 불러옵니다.
   * 3. 페이지 접속 즉시 모든 알림을 읽음(is_read: true) 처리합니다.
   */
  useEffect(() => {
    const loadNotifications = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        setNotifications(data || []);

        // 페이지 접속 시 모든 알림 읽음 처리
        await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id);
      }
      setLoading(false);
    };

    void loadNotifications();
  }, []);

  if (loading) return <div className="text-center py-20 text-gray-500">LOADING NOTIFICATIONS...</div>;

  return (
    <div className="w-full py-12 px-4 animate-fade-in-down">
      <h2 className="text-3xl font-black text-white mb-8 border-b border-gray-700 pb-4 flex items-center gap-3">
        <span>🔔</span> 알림함
      </h2>

      {isApplicant && (
        <div className="mb-6 rounded-2xl border border-yellow-700/40 bg-yellow-900/20 p-5">
          <h3 className="text-lg font-bold text-yellow-300 mb-2">가입 신청 진행 상태 안내</h3>
          <p className="text-sm text-gray-300 leading-relaxed mb-4">
            운영진이 남긴 심사 결과, 테스트 일정, 합격 또는 불합격 안내는 이 알림함으로 가장 먼저 도착합니다.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigateTo?.('가입안내')}
              className="px-5 py-2.5 rounded-lg font-bold text-sm bg-yellow-500 text-gray-900 hover:bg-yellow-400 transition-colors"
            >
              가입 안내 다시 보기
            </button>
            <button
              onClick={() => navigateTo?.('Home')}
              className="px-5 py-2.5 rounded-lg font-bold text-sm bg-gray-700 text-white hover:bg-gray-600 transition-colors"
            >
              홈으로 이동
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {notifications.map(noti => (
          <div key={noti.id} className={`p-6 rounded-2xl border ${noti.is_read ? 'bg-gray-800/40 border-gray-700/50' : 'bg-gray-800 border-yellow-700/50 shadow-lg'}`}>
            <div className="flex justify-between items-start mb-2">
              <h4 className={`font-bold ${noti.is_read ? 'text-gray-400' : 'text-yellow-400'}`}>{noti.title}</h4>
              <span className="text-xs text-gray-500 font-mono">{new Date(noti.created_at).toLocaleDateString()}</span>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">{noti.message}</p>
          </div>
        ))}
        {notifications.length === 0 && (
          <div className="text-center py-20 bg-gray-900/50 rounded-2xl border-2 border-dashed border-gray-800 text-gray-500">
            도착한 알림이 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}

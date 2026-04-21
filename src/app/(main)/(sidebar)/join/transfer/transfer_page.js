/**
 * 파일명: (main)/(sidebar)/join/transfer/page.js
 * 역할: 정회원 전환 신청 페이지
 * URL 경로: /join/transfer
 * 주요 기능:
 *   - 신입 길드원(rookie)이 정회원(member) 전환을 신청하는 페이지
 *   - rookie_since 기준 7일 미만이면 신청 불가 (남은 일수 표시)
 *   - 이미 신청서가 존재하면 중복 신청 방지
 *   - 신청 시 admin 이상 전원에게 알림 발송
 * 접근 권한: 신입 길드원(rookie)만 해당
 */
'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabase';

/** 정회원 신청 가능 최소 수습 기간(일) */
const MIN_ROOKIE_DAYS = 7;

/**
 * JoinTransferPage
 * 정회원 전환 신청 UI를 렌더링합니다.
 */
export default function JoinTransferPage() {
  /** 현재 로그인 유저 프로필 */
  const [profile, setProfile] = useState(null);
  /** 데이터 로딩 여부 */
  const [loading, setLoading] = useState(true);
  /** 이미 신청서가 접수됐는지 여부 */
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  /** 신청 처리 중 여부 (중복 클릭 방지) */
  const [submitting, setSubmitting] = useState(false);
  /** 처리 결과 메시지 */
  const [resultMsg, setResultMsg] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: p } = await supabase
          .from('profiles')
          .select('id, by_id, role, rookie_since')
          .eq('id', user.id)
          .single();

        setProfile(p);

        if (p?.id) {
          // applications 테이블에서 전환 신청 여부 확인
          // notifications에 의존하던 방식을 제거하고 applications를 단일 출처로 사용합니다.
          const { data: existing } = await supabase
            .from('applications')
            .select('id')
            .eq('user_id', p.id)
            .eq('status', 'pending')
            .ilike('btag', 'TRANSFER_%')   // 전환 신청 전용 마커 prefix
            .limit(1);
          setAlreadyApplied(Boolean(existing?.length));
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-24 text-gray-400 animate-pulse font-mono">
        [ 로딩 중... ]
      </div>
    );
  }

  if (!profile || profile.role !== 'rookie') {
    const role = profile?.role;
    const isMemberOrHigher = ['member', 'elite', 'admin', 'master', 'developer'].includes(role);

    return (
      <div className="max-w-lg mx-auto mt-16 bg-gray-900 border border-slate-600/40 rounded-2xl p-10 text-center shadow-xl">
        <div className="text-5xl mb-4">🧭</div>
        <h2 className="text-2xl font-black text-slate-100 mb-3">이 페이지는 신입 전환 전용입니다</h2>
        <p className="text-gray-300 leading-relaxed">
          {isMemberOrHigher
            ? '이미 정회원 이상으로 활동 중입니다. 전환 신청은 더 이상 필요하지 않습니다.'
            : '정회원 전환 신청은 신입 길드원(rookie) 단계에서만 진행됩니다.'}
        </p>

        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => window.location.assign('/')}
            className="px-5 py-2.5 rounded-lg font-bold text-sm bg-slate-700 text-white hover:bg-slate-600 transition-colors"
          >
            홈으로 이동
          </button>
          <button
            onClick={() => window.location.assign('/join')}
            className="px-5 py-2.5 rounded-lg font-bold text-sm bg-slate-800 text-slate-200 border border-slate-600 hover:bg-slate-700 transition-colors"
          >
            가입 안내 보기
          </button>
        </div>
      </div>
    );
  }

  // 수습 기간 계산
  const rookieSince = profile.rookie_since ? new Date(profile.rookie_since) : null;
  const daysAsSinceRookie = rookieSince
    ? Math.floor((Date.now() - rookieSince.getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const daysRemaining = daysAsSinceRookie !== null ? Math.max(0, MIN_ROOKIE_DAYS - daysAsSinceRookie) : null;
  const canApply = daysAsSinceRookie !== null && daysAsSinceRookie >= MIN_ROOKIE_DAYS;

  const handleApply = async () => {
    if (!canApply || alreadyApplied || submitting) return;

    setSubmitting(true);
    try {
      // 1) applications 테이블에 전환 신청 레코드 저장 (중복 방지의 단일 출처)
      //    btag 필드에 'TRANSFER_{userId}' 마커를 사용해 일반 가입 신청과 구분합니다.
      const { error: appError } = await supabase.from('applications').insert({
        user_id: profile.id,
        btag: `TRANSFER_${profile.id}`,
        status: 'pending',
        intro: `정회원 전환 신청 — 수습 시작일: ${rookieSince?.toLocaleDateString('ko-KR')}`,
      });
      if (appError) throw appError;

      // 2) 운영진 전원에게 알림 발송
      const { data: admins } = await supabase
        .from('profiles')
        .select('id')
        .in('role', ['admin', 'master', 'developer']);

      const notifMessage = `신입 길드원 ${profile.by_id}님이 정회원 전환을 신청했습니다.\n수습 시작일: ${rookieSince?.toLocaleDateString('ko-KR')}\n\n승인 또는 거부를 위해 길드원 관리 페이지에서 등급을 변경해 주세요.`;

      const adminNotifs = (admins || []).map((admin) => ({
        user_id: admin.id,
        title: '📋 정회원 전환 신청',
        message: notifMessage,
      }));

      // 3) 신청자 본인에게도 접수 확인 알림
      adminNotifs.push({
        user_id: profile.id,
        title: '📋 정회원 전환 신청 접수',
        message: '정회원 전환 신청이 운영진에게 전달되었습니다. 검토 후 결과를 알림으로 안내드립니다.',
      });

      await supabase.from('notifications').insert(adminNotifs);

      setAlreadyApplied(true);
      setResultMsg('✅ 신청이 완료되었습니다. 운영진 검토 후 결과를 알림으로 안내해드립니다.');
    } catch (err) {
      setResultMsg(`❌ 신청 실패: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-12 mb-20 px-4">
      <div className="bg-gray-900 border border-purple-500/30 rounded-2xl p-8 shadow-2xl">
        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 mb-2">
          정회원 전환 신청
        </h1>
        <p className="text-gray-400 mb-6 text-sm leading-relaxed">
          수습 기간(최소 {MIN_ROOKIE_DAYS}일) 이후 정회원 전환을 신청할 수 있습니다.
          운영진이 검토 후 승인 여부를 결정합니다.
        </p>

        {/* 수습 기간 현황 */}
        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700 mb-6 space-y-2">
          <p className="text-sm text-gray-400">
            수습 시작일:{' '}
            <span className="text-white font-semibold">
              {rookieSince ? rookieSince.toLocaleDateString('ko-KR') : '정보 없음'}
            </span>
          </p>
          {daysAsSinceRookie !== null ? (
            <p className="text-sm text-gray-400">
              경과 일수:{' '}
              <span className={`font-bold ${canApply ? 'text-emerald-400' : 'text-yellow-400'}`}>
                {daysAsSinceRookie}일
              </span>
              {' / '}
              <span className="text-gray-300">최소 {MIN_ROOKIE_DAYS}일</span>
            </p>
          ) : (
            <p className="text-sm text-yellow-400">수습 시작일이 기록되지 않았습니다. 운영진에게 문의해 주세요.</p>
          )}
          {!canApply && daysRemaining !== null && daysRemaining > 0 && (
            <p className="text-sm text-orange-400 font-semibold">
              ⏳ 신청 가능까지 {daysRemaining}일 남았습니다.
            </p>
          )}
          {canApply && !alreadyApplied && (
            <p className="text-sm text-emerald-400 font-semibold">✅ 정회원 전환 신청이 가능합니다.</p>
          )}
        </div>

        {/* 결과 메시지 */}
        {resultMsg && (
          <div className={`mb-5 p-4 rounded-xl text-sm font-semibold ${resultMsg.startsWith('✅') ? 'bg-emerald-900/40 border border-emerald-500/40 text-emerald-300' : 'bg-red-900/40 border border-red-500/40 text-red-300'}`}>
            {resultMsg}
          </div>
        )}

        {/* 신청 버튼 */}
        {alreadyApplied ? (
          <div className="py-4 text-center text-yellow-400 font-bold text-sm">
            📨 이미 신청서가 접수되었습니다. 운영진의 검토를 기다려 주세요.
          </div>
        ) : (
          <button
            onClick={handleApply}
            disabled={!canApply || submitting || daysAsSinceRookie === null}
            className="w-full py-3 rounded-xl font-black text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-lg"
          >
            {submitting ? '신청 중...' : '정회원 전환 신청하기'}
          </button>
        )}

        <p className="text-xs text-gray-600 mt-4 text-center">
          master는 수습 기간에 관계없이 길드원 관리에서 즉시 승급할 수 있습니다.
        </p>
      </div>
    </div>
  );
}


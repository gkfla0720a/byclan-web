/**
 * 파일명: (main)/(sidebar)/points/history/page.js
 * 역할: 포인트 내역 페이지
 * URL 경로: /points/history
 * 주요 기능: 내 포인트 획득/사용 내역 조회 + 배팅 이력 조회
 * 접근 권한: 로그인한 클랜원
 */
'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabase';

/** 포인트 거래 유형 레이블 */
const TYPE_LABEL = {
  manual: '수동 조정',
  admin_grant: '관리자 지급',
  admin_deduct: '관리자 회수',
  daily_bonus: '출석 보상',
  match_reward: '매치 참여',
  rank_promotion: '직급 승급',
  new_member: '신규 클랜원',
  bet_deduct: '베팅 차감',
  bet_settle_win: '베팅 정산(승)',
  bet_settle_loss: '베팅 정산(패)',
};

const TYPE_ICON = {
  daily_bonus: '📅',
  match_reward: '🎮',
  rank_promotion: '⬆️',
  new_member: '🎉',
  bet_settle_win: '🏆',
  bet_settle_loss: '❌',
  bet_deduct: '🎲',
  admin_grant: '💎',
  admin_deduct: '⚠️',
};

export default function PointHistoryPage() {
  const [profile, setProfile] = useState(null);
  const [logs, setLogs] = useState([]);
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('logs');

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const [profRes, logsRes, betsRes] = await Promise.all([
        supabase.from('profiles').select('by_id, clan_point, role').eq('id', user.id).single(),
        supabase
          .from('point_logs')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(100),
        supabase
          .from('match_bets')
          .select('*, ladder_matches(match_type, status, winning_team)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50),
      ]);

      setProfile(profRes.data);
      setLogs(logsRes.data || []);
      setBets(betsRes.data || []);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="py-20 text-center text-gray-500 font-mono animate-pulse">
        포인트 내역 로딩 중...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="py-20 text-center text-gray-500">
        로그인이 필요합니다.
      </div>
    );
  }

  // 총 획득 / 총 사용 계산
  const totalEarned = logs.filter(l => l.amount > 0).reduce((acc, l) => acc + l.amount, 0);
  const totalSpent = logs.filter(l => l.amount < 0).reduce((acc, l) => acc + Math.abs(l.amount), 0);

  return (
    <div className="w-full max-w-3xl mx-auto py-10 px-4 animate-fade-in-down font-sans">
      <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
        <span>💰</span> 포인트 내역
      </h2>

      {/* 잔액 요약 */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="bg-gray-900/70 border border-yellow-700/40 rounded-2xl p-4 text-center">
          <p className="text-gray-500 text-[10px] uppercase tracking-wider mb-1">현재 잔액</p>
          <p className="text-yellow-400 font-black text-xl">{(profile.clan_point ?? 0).toLocaleString()}</p>
          <p className="text-gray-600 text-[10px]">CP</p>
        </div>
        <div className="bg-gray-900/70 border border-emerald-700/40 rounded-2xl p-4 text-center">
          <p className="text-gray-500 text-[10px] uppercase tracking-wider mb-1">총 획득</p>
          <p className="text-emerald-400 font-black text-xl">+{totalEarned.toLocaleString()}</p>
          <p className="text-gray-600 text-[10px]">CP</p>
        </div>
        <div className="bg-gray-900/70 border border-red-800/40 rounded-2xl p-4 text-center">
          <p className="text-gray-500 text-[10px] uppercase tracking-wider mb-1">총 사용</p>
          <p className="text-red-400 font-black text-xl">-{totalSpent.toLocaleString()}</p>
          <p className="text-gray-600 text-[10px]">CP</p>
        </div>
      </div>

      {/* 탭 */}
      <div className="flex gap-1 mb-5 border-b border-gray-700/50">
        {[
          { id: 'logs', label: '📋 전체 내역' },
          { id: 'bets', label: '🎲 베팅 이력' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-bold rounded-t-lg transition-colors border-b-2 ${
              activeTab === tab.id
                ? 'text-yellow-400 border-yellow-500'
                : 'text-gray-500 border-transparent hover:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 포인트 내역 */}
      {activeTab === 'logs' && (
        <div className="space-y-2">
          {logs.length === 0 && (
            <div className="text-center py-16 text-gray-600 text-sm">포인트 거래 내역이 없습니다.</div>
          )}
          {logs.map(log => {
            const isPositive = log.amount > 0;
            const icon = TYPE_ICON[log.type] || '📌';
            const label = TYPE_LABEL[log.type] || log.type || '기타';
            return (
              <div
                key={log.id}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${
                  isPositive
                    ? 'bg-emerald-950/20 border-emerald-900/40'
                    : 'bg-red-950/20 border-red-900/40'
                }`}
              >
                <span className="text-xl flex-shrink-0">{icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-bold truncate">{label}</p>
                  <p className="text-gray-500 text-xs truncate">{log.reason}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`font-black text-sm ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                    {isPositive ? '+' : ''}{log.amount?.toLocaleString()} CP
                  </p>
                  {log.balance_after != null && (
                    <p className="text-gray-600 text-[10px]">잔액 {log.balance_after.toLocaleString()}</p>
                  )}
                  <p className="text-gray-700 text-[10px]">
                    {new Date(log.created_at).toLocaleDateString('ko-KR')}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 베팅 이력 */}
      {activeTab === 'bets' && (
        <div className="space-y-2">
          {bets.length === 0 && (
            <div className="text-center py-16 text-gray-600 text-sm">베팅 이력이 없습니다.</div>
          )}
          {bets.map(bet => {
            const matchEnded = bet.ladder_matches?.status === '완료';
            const won = matchEnded && bet.ladder_matches?.winning_team === bet.team_choice;
            const lost = matchEnded && bet.ladder_matches?.winning_team !== bet.team_choice;
            const statusColor = bet.status === 'won' ? 'text-emerald-400' : bet.status === 'lost' ? 'text-red-400' : 'text-yellow-400';
            const statusLabel = { won: '🏆 승리 정산', lost: '❌ 패배 정산', pending: '⏳ 정산 대기' }[bet.status] || '?';

            return (
              <div key={bet.id} className="flex items-center gap-4 p-4 rounded-xl border border-gray-700/50 bg-gray-900/40">
                <span className="text-xl flex-shrink-0">🎲</span>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-bold">
                    {bet.ladder_matches?.match_type || '?'} 매치 — TEAM {bet.team_choice} 배팅
                  </p>
                  <p className={`text-xs font-bold ${statusColor}`}>{statusLabel}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-white font-black text-sm">{bet.bet_amount?.toLocaleString()} CP</p>
                  {bet.payout > 0 && (
                    <p className="text-emerald-400 text-xs">수령: +{bet.payout.toLocaleString()} CP</p>
                  )}
                  <p className="text-gray-600 text-[10px]">
                    {new Date(bet.created_at).toLocaleDateString('ko-KR')}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


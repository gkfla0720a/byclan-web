/**
 * @file AdminPointManager.js
 * @역할 관리자 전용 클랜 포인트 관리 패널
 * @주요기능
 *   - 전체 포인트 거래 내역 조회 (point_logs)
 *   - 특정 유저에게 포인트 지급 / 회수
 *   - 유저별 잔액 및 누적 포인트 조회
 *   - 배팅 정산 내역 필터링
 * @접근권한 developer, master, admin 전용
 */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/supabase';
import { grantPoints, deductPoints } from '@/app/utils/pointSystem';
import { recordAdminAudit } from '@/app/utils/adminAudit';

/** 포인트 거래 유형 한국어 레이블 */
const TYPE_LABEL = {
  manual: '수동 지급',
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

const TYPE_COLOR = {
  daily_bonus: 'text-yellow-400',
  match_reward: 'text-blue-400',
  rank_promotion: 'text-purple-400',
  new_member: 'text-emerald-400',
  bet_settle_win: 'text-green-400',
  bet_settle_loss: 'text-red-400',
  bet_deduct: 'text-orange-400',
  admin_grant: 'text-cyan-400',
  admin_deduct: 'text-pink-400',
};

export default function AdminPointManager() {
  const [myProfile, setMyProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // 포인트 내역
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [searchById, setSearchById] = useState('');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 30;

  // 유저 목록 (지급/회수 대상 선택용)
  const [members, setMembers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [grantAmount, setGrantAmount] = useState('');
  const [grantReason, setGrantReason] = useState('');
  const [isDeduct, setIsDeduct] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  /** 권한 확인 및 초기 데이터 로드 */
  const checkAndLoad = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: prof } = await supabase
        .from('profiles')
        .select('id, by_id, role, profile_meta(is_test_account)')
        .eq('id', user.id)
        .single();

      const flatProf = prof ? { ...prof, is_test_account: prof.profile_meta?.is_test_account ?? false, profile_meta: undefined } : null;
      setMyProfile(flatProf);
      const role = flatProf?.role?.trim().toLowerCase();
      if (!['developer', 'master', 'admin'].includes(role)) return;

      setIsAdmin(true);

      // 클랜원 목록 로드
      const { data: mems } = await supabase
        .from('profiles')
        .select('id, by_id, role, clan_point, profile_meta(is_test_account)')
        .not('role', 'eq', 'visitor')
        .order('by_id');
      setMembers((mems || []).map(m => ({ ...m, is_test_account: m.profile_meta?.is_test_account ?? false, profile_meta: undefined })));
    } catch (err) {
      console.error('[AdminPointManager] 초기화 오류:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { checkAndLoad(); }, [checkAndLoad]);

  /** 포인트 로그 조회 */
  const fetchLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      let query = supabase
        .from('point_logs')
        .select(`
          id, user_id, amount, reason, type, balance_after, related_id, created_at,
          profiles:user_id (by_id, role)
        `)
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (filterType !== 'all') {
        query = query.eq('type', filterType);
      }

      const { data, error } = await query;
      if (error) throw error;

      let filtered = data || [];
      if (searchById.trim()) {
        filtered = filtered.filter(log =>
          log.profiles?.by_id?.toLowerCase().includes(searchById.toLowerCase())
        );
      }

      setLogs(filtered);
    } catch (err) {
      console.error('[AdminPointManager] 로그 조회 오류:', err);
    } finally {
      setLogsLoading(false);
    }
  }, [page, filterType, searchById]);

  useEffect(() => {
    if (isAdmin) fetchLogs();
  }, [isAdmin, fetchLogs]);

  /** 포인트 지급 또는 회수 처리 */
  const handleSubmitPoints = async (e) => {
    e.preventDefault();
    const amount = parseInt(grantAmount, 10);
    if (!selectedUserId || !amount || amount <= 0 || !grantReason.trim()) {
      alert('대상 유저, 포인트 금액, 사유를 모두 입력해주세요.');
      return;
    }

    const targetMember = members.find(m => m.id === selectedUserId);
    const actionLabel = isDeduct ? '회수' : '지급';
    const guideText = [
      '[관리자 데이터 변경 안내]',
      `${targetMember?.by_id || '대상유저'}에게 ${amount.toLocaleString()} CP를 ${actionLabel}합니다.`,
      '변경 내역은 로그 및 알림으로 기록됩니다.',
      '계속하려면 아래 입력창에 정확히 확인 을 입력하세요.',
    ].join('\n');
    const typed = window.prompt(guideText, '');
    if ((typed || '').trim() !== '확인') {
      alert('취소되었습니다. 확인 문자열이 일치하지 않습니다.');
      return;
    }

    setSubmitting(true);
    try {
      const { data: targetBefore } = await supabase
        .from('profiles')
        .select('id, by_id, role, clan_point')
        .eq('id', selectedUserId)
        .single();

      const isTest = Boolean(targetMember?.is_test_account);
      const fn = isDeduct ? deductPoints : grantPoints;
      const type = isDeduct ? 'admin_deduct' : 'admin_grant';
      const result = await fn(supabase, selectedUserId, amount, grantReason.trim(), type, null, isTest);

      if (result.ok) {
        const { data: targetAfter } = await supabase
          .from('profiles')
          .select('id, by_id, role, clan_point')
          .eq('id', selectedUserId)
          .single();

        await recordAdminAudit(supabase, {
          actorId: myProfile?.id,
          actorById: myProfile?.by_id,
          actorRole: myProfile?.role,
          category: 'admin',
          actionType: isDeduct ? 'point_deduct' : 'point_grant',
          targetTable: 'profiles',
          targetId: selectedUserId,
          targetUserId: selectedUserId,
          beforeData: {
            clan_point: targetBefore?.clan_point,
            by_id: targetBefore?.by_id,
            role: targetBefore?.role,
          },
          afterData: {
            clan_point: targetAfter?.clan_point,
            by_id: targetAfter?.by_id,
            role: targetAfter?.role,
          },
          summary: `${targetMember?.by_id || '대상유저'} 포인트 ${isDeduct ? '회수' : '지급'} ${amount}CP`,
          note: `${isDeduct ? '포인트 회수' : '포인트 지급'} ${amount}CP / 사유: ${grantReason.trim()}`,
          isTestData: isTest,
        });

        alert(`✅ ${isDeduct ? '차감' : '지급'} 완료. 변경 후 잔액: ${result.newBalance.toLocaleString()} CP`);
        setGrantAmount('');
        setGrantReason('');
        setSelectedUserId('');
        // 목록 갱신
        checkAndLoad();
        fetchLogs();
      } else {
        alert('실패: ' + result.error);
      }
    } catch (err) {
      alert('오류: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="text-center py-16 text-gray-500 font-mono animate-pulse">
      [ LOADING POINT SYSTEM... ]
    </div>
  );

  if (!isAdmin) return (
    <div className="w-full max-w-4xl mx-auto my-10 bg-gray-900 rounded-3xl p-12 text-center border-2 border-red-900/50">
      <div className="text-5xl mb-4">🚫</div>
      <h2 className="text-2xl font-black text-red-500">접근 불가</h2>
      <p className="text-gray-500 mt-2 text-sm">운영진(admin/master/developer) 전용 기능입니다.</p>
    </div>
  );

  return (
    <div className="w-full max-w-5xl mx-auto py-8 px-4 space-y-8 font-sans">
      <div className="border-b border-yellow-700/30 pb-6">
        <h2 className="text-2xl font-black text-white flex items-center gap-3">
          <span>💰</span> 포인트 관리 시스템
        </h2>
        <p className="text-gray-500 text-sm mt-1">클랜원 포인트 지급·회수 및 전체 거래 내역을 관리합니다.</p>
      </div>

      {/* ── 포인트 지급 / 회수 ─────────────────────────────────────────── */}
      <div className="bg-gray-900/60 border border-gray-700 rounded-2xl p-6">
        <h3 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">포인트 지급 / 회수</h3>

        <form onSubmit={handleSubmitPoints} className="space-y-4">
          {/* 지급/회수 토글 */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsDeduct(false)}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${
                !isDeduct
                  ? 'bg-emerald-700 text-white border border-emerald-500'
                  : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-500'
              }`}
            >
              ＋ 포인트 지급
            </button>
            <button
              type="button"
              onClick={() => setIsDeduct(true)}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${
                isDeduct
                  ? 'bg-red-800 text-white border border-red-600'
                  : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-500'
              }`}
            >
              ─ 포인트 회수
            </button>
          </div>

          {/* 대상 유저 선택 */}
          <div>
            <label className="text-gray-400 text-xs mb-1 block">대상 클랜원</label>
            <select
              value={selectedUserId}
              onChange={e => setSelectedUserId(e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-yellow-600"
            >
              <option value="">── 유저를 선택하세요 ──</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>
                  {m.by_id} ({m.role}) — 잔액: {(m.clan_point ?? 0).toLocaleString()} CP
                </option>
              ))}
            </select>
          </div>

          {/* 금액 */}
          <div>
            <label className="text-gray-400 text-xs mb-1 block">포인트 금액 (CP)</label>
            <input
              type="number"
              min="1"
              value={grantAmount}
              onChange={e => setGrantAmount(e.target.value)}
              placeholder="예: 5000"
              className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-yellow-600"
            />
          </div>

          {/* 사유 */}
          <div>
            <label className="text-gray-400 text-xs mb-1 block">지급/회수 사유</label>
            <input
              type="text"
              value={grantReason}
              onChange={e => setGrantReason(e.target.value)}
              placeholder="예: 이벤트 보상, 규정 위반 차감 등"
              maxLength={200}
              className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-yellow-600"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !selectedUserId || !grantAmount || !grantReason.trim()}
            className={`w-full py-3 rounded-xl font-black text-sm transition-all disabled:opacity-30 ${
              isDeduct
                ? 'bg-red-700 hover:bg-red-600 text-white'
                : 'bg-emerald-700 hover:bg-emerald-600 text-white'
            }`}
          >
            {submitting ? '처리 중...' : isDeduct ? '포인트 회수 실행' : '포인트 지급 실행'}
          </button>
        </form>
      </div>

      {/* ── 거래 내역 ─────────────────────────────────────────────────────── */}
      <div className="bg-gray-900/60 border border-gray-700 rounded-2xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="text-white font-bold text-sm uppercase tracking-wider">전체 포인트 거래 내역</h3>
          <div className="flex gap-2 flex-wrap">
            {/* 유형 필터 */}
            <select
              value={filterType}
              onChange={e => { setFilterType(e.target.value); setPage(0); }}
              className="bg-gray-800 border border-gray-700 text-gray-300 rounded-lg px-2 py-1.5 text-xs outline-none"
            >
              <option value="all">전체 유형</option>
              {Object.entries(TYPE_LABEL).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            {/* by_id 검색 */}
            <input
              type="text"
              value={searchById}
              onChange={e => { setSearchById(e.target.value); setPage(0); }}
              placeholder="닉네임 검색..."
              className="bg-gray-800 border border-gray-700 text-gray-300 rounded-lg px-2 py-1.5 text-xs outline-none w-32"
            />
            <button
              onClick={() => fetchLogs()}
              className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg text-xs font-bold transition-colors"
            >
              새로고침
            </button>
          </div>
        </div>

        {logsLoading ? (
          <div className="text-center py-8 text-gray-500 animate-pulse text-sm">로딩 중...</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-gray-700 text-gray-500 uppercase tracking-wider text-[10px]">
                    <th className="pb-3 pr-4">일시</th>
                    <th className="pb-3 pr-4">닉네임</th>
                    <th className="pb-3 pr-4">유형</th>
                    <th className="pb-3 pr-4 text-right">금액</th>
                    <th className="pb-3 pr-4 text-right">잔액</th>
                    <th className="pb-3">사유</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {logs.map(log => {
                    const isPositive = log.amount > 0;
                    const typeColor = TYPE_COLOR[log.type] || 'text-gray-400';
                    return (
                      <tr key={log.id} className="hover:bg-gray-800/30 transition-colors">
                        <td className="py-3 pr-4 text-gray-500 whitespace-nowrap">
                          {new Date(log.created_at).toLocaleDateString('ko-KR', {
                            month: '2-digit', day: '2-digit',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </td>
                        <td className="py-3 pr-4 text-white font-bold">
                          {log.profiles?.by_id || '?'}
                        </td>
                        <td className={`py-3 pr-4 font-bold ${typeColor}`}>
                          {TYPE_LABEL[log.type] || log.type || '-'}
                        </td>
                        <td className={`py-3 pr-4 font-black text-right ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                          {isPositive ? '+' : ''}{log.amount?.toLocaleString()} CP
                        </td>
                        <td className="py-3 pr-4 text-gray-400 text-right">
                          {log.balance_after != null ? log.balance_after.toLocaleString() : '-'} CP
                        </td>
                        <td className="py-3 text-gray-400 max-w-xs truncate" title={log.reason}>
                          {log.reason || '-'}
                        </td>
                      </tr>
                    );
                  })}
                  {logs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-600">
                        거래 내역이 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* 페이지네이션 */}
            <div className="flex gap-2 mt-4 justify-end">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1.5 bg-gray-800 text-gray-400 rounded-lg text-xs disabled:opacity-30 hover:bg-gray-700 transition-colors"
              >
                ← 이전
              </button>
              <span className="px-3 py-1.5 text-gray-500 text-xs">페이지 {page + 1}</span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={logs.length < PAGE_SIZE}
                className="px-3 py-1.5 bg-gray-800 text-gray-400 rounded-lg text-xs disabled:opacity-30 hover:bg-gray-700 transition-colors"
              >
                다음 →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

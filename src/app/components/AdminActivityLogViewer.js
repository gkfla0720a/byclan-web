/**
 * @file AdminActivityLogViewer.js
 * @role 전역 활동 로그 조회 패널 (수동 변경 특수표시 포함)
 */
'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import logger from '@/app/utils/errorLogger';
import { supabase } from '@/supabase';

const CATEGORY_OPTIONS = [
  'all', 'admin', 'cp', 'mmr', 'match', 'auth', 'post', 'profile', 'role'
];

export default function AdminActivityLogViewer() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [rows, setRows] = useState([]);

  const [manualOnly, setManualOnly] = useState(true);
  const [category, setCategory] = useState('all');
  const [targetSearch, setTargetSearch] = useState('');
  const [actorSearch, setActorSearch] = useState('');

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (!user) {
        setIsAdmin(false);
        setRows([]);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', user.id)
        .single();

      const role = (profile?.role || '').trim().toLowerCase();
      const allowed = ['developer', 'master', 'admin'].includes(role);
      setIsAdmin(allowed);
      if (!allowed) {
        setRows([]);
        return;
      }

      let query = supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(300);

      if (manualOnly) query = query.eq('is_manual', true);
      if (category !== 'all') query = query.eq('category', category);

      const { data, error } = await query;
      if (error) throw error;
      setRows(data || []);
    } catch (err) {
      logger.error('[AdminActivityLogViewer] loadLogs 오류', err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [manualOnly, category]);

  useEffect(() => {
    loadLogs().catch(() => {});
  }, [loadLogs]);

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      const targetOk = !targetSearch.trim() || String(row.target_id || '').toLowerCase().includes(targetSearch.toLowerCase()) || String(row.target_user_id || '').toLowerCase().includes(targetSearch.toLowerCase());
      const actorOk = !actorSearch.trim() || String(row.actor_by_id || '').toLowerCase().includes(actorSearch.toLowerCase()) || String(row.actor_id || '').toLowerCase().includes(actorSearch.toLowerCase());
      return targetOk && actorOk;
    });
  }, [rows, targetSearch, actorSearch]);

  if (loading) {
    return <div className="text-center py-10 text-gray-500">활동 로그 로딩 중...</div>;
  }

  if (!isAdmin) {
    return <div className="text-center py-10 text-red-400">운영진만 접근 가능합니다.</div>;
  }

  return (
    <div className="w-full max-w-6xl mx-auto py-4 px-2 sm:px-4 space-y-4">
      <div className="bg-gray-900/60 border border-gray-700 rounded-2xl p-4">
        <h2 className="text-white text-lg font-black mb-2">전역 활동 로그</h2>
        <p className="text-gray-500 text-xs sm:text-sm mb-3">CP/MMR/경기/접속/게시글/닉네임/등급 변동 이력을 통합 조회합니다.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
          <label className="text-[11px] text-gray-400">
            카테고리
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-2 text-sm text-white"
            >
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>

          <label className="text-[11px] text-gray-400">
            대상 검색
            <input
              value={targetSearch}
              onChange={(e) => setTargetSearch(e.target.value)}
              placeholder="target_id/user_id"
              className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-2 text-sm text-white"
            />
          </label>

          <label className="text-[11px] text-gray-400">
            작업자 검색
            <input
              value={actorSearch}
              onChange={(e) => setActorSearch(e.target.value)}
              placeholder="actor by_id/id"
              className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-2 text-sm text-white"
            />
          </label>

          <label className="text-[11px] text-gray-400 flex items-end">
            <input
              type="checkbox"
              checked={manualOnly}
              onChange={(e) => setManualOnly(e.target.checked)}
              className="mr-2"
            />
            수동 변경만 보기
          </label>

          <button
            onClick={() => loadLogs()}
            className="px-3 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm font-bold h-fit self-end"
          >
            새로고침
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {filtered.map((row) => (
          <div
            key={row.id}
            className={`rounded-xl border p-3 ${row.is_manual ? 'border-yellow-500/60 bg-yellow-950/10' : 'border-gray-700 bg-gray-900/40'}`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] px-2 py-0.5 rounded bg-gray-800 text-gray-300 uppercase">{row.category}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-gray-800 text-cyan-300 uppercase">{row.action_type}</span>
                {row.is_manual && <span className="text-[10px] px-2 py-0.5 rounded bg-yellow-700 text-black font-bold">수동변경 특수</span>}
              </div>
              <span className="text-[11px] text-gray-500">{new Date(row.created_at).toLocaleString()}</span>
            </div>

            <p className="text-sm text-gray-200 mb-1">{row.summary || '-'}</p>
            <p className="text-xs text-gray-500 mb-1">작업자: {row.actor_by_id || '-'} ({row.actor_role || '-'})</p>
            <p className="text-xs text-gray-500 mb-2">대상: {row.target_table || '-'} / {row.target_id || '-'} / user:{row.target_user_id || '-'}</p>

            <details className="text-xs text-gray-400">
              <summary className="cursor-pointer text-gray-300">변경 전/후 데이터 보기</summary>
              <div className="mt-2 grid grid-cols-1 lg:grid-cols-2 gap-2">
                <pre className="bg-gray-950/70 border border-gray-800 rounded p-2 overflow-auto">{JSON.stringify(row.before_data || {}, null, 2)}</pre>
                <pre className="bg-gray-950/70 border border-gray-800 rounded p-2 overflow-auto">{JSON.stringify(row.after_data || {}, null, 2)}</pre>
              </div>
            </details>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-10 text-gray-500 border border-gray-800 rounded-xl bg-gray-900/40">
            조건에 맞는 활동 로그가 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}

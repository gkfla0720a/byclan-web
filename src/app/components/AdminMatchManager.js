/**
 * @file AdminMatchManager.js
 * @role 관리자 경기 기록 수정/삭제 패널
 */
'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/supabase';
import { recordAdminAudit } from '@/app/utils/adminAudit';

const STATUS_OPTIONS = ['모집중', '진행중', '완료', '거절됨'];
const WINNING_TEAM_OPTIONS = ['', 'A', 'B'];

function requireAdminTypingConfirm(actionText) {
  const message = [
    '[관리자 데이터 변경 안내]',
    actionText,
    '이 작업은 경기 기록 데이터를 직접 변경합니다.',
    '변경 이력은 감사 대상이 될 수 있습니다.',
    '계속하려면 정확히 확인 을 입력하세요.',
  ].join('\n');
  const typed = window.prompt(message, '');
  return (typed || '').trim() === '확인';
}

export default function AdminMatchManager() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [myProfile, setMyProfile] = useState(null);
  const [matches, setMatches] = useState([]);
  const [savingId, setSavingId] = useState('');
  const [deletingId, setDeletingId] = useState('');
  const [search, setSearch] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (!user) {
        setIsAdmin(false);
        setMatches([]);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, by_id, role')
        .eq('id', user.id)
        .single();

      setMyProfile(profile || null);

      const role = (profile?.role || '').trim().toLowerCase();
      const allowed = ['developer', 'master', 'admin'].includes(role);
      setIsAdmin(allowed);
      if (!allowed) {
        setMatches([]);
        return;
      }

      const { data, error } = await supabase
        .from('ladder_matches')
        .select('id, status, match_type, winner_team, map_name, score_a, score_b, created_at, team_a_ids, team_b_ids')
        .order('created_at', { ascending: false })
        .limit(80);

      if (error) throw error;
      setMatches((data || []).map((row) => ({ ...row })));
    } catch (err) {
      console.error('[AdminMatchManager] loadData 오류:', err);
      setMatches([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData().catch(() => {});
  }, [loadData]);

  const filteredMatches = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return matches;
    return matches.filter((m) =>
      String(m.id || '').toLowerCase().includes(q)
      || String(m.status || '').toLowerCase().includes(q)
      || String(m.map_name || '').toLowerCase().includes(q)
      || String(m.match_type || '').toLowerCase().includes(q)
    );
  }, [matches, search]);

  const updateLocalField = (id, field, value) => {
    setMatches((prev) => prev.map((m) => (m.id === id ? { ...m, [field]: value } : m)));
  };

  const handleSave = async (match) => {
    const actionText = `경기 기록 수정: ${match.id}\n상태=${match.status}, 스코어=${match.score_a}:${match.score_b}, 승리팀=${match.winner_team || '-'} 로 저장합니다.`;
    if (!requireAdminTypingConfirm(actionText)) {
      alert('취소되었습니다. 확인 문자열이 일치하지 않습니다.');
      return;
    }

    setSavingId(match.id);
    try {
      const { data: current } = await supabase
        .from('ladder_matches')
        .select('*')
        .eq('id', match.id)
        .single();

      const payload = {
        status: match.status,
        score_a: Number(match.score_a || 0),
        score_b: Number(match.score_b || 0),
        winner_team: match.winner_team || null,
        map_name: match.map_name || null,
      };

      const { error } = await supabase
        .from('ladder_matches')
        .update(payload)
        .eq('id', match.id);

      if (error) throw error;

      await recordAdminAudit(supabase, {
        actorId: myProfile?.id,
        actorById: myProfile?.by_id,
        actorRole: myProfile?.role,
        category: 'admin',
        actionType: 'match_update',
        targetTable: 'ladder_matches',
        targetId: match.id,
        summary: `경기 기록 수동 수정 (${match.id})`,
        beforeData: current,
        afterData: payload,
        meta: {
          team_a_ids: current?.team_a_ids || [],
          team_b_ids: current?.team_b_ids || [],
        },
        note: '관리자 경기 기록 수정',
        isTestData: Boolean(current?.is_test_data),
      });

      alert('경기 기록이 수정되었습니다.');
      await loadData();
    } catch (err) {
      alert('수정 실패: ' + err.message);
    } finally {
      setSavingId('');
    }
  };

  const handleDelete = async (match) => {
    const actionText = `경기 기록 삭제: ${match.id}\n연관 세트/배팅 기록도 함께 삭제합니다.`;
    if (!requireAdminTypingConfirm(actionText)) {
      alert('취소되었습니다. 확인 문자열이 일치하지 않습니다.');
      return;
    }

    setDeletingId(match.id);
    try {
      const { data: current } = await supabase
        .from('ladder_matches')
        .select('*')
        .eq('id', match.id)
        .single();

      // FK 충돌 방지를 위해 하위 데이터부터 삭제
      const { data: deletedSets, error: setErr } = await supabase
        .from('match_sets')
        .delete()
        .select('id')
        .eq('match_id', match.id);
      if (setErr) throw setErr;

      const { data: deletedBets, error: betErr } = await supabase
        .from('match_bets')
        .delete()
        .select('id')
        .eq('match_id', match.id);
      if (betErr) throw betErr;

      const { error: matchErr } = await supabase
        .from('ladder_matches')
        .delete()
        .eq('id', match.id);
      if (matchErr) throw matchErr;

      await recordAdminAudit(supabase, {
        actorId: myProfile?.id,
        actorById: myProfile?.by_id,
        actorRole: myProfile?.role,
        category: 'admin',
        actionType: 'match_delete',
        targetTable: 'ladder_matches',
        targetId: match.id,
        summary: `경기 기록 수동 삭제 (${match.id})`,
        beforeData: current,
        afterData: {
          deleted: true,
          deleted_set_count: (deletedSets || []).length,
          deleted_bet_count: (deletedBets || []).length,
        },
        meta: {
          team_a_ids: current?.team_a_ids || [],
          team_b_ids: current?.team_b_ids || [],
        },
        note: '관리자 경기 기록 삭제',
        isTestData: Boolean(current?.is_test_data),
      });

      alert('경기 기록이 삭제되었습니다.');
      await loadData();
    } catch (err) {
      alert('삭제 실패: ' + err.message);
    } finally {
      setDeletingId('');
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">경기 기록 로딩 중...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="w-full max-w-4xl mx-auto bg-gray-900 rounded-2xl p-10 text-center border border-red-900/50">
        <h3 className="text-red-400 text-xl font-black mb-2">접근 불가</h3>
        <p className="text-gray-500 text-sm">운영진(admin/master/developer)만 경기 기록을 수정/삭제할 수 있습니다.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto py-4 px-2 sm:px-4 space-y-4">
      <div className="bg-gray-900/60 border border-gray-700 rounded-2xl p-4 sm:p-5">
        <h2 className="text-white text-lg sm:text-xl font-black mb-2">경기 기록 관리</h2>
        <p className="text-gray-500 text-xs sm:text-sm mb-4">
          관리자 데이터 변경 작업입니다. 저장/삭제 시마다 안내문구 확인 후 확인 입력이 필요합니다.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="매치 ID, 상태, 맵명 검색"
            className="w-full sm:max-w-sm bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200"
          />
          <button
            onClick={() => loadData()}
            className="px-3 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm font-bold"
          >
            새로고침
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {filteredMatches.map((m) => (
          <div key={m.id} className="bg-[#0b0f1c] border border-gray-700/60 rounded-2xl p-3 sm:p-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2 mb-3">
              <p className="text-cyan-300 text-xs sm:text-sm font-bold break-all">{m.id}</p>
              <p className="text-gray-500 text-[11px]">생성일: {new Date(m.created_at).toLocaleString()}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
              <label className="text-[11px] text-gray-400">
                상태
                <select
                  value={m.status || ''}
                  onChange={(e) => updateLocalField(m.id, 'status', e.target.value)}
                  className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-2 text-sm text-white"
                >
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>

              <label className="text-[11px] text-gray-400">
                승리팀
                <select
                  value={m.winner_team || ''}
                  onChange={(e) => updateLocalField(m.id, 'winner_team', e.target.value)}
                  className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-2 text-sm text-white"
                >
                  {WINNING_TEAM_OPTIONS.map((s) => <option key={s} value={s}>{s || '미지정'}</option>)}
                </select>
              </label>

              <label className="text-[11px] text-gray-400">
                스코어 A
                <input
                  type="number"
                  min="0"
                  value={m.score_a ?? 0}
                  onChange={(e) => updateLocalField(m.id, 'score_a', e.target.value)}
                  className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-2 text-sm text-white"
                />
              </label>

              <label className="text-[11px] text-gray-400">
                스코어 B
                <input
                  type="number"
                  min="0"
                  value={m.score_b ?? 0}
                  onChange={(e) => updateLocalField(m.id, 'score_b', e.target.value)}
                  className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-2 text-sm text-white"
                />
              </label>

              <label className="text-[11px] text-gray-400">
                맵 이름
                <input
                  value={m.map_name || ''}
                  onChange={(e) => updateLocalField(m.id, 'map_name', e.target.value)}
                  className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-2 text-sm text-white"
                />
              </label>
            </div>

            <div className="mt-3 flex flex-col sm:flex-row gap-2 sm:justify-end">
              <button
                onClick={() => handleSave(m)}
                disabled={savingId === m.id || deletingId === m.id}
                className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-bold"
              >
                {savingId === m.id ? '저장 중...' : '수정 저장'}
              </button>
              <button
                onClick={() => handleDelete(m)}
                disabled={deletingId === m.id || savingId === m.id}
                className="px-4 py-2 rounded-lg bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-bold"
              >
                {deletingId === m.id ? '삭제 중...' : '기록 삭제'}
              </button>
            </div>
          </div>
        ))}

        {filteredMatches.length === 0 && (
          <div className="text-center py-10 text-gray-500 bg-gray-900/40 border border-gray-800 rounded-2xl">
            표시할 경기 기록이 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}

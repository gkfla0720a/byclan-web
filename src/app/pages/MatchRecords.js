/**
 * 파일명: MatchRecords.js
 *
 * 역할:
 *   래더 경기 기록을 표로 표시하는 컴포넌트입니다.
 *   비로그인 유저를 포함한 모든 방문자가 열람할 수 있습니다.
 *
 * 주요 기능:
 *   - ladder_matches 테이블에서 완료·진행중 경기를 최신순으로 불러옵니다.
 *   - 각 경기의 날짜, 종류, 상태, 스코어, 참여 인원을 표시합니다.
 *   - 참여자 프로필(ByID)을 비동기로 조회하여 팀 명단을 표시합니다.
 *
 * 접근 권한: 전체 공개 (비로그인 포함)
 */
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { isSupabaseConfigured, supabase } from '@/supabase';
import { filterVisibleTestData } from '@/app/utils/testData';

/** 경기 상태별 배지 스타일 클래스를 반환합니다. */
function getStatusStyle(status) {
  switch (status) {
    case '완료': return 'bg-cyan-900/60 text-cyan-300 border border-cyan-500/30';
    case '진행중': return 'bg-red-900/60 text-red-300 border border-red-500/30';
    case '제안중': return 'bg-yellow-900/60 text-yellow-300 border border-yellow-500/30';
    case '모집중': return 'bg-green-900/60 text-green-300 border border-green-500/30';
    default: return 'bg-gray-900/60 text-gray-400 border border-gray-600/30';
  }
}

/** 날짜 문자열을 읽기 좋은 형식으로 변환합니다. */
function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${mm}.${dd} ${hh}:${min}`;
}

/**
 * MatchRecords 컴포넌트
 *
 * @returns {JSX.Element} 경기 기록 목록 UI
 */
export default function MatchRecords() {
  /** DB에서 불러온 경기 목록 */
  const [matches, setMatches] = useState([]);
  /** 경기 로딩 중 여부 */
  const [loading, setLoading] = useState(true);
  /** 에러 상태 */
  const [error, setError] = useState(null);
/**
 * MatchRecords 프로필 캐시
 * 키: user.id (Supabase UUID — 불변 식별자)
 * 값: 표시명 (ByID 우선, 없으면 discord_id, 없으면 '알 수 없음')
 * ※ ByID 는 변경 가능한 표시명이고, 실제 인증/식별에는 discord_id(불변) 또는 user.id 를 사용합니다.
 */
  const [profileCache, setProfileCache] = useState({});

  /**
   * ladder_matches 테이블에서 최신 경기 50건을 불러옵니다.
   * '완료', '진행중', '제안중' 상태만 표시합니다.
   */
  const fetchMatches = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setMatches([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await filterVisibleTestData(
        supabase
          .from('ladder_matches')
          .select('id, match_type, status, score_a, score_b, team_a_ids, team_b_ids, created_at')
          .in('status', ['완료', '진행중', '제안중'])
          .order('created_at', { ascending: false })
          .limit(50)
      );
      if (fetchError) throw fetchError;
      setMatches(data || []);

      // 경기에 참여한 모든 사용자 ID를 모아 프로필 일괄 조회
      const allIds = new Set();
      (data || []).forEach((m) => {
        (m.team_a_ids || []).forEach((id) => allIds.add(id));
        (m.team_b_ids || []).forEach((id) => allIds.add(id));
      });
      if (allIds.size > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, ByID, discord_id')
          .in('id', Array.from(allIds));
        const cache = {};
        (profiles || []).forEach((p) => {
          // 키: p.id (Supabase UUID — 불변 식별자), 값: 표시명 (ByID 우선)
          // ByID 는 표시용이며, 인증 주체에는 discord_id (불변) 를 사용합니다.
          cache[p.id] = p.ByID || p.discord_id || '알 수 없음';
        });
        setProfileCache(cache);
      }
    } catch (err) {
      console.error('경기 기록 로딩 실패:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchMatches();
  }, [fetchMatches]);

  /** 팀 ID 배열을 닉네임 문자열로 변환합니다. */
  const renderTeam = (ids) => {
    if (!ids || ids.length === 0) return <span className="text-gray-600">-</span>;
    return ids.map((id, i) => (
      <span key={id} className="text-slate-300 text-xs">
        {profileCache[id] || '…'}
        {i < ids.length - 1 && <span className="text-gray-600 mx-1">·</span>}
      </span>
    ));
  };

  return (
    <div className="w-full max-w-5xl mx-auto animate-fade-in-down mt-4 sm:mt-8 font-mono">
      {/* 헤더 */}
      <div className="flex justify-between items-end mb-4 px-2 sm:px-0 border-b border-cyan-500/50 pb-2">
        <h2 className="text-xl sm:text-2xl font-bold text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] tracking-widest">
          [ SYSTEM: MATCH RECORDS ]
        </h2>
        <button
          onClick={fetchMatches}
          className="text-cyan-500 hover:text-cyan-300 text-xs transition-colors"
        >
          ↻ 새로고침
        </button>
      </div>

      {/* 본문 */}
      <div className="bg-[#0A1128] border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.15)] rounded-sm overflow-hidden relative">
        {!isSupabaseConfigured ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            경기 기록 데이터 연결이 완료되지 않았습니다.
          </div>
        ) : loading ? (
          <div className="p-8 text-center text-gray-500 text-sm animate-pulse">
            경기 기록을 불러오는 중입니다...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-400 text-sm">
            경기 기록을 불러오지 못했습니다. 잠시 후 새로고침 해주세요.
          </div>
        ) : matches.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            아직 기록된 경기가 없습니다.
          </div>
        ) : (
          <>
            {/* 데스크톱 테이블 */}
            <table className="w-full text-left border-collapse hidden sm:table">
              <thead>
                <tr className="border-b border-cyan-500/40 bg-cyan-950/10 text-cyan-300 text-xs uppercase tracking-widest">
                  <th className="py-3 px-4 w-[110px]">날짜</th>
                  <th className="py-3 px-4 w-[70px]">종류</th>
                  <th className="py-3 px-4 w-[70px]">상태</th>
                  <th className="py-3 px-4">A팀</th>
                  <th className="py-3 px-3 w-[70px] text-center">스코어</th>
                  <th className="py-3 px-4">B팀</th>
                </tr>
              </thead>
              <tbody>
                {matches.map((m, idx) => (
                  <tr
                    key={m.id}
                    className={`border-b border-cyan-500/10 transition-colors hover:bg-cyan-950/10 ${
                      idx % 2 === 0 ? '' : 'bg-[#0a0f1e]/40'
                    }`}
                  >
                    <td className="py-3 px-4 text-gray-500 text-xs">{formatDate(m.created_at)}</td>
                    <td className="py-3 px-4 text-cyan-200 text-xs font-bold">{m.match_type || '-'}</td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${getStatusStyle(m.status)}`}>
                        {m.status || '-'}
                      </span>
                    </td>
                    <td className="py-3 px-4">{renderTeam(m.team_a_ids)}</td>
                    <td className="py-3 px-3 text-center">
                      {m.status === '완료' ? (
                        <span className="text-white font-black text-sm">
                          {m.score_a ?? '-'} : {m.score_b ?? '-'}
                        </span>
                      ) : (
                        <span className="text-gray-600 text-xs">VS</span>
                      )}
                    </td>
                    <td className="py-3 px-4">{renderTeam(m.team_b_ids)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* 모바일 카드 */}
            <div className="sm:hidden flex flex-col divide-y divide-cyan-500/10">
              {matches.map((m) => (
                <div key={m.id} className="px-4 py-4 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-xs">{formatDate(m.created_at)}</span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${getStatusStyle(m.status)}`}>
                      {m.status || '-'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-cyan-300 text-xs font-bold w-10">{m.match_type}</span>
                    <div className="flex-1">
                      <div className="text-[11px] text-gray-400 mb-0.5">A팀</div>
                      <div className="flex flex-wrap gap-1">{renderTeam(m.team_a_ids)}</div>
                    </div>
                    {m.status === '완료' && (
                      <span className="text-white font-black text-sm mx-1">
                        {m.score_a ?? '-'} : {m.score_b ?? '-'}
                      </span>
                    )}
                    <div className="flex-1 text-right">
                      <div className="text-[11px] text-gray-400 mb-0.5">B팀</div>
                      <div className="flex flex-wrap gap-1 justify-end">{renderTeam(m.team_b_ids)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

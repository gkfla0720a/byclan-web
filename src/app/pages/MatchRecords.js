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
 *   - 참여자 프로필(by_id)을 비동기로 조회하여 팀 명단을 표시합니다.
 *   - 경기 행 클릭 시 상세 팝업을 표시합니다.
 *
 * 접근 권한: 전체 공개 (비로그인 포함)
 */
'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { isSupabaseConfigured, supabase } from '@/supabase';
import { filterVisibleTestData } from '@/app/utils/testData';

const PAGE_SIZE = 30;

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

/** 종족 이름을 한글 약어로 변환합니다. */
function raceLabel(race) {
  const map = { Terran: '테', Protoss: '프', Zerg: '저', Random: '랜' };
  return map[race] || '';
}

/** race_cards 배열을 한글 문자열로 변환합니다. (예: ['Protoss','Protoss','Terran'] → '프·프·테') */
function raceCardsLabel(cards) {
  if (!Array.isArray(cards) || cards.length === 0) return '';
  return cards.map(raceLabel).join('·');
}

/** race_cards 배열을 영문 조합코드(PPP/PPT/PPZ/PZT/OTHER)로 변환합니다. */
function raceComboCode(cards) {
  if (!Array.isArray(cards) || cards.length !== 3) return 'OTHER';
  const map = { Protoss: 'P', Terran: 'T', Zerg: 'Z' };
  const code = cards
    .map((r) => map[r] || 'X')
    .sort()
    .join('');
  if (['PPP', 'PPT', 'PPZ', 'PTZ'].includes(code)) return code === 'PTZ' ? 'PZT' : code;
  return 'OTHER';
}

function normalizeSetEntry(entry) {
  if (!entry) return [];
  if (Array.isArray(entry)) {
    return entry
      .map((e) => ({
        id: e?.id || e?.user_id || null,
        by_id: e?.by_id || null,
        race: e?.race || null,
      }))
      .filter((e) => e.id);
  }

  if (Array.isArray(entry.players) && Array.isArray(entry.races)) {
    return entry.players.map((id, idx) => ({
      id,
      by_id: null,
      race: entry.races[idx] || null,
    })).filter((e) => e.id);
  }

  const singleId = entry.id || entry.user_id;
  if (singleId) {
    return [{ id: singleId, by_id: entry.by_id || null, race: entry.race || null }];
  }

  return [];
}

/**
 * MatchDetailModal 컴포넌트
 *
 * 경기 상세 정보를 팝업으로 표시합니다.
 * 좌우 화살표로 이전/다음 경기를 탐색하고, 우상단 ✕ 버튼으로 닫습니다.
 *
 * @param {object} props
 * @param {Array}  props.matches      - 전체 경기 목록
 * @param {number} props.index        - 현재 표시 중인 경기의 인덱스
 * @param {object} props.profileCache - id → by_id 매핑
 * @param {Function} props.onClose    - 닫기 콜백
 * @param {Function} props.onPrev     - 이전 경기 이동 콜백
 * @param {Function} props.onNext     - 다음 경기 이동 콜백
 */
function MatchDetailModal({ matches, index, profileCache, onClose, onPrev, onNext }) {
  const m = matches[index];
  const overlayRef = useRef(null);
  /** 현재 경기의 세트별 결과 */
  const [sets, setSets] = useState([]);
  const [expandedSetNo, setExpandedSetNo] = useState(null);

  // 경기가 바뀔 때마다 match_sets 조회
  useEffect(() => {
    if (!m?.id || !isSupabaseConfigured) return;
    let cancelled = false;
    supabase
      .from('match_sets')
      .select('set_number, winner_team, race_cards, combo_code, status, team_a_entry, team_b_entry')
      .eq('match_id', m.id)
      .order('set_number', { ascending: true })
      .then(({ data }) => {
        if (!cancelled) {
          const list = data || [];
          setSets(list);
          setExpandedSetNo(list[0]?.set_number || null);
        }
      });
    return () => { cancelled = true; };
  }, [m?.id]);

  // ESC 키로 닫기
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onNext();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, onPrev, onNext]);

  // 오버레이 바깥 클릭으로 닫기
  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  if (!m) return null;

  const isFinished = m.status === '완료';
  const isOngoing = m.status === '진행중';
  const teamA = m.team_a_ids || [];
  const teamB = m.team_b_ids || [];
  const teamARaces = m.team_a_races || [];
  const teamBRaces = m.team_b_races || [];
  const maxRows = Math.max(teamA.length, teamB.length);
  const matchFormat = m.match_type === '5v5' ? 'BO7 (4선승)' : 'BO5 (3선승)';

  // 승패 계산 (완료 경기만)
  let resultLabel = null;
  if (isFinished) {
    const sa = m.score_a ?? 0;
    const sb = m.score_b ?? 0;
    if (sa > sb) resultLabel = { a: '승', b: '패' };
    else if (sb > sa) resultLabel = { a: '패', b: '승' };
    else resultLabel = { a: '무', b: '무' };
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-2 sm:px-4"
      onClick={handleOverlayClick}
    >
      <div className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-[#0A1128] border border-cyan-500/50 shadow-[0_0_40px_rgba(6,182,212,0.3)] rounded-sm font-mono select-none">

        {/* 상단 바 */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-cyan-500/30 bg-cyan-950/20">
          <span className="text-cyan-400 text-xs tracking-widest">
            [ {m.match_type || '-'} · {matchFormat} ] {formatDate(m.created_at)}
          </span>
          <button
            onClick={onClose}
            aria-label="닫기"
            className="text-gray-400 hover:text-white transition-colors text-lg leading-none ml-4"
          >
            ✕
          </button>
        </div>

        {/* 상태 배지 */}
        <div className="flex justify-center pt-3 pb-1">
          <span className={`text-[11px] font-black px-3 py-0.5 rounded-full ${getStatusStyle(m.status)}`}>
            {isOngoing ? '진행중' : m.status || '-'}
          </span>
        </div>

        {/* 스코어 */}
        <div className="flex justify-center items-center gap-4 py-2">
          {isFinished ? (
            <>
              <span className={`text-2xl font-black ${resultLabel?.a === '승' ? 'text-cyan-300' : 'text-gray-500'}`}>
                {resultLabel?.a}
              </span>
              <span className="text-white font-black text-2xl tracking-widest">
                {m.score_a ?? '-'} : {m.score_b ?? '-'}
              </span>
              <span className={`text-2xl font-black ${resultLabel?.b === '승' ? 'text-cyan-300' : 'text-gray-500'}`}>
                {resultLabel?.b}
              </span>
            </>
          ) : isOngoing ? (
            <span className="text-red-300 font-black text-xl tracking-widest animate-pulse">
              {m.score_a ?? 0} : {m.score_b ?? 0} 진행중
            </span>
          ) : (
            <span className="text-gray-500 text-sm">VS</span>
          )}
        </div>

        {/* 팀 목록 (종족 포함) */}
        <div className="grid grid-cols-[1fr_auto_1fr] gap-x-2 px-4 pb-3 mt-1">
          {/* A팀 헤더 */}
          <div className="text-cyan-400 text-xs text-center font-bold pb-1 border-b border-cyan-500/20">A팀</div>
          <div className="border-b border-transparent pb-1" />
          {/* B팀 헤더 */}
          <div className="text-cyan-400 text-xs text-center font-bold pb-1 border-b border-cyan-500/20">B팀</div>

          {/* 가운데 VS 세로선 */}
          {Array.from({ length: maxRows }).map((_, i) => (
            <React.Fragment key={i}>
              <div className="py-1 text-center leading-snug">
                {teamARaces[i] && (
                  <span className="text-yellow-500/80 text-[10px] mr-1">[{raceLabel(teamARaces[i])}]</span>
                )}
                <span className="text-slate-200 text-sm">
                  {profileCache[teamA[i]] ?? (teamA[i] ? '…' : '')}
                </span>
              </div>
              <div className="py-1 flex items-center justify-center">
                {i === Math.floor(maxRows / 2) ? (
                  <span className="text-gray-600 text-xs font-bold px-1">VS</span>
                ) : (
                  <span className="text-gray-700 text-xs px-1">│</span>
                )}
              </div>
              <div className="py-1 text-center leading-snug">
                <span className="text-slate-200 text-sm">
                  {profileCache[teamB[i]] ?? (teamB[i] ? '…' : '')}
                </span>
                {teamBRaces[i] && (
                  <span className="text-yellow-500/80 text-[10px] ml-1">[{raceLabel(teamBRaces[i])}]</span>
                )}
              </div>
            </React.Fragment>
          ))}

          {maxRows === 0 && (
            <div className="col-span-3 text-center text-gray-600 text-xs py-4">참여 정보 없음</div>
          )}
        </div>

        {/* 세트별 결과 + 클릭 상세 */}
        {sets.length > 0 && (
          <div className="px-4 pb-4 pt-3 border-t border-cyan-500/10 mx-4">
            <div className="text-cyan-500/70 text-[10px] font-bold tracking-widest mb-2">SET RESULTS (조합 클릭 시 엔트리 확인)</div>
            <div className="space-y-1.5">
              {sets.map((s) => {
                const isActive = !s.winner_team;
                const isA = s.winner_team === 'A';
                const isB = s.winner_team === 'B';
                const combo = s.combo_code || raceComboCode(s.race_cards);
                const expanded = expandedSetNo === s.set_number;
                const teamAEntry = normalizeSetEntry(s.team_a_entry);
                const teamBEntry = normalizeSetEntry(s.team_b_entry);
                return (
                  <div key={s.set_number} className="rounded border border-cyan-500/15 bg-slate-950/40">
                    <div className="flex items-center justify-between px-2 py-1.5 text-[11px]">
                      <span className="text-slate-500">SET {s.set_number}</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`px-1.5 py-0.5 rounded ${isA ? 'bg-blue-900/40 text-blue-300' : 'text-slate-500'}`}>A</span>
                        <button
                          type="button"
                          onClick={() => setExpandedSetNo(expanded ? null : s.set_number)}
                          className="px-2 py-0.5 rounded border border-cyan-500/30 text-cyan-300 hover:bg-cyan-900/20 transition"
                        >
                          {combo}
                        </button>
                        <span className={`px-1.5 py-0.5 rounded ${isB ? 'bg-red-900/40 text-red-300' : 'text-slate-500'}`}>B</span>
                      </div>
                      <span className="text-slate-500">{isActive ? '진행중' : raceCardsLabel(s.race_cards)}</span>
                    </div>

                    {expanded && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border-t border-cyan-500/10 p-2 text-xs">
                        <div className="rounded border border-blue-500/20 bg-blue-950/10 p-2">
                          <div className="text-blue-300 text-[11px] font-bold mb-1">A팀 엔트리</div>
                          {teamAEntry.length === 0 ? (
                            <div className="text-slate-500">기록 없음</div>
                          ) : (
                            teamAEntry.map((e) => (
                              <div key={`A-${s.set_number}-${e.id}`} className="flex items-center justify-between py-0.5">
                                <span className="text-slate-200">{e.by_id || profileCache[e.id] || '...'}</span>
                                <span className="text-yellow-400">{raceLabel(e.race)}</span>
                              </div>
                            ))
                          )}
                        </div>
                        <div className="rounded border border-red-500/20 bg-red-950/10 p-2">
                          <div className="text-red-300 text-[11px] font-bold mb-1">B팀 엔트리</div>
                          {teamBEntry.length === 0 ? (
                            <div className="text-slate-500">기록 없음</div>
                          ) : (
                            teamBEntry.map((e) => (
                              <div key={`B-${s.set_number}-${e.id}`} className="flex items-center justify-between py-0.5">
                                <span className="text-slate-200">{e.by_id || profileCache[e.id] || '...'}</span>
                                <span className="text-yellow-400">{raceLabel(e.race)}</span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 좌우 네비게이션 버튼 */}
        <button
          onClick={onPrev}
          disabled={index <= 0}
          aria-label="이전 경기"
          className="absolute top-1/2 -translate-y-1/2 -left-11 text-cyan-400 hover:text-cyan-200 disabled:text-gray-700 disabled:cursor-not-allowed text-3xl transition-colors"
        >
          ‹
        </button>
        <button
          onClick={onNext}
          disabled={index >= matches.length - 1}
          aria-label="다음 경기"
          className="absolute top-1/2 -translate-y-1/2 -right-11 text-cyan-400 hover:text-cyan-200 disabled:text-gray-700 disabled:cursor-not-allowed text-3xl transition-colors"
        >
          ›
        </button>

        {/* 페이지 표시 */}
        <div className="text-center text-gray-600 text-[10px] pb-2 tracking-widest">
          {index + 1} / {matches.length}
        </div>
      </div>
    </div>
  );
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
  /** 상세 팝업에서 현재 선택된 경기 인덱스 (null이면 닫힘) */
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
/**
 * MatchRecords 프로필 캐시
 * 키: user.id (Supabase UUID — 불변 식별자)
 * 값: 표시명 (by_id, 없으면 '알 수 없음')
 */
  const [profileCache, setProfileCache] = useState({});

  /**
  * ladder_matches 테이블에서 최신 경기 목록을 불러옵니다.
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
          .select('id, match_type, status, score_a, score_b, team_a_ids, team_b_ids, team_a_races, team_b_races, created_at')
          .in('status', ['완료', '진행중', '제안중'])
          .order('created_at', { ascending: false })
            .limit(300)
      );
      if (fetchError) throw fetchError;
      setMatches(data || []);
          setCurrentPage(1);

      // 경기에 참여한 모든 사용자 ID를 모아 프로필 일괄 조회
      const allIds = new Set();
      (data || []).forEach((m) => {
        (m.team_a_ids || []).forEach((id) => allIds.add(id));
        (m.team_b_ids || []).forEach((id) => allIds.add(id));
      });
      if (allIds.size > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, by_id')
          .in('id', Array.from(allIds));
        const cache = {};
        (profiles || []).forEach((p) => {
          cache[p.id] = p.by_id || '알 수 없음';
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

  const totalPages = Math.max(1, Math.ceil(matches.length / PAGE_SIZE));
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pagedMatches = matches.slice(pageStart, pageStart + PAGE_SIZE);

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
                {pagedMatches.map((m, idx) => (
                  <tr
                    key={m.id}
                    onClick={() => setSelectedIndex(idx)}
                    className={`border-b border-cyan-500/10 transition-colors hover:bg-cyan-950/10 cursor-pointer ${
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
              {pagedMatches.map((m, idx) => (
                <div
                  key={m.id}
                  onClick={() => setSelectedIndex(idx)}
                  className="px-4 py-4 flex flex-col gap-2 cursor-pointer active:bg-cyan-950/20"
                >
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

            <div className="flex items-center justify-between px-4 py-3 border-t border-cyan-500/15 bg-slate-950/50">
              <span className="text-[11px] text-slate-500">페이지 {currentPage} / {totalPages} · 총 {matches.length}경기</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="px-2.5 py-1 text-xs rounded border border-cyan-500/20 text-cyan-300 disabled:text-slate-600 disabled:border-slate-700"
                >
                  이전
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="px-2.5 py-1 text-xs rounded border border-cyan-500/20 text-cyan-300 disabled:text-slate-600 disabled:border-slate-700"
                >
                  다음
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 경기 상세 팝업 */}
      {selectedIndex !== null && (
        <MatchDetailModal
          matches={pagedMatches}
          index={selectedIndex}
          profileCache={profileCache}
          onClose={() => setSelectedIndex(null)}
          onPrev={() => setSelectedIndex((i) => Math.max(0, i - 1))}
          onNext={() => setSelectedIndex((i) => Math.min(pagedMatches.length - 1, i + 1))}
        />
      )}
    </div>
  );
}

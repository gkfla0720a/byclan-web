/**
 * 파일명: RankingBoard.js
 *
 * 역할:
 *   ByClan 래더 MMR(매치메이킹 레이팅) 랭킹을 표 형태로 보여주는 컴포넌트입니다.
 *   Supabase의 profiles 테이블에서 클랜원 이상의 유저 목록을 MMR 내림차순으로 조회하여
 *   순위, 닉네임, 종족, MMR, 전적(승/패), 승률을 표시합니다.
 *
 * 주요 기능:
 *   - profiles 테이블에서 visitor/applicant/expelled 제외 후 순위 표시
 *   - 테스트 계정 데이터 필터링 (filterVisibleTestData 활용)
 *   - 테스트 데이터에는 'TEST' 뱃지 표시
 *   - 로딩 중 / 오류 / 데이터 없음 상태별 메시지 표시
 *
 * 사용 방법:
 *   <RankingBoard />
 *   (별도의 props 없이 독립적으로 사용합니다.)
 */
'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabase'; // ✅ 수정1
import { filterVisibleTestData, isMarkedTestData } from '@/app/utils/testData';

/**
 * 래더 랭킹 보드 컴포넌트
 * Supabase의 profiles 테이블에서 랭킹 데이터를 불러와 표로 표시합니다.
 *
 * @returns {JSX.Element} MMR 랭킹 테이블 UI
 */
export default function RankingBoard() {
  /** 랭킹 데이터 배열. 각 항목은 플레이어 프로필 정보를 담습니다. */
  const [rankings, setRankings] = useState([]);
  /** 데이터 로딩 중 여부. true이면 "불러오는 중" 메시지를 표시합니다. */
  const [loading, setLoading] = useState(true);
  /** 데이터 조회 실패 시 오류 객체를 저장합니다. null이면 오류 없음. */
  const [error, setError] = useState(null);

  /**
   * 컴포넌트가 처음 화면에 나타날 때 랭킹 데이터를 한 번 불러옵니다.
   * - visitor(방문자), applicant(지원자), expelled(강퇴) 역할은 제외합니다.
   * - Clan_Point(MMR) 내림차순으로 정렬합니다.
   */
  useEffect(() => {
    const fetchRankings = async () => {
      try {
        const { data, error: fetchError } = await filterVisibleTestData(supabase
          .from('profiles')
          .select('id, ByID, race, Clan_Point, wins, losses')
          .neq('role', 'visitor')
          .neq('role', 'applicant')
          .neq('role', 'expelled')
          .order('Clan_Point', { ascending: false }));
        if (fetchError) throw fetchError;
        setRankings(data || []);
      } catch (err) {
        console.error('랭킹 로드 실패:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRankings();
  }, []);

  return (
    <div className="w-full max-w-5xl mx-auto animate-fade-in-down mt-4 sm:mt-8 font-mono">
      {/* 헤더 동일 */}
      <div className="flex justify-between items-end mb-4 px-2 sm:px-0 border-b border-cyan-500/50 pb-2">
        <h2 className="text-xl sm:text-2xl font-bold text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] tracking-widest">
          [ SYSTEM: LADDER MMR RANKING ]
        </h2>
        <span className="text-cyan-600 text-xs sm:text-sm animate-pulse">SUPABASE CONNECTED //</span>
      </div>
      
      <div className="bg-[#0A1128] border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.15)] rounded-sm overflow-hidden relative">
        <table className="w-full text-left border-collapse relative z-10 table-fixed">
          <thead>
            <tr className="border-b border-cyan-500/40 bg-cyan-950/10 text-cyan-300 text-xs uppercase tracking-widest">
              <th className="py-3 px-4 text-center w-[12%]">순위</th>
              <th className="py-3 px-4 w-[28%]">플레이어</th>
              <th className="py-3 px-4 text-center w-[14%]">종족</th>
              <th className="py-3 px-4 text-center w-[16%]">MMR</th>
              <th className="py-3 px-4 text-center w-[16%]">전적</th>
              <th className="py-3 px-4 text-center w-[14%]">승률</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="text-center py-8 text-cyan-600 animate-pulse">DB 데이터를 불러오는 중입니다...</td></tr>
            ) : error ? (
              <tr><td colSpan="6" className="text-center py-8 text-red-400">랭킹 데이터를 불러오지 못했습니다. 잠시 후 새로고침 해주세요.</td></tr>
            ) : rankings.length === 0 ? (
              <tr><td colSpan="6" className="text-center py-8 text-cyan-600">등록된 랭킹 데이터가 없습니다.</td></tr>
            ) : null}
            {rankings.map((player, index) => (  // ✅ index 추가
              <tr key={player.id} className="border-b border-cyan-800/50 hover:bg-cyan-900/30 transition-colors">
                <td className="py-3 px-4 text-center font-bold text-cyan-100">
                  {index + 1}  {/* ✅ 동적 랭킹 */}
                </td>
                <td className="py-3 px-4 font-medium text-cyan-50">
                  <div className="flex flex-col sm:flex-row gap-1 sm:items-center">
                    <span className="text-sm sm:text-base tracking-wide">{player.ByID || <span className="text-red-400">[ByID 없음]</span>}</span>
                    {isMarkedTestData(player) && <span className="text-[10px] text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded">TEST</span>}
                    <span className="text-[10px] text-cyan-600 sm:hidden">[{player.race}]</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-center text-sm text-cyan-400 hidden sm:table-cell">{player.race}</td>
                <td className="py-3 px-4 text-center font-bold text-cyan-300 text-sm sm:text-base drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]">
                  {player.Clan_Point}점
                </td>
                <td className="py-3 px-4 text-center text-sm text-gray-400 hidden md:table-cell">
                  <span className="text-emerald-400">{player.wins ?? 0}W</span> / <span className="text-red-400">{player.losses ?? 0}L</span>
                </td>
                <td className="py-3 px-4 text-center text-sm text-cyan-500 hidden sm:table-cell">
                  {(player.wins + player.losses) === 0 ? '0.0' : ((player.wins / (player.wins + player.losses)) * 100).toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
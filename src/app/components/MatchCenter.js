// 파일명: src/app/components/MatchCenter.js
'use client';

import React from 'react';
import { 
  useMatchCenter, 
  BET_AMOUNTS, 
  RACE_COMBOS, 
  RACE_ICONS, 
  formatTime, 
  getRaceCards 
} from '@/app/hooks/useMatchCenter'; 

export default function MatchCenter({ matchId, onExit }) {
  const {
    match, currentSet, betTimer, betTimerActive, myTeam, isRevealed, managementMode, 
    settlementStatus, settlementError, selectedEntryByTeam, betTeam, betAmount, bettingDone, 
    bettingLoading, betOdds, myClanPoint, raceCombo, showRaceSelector, isManagementRole, 
    canReportSetResult, perspectiveTeam, editingTeam, selectedEntry, remainingRequiredCombos, 
    matchEnded, isLadderMatch, matchFormat, canBetOnA, canBetOnB, teamACaptainId, teamBCaptainId,
    setBetTeam, setBetAmount, setShowRaceSelector, setRaceCombo,
    toggleManagementMode, handleSelect, submitEntry, requestWithdraw, approveWithdraw, 
    forceRetract, handleSetWin, handleBet, handleSettlement, 
    getTeamMembersByLetter, currentTeamEntry, currentTeamReady, getRestStatus
  } = useMatchCenter(matchId);

  // 로딩 처리
  if (!match) {
    return <div className="py-20 text-center text-gray-500 font-mono animate-pulse">전장 진입 중...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-5 font-mono">

      {/* 1. 스코어보드 */}
      <div className="bg-[#07091a] rounded-2xl p-4 sm:p-6 flex justify-around items-center border border-yellow-500/20 shadow-[0_0_20px_rgba(245,158,11,0.08)] gap-3 sm:gap-0">
        <div className="text-center">
          <p className="text-blue-400 font-black text-xs mb-2 tracking-widest">TEAM A</p>
          <h2 className="text-4xl sm:text-6xl font-black text-white drop-shadow-lg">{match.score_a}</h2>
        </div>
        <div className="text-center">
          <div className="bg-gray-900/80 px-3 sm:px-4 py-1 rounded-full border border-gray-700 text-[9px] sm:text-[10px] text-gray-400 font-bold mb-3 uppercase tracking-widest whitespace-nowrap">
            {match.match_type}v{match.match_type} {isLadderMatch ? 'LADDER' : 'NORMAL'} — {matchFormat}
          </div>
          <p className="text-2xl sm:text-3xl font-black text-gray-700 italic">VS</p>
          <div className="mt-2 text-[10px] text-gray-600 uppercase tracking-wider">
            세트 {(match.match_sets?.length || 0) + 1}
          </div>
        </div>
        <div className="text-center">
          <p className="text-red-400 font-black text-xs mb-2 tracking-widest">TEAM B</p>
          <h2 className="text-4xl sm:text-6xl font-black text-white drop-shadow-lg">{match.score_b}</h2>
        </div>
      </div>

      {/* 2. 배팅 구역 */}
      <div className={`rounded-2xl border p-5 transition-all ${
        betTimerActive
          ? 'bg-[#0d0a00] border-yellow-600/40 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
          : 'bg-gray-900/40 border-gray-800'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {betTimerActive && <div className="w-2 h-2 bg-red-500 rounded-full animate-ping flex-shrink-0"></div>}
            <span className={`font-bold text-xs uppercase tracking-widest ${betTimerActive ? 'text-yellow-500' : 'text-gray-600'}`}>
              {betTimerActive ? '💰 베팅 창 열림' : bettingDone ? '✓ 베팅 완료' : '베팅 창 종료'}
            </span>
          </div>
          {betTimerActive && (
            <span className="text-white font-mono bg-red-700/70 px-4 py-1 rounded-full text-sm font-bold border border-red-600/40">
              {formatTime(betTimer)}
            </span>
          )}
        </div>

        {/* 실시간 배당 현황 */}
        {(betOdds.total_a > 0 || betOdds.total_b > 0) && (
          <div className="grid grid-cols-2 gap-2 mb-4 text-center">
            <div className="bg-blue-950/20 border border-blue-900/40 rounded-xl p-3">
              <p className="text-blue-400 text-[10px] font-bold uppercase tracking-wider mb-1">TEAM A 배팅 현황</p>
              <p className="text-white font-black text-sm">{Number(betOdds.total_a).toLocaleString()} CP</p>
              <p className="text-gray-500 text-[10px]">{betOdds.count_a}명 · 배당 <span className="text-blue-300 font-bold">{Number(betOdds.odds_a || 0).toFixed(2)}x</span></p>
            </div>
            <div className="bg-red-950/20 border border-red-900/40 rounded-xl p-3">
              <p className="text-red-400 text-[10px] font-bold uppercase tracking-wider mb-1">TEAM B 배팅 현황</p>
              <p className="text-white font-black text-sm">{Number(betOdds.total_b).toLocaleString()} CP</p>
              <p className="text-gray-500 text-[10px]">{betOdds.count_b}명 · 배당 <span className="text-red-300 font-bold">{Number(betOdds.odds_b || 0).toFixed(2)}x</span></p>
            </div>
          </div>
        )}

        {betTimerActive && !bettingDone && (
          <>
            <p className="text-gray-500 text-xs mb-3 font-sans">
              내 포인트: <span className="text-purple-400 font-bold">{myClanPoint.toLocaleString()} CP</span>
              {myTeam && <span className="ml-3 text-gray-600">※ 자신의 팀({myTeam})에는 베팅 불가</span>}
            </p>

            {/* 팀 선택 */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {['A', 'B'].map(team => {
                const canBet = team === 'A' ? canBetOnA : canBetOnB;
                const selected = betTeam === team;
                const teamOdds = team === 'A' ? Number(betOdds.odds_a || 0) : Number(betOdds.odds_b || 0);
                return (
                  <button
                    key={team}
                    onClick={() => canBet && setBetTeam(team)}
                    disabled={!canBet}
                    className={`p-4 rounded-xl border-2 font-black text-sm transition-all ${
                      selected
                        ? team === 'A'
                          ? 'border-blue-500 bg-blue-950/40 text-blue-300 shadow-[0_0_12px_rgba(59,130,246,0.3)]'
                          : 'border-red-500 bg-red-950/40 text-red-300 shadow-[0_0_12px_rgba(239,68,68,0.3)]'
                        : canBet
                          ? team === 'A'
                            ? 'border-blue-800/40 bg-blue-950/10 text-blue-600 hover:border-blue-600 hover:text-blue-400'
                            : 'border-red-800/40 bg-red-950/10 text-red-600 hover:border-red-600 hover:text-red-400'
                          : 'border-gray-800 bg-gray-900/20 text-gray-700 cursor-not-allowed opacity-40'
                    }`}
                  >
                    {team === 'A' ? '🔵 TEAM A' : '🔴 TEAM B'}
                    {teamOdds > 0 && <div className="text-[10px] font-normal mt-0.5 opacity-70">{teamOdds.toFixed(2)}x 배당</div>}
                    {!canBet && <div className="text-[10px] font-normal mt-0.5">내 팀</div>}
                  </button>
                );
              })}
            </div>

            {/* 금액 선택 */}
            <div className="flex flex-wrap gap-2 mb-4">
              {BET_AMOUNTS.map(amt => (
                <button
                  key={amt}
                  onClick={() => setBetAmount(betAmount === amt ? null : amt)}
                  disabled={amt > myClanPoint}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    betAmount === amt
                      ? 'bg-yellow-600 text-white shadow-[0_0_8px_rgba(245,158,11,0.4)]'
                      : amt > myClanPoint
                        ? 'bg-gray-900 text-gray-700 border border-gray-800 cursor-not-allowed opacity-40'
                        : 'bg-gray-900 border border-gray-700 text-gray-400 hover:border-yellow-600 hover:text-yellow-400'
                  }`}
                >
                  {amt.toLocaleString()}P
                </button>
              ))}
            </div>

            <button
              onClick={handleBet}
              disabled={!betTeam || !betAmount || bettingLoading || !betTimerActive}
              className="w-full py-3 rounded-xl font-black text-sm transition-all disabled:opacity-30 bg-yellow-600 hover:bg-yellow-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.3)]"
            >
              {bettingLoading
                ? '처리 중...'
                : betTeam && betAmount
                  ? `${betTeam}팀에 ${betAmount.toLocaleString()}P 베팅`
                  : '팀과 금액을 선택하세요'}
            </button>
          </>
        )}

        {bettingDone && (
          <p className="text-center text-green-400 text-sm font-bold">
            ✓ {betTeam}팀에 {betAmount?.toLocaleString()}P 베팅 완료
          </p>
        )}

        {!betTimerActive && !bettingDone && (
          <p className="text-center text-gray-600 text-sm">베팅 창이 닫혔습니다 (세트 시작 5분 이내)</p>
        )}
      </div>

      {/* 3. 엔트리 제출 구역 */}
      <div className="bg-[#0a0e1e] p-4 sm:p-6 rounded-2xl border border-gray-700/50 shadow-xl">
        <div className="flex flex-col gap-3 mb-6 border-b border-gray-700/50 pb-4">
          <div className="flex flex-wrap justify-between items-center gap-2">
            <h4 className="text-white font-black text-base tracking-wider">
              ROUND {match.match_sets?.length || 1} ENTRY
            </h4>
            <div className="flex flex-wrap items-center gap-2 justify-end">
              {currentSet?.race_cards?.map((r, i) => (
                <span key={i} className="w-8 h-8 bg-gray-900 border border-cyan-600/40 rounded-lg flex items-center justify-center text-cyan-400 font-black text-xs">
                  {RACE_ICONS[r] || r}
                </span>
              ))}
              {myTeam && match.score_a !== undefined && (
                <button
                  onClick={() => setShowRaceSelector(!showRaceSelector)}
                  className="ml-2 text-xs text-gray-500 hover:text-cyan-400 border border-gray-700 px-2 py-1 rounded transition-colors"
                >
                  종족 선택
                </button>
              )}
            </div>
          </div>

          <div className="text-[11px] text-gray-500">
            현재 시야:{' '}
            {perspectiveTeam === 'D'
              ? '운영진(D팀) — 양 팀 동시 열람·수정'
              : perspectiveTeam === 'A' ? 'A팀 엔트리 화면'
              : perspectiveTeam === 'B' ? 'B팀 엔트리 화면'
              : '관전자(C팀) 화면'}
            {!isRevealed && perspectiveTeam !== 'D' && <span className="ml-2 text-gray-600">(공개 전 상대 엔트리는 보이지 않습니다)</span>}
          </div>

          {isManagementRole && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                onClick={toggleManagementMode}
                className={`px-3 py-1.5 text-xs rounded-lg border font-bold transition-colors ${managementMode ? 'border-emerald-500 text-emerald-300 bg-emerald-950/20' : 'border-gray-700 text-gray-400 hover:border-gray-500'}`}
              >
                실시간 관리모드 (D팀) {managementMode ? 'ON' : 'OFF'}
              </button>

              {managementMode && (
                <span className="text-[10px] text-emerald-400/70 font-sans">↔ 양 팀 엔트리 동시 열람·수정. 상대방 동의 없이 수정 가능.</span>
              )}
            </div>
          )}
        </div>

        {/* 종족 선택 패널 */}
        {showRaceSelector && (
          <div className="mb-5 p-4 rounded-xl bg-gray-900/60 border border-gray-700">
            <p className="text-gray-500 text-xs mb-3 uppercase tracking-wider">다음 세트 종족 선택 (패배팀 선택권)</p>
            {remainingRequiredCombos.length > 0 && (
              <p className="text-[11px] text-yellow-500 mb-3">
                필수 종족전 우선 규칙: {remainingRequiredCombos.join(', ')} 먼저 진행 후 재선택 가능
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              {RACE_COMBOS.map(combo => (
                <button
                  key={combo.id}
                  disabled={remainingRequiredCombos.length > 0 && !remainingRequiredCombos.includes(combo.id)}
                  onClick={() => { setRaceCombo(combo.id); setShowRaceSelector(false); }}
                  className={`px-3 py-2 rounded-lg text-xs font-bold transition-all border ${
                    raceCombo === combo.id
                      ? 'border-cyan-500 bg-cyan-950/30 text-cyan-300'
                      : 'border-gray-700 text-gray-400 hover:border-gray-500'
                  } ${
                    remainingRequiredCombos.length > 0 && !remainingRequiredCombos.includes(combo.id)
                      ? 'opacity-35 cursor-not-allowed hover:border-gray-700'
                      : ''
                  }`}
                >
                  {combo.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 팀 현황 (A/B 시야 분리 + 관전자 C 시야 + 운영진 D팀 동시 시야) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 mb-6">
          {['A', 'B'].map((t) => {
            const canSeeEntryBeforeReveal = !isRevealed && (perspectiveTeam === t || perspectiveTeam === 'D');
            const teamEntry = currentTeamEntry(t);
            const ready = currentTeamReady(t);
            const withdrawReq = t === 'A'
              ? Boolean(currentSet?.team_a_withdraw_req)
              : Boolean(currentSet?.team_b_withdraw_req);
            const isMyTeam = myTeam === t;
            const isOpponentTeam = myTeam === (t === 'A' ? 'B' : 'A');
            const canWithdraw = ready && !currentSet?.winner_team;

            return (
              <div key={t} className={`p-4 rounded-xl border-2 border-dashed transition-all ${
                t === 'A' ? 'border-blue-900/60 bg-blue-900/5' : 'border-red-900/60 bg-red-900/5'
              }`}>
                <div className="flex justify-between items-center mb-3">
                  <p className={`font-black text-xs tracking-widest ${t === 'A' ? 'text-blue-500' : 'text-red-500'}`}>
                    TEAM {t}
                  </p>
                  {ready && !currentSet?.winner_team && (
                    <span className="text-[9px] text-emerald-500 font-bold">✓ 제출</span>
                  )}
                </div>

                {isRevealed || canSeeEntryBeforeReveal ? (
                  <div className="space-y-2">
                    {teamEntry.length > 0 ? teamEntry.map((p, i) => {
                      // 💡 [추가] 이 선수가 양 팀의 캡틴(최고 MMR) 중 한 명인지 확인합니다.
                      const isCaptain = p.id === teamACaptainId || p.id === teamBCaptainId;
                      
                      return (
                        <div 
                          key={i} 
                          className={`p-2.5 rounded-lg border text-xs text-center font-bold relative transition-all ${
                            isCaptain 
                              ? 'bg-yellow-900/30 border-yellow-500/50 text-yellow-300 shadow-[0_0_10px_rgba(234,179,8,0.2)]' // 👑 팀장 특별 스타일
                              : 'bg-gray-900/60 border-gray-800 text-white' // 일반 팀원 스타일
                          }`}
                        >
                          {/* 👑 팀장 뱃지 (왼쪽 위에 통통 튀는 왕관) */}
                          {isCaptain && (
                            <span className="absolute -top-2 -left-2 text-lg drop-shadow-md animate-bounce" title="팀 대표 (최고 점수)">
                              👑
                            </span>
                          )}
                          
                          {p.by_id}
                          <span className={isCaptain ? "text-yellow-500 ml-2" : "text-cyan-400 ml-2"}>
                            ({RACE_ICONS[p.race] || p.race})
                          </span>
                          
                          {/* 👑 본인이 팀장일 때만 보이는 특별한 메시지 */}
                          {isCaptain && p.id === myUserId && (
                            <p className="text-[9px] text-yellow-500/80 mt-1 font-normal tracking-tighter">
                              당신은 팀의 승패를 결정할 권한이 있습니다.
                            </p>
                          )}
                        </div>
                      );
                    }) : (
                      <p className="text-center text-gray-600 text-[10px] italic">아직 제출된 엔트리가 없습니다.</p>
                    )}
                  </div>
                ) : (
                  <div className="h-20 flex flex-col items-center justify-center gap-2">
                    {ready ? (
                      <p className="text-emerald-500 font-bold text-[10px] tracking-wider">제출 완료 (비공개)</p>
                    ) : (
                      <p className="text-gray-700 italic text-[10px] animate-pulse">엔트리 작성 중...</p>
                    )}
                  </div>
                )}

                {/* 철회 요청/승인/강제 철회 버튼 */}
                {!currentSet?.winner_team && (
                  <div className="mt-3 space-y-1.5">
                    {isMyTeam && canWithdraw && !withdrawReq && (
                      <button
                        onClick={() => requestWithdraw(t)}
                        className="w-full py-1.5 text-[10px] rounded-lg border border-yellow-700/60 text-yellow-500 hover:border-yellow-500 hover:text-yellow-300 transition-colors font-bold"
                      >
                        엔트리 수정 요청
                      </button>
                    )}
                    {isMyTeam && canWithdraw && withdrawReq && (
                      <p className="text-center text-yellow-500/70 text-[10px] font-bold py-1">수정 요청 중… 상대방 승인 대기</p>
                    )}
                    {isOpponentTeam && withdrawReq && (
                      <button
                        onClick={() => approveWithdraw(t)}
                        className="w-full py-1.5 text-[10px] rounded-lg border border-cyan-600/60 text-cyan-400 hover:border-cyan-400 transition-colors font-bold"
                      >
                        {t}팀 수정 요청 승인
                      </button>
                    )}
                    {perspectiveTeam === 'D' && ready && (
                      <button
                        onClick={() => forceRetract(t)}
                        className="w-full py-1.5 text-[10px] rounded-lg border border-orange-700/50 text-orange-400 hover:border-orange-500 transition-colors font-bold"
                      >
                        강제 철회 (관리)
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 엔트리 작성/수정 (관리모드 D팀) */}
        {managementMode && isManagementRole && !currentSet?.winner_team && (
          <div className="pt-4 border-t border-gray-700/50 space-y-4">
            <p className="text-orange-400/80 text-[10px] uppercase tracking-wider font-bold">↕ D팀 관리 — 양 팀 엔트리 직접 수정</p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {['A', 'B'].map((t) => {
                const tEntry = selectedEntryByTeam[t];
                const tReady = currentTeamReady(t);
                return (
                  <div key={t} className={`space-y-2 p-3 rounded-xl border ${t === 'A' ? 'border-blue-800/40' : 'border-red-800/40'}`}>
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${t === 'A' ? 'text-blue-400' : 'text-red-400'}`}>
                      {t}팀 엔트리 {tReady ? '(제출됨 — 강제 수정)' : '관리'}
                    </p>
                    {(currentSet?.race_cards || getRaceCards(raceCombo)).map((race, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-gray-900/60 p-2 rounded-lg border border-gray-800">
                        <div className="w-7 h-6 bg-gray-900 rounded flex items-center justify-center text-yellow-500 font-black border border-yellow-600/30 text-[10px] shrink-0">
                          {RACE_ICONS[race] || race}
                        </div>
                        <select
                          className="flex-1 bg-transparent text-white text-xs outline-none cursor-pointer font-bold"
                          value={tEntry[idx]?.id || ''}
                          onChange={(e) => handleSelect(t, idx, e.target.value, race)}
                        >
                          <option value="" className="bg-gray-900">선수 선택</option>
                          {getTeamMembersByLetter(t).map((member) => {
                            const { count, canRest } = getRestStatus(member.id, t);
                            const isAlreadySelected = tEntry.some((se, i) => i !== idx && se.id === member.id);
                            return (
                              <option key={member.id} value={member.id} disabled={isAlreadySelected || !canRest} className="bg-gray-900">
                                {member.by_id} ({count}회){isAlreadySelected ? ' [이미선택]' : ''}{!canRest ? ' [한도]' : ''}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    ))}
                    <button
                      onClick={() => submitEntry(t)}
                      disabled={tEntry.some((e) => !e.id)}
                      className={`w-full py-2 rounded-lg font-black text-xs disabled:opacity-25 transition-all ${t === 'A' ? 'bg-blue-800 hover:bg-blue-700 text-white' : 'bg-red-800 hover:bg-red-700 text-white'}`}
                    >
                      {tEntry.every((e) => e.id) ? `${t}팀 제출 →` : '선수 배치 필요'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 일반 플레이어 엔트리 작성 */}
        {!managementMode && !isRevealed && editingTeam && !currentTeamReady(editingTeam) && (
          <div className="space-y-3 pt-4 border-t border-gray-700/50">
            <p className="text-gray-600 text-xs uppercase tracking-wider mb-2">내 팀 엔트리 작성</p>
            {(currentSet?.race_cards || getRaceCards(raceCombo)).map((race, idx) => (
              <div key={idx} className="flex items-center gap-3 bg-gray-900/60 p-3.5 rounded-xl border border-gray-800 hover:border-gray-600 transition-colors">
                <div className="w-10 h-9 bg-gray-900 rounded-lg flex items-center justify-center text-yellow-500 font-black border border-yellow-600/30 text-sm shrink-0">
                  {RACE_ICONS[race] || race}
                </div>
                <select
                  className="flex-1 bg-transparent text-white text-sm outline-none cursor-pointer font-bold"
                  value={selectedEntry[idx]?.id || ''}
                  onChange={(e) => handleSelect(editingTeam, idx, e.target.value, race)}
                >
                  <option value="" className="bg-gray-900">선수 선택</option>
                  {getTeamMembersByLetter(editingTeam).map((member) => {
                    const { count, canRest } = getRestStatus(member.id, editingTeam);
                    const isAlreadySelected = selectedEntry.some((se, i) => i !== idx && se.id === member.id);
                    const isWrongRace = member.race && member.race !== 'Random' && member.race !== race;
                    return (
                      <option
                        key={member.id}
                        value={member.id}
                        disabled={isAlreadySelected || !canRest || isWrongRace}
                        className="bg-gray-900"
                      >
                        {member.by_id} (휴식: {count}회)
                        {isWrongRace ? ` [종족 불일치]` : ''}
                        {isAlreadySelected ? ' [선택됨]' : ''}
                        {!canRest ? ' [휴식 한도]' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>
            ))}
            <button
              onClick={() => submitEntry(editingTeam)}
              disabled={selectedEntry.some((e) => !e.id)}
              className="w-full mt-4 py-4 bg-linear-to-r from-emerald-700 to-teal-700 hover:from-emerald-600 hover:to-teal-600 text-white font-black rounded-xl shadow-xl disabled:opacity-25 active:scale-98 transition-all text-sm tracking-wider"
            >
              {selectedEntry.every((e) => e.id) ? '엔트리 최종 제출 →' : '모든 슬롯에 선수를 배치하세요'}
            </button>
          </div>
        )}

        {/* 세트 결과 처리 영역 */}
        {canReportSetResult && (
          <div className="mt-5 pt-4 border-t border-gray-700/50">
            <p className="text-[10px] text-orange-400 font-bold mb-2 uppercase tracking-wider">
              {isManagementRole ? '운영진 세트 결과 처리' : '팀 캡틴 세트 결과 처리'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                onClick={() => handleSetWin('A')}
                disabled={!currentSet || currentSet?.status === 'completed'}
                className="py-2 rounded-lg bg-blue-900/50 border border-blue-700 text-blue-300 font-bold text-xs disabled:opacity-30"
              >
                TEAM A 세트 승리 확정
              </button>
              <button
                onClick={() => handleSetWin('B')}
                disabled={!currentSet || currentSet?.status === 'completed'}
                className="py-2 rounded-lg bg-red-900/50 border border-red-700 text-red-300 font-bold text-xs disabled:opacity-30"
              >
                TEAM B 세트 승리 확정
              </button>
            </div>
            
            {/* 최종 정산 버튼 영역 */}
            {matchEnded && (
              <div className="mt-6 pt-4 border-t border-yellow-500/30">
                <p className="text-[10px] text-yellow-400 font-bold mb-3 uppercase tracking-wider text-center">
                  최종 매치 정산 처리
                </p>
                <div className="flex flex-col items-center">
                  <button
                    onClick={handleSettlement}
                    disabled={settlementStatus === 'loading' || settlementStatus === 'success'}
                    className={`w-full py-3 text-sm rounded-xl font-black text-white transition-colors shadow-lg
                      ${settlementStatus === 'idle' ? 'bg-cyan-600 hover:bg-cyan-500' : ''}
                      ${settlementStatus === 'loading' ? 'bg-slate-500 cursor-not-allowed' : ''}
                      ${settlementStatus === 'success' ? 'bg-emerald-600 cursor-default' : ''}
                      ${settlementStatus === 'error' ? 'bg-rose-600 hover:bg-rose-500' : ''}
                    `}
                  >
                    {settlementStatus === 'idle' && '💰 매치 최종 정산 실행'}
                    {settlementStatus === 'loading' && '정산 처리 중... ⏳'}
                    {settlementStatus === 'success' && '정산 완료 ✅'}
                    {settlementStatus === 'error' && '정산 실패 (재시도 ↻)'}
                  </button>
                  
                  {settlementStatus === 'error' && (
                    <span className="text-rose-400 text-xs mt-2 font-mono break-all text-center">
                      실패 원인: {settlementError}
                    </span>
                  )}
                </div>
              </div>
            )}

            {!isManagementRole && (
              <p className="text-[10px] text-gray-500 mt-4">
                팀 캡틴만 세트 결과를 확정할 수 있습니다.
              </p>
            )}
          </div>
        )}
      </div>

      {/* 뒤로 버튼 */}
      <button
        onClick={onExit}
        className="w-full py-4 bg-gray-900/60 text-gray-600 text-xs font-bold rounded-xl hover:text-gray-400 hover:bg-gray-900 transition-colors uppercase tracking-widest border border-gray-800"
      >
        ← 래더 로비로 돌아가기
      </button>
    </div>
  );
}
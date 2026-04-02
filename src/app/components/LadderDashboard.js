'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/supabase';

export default function LadderDashboard() {
  const [profile, setProfile] = useState(null);
  const [waitingUsers, setWaitingUsers] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // ... (기존 fetchData 및 Subscription 로직 동일) ...

  // ⚖️ [핵심] 팀 밸런싱 알고리즘
  // 선택된 인원들의 점수 합산 차이가 가장 적은 조합을 찾아냅니다.
  const getBalancedTeams = (users) => {
    const size = users.length / 2;
    let bestDiff = Infinity;
    let bestCombination = { teamA: [], teamB: [] };

    // 조합 생성 및 밸런스 계산 (단순화된 알고리즘 예시)
    // 6인 기준 모든 경우의 수 중 합계 점수 차이가 최소인 팀 선정
    const combine = (start, combo) => {
      if (combo.length === size) {
        const teamA = combo;
        const teamB = users.filter(u => !teamA.includes(u));
        const sumA = teamA.reduce((sum, u) => sum + u.ladder_points, 0);
        const sumB = teamB.reduce((sum, u) => sum + u.ladder_points, 0);
        const diff = Math.abs(sumA - sumB);

        if (diff < bestDiff) {
          bestDiff = diff;
          bestCombination = { teamA, teamB };
        }
        return;
      }
      for (let i = start; i < users.length; i++) {
        combine(i + 1, [...combo, users[i]]);
      }
    };

    combine(0, []);
    return bestCombination;
  };

  // 🚀 전원 동의 시 매치 생성 및 자동 팀 배정
  const createMatch = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      // 1. 현재 대기 및 동의한 인원 확정
      const participants = waitingUsers.filter(u => u.vote_to_start);
      if (participants.length < 6 || participants.length % 2 !== 0) {
        alert("인원수가 맞지 않거나 전원 동의가 이루어지지 않았습니다.");
        return;
      }

      // 2. 밸런스 알고리즘 돌리기
      const { teamA, teamB } = getBalancedTeams(participants);

      // 3. DB에 경기 생성
      const { data: match, error: matchError } = await supabase
        .from('ladder_matches')
        .insert({
          host_id: profile.id,
          match_type: participants.length / 2,
          team_a: teamA.map(u => u.id),
          team_b: teamB.map(u => u.id),
          status: '진행중'
        })
        .select()
        .single();

      if (matchError) throw matchError;

      // 4. 참여자들의 대기 상태 해제 및 알림 발송
      const participantIds = participants.map(u => u.id);
      await supabase.from('profiles').update({ is_in_queue: false, vote_to_start: false }).in('id', participantIds);
      
      // 5. 알림 테이블에 기록 (전장에 투입되었다는 알림)
      await supabase.from('notifications').insert(
        participantIds.map(id => ({
          user_id: id,
          title: "⚔️ 전장 투입 완료!",
          message: `매치가 생성되었습니다. 팀 구성을 확인하고 게임을 시작하세요!`,
          link_to: '경기기록'
        }))
      );

      alert("매치가 성공적으로 생성되었습니다. 전장으로 이동합니다!");
    } catch (e) {
      alert("매치 생성 실패: " + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // ... (UI 렌더링 영역 동일) ...
}

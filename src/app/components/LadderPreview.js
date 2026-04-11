/**
 * 파일명: LadderPreview.js
 *
 * 역할:
 *   비회원(게스트)이거나 클랜원 등급이 없는 사용자에게 래더 시스템을
 *   미리보기 형태로 보여주는 컴포넌트입니다.
 *   실제 래더 기능은 잠금(블러) 처리되고, 가입/로그인을 유도합니다.
 *
 * 주요 기능:
 *   - Supabase profiles에서 대기열 또는 상위 래더 플레이어를 최대 5명 불러옴
 *   - 불러온 플레이어 정보를 블러(흐림) 처리된 UI로 표시
 *   - 사용자 상태(게스트 / 등급 부족)에 따라 다른 안내 메시지 표시
 *   - 래더 시스템의 주요 기능(랭킹, 베팅, 대기열)을 카드로 소개
 *
 * 사용 방법:
 *   <LadderPreview isGuest={true} />
 *
 *   - isGuest: 로그인하지 않은 방문자라면 true
 */
'use client';

import React, { useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from '@/supabase';
import { filterVisibleTestAccounts, filterVisibleTestData } from '@/app/utils/testData';
import { useNavigate } from '../hooks/useNavigate';

/**
 * 포인트를 받아 해당하는 래더 티어 이름을 반환합니다.
 * @param {number} mmr - 플레이어의 MMR 포인트
 * @returns {string} 티어 이름 (예: 'Gold', 'Platinum')
 */
function getTier(mmr) {
  if (mmr >= 2400) return 'Challenger';
  if (mmr >= 2200) return 'Master';
  if (mmr >= 1900) return 'Diamond';
  if (mmr >= 1600) return 'Platinum';
  if (mmr >= 1350) return 'Gold';
  if (mmr >= 1100) return 'Silver';
  return 'Bronze';
}

/**
 * 종족 영문명을 한글 약자로 변환합니다.
 * @param {string} race - 종족 이름 ('Protoss', 'Terran', 'Zerg', 'Random')
 * @returns {string} 한글 약자 ('프', '테', '저', '랜') 또는 '—'
 */
function getRaceLabel(race) {
  if (race === 'Protoss') return '프';
  if (race === 'Terran') return '테';
  if (race === 'Zerg') return '저';
  if (race === 'Random') return '랜';
  return '—';
}

/**
 * 래더 미리보기 컴포넌트 – 비회원/권한 없는 사용자에게 표시됩니다.
 * 실제 래더 UI는 블러(흐림) 처리되며, 가입/로그인 안내가 함께 표시됩니다.
 *
 * @param {boolean} isGuest - 로그인하지 않은 방문자 여부
 * @returns {JSX.Element} 래더 미리보기 화면
 */
export default function LadderPreview({ isGuest }) {
  /** useNavigate 훅: 페이지 이동 함수 (예: navigateTo('로그인')) */
  const navigateTo = useNavigate();
  /** 미리보기에 표시할 플레이어 목록 (최대 5명) */
  const [previewPlayers, setPreviewPlayers] = useState([]);
  /** 데이터 로딩 중 여부 - true이면 로딩 플레이스홀더 표시 */
  const [loading, setLoading] = useState(true);

  /**
   * 컴포넌트가 처음 화면에 나타날 때(마운트 시) 한 번 실행됩니다.
   * 대기열에 있는 플레이어를 우선 불러오고, 없으면 상위 래더 유저를 표시합니다.
   * 의존성 배열이 빈 배열([])이므로 최초 렌더링 시에만 실행됩니다.
   */
  useEffect(() => {
    const loadPreviewPlayers = async () => {
      if (!isSupabaseConfigured) {
        setPreviewPlayers([]);
        setLoading(false);
        return;
      }

      try {
        // 1단계: 현재 대기열에 있는 플레이어 최대 5명 조회
        const queueResult = await filterVisibleTestAccounts(
          supabase
            .from('profiles')
            .select('id, by_id, race, ladder_mmr, is_in_queue')
            .eq('is_in_queue', true)
            .order('ladder_mmr', { ascending: false })
            .limit(5)
        );

        let rows = queueResult.data || [];

        if (rows.length === 0) {
          // 2단계: 대기열이 비어 있으면 profiles 기준 상위 5명 조회
          const profileResult = await filterVisibleTestData(
            supabase
              .from('profiles')
              .select('id, by_id, race, ladder_mmr, is_in_queue')
              .neq('role', 'visitor')
              .neq('role', 'applicant')
              .neq('role', 'expelled')
              .order('ladder_mmr', { ascending: false })
              .limit(5)
          );
          rows = profileResult.data || [];
        }

        // 화면에 표시할 형태로 데이터 가공 후 상태에 저장
        setPreviewPlayers(
          rows.map((player, index) => ({
            id: player.id || `preview-${index}`,
            name: player.by_id || '[by_id 없음]',
            tier: getTier(player.ladder_mmr || 1000),
            pts: player.ladder_mmr || 1000,
            race: getRaceLabel(player.race),
            isInQueue: Boolean(player.is_in_queue),
          }))
        );
      } catch (error) {
        console.error('래더 미리보기 로딩 실패:', error);
        setPreviewPlayers([]);
      } finally {
        setLoading(false);
      }
    };

    loadPreviewPlayers();
  }, []);

  /**
   * 사용자 상태에 따른 안내 메시지를 결정합니다.
   * - 게스트(비로그인): 로그인 및 클랜원 등급 필요 안내
   * - 로그인했으나 등급 부족: 클랜원 등급 필요 안내
   */
  const accessMessage = isGuest
    ? '래더 참여는 로그인 후 클랜원 등급 이상이어야 합니다.'
    : '래더 참여는 클랜원(일반 클랜원 이상) 등급이 필요합니다.';

  return (
    <div className="w-full max-w-5xl mx-auto mt-6 px-2">
      {/* 안내 배너 */}
      <div className="mb-6 p-5 rounded-xl border border-cyan-500/30 bg-cyan-950/10 text-center">
        <div className="text-4xl mb-3">⚔️</div>
        <h2 className="text-2xl font-black text-cyan-400 mb-2" style={{ textShadow: '0 0 12px rgba(0,212,255,0.5)' }}>
          ByClan 래더 시스템
        </h2>
        <p className="text-gray-300 mb-1 text-sm">
          스타크래프트 빠른무한 3v3 · 4v4 · 5v5 내전 래더 — 실시간 대기열 & 포인트 베팅
        </p>
          <p className="text-gray-500 text-xs mb-4">{accessMessage}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {isGuest ? (
              <>
                <button
                  onClick={() => navigateTo('로그인')}
                className="px-6 py-2.5 rounded-lg font-bold text-sm btn-neon"
              >
                로그인하기
              </button>
              <button
                onClick={() => navigateTo('가입안내')}
                className="px-6 py-2.5 rounded-lg font-bold text-sm bg-yellow-500/10 border border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/20 transition-all"
              >
                클랜 가입 안내
              </button>
            </>
          ) : (
            <button
              onClick={() => navigateTo('가입안내')}
              className="px-6 py-2.5 rounded-lg font-bold text-sm btn-neon"
            >
              가입 안내 보기
            </button>
          )}
        </div>
      </div>

      {/* 래더 시스템 미리보기 (블러 처리) */}
      <div className="relative rounded-xl overflow-hidden border border-gray-700/50">
        {/* 오버레이 */}
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="text-5xl mb-3">🔒</div>
          <p className="text-white font-bold text-lg">클랜원 전용 기능</p>
          <p className="text-gray-400 text-sm mt-1">래더에 참여하려면 클랜에 가입하세요</p>
        </div>

        {/* 블러된 대기열 미리보기 */}
        <div className="ladder-preview-blur p-6 bg-[#0d0d14]">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-cyan-400">🟢 매칭 대기열 · {previewPlayers.length || 0}명 표시 중</h3>
            <span className="text-xs text-gray-500 border border-gray-700 px-2 py-1 rounded">4v4 래더</span>
          </div>
          <div className="space-y-2">
            {(loading ? Array.from({ length: 5 }).map((_, index) => ({ id: `loading-${index}`, name: '불러오는 중', tier: 'Loading', pts: 0, race: '…', isInQueue: false })) : previewPlayers).map((p, index) => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-900/60 border border-gray-800">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-cyan-900/50 border border-cyan-700/40 flex items-center justify-center text-xs font-bold text-cyan-400">{p.race}</span>
                  <span className="font-semibold text-sm text-gray-200">{p.name}</span>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-purple-400">{p.tier}</span>
                  <span className="text-yellow-400 font-bold">MMR {p.pts}점</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 p-4 rounded-lg bg-blue-900/20 border border-blue-700/30 text-center">
            <div className="text-blue-400 font-bold text-sm">
              {previewPlayers.some((player) => player.isInQueue)
                ? '실시간 대기열 기준 미리보기입니다.'
                : '현재 대기열이 비어 있어 상위 래더 유저 기준 미리보기를 표시합니다.'}
            </div>
            <button className="mt-2 px-5 py-2 rounded-lg text-sm font-bold bg-blue-500/20 border border-blue-400/40 text-blue-300 animate-pulse-neon">
              ⚡ 매치 시작 제안
            </button>
          </div>
        </div>
      </div>

      {/* 래더 시스템 소개 */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: '🏆', title: '랭킹 시스템', desc: '주력 콘텐츠는 레더 경쟁입니다. 승패와 MMR, 티어가 프로필과 랭킹에 반영됩니다.' },
          { icon: '💰', title: '포인트 베팅', desc: '경기 시작 후 5분간 관전 유저도 팀별 포인트 베팅에 참여할 수 있습니다.' },
          { icon: '🎮', title: '대기열 공개', desc: '대기 중이 아니어도 항상 대기열을 볼 수 있고, 팀 밸런스 중심으로 매치를 제안합니다.' },
        ].map((item) => (
          <div key={item.title} className="p-4 rounded-xl cyber-card">
            <div className="text-2xl mb-2">{item.icon}</div>
            <h4 className="font-bold text-sm text-cyan-400 mb-1">{item.title}</h4>
            <p className="text-gray-500 text-xs">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* 매치 시스템 추가 소개 */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { icon: '⚡', title: '실시간 대기열', desc: '매칭 최대 대기 20분. 대기열에 있는 모든 플레이어를 실시간으로 볼 수 있습니다. 인원이 모이면 매치 시작 제안 버튼 활성화.' },
          { icon: '🎯', title: '종족 선택 시스템', desc: '각 세트마다 전 세트 패배팀이 종족 조합을 선택합니다: 프프프/프프테/프프저/프저테/대포(랜덤). 전략적 선택이 승부를 가릅니다.' },
        ].map((item) => (
          <div key={item.title} className="p-4 rounded-xl cyber-card">
            <div className="text-2xl mb-2">{item.icon}</div>
            <h4 className="font-bold text-sm text-cyan-400 mb-1">{item.title}</h4>
            <p className="text-gray-500 text-xs">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

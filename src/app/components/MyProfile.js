/**
 * @file MyProfile.js
 * @역할 로그인한 유저 자신의 프로필 설정 페이지 컴포넌트
 * @주요기능
 *   - 클랜 닉네임(By_ 접두사) 설정 및 중복 확인
 *   - 주종족 선택 (Protoss / Terran / Zerg / Random)
 *   - 한줄 자기소개 수정
 *   - 래더(경쟁전) 전적 데이터 표시 (포인트, 티어, 승/패)
 *   - 보유 클랜 포인트 표시
 *   - 소셜 계정(Discord / Google) 연동 및 연동 해제
 *   - 로그아웃 기능
 *   - 개발자(developer) 등급에게만 보이는 개발자 콘솔 진입 버튼
 * @사용방법
 *   로그인된 유저만 접근 가능합니다. 프로필이 없으면 에러 메시지를 표시합니다.
 * @관련컴포넌트 DevConsole.js (개발자 콘솔), GuildManagement.js
 */
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase';
import { extractAccountIdFromAuthUser, isInternalAuthEmail } from '@/app/utils/accountId';
import { isMarkedTestAccount } from '@/app/utils/testData';
import { useNavigate } from '../hooks/useNavigate';
import { useAuthContext } from '../context/AuthContext';
import { invalidateCache } from '../utils/queryCache';

function normalizeProfileRow(profileData) {
  if (!profileData) return profileData;
  const clanPoint =
    typeof profileData.clan_point === 'number'
      ? profileData.clan_point
      : typeof profileData.points === 'number'
        ? profileData.points
        : 0;

  return {
    ...profileData,
    clan_point: clanPoint,
  };
}

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
 * MyProfile 컴포넌트
 * 현재 로그인한 유저가 자신의 클랜 프로필을 확인하고 수정할 수 있는 페이지입니다.
 */
export default function MyProfile() {
  const router = useRouter();
  /** 페이지 전환(탭 이동)을 위한 내비게이션 함수 */
  const navigateTo = useNavigate();
  /** AuthContext에서 전역 프로필 재조회 함수를 가져옵니다. */
  const { reloadProfile } = useAuthContext();
  /** Supabase profiles 테이블에서 불러온 전체 프로필 데이터 */
  const [profile, setProfile] = useState(null);
  /** 현재 계정의 내부 인증 이메일 (재인증용) */
  const [authEmail, setAuthEmail] = useState('');
  /** 현재 유저에게 표시할 로그인 아이디 */
  const [accountId, setAccountId] = useState('');
  /** 숨김 이메일 기반 로컬 계정 여부 */
  const [usesInternalLogin, setUsesInternalLogin] = useState(false);
  /** 프로필 데이터를 불러오는 중인지 여부 */
  const [loading, setLoading] = useState(true);
  /** 프로필 저장 요청이 진행 중인지 여부 (버튼 중복 클릭 방지) */
  const [isUpdating, setIsUpdating] = useState(false);

  // 소셜 계정 연동 상태
  /** Discord 연동 처리 중 여부 */
  const [discordLinking, setDiscordLinking] = useState(false);
  /** Google 연동 처리 중 여부 */
  const [googleLinking, setGoogleLinking] = useState(false);
  /** 연동 관련 메시지 (성공/에러) */
  const [linkMessage, setLinkMessage] = useState(null);

  // 수정용 입력 상태들
  /** By_ 접두사를 제외한 클랜 닉네임 입력값 (예: 'By_홍길동'에서 '홍길동') */
  const [clanNameInput, setClanNameInput] = useState(''); 
  /** 선택된 주종족 (Protoss / Terran / Zerg / Random / 미지정) */
  const [race, setRace] = useState('미지정');
  /** 한줄 자기소개 입력값 */
  const [intro, setIntro] = useState('');
  /** 닉네임 중복 확인 통과 여부. false이면 저장 버튼이 비활성화됩니다. */
  const [isNicknameAvailable, setIsNicknameAvailable] = useState(false);
  /** 최초 로드 시 DB에 저장된 원본 by_id 값 (중복 확인 시 본인 닉네임 허용 판단에 사용) */
  const [originalById, setOriginalById] = useState('');

  // ── 계정 보안 (아이디/비밀번호 변경) ─────────────────────────────────────
  /** 이메일 변경 입력값 */
  const [newEmail, setNewEmail] = useState('');
  /** 현재 비밀번호 (비밀번호 변경 재인증에 사용) */
  const [currentPassword, setCurrentPassword] = useState('');
  /** 새 비밀번호 입력값 */
  const [newPassword, setNewPassword] = useState('');
  /** 새 비밀번호 확인 입력값 */
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  /** 계정 보안 섹션 로딩 여부 */
  const [securityLoading, setSecurityLoading] = useState(false);
  /** 계정 보안 작업 결과 메시지 { type: 'success'|'error', text: string } */
  const [securityMsg, setSecurityMsg] = useState(null);

  /** 역할 코드를 한국어 표시 이름(+이모지)으로 변환하는 매핑 테이블 */
  const roleLabels = {
    developer: "👨‍💻 시스템 개발자",
    master: "👑 클랜 마스터",
    admin: "🛠️ 운영진",
    elite: "⚔️ 정예 클랜원",
    member: "🛡️ 일반 클랜원",
    rookie: "🌱 신입 클랜원",
    applicant: "📝 신규 가입자",
    visitor: "👤 방문자"
  };

  /**
   * 컴포넌트가 처음 마운트될 때 프로필 데이터를 불러오고
   * URL 파라미터에서 연동 결과 메시지를 읽습니다.
   */
  useEffect(() => {
    fetchProfileData();
    readLinkResultFromUrl();
  }, []);

  /**
   * Supabase에서 현재 유저의 프로필 및 래더 데이터를 불러옵니다.
   * By_ 접두사가 있는 닉네임이 있으면 래더 데이터도 함께 조회합니다.
   * @async
   */
  const fetchProfileData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setAuthEmail(user.email || '');
      setUsesInternalLogin(isInternalAuthEmail(user.email || ''));

      const [{ data: profileDataRaw }, { data: oauthData }, { data: ladderData }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('profile_oauth').select('discord_id, google_email, google_name, google_avatar_url, auth_provider').eq('user_id', user.id).maybeSingle(),
        supabase.from('ladder_rankings').select('ladder_mmr, wins, losses').eq('user_id', user.id).maybeSingle(),
      ]);
      const profileData = normalizeProfileRow({
        ...profileDataRaw,
        ...(oauthData || {}),
        ladder_mmr: ladderData?.ladder_mmr ?? 1500,
        wins: ladderData?.wins ?? 0,
        losses: ladderData?.losses ?? 0,
      });

      if (profileData) {
        setProfile(profileData);
        setRace(profileData.race || '미지정');
        setIntro(profileData.intro || '');
        
        const currentById = profileData.by_id || '';
        if (currentById.startsWith('By_')) {
          setClanNameInput(currentById.replace('By_', ''));
          setOriginalById(currentById);
          setIsNicknameAvailable(true); // 기존에 By_ 닉네임이 있으면 일단 활성화
        }

        setAccountId(extractAccountIdFromAuthUser(user, profileData));

      }
    } catch (error) {
      console.error("데이터 로드 에러:", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * URL 파라미터에서 소셜 계정 연동 결과를 읽어 메시지를 표시합니다.
   * 연동 성공: ?linked=discord|google
   * 연동 실패(충돌): ?error=discord_conflict|google_conflict|link_failed
   */
  const readLinkResultFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    const linked = params.get('linked');
    const errorParam = params.get('error');

    if (linked === 'discord') {
      setLinkMessage({ type: 'success', text: 'Discord 계정이 성공적으로 연동되었습니다.' });
    } else if (linked === 'google') {
      setLinkMessage({ type: 'success', text: 'Google 계정이 성공적으로 연동되었습니다.' });
    } else if (errorParam === 'discord_conflict') {
      setLinkMessage({ type: 'error', text: '이 Discord 계정은 이미 다른 계정에 연동되어 있습니다. 해당 계정에서 연동을 먼저 해제해주세요.' });
    } else if (errorParam === 'google_conflict') {
      setLinkMessage({ type: 'error', text: '이 Google 계정은 이미 다른 계정에 연동되어 있습니다. 해당 계정에서 연동을 먼저 해제해주세요.' });
    } else if (errorParam === 'link_failed') {
      setLinkMessage({ type: 'error', text: '소셜 계정 연동에 실패했습니다. 다시 시도해주세요.' });
    }

    // 메시지를 읽은 후 URL 파라미터를 정리합니다
    if (linked || errorParam) {
      const url = new URL(window.location.href);
      url.searchParams.delete('linked');
      url.searchParams.delete('error');
      window.history.replaceState({}, '', url.pathname + (url.search || ''));
    }
  };

  /**
   * Discord 계정 연동을 시작합니다.
   * Supabase linkIdentity API를 사용해 현재 세션에 Discord 계정을 추가합니다.
   * 콜백에서 충돌 감지가 이루어집니다.
   * @async
   */
  const handleLinkDiscord = async () => {
    setDiscordLinking(true);
    setLinkMessage(null);
    try {
      const { error } = await supabase.auth.linkIdentity({
        provider: 'discord',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/profile&link_provider=discord`
        }
      });
      if (error) throw error;
      // OAuth 리다이렉트가 발생하므로 여기까지 실행되지 않습니다
    } catch (err) {
      setLinkMessage({ type: 'error', text: 'Discord 연동 시작 실패: ' + err.message });
      setDiscordLinking(false);
    }
  };

  /**
   * Google 계정 연동을 시작합니다.
   * Supabase linkIdentity API를 사용해 현재 세션에 Google 계정을 추가합니다.
   * @async
   */
  const handleLinkGoogle = async () => {
    setGoogleLinking(true);
    setLinkMessage(null);
    try {
      const { error } = await supabase.auth.linkIdentity({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/profile&link_provider=google`
        }
      });
      if (error) throw error;
    } catch (err) {
      setLinkMessage({ type: 'error', text: 'Google 연동 시작 실패: ' + err.message });
      setGoogleLinking(false);
    }
  };

  /**
   * Discord 연동을 해제합니다.
   * - profiles 테이블에서 discord_id를 초기화합니다.
   * - Supabase Auth에서도 Discord identity를 제거합니다.
   * - Discord가 유일한 로그인 수단이면 로그아웃 후 홈으로 이동합니다.
   * @async
   */
  const handleDiscordUnlink = async () => {
    if (!confirm('Discord 연동을 해제하시겠습니까?\nDiscord가 유일한 로그인 수단인 경우 로그아웃됩니다.')) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const discordIdentity = user?.identities?.find((i) => i.provider === 'discord');
      const identityCount = user?.identities?.length || 0;

      const { error } = await supabase
        .from('profile_oauth')
        .update({ discord_id: null })
        .eq('user_id', profile.id);
      if (error) throw error;

      if (discordIdentity && identityCount > 1) {
        // 다른 로그인 수단이 있으므로 identity만 해제하고 로그아웃하지 않습니다
        await supabase.auth.unlinkIdentity(discordIdentity);
        await reloadProfile();
        await fetchProfileData();
        setLinkMessage({ type: 'success', text: 'Discord 연동이 해제되었습니다.' });
      } else {
        // Discord가 유일한 로그인 수단: 로그아웃 후 홈으로 이동
        await supabase.auth.signOut();
        localStorage.clear();
        router.push('/');
      }
    } catch (error) {
      alert('Discord 연동 해제 실패: ' + error.message);
    }
  };

  /**
   * Google 연동을 해제합니다.
   * - profiles 테이블에서 google_sub, google_email 등을 초기화합니다.
   * - Supabase Auth에서도 Google identity를 제거합니다.
   * - Google이 유일한 로그인 수단이면 로그아웃 후 홈으로 이동합니다.
   * @async
   */
  const handleGoogleUnlink = async () => {
    if (!confirm('Google 연동을 해제하시겠습니까?\nGoogle이 유일한 로그인 수단인 경우 로그아웃됩니다.')) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const googleIdentity = user?.identities?.find((i) => i.provider === 'google');
      const identityCount = user?.identities?.length || 0;

      const { error } = await supabase
        .from('profile_oauth')
        .update({ google_sub: null, google_email: null, google_name: null, google_avatar_url: null })
        .eq('user_id', profile.id);
      if (error) throw error;

      if (googleIdentity && identityCount > 1) {
        await supabase.auth.unlinkIdentity(googleIdentity);
        await reloadProfile();
        await fetchProfileData();
        setLinkMessage({ type: 'success', text: 'Google 연동이 해제되었습니다.' });
      } else {
        await supabase.auth.signOut();
        localStorage.clear();
        router.push('/');
      }
    } catch (error) {
      alert('Google 연동 해제 실패: ' + error.message);
    }
  };

  /**
   * 닉네임 입력 필드 변경 핸들러입니다.
   * 공백을 자동으로 제거하고, 값이 바뀌면 중복 확인 상태를 리셋합니다.
   * (단, 입력값이 원래 본인 닉네임과 동일하면 바로 사용 가능 상태로 유지합니다.)
   * @param {React.ChangeEvent<HTMLInputElement>} e - 입력 변경 이벤트
   */
  // 닉네임 입력 변경 핸들러
  const handleInputChange = (e) => {
    const value = e.target.value.replace(/\s/g, ''); // 공백 제거
    setClanNameInput(value);
    // 입력값이 바뀌면 다시 중복 확인을 하도록 설정 (단, 원래 자기 닉네임이면 허용)
    setIsNicknameAvailable(`By_${value}` === originalById);
  };

  /**
   * 입력한 닉네임(By_ 포함)이 이미 다른 유저가 사용 중인지 확인합니다.
   * 본인의 현재 닉네임과 동일하면 중복으로 처리하지 않습니다.
   * @async
   */
  // 닉네임 중복 확인
  const checkDuplicate = async () => {
    if (!clanNameInput.trim()) return alert('닉네임을 입력해 주세요.');
    const fullNickname = `By_${clanNameInput}`;

    if (fullNickname === originalById) {
      alert('현재 사용 중인 본인의 닉네임입니다.');
      setIsNicknameAvailable(true);
      return;
    }

    try {
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('by_id', fullNickname);

      if (count > 0) {
        alert(`'${fullNickname}'은(는) 이미 다른 유저가 사용 중입니다.`);
        setIsNicknameAvailable(false);
      } else {
        alert(`'${fullNickname}'은(는) 사용 가능한 닉네임입니다!`);
        setIsNicknameAvailable(true);
      }
    } catch (error) {
      alert('중복 확인 중 오류가 발생했습니다.');
    }
  };

  /**
   * 변경된 프로필 정보(닉네임, 종족, 자기소개)를 DB에 저장합니다.
   * 닉네임 중복 확인을 통과하지 않으면 저장이 차단됩니다.
   * 저장 성공 후 페이지를 새로고침하여 최신 데이터를 반영합니다.
   * @async
   */
  // 프로필 업데이트 저장
  const handleUpdate = async () => {
    if (!isNicknameAvailable) {
      alert('닉네임 중복 확인을 먼저 완료해 주세요.');
      return;
    }

    setIsUpdating(true);
    try {
      const { error } = await supabase.from('profiles').update({ 
        by_id: `By_${clanNameInput}`,
        race: race,
        intro: intro,
      }).eq('id', profile.id);

      if (error) throw error;
      alert('프로필이 성공적으로 업데이트되었습니다.');
      invalidateCache('ranking_board');
      await reloadProfile();
      fetchProfileData();
    } catch (error) {
      alert('업데이트 실패: ' + error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  /**
   * 현재 유저를 Supabase에서 로그아웃하고 홈으로 이동합니다.
   * 로컬 스토리지를 초기화하여 캐시된 세션 정보를 제거합니다.
   * @async
   */
  const handleLogout = async () => {
    if (confirm("로그아웃 하시겠습니까?")) {
      await supabase.auth.signOut();
      localStorage.clear();
      router.push('/');
    }
  };

  /**
   * 비밀번호 강도 검증
   * Supabase 설정: 최소 8자, 영문+숫자 필수
   */
  const validateNewPassword = (pw) => {
    if (!pw) return '새 비밀번호를 입력하세요.';
    if (pw.length < 8) return '비밀번호는 최소 8자 이상이어야 합니다.';
    if (!/[a-zA-Z]/.test(pw)) return '영문자가 포함되어야 합니다.';
    if (!/[0-9]/.test(pw)) return '숫자가 포함되어야 합니다.';
    return null;
  };

  /**
   * 이메일 변경 핸들러
   * Supabase "Secure email change" 활성화됨:
   * 기존 이메일과 새 이메일 양쪽 모두에 확인 링크가 발송됩니다.
   */
  const handleEmailChange = async () => {
    if (!newEmail.trim()) return setSecurityMsg({ type: 'error', text: '새 이메일 주소를 입력하세요.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) return setSecurityMsg({ type: 'error', text: '올바른 이메일 형식이 아닙니다.' });
    if (newEmail === authEmail) return setSecurityMsg({ type: 'error', text: '현재 이메일과 동일합니다.' });

    setSecurityLoading(true);
    setSecurityMsg(null);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
      setSecurityMsg({
        type: 'success',
        text: `확인 이메일이 발송되었습니다. 기존 주소(${authEmail})와 새 주소(${newEmail}) 양쪽의 링크를 모두 클릭해야 변경이 완료됩니다.`,
      });
      setNewEmail('');
    } catch (err) {
      setSecurityMsg({ type: 'error', text: '이메일 변경 실패: ' + err.message });
    } finally {
      setSecurityLoading(false);
    }
  };

  /**
   * 비밀번호 변경 핸들러
   * Supabase "Require current password" 활성화됨:
   * 현재 비밀번호로 재인증 후 새 비밀번호로 변경합니다.
   */
  const handlePasswordChange = async () => {
    const pwErr = validateNewPassword(newPassword);
    if (pwErr) return setSecurityMsg({ type: 'error', text: pwErr });
    if (newPassword !== confirmNewPassword) return setSecurityMsg({ type: 'error', text: '새 비밀번호가 일치하지 않습니다.' });
    if (!currentPassword) return setSecurityMsg({ type: 'error', text: '현재 비밀번호를 입력하세요.' });
    if (currentPassword === newPassword) return setSecurityMsg({ type: 'error', text: '새 비밀번호가 현재 비밀번호와 동일합니다.' });

    setSecurityLoading(true);
    setSecurityMsg(null);
    try {
      // 1단계: 현재 비밀번호로 재인증
      const { error: reAuthError } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: currentPassword,
      });
      if (reAuthError) throw new Error('현재 비밀번호가 올바르지 않습니다.');

      // 2단계: 새 비밀번호로 변경
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;

      setSecurityMsg({ type: 'success', text: '비밀번호가 성공적으로 변경되었습니다.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      setSecurityMsg({ type: 'error', text: err.message });
    } finally {
      setSecurityLoading(false);
    }
  };

  if (loading) return <div className="text-center py-24 text-gray-500 font-mono animate-pulse">LOADING...</div>;
  if (!profile) return <div className="text-center py-24 text-red-500">프로필 정보를 찾을 수 없습니다.</div>;

  const ladderMmr = profile.ladder_mmr ?? 1000;
  const ladderTier = getTier(ladderMmr);
  const ladderWins = profile.wins ?? 0;
  const ladderLosses = profile.losses ?? 0;

  // 권한 체크: 소문자로 변환하여 정확히 비교
  const currentRole = profile.role?.trim().toLowerCase();
  /** 현재 유저가 개발자 등급인지 여부 (개발자 콘솔 버튼 표시 여부 결정) */
  const isDeveloper = currentRole === 'developer';
  /** 화면에 표시할 현재 역할의 한국어 라벨 */
  const userRoleLabel = roleLabels[currentRole] || `👤 방문자 (${currentRole})`;

  return (
    <div className="w-full py-8 px-4 animate-fade-in font-sans relative">
      
      {/* ⚙️ 비밀 톱니바퀴 (오직 'developer' 등급에게만 보임) */}
      {isDeveloper && (
        <button 
          onClick={() => navigateTo('개발자')}
          className="absolute top-8 right-4 text-yellow-600 hover:text-yellow-400 p-2 hover:rotate-90 transition-all duration-300"
          title="시스템 개발자 콘솔 진입"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      )}

      <div className="mb-8 border-b border-gray-700 pb-4">
        <h2 className="text-3xl font-black text-white">내 프로필 설정</h2>
        <p className="text-yellow-500 font-bold mt-1 tracking-tight">{userRoleLabel} 모드로 접속 중</p>
        {isMarkedTestAccount(profile) && <p className="text-xs text-amber-300 mt-2">TEST ACCOUNT: 개발자 콘솔에서 언제든지 on/off 할 수 있는 테스트 계정입니다.</p>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 왼쪽 섹션: 회원 정보 수정 폼 */}
        <div className="lg:col-span-2 bg-gray-800 rounded-3xl p-6 sm:p-8 border border-gray-700 shadow-xl space-y-6">
          
        {/* by_id 미설정 경고 배너 */}
          {!originalById && (
            <div className="bg-red-900/30 border border-red-500/50 rounded-xl px-4 py-3 text-red-300 text-sm font-bold flex items-center gap-2">
              ⚠️ By닉네임이 설정되지 않았습니다. 아이디를 입력하고 중복 확인 후 저장해주세요.
            </div>
          )}

          {/* 1. 닉네임 설정 */}
          <div>
            <label className="block text-gray-400 text-xs font-bold mb-3 uppercase tracking-widest">1. 클랜 닉네임 (By_ ID)</label>
            <div className="flex gap-3">
              <div className="flex-1 flex items-center bg-gray-900 border border-gray-600 rounded-xl overflow-hidden focus-within:border-yellow-500 transition-colors">
                <span className="px-4 bg-gray-800 text-yellow-500 font-black text-sm border-r border-gray-700">By_</span>
                <input 
                  type="text" 
                  value={clanNameInput}
                  onChange={handleInputChange}
                  placeholder="아이디"
                  className="w-full p-3.5 bg-transparent text-white font-bold focus:outline-none"
                />
              </div>
              <button 
                onClick={checkDuplicate}
                className="px-6 py-3.5 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl text-sm transition-all border border-gray-600 shadow-lg"
              >
                중복 확인
              </button>
            </div>
            <p className={`text-[10px] mt-2 font-bold ${isNicknameAvailable ? 'text-emerald-400' : 'text-red-400'}`}>
              {isNicknameAvailable ? '✓ 사용 가능한 닉네임입니다.' : '⚠ 변경 시 중복 확인이 반드시 필요합니다.'}
            </p>
          </div>

          {/* 2. 종족 선택 */}
          <div>
            <label className="block text-gray-400 text-xs font-bold mb-3 uppercase tracking-widest">2. 주종족 선택</label>
            <select 
              value={race} 
              onChange={(e) => setRace(e.target.value)}
              className="w-full p-3.5 rounded-xl bg-gray-900 border border-gray-600 text-white font-bold text-sm focus:border-yellow-500 focus:outline-none transition-all cursor-pointer"
            >
              <option value="미지정">선택해 주세요</option>
              <option value="Protoss">프로토스 (Protoss)</option>
              <option value="Terran">테란 (Terran)</option>
              <option value="Zerg">저그 (Zerg)</option>
              <option value="Random">랜덤 (Random)</option>
            </select>
          </div>

          {/* 3. 자기소개 */}
          <div>
            <label className="block text-gray-400 text-xs font-bold mb-3 uppercase tracking-widest">3. 한줄 자기소개</label>
            <textarea 
              value={intro}
              onChange={(e) => setIntro(e.target.value)}
              placeholder="클랜원들에게 보여질 한마디를 입력하세요."
              rows="3"
              className="w-full p-4 rounded-xl bg-gray-900 border border-gray-600 text-white text-sm focus:border-yellow-500 focus:outline-none resize-none transition-all"
            ></textarea>
          </div>

          {/* 저장 버튼 */}
          <button 
            onClick={handleUpdate}
            disabled={isUpdating || !isNicknameAvailable}
            className={`w-full py-4 font-black text-lg rounded-2xl shadow-xl transition-all active:scale-95
              ${isNicknameAvailable && !isUpdating 
                ? 'bg-linear-to-r from-yellow-600 to-yellow-500 text-gray-900 hover:brightness-110' 
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}
          >
            {isUpdating ? '데이터 처리 중...' : '변경 사항 저장하기'}
          </button>

          {/* 소셜 계정 연동 */}
          <div className="pt-2 border-t border-gray-700">
            <label className="block text-gray-400 text-xs font-bold mb-4 uppercase tracking-widest">4. 소셜 계정 연동</label>

            {/* 연동 결과 메시지 */}
            {linkMessage && (
              <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-bold flex items-start gap-2 ${
                linkMessage.type === 'success'
                  ? 'bg-emerald-900/30 border border-emerald-500/50 text-emerald-300'
                  : 'bg-red-900/30 border border-red-500/50 text-red-300'
              }`}>
                <span>{linkMessage.type === 'success' ? '✓' : '⚠️'}</span>
                <span>{linkMessage.text}</span>
              </div>
            )}

            <div className="space-y-3">
              {/* Discord */}
              <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-gray-900/60 border border-gray-700">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-indigo-400 text-lg shrink-0">🎮</span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Discord</p>
                    <p className="text-sm font-medium truncate">
                      {profile.discord_id
                        ? <span className="text-white">{profile.discord_id}</span>
                        : <span className="text-gray-600">연동되지 않음</span>
                      }
                    </p>
                  </div>
                </div>
                {profile.discord_id ? (
                  <button
                    onClick={handleDiscordUnlink}
                    className="shrink-0 px-3 py-1.5 bg-red-900/30 hover:bg-red-900/50 border border-red-500/50 text-red-400 hover:text-red-300 text-xs font-bold rounded-lg transition-all"
                  >
                    연동 해제
                  </button>
                ) : (
                  <button
                    onClick={handleLinkDiscord}
                    disabled={discordLinking}
                    className="shrink-0 px-3 py-1.5 bg-indigo-700/30 hover:bg-indigo-700/50 border border-indigo-600/40 text-indigo-300 text-xs font-bold rounded-lg transition-all disabled:opacity-50"
                  >
                    {discordLinking ? '연동 중...' : '연동하기'}
                  </button>
                )}
              </div>

              {/* Google */}
              <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-gray-900/60 border border-gray-700">
                <div className="flex items-center gap-3 min-w-0">
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115z"/>
                    <path fill="#34A853" d="M16.04 18.013c-1.09.703-2.474 1.078-4.04 1.078a7.077 7.077 0 0 1-6.723-4.823l-4.04 3.067A11.965 11.965 0 0 0 12 24c2.933 0 5.735-1.043 7.834-3l-3.793-2.987z"/>
                    <path fill="#4A90D9" d="M19.834 21c2.195-2.048 3.62-5.096 3.62-9 0-.71-.109-1.473-.272-2.182H12v4.637h6.436c-.317 1.559-1.17 2.766-2.395 3.558L19.834 21z"/>
                    <path fill="#FBBC05" d="M5.277 14.268A7.12 7.12 0 0 1 4.909 12c0-.782.125-1.533.357-2.235L1.24 6.65A11.934 11.934 0 0 0 0 12c0 1.92.445 3.73 1.237 5.335l4.04-3.067z"/>
                  </svg>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Google</p>
                    <p className="text-sm font-medium truncate">
                      {profile.google_email
                        ? <span className="text-white">{profile.google_email}</span>
                        : <span className="text-gray-600">연동되지 않음</span>
                      }
                    </p>
                  </div>
                </div>
                {profile.google_email ? (
                  <button
                    onClick={handleGoogleUnlink}
                    className="shrink-0 px-3 py-1.5 bg-red-900/30 hover:bg-red-900/50 border border-red-500/50 text-red-400 hover:text-red-300 text-xs font-bold rounded-lg transition-all"
                  >
                    연동 해제
                  </button>
                ) : (
                  <button
                    onClick={handleLinkGoogle}
                    disabled={googleLinking}
                    className="shrink-0 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-gray-600/50 text-gray-200 text-xs font-bold rounded-lg transition-all disabled:opacity-50"
                  >
                    {googleLinking ? '연동 중...' : '연동하기'}
                  </button>
                )}
              </div>
            </div>
            <p className="text-[10px] text-gray-600 mt-2">
              이미 다른 계정에 연동된 소셜 계정은 연동할 수 없습니다. 기존 연동을 먼저 해제해주세요.
            </p>
          </div>
        </div>

        {/* 오른쪽 섹션: 전적 및 자산 정보 */}
        <div className="space-y-6">
          
          {/* 래더 정보 카드 */}
          <div className="bg-linear-to-br from-gray-800 to-gray-900 rounded-3xl p-6 border border-gray-700 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl group-hover:scale-110 transition-transform duration-500">🏆</div>
            <h3 className="text-white font-black text-xs mb-6 border-b border-gray-700/50 pb-2 uppercase tracking-[0.2em]">Ladder Status</h3>
            <div className="space-y-5">
              <div>
                <p className="text-gray-500 text-[10px] font-bold mb-1 uppercase">Rating Points</p>
                <p className="text-4xl font-black text-cyan-400">{ladderMmr} <span className="text-xs text-gray-500 font-normal">PTS</span></p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-gray-500 text-[10px] font-bold mb-1 uppercase">Tier</p>
                  <p className="text-white font-bold italic">{ladderTier}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-500 text-[10px] font-bold mb-1 uppercase">W / L</p>
                  <p className="text-white font-bold">{ladderWins}승 {ladderLosses}패</p>
                </div>
              </div>
            </div>
          </div>

          {/* 포인트 카드 */}
          <div className="bg-gray-800 rounded-3xl p-6 border border-gray-700 shadow-xl">
             <h3 className="text-white font-black text-xs mb-4 border-b border-gray-700/50 pb-2 uppercase tracking-[0.2em]">Clan Assets</h3>
             <p className="text-gray-500 text-[10px] font-bold mb-1 uppercase">보유 클랜 포인트</p>
             <p className="text-2xl font-black text-emerald-400 flex items-center gap-2">
               💰 {profile.clan_point?.toLocaleString() || 0} <span className="text-xs text-gray-500 font-normal">CP</span>
             </p>
          </div>

          {/* 로그아웃 버튼 */}
          <button 
            onClick={handleLogout}
            className="w-full py-4 bg-gray-900 hover:bg-red-900/20 border border-gray-800 hover:border-red-500/50 text-gray-500 hover:text-red-500 text-xs font-black rounded-2xl transition-all shadow-md uppercase tracking-widest"
          >
            Logout
          </button>
        </div>

      </div>

      {/* ── 계정 보안 섹션 ──────────────────────────────────────────────────── */}
      <div className="mt-8 bg-gray-800 rounded-3xl p-6 sm:p-8 border border-gray-700 shadow-xl space-y-8">
        <h3 className="text-white font-black text-xs uppercase tracking-[0.2em] border-b border-gray-700/50 pb-3">
          🔒 계정 보안
        </h3>

        {securityMsg && (
          <div className={`px-4 py-3 rounded-xl text-sm font-bold ${securityMsg.type === 'success' ? 'bg-emerald-900/30 border border-emerald-500/50 text-emerald-300' : 'bg-red-900/30 border border-red-500/50 text-red-300'}`}>
            {securityMsg.type === 'success' ? '✓ ' : '⚠ '}{securityMsg.text}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* 계정 아이디 / 이메일 변경 */}
          <div className="space-y-4">
            <h4 className="text-gray-400 text-xs font-bold uppercase tracking-widest">
              {usesInternalLogin ? '로그인 아이디' : '이메일 변경'}
            </h4>
            {usesInternalLogin ? (
              <>
                <div>
                  <label className="block text-gray-500 text-[10px] font-bold mb-1 uppercase">현재 로그인 아이디</label>
                  <input type="text" value={accountId} disabled className="w-full p-3 rounded-xl bg-gray-900/50 border border-gray-700 text-gray-300 cursor-not-allowed text-sm" />
                </div>
                <p className="text-gray-600 text-[10px] leading-relaxed">
                  일반 아이디 로그인 계정은 내부 인증용 이메일을 별도로 사용합니다. 현재 버전에서는 로그인 아이디 변경을 지원하지 않습니다.
                </p>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-gray-500 text-[10px] font-bold mb-1 uppercase">현재 이메일</label>
                  <input type="text" value={authEmail} disabled className="w-full p-3 rounded-xl bg-gray-900/50 border border-gray-700 text-gray-500 cursor-not-allowed text-sm" />
                </div>
                <div>
                  <label className="block text-gray-500 text-[10px] font-bold mb-1 uppercase">새 이메일</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="new@example.com"
                    className="w-full p-3 rounded-xl bg-gray-900 border border-gray-600 text-white text-sm focus:border-cyan-500 focus:outline-none transition-all"
                  />
                </div>
                <p className="text-gray-600 text-[10px] leading-relaxed">
                  변경 시 기존 이메일과 새 이메일 양쪽 모두에 확인 링크가 발송됩니다. 두 링크를 모두 클릭해야 변경이 완료됩니다.
                </p>
                <button
                  onClick={handleEmailChange}
                  disabled={securityLoading || !newEmail}
                  className="w-full py-3 bg-cyan-700/30 hover:bg-cyan-700/50 border border-cyan-500/40 text-cyan-300 text-xs font-black rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {securityLoading ? '처리 중...' : '이메일 변경 요청'}
                </button>
              </>
            )}
          </div>

          {/* 비밀번호 변경 */}
          <div className="space-y-4">
            <h4 className="text-gray-400 text-xs font-bold uppercase tracking-widest">비밀번호 변경</h4>
            <div>
              <label className="block text-gray-500 text-[10px] font-bold mb-1 uppercase">현재 비밀번호</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="현재 비밀번호"
                className="w-full p-3 rounded-xl bg-gray-900 border border-gray-600 text-white text-sm focus:border-yellow-500 focus:outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-gray-500 text-[10px] font-bold mb-1 uppercase">새 비밀번호</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="8자 이상, 영문+숫자 포함"
                className="w-full p-3 rounded-xl bg-gray-900 border border-gray-600 text-white text-sm focus:border-yellow-500 focus:outline-none transition-all"
              />
              {newPassword && (
                <div className="flex gap-3 mt-1.5 text-[10px]">
                  <span className={newPassword.length >= 8 ? 'text-green-400' : 'text-gray-600'}>✓ 8자 이상</span>
                  <span className={/[a-zA-Z]/.test(newPassword) ? 'text-green-400' : 'text-gray-600'}>✓ 영문 포함</span>
                  <span className={/[0-9]/.test(newPassword) ? 'text-green-400' : 'text-gray-600'}>✓ 숫자 포함</span>
                </div>
              )}
            </div>
            <div>
              <label className="block text-gray-500 text-[10px] font-bold mb-1 uppercase">새 비밀번호 확인</label>
              <input
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="비밀번호 재입력"
                className={`w-full p-3 rounded-xl bg-gray-900 border text-white text-sm focus:outline-none transition-all ${
                  newPassword && confirmNewPassword
                    ? newPassword === confirmNewPassword ? 'border-emerald-500' : 'border-red-500'
                    : 'border-gray-600'
                }`}
              />
            </div>
            <button
              onClick={handlePasswordChange}
              disabled={securityLoading || !currentPassword || !newPassword || !confirmNewPassword}
              className="w-full py-3 bg-yellow-700/30 hover:bg-yellow-700/50 border border-yellow-500/40 text-yellow-300 text-xs font-black rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {securityLoading ? '처리 중...' : '비밀번호 변경'}
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
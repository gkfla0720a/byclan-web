'use client';

import React, { useState } from 'react';
import { supabase } from '@/supabase';
import { ErrorMessage } from './UIStates';

const ROLE_LABELS = {
  visitor: '방문자',
  applicant: '가입 신청자',
  rookie: '신입 길드원',
  associate: '준회원',
  elite: '정예 멤버',
  admin: '운영진',
  master: '마스터',
  developer: '개발자',
};

const STREAMER_PLATFORMS = ['SOOP', 'YouTube', '치지직', 'Twitch', 'AfreecaTV', '기타'];

function normalizeUrl(url) {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
}

function formatPhone(value) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length < 4) return digits;
  if (digits.length < 8) {
    return digits.replace(/(\d{3})(\d{1,4})/, '$1-$2');
  }
  return digits.replace(/(\d{3})(\d{4})(\d{1,4})/, '$1-$2-$3');
}

async function submitApplication(userId, applicationData) {
  try {
    const applicationPayload = {
      user_id: userId,
      btag: applicationData.btag,
      race: applicationData.race,
      tier: applicationData.tier,
      intro: applicationData.intro,
      motivation: applicationData.motivation,
      playtime: applicationData.playtime,
      phone: applicationData.phone,
      status: 'pending',
      is_streamer: applicationData.isStreamer,
      streamer_platform: applicationData.isStreamer ? applicationData.streamerPlatform : null,
      streamer_url: applicationData.isStreamer ? normalizeUrl(applicationData.streamerUrl) : null,
    };

    let { error: appError } = await supabase
      .from('applications')
      .insert(applicationPayload);

    if (appError) {
      const message = `${appError.message || ''} ${appError.details || ''}`.toLowerCase();
      if (appError.code === '42703' || message.includes('does not exist')) {
        ({ error: appError } = await supabase
          .from('applications')
          .insert({
            user_id: userId,
            btag: applicationData.btag,
            race: applicationData.race,
            tier: applicationData.tier,
            intro: applicationData.intro,
            motivation: applicationData.motivation,
            playtime: applicationData.playtime,
            phone: applicationData.phone,
            status: 'pending',
          }));
      }
    }

    if (appError) {
      console.warn('applications 테이블 오류:', appError.message);
    }

    const profilePayload = {
      role: 'applicant',
      is_streamer: applicationData.isStreamer,
      streamer_platform: applicationData.isStreamer ? applicationData.streamerPlatform : null,
      streamer_url: applicationData.isStreamer ? normalizeUrl(applicationData.streamerUrl) : null,
    };

    let { error: profileError } = await supabase
      .from('profiles')
      .update(profilePayload)
      .eq('id', userId);

    if (profileError) {
      const message = `${profileError.message || ''} ${profileError.details || ''}`.toLowerCase();
      if (profileError.code === '42703' || message.includes('does not exist')) {
        ({ error: profileError } = await supabase
          .from('profiles')
          .update({ role: 'applicant' })
          .eq('id', userId));
      }
    }

    if (profileError) throw profileError;

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function StepItem({ number, title, description, done = false }) {
  return (
    <div className="flex items-center space-x-3">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${done ? 'bg-green-500 text-white' : 'bg-yellow-500 text-gray-900'}`}>
        {number}
      </div>
      <div className="flex-1">
        <div className="text-white font-medium">{title}</div>
        <div className="text-gray-400 text-sm">{description}</div>
      </div>
    </div>
  );
}

function ApplicationForm({ onSubmit, onCancel, loading, error }) {
  const [formData, setFormData] = useState({
    btag: '',
    race: 'Terran',
    tier: 'Bronze',
    intro: '',
    motivation: '',
    playtime: '',
    phone: '',
    isStreamer: false,
    streamerPlatform: 'SOOP',
    streamerUrl: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 p-8 rounded-xl border border-gray-700 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-2xl font-bold text-white mb-6">📝 클랜 가입 신청서</h3>

        {error && <ErrorMessage message={error} />}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">배틀태그 *</label>
              <input
                type="text"
                value={formData.btag}
                onChange={(e) => setFormData((prev) => ({ ...prev, btag: e.target.value }))}
                placeholder="예: ByName#1234"
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-yellow-500"
                required
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">주력 종족 *</label>
              <select
                value={formData.race}
                onChange={(e) => setFormData((prev) => ({ ...prev, race: e.target.value }))}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-yellow-500"
              >
                <option value="Terran">테란</option>
                <option value="Protoss">프로토스</option>
                <option value="Zerg">저그</option>
                <option value="Random">랜덤</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">현재 티어 *</label>
              <select
                value={formData.tier}
                onChange={(e) => setFormData((prev) => ({ ...prev, tier: e.target.value }))}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-yellow-500"
              >
                <option value="Bronze">브론즈</option>
                <option value="Silver">실버</option>
                <option value="Gold">골드</option>
                <option value="Platinum">플래티넘</option>
                <option value="Diamond">다이아몬드</option>
                <option value="Master">마스터</option>
                <option value="Grandmaster">그랜드마스터</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">연락처 *</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData((prev) => ({ ...prev, phone: formatPhone(e.target.value) }))}
                placeholder="010-0000-0000"
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-yellow-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">자기소개 *</label>
            <textarea
              value={formData.intro}
              onChange={(e) => setFormData((prev) => ({ ...prev, intro: e.target.value }))}
              placeholder="스타크래프트를 시작한 계기, 주력 전략 등 자유롭게 소개해주세요."
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-yellow-500 resize-none"
              rows={3}
              required
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">클랜 가입 동기 *</label>
            <textarea
              value={formData.motivation}
              onChange={(e) => setFormData((prev) => ({ ...prev, motivation: e.target.value }))}
              placeholder="ByClan 클랜에 가입하려는 이유와 클랜 활동 계획을 알려주세요."
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-yellow-500 resize-none"
              rows={3}
              required
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">주 활동 시간대 *</label>
            <input
              type="text"
              value={formData.playtime}
              onChange={(e) => setFormData((prev) => ({ ...prev, playtime: e.target.value }))}
              placeholder="예: 평일 저녁 7시~11시, 주말 자유"
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-yellow-500"
              required
            />
          </div>

          <div className="rounded-xl border border-gray-700 bg-gray-900/40 p-4 space-y-4">
            <label className="flex items-center gap-3 text-sm text-gray-300 font-medium">
              <input
                type="checkbox"
                checked={formData.isStreamer}
                onChange={(e) => setFormData((prev) => ({
                  ...prev,
                  isStreamer: e.target.checked,
                  streamerUrl: e.target.checked ? prev.streamerUrl : '',
                }))}
                className="w-4 h-4 rounded border-gray-500 bg-gray-700 text-yellow-500 focus:ring-yellow-500"
              />
              BJ 또는 스트리머입니다. 방송 플랫폼 정보를 추가하겠습니다.
            </label>

            {formData.isStreamer && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">방송 플랫폼</label>
                  <select
                    value={formData.streamerPlatform}
                    onChange={(e) => setFormData((prev) => ({ ...prev, streamerPlatform: e.target.value }))}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-yellow-500"
                  >
                    {STREAMER_PLATFORMS.map((platform) => (
                      <option key={platform} value={platform}>{platform}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">방송 URL</label>
                  <input
                    type="url"
                    value={formData.streamerUrl}
                    onChange={(e) => setFormData((prev) => ({ ...prev, streamerUrl: e.target.value }))}
                    placeholder="https://..."
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-yellow-500"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="px-6 py-2 bg-gray-700 text-white font-bold rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-yellow-500 text-gray-900 font-bold rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-50"
            >
              {loading ? '제출 중...' : '신청서 제출'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function VisitorWelcome({ user, profile, mode = 'guide', navigateTo, onApplicationSubmit }) {
  const [showApplicationForm, setShowApplicationForm] = useState(mode === 'apply');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const displayName = profile?.ByID || (user?.email ? `By_${user.email.split('@')[0]}` : 'By_Visitor');
  const currentRole = profile?.role?.trim?.().toLowerCase?.() || 'guest';
  const isApplied = currentRole === 'applicant';
  const isRookieOrHigher = ['rookie', 'associate', 'elite', 'admin', 'master', 'developer'].includes(currentRole);
  const canApply = Boolean(user && currentRole === 'visitor');
  const roleLabel = ROLE_LABELS[currentRole] || '클랜 유저';
  const introText = profile?.intro?.trim?.() || '클랜 활동을 이어가고 있는 멤버입니다.';

  const handleApplicationSubmit = async (applicationData) => {
    setLoading(true);
    setError(null);

    try {
      const result = await submitApplication(user.id, applicationData);

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          onApplicationSubmit();
          setShowApplicationForm(false);
          navigateTo?.('Home');
        }, 2000);
      } else {
        setError(result.error);
      }
    } catch {
      setError('가입 신청 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] flex flex-col justify-center items-center p-4">
        <div className="bg-green-900/20 border border-green-700/50 rounded-xl p-8 max-w-md text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-green-400 mb-2">가입 신청 완료!</h2>
          <p className="text-gray-300 mb-4">신청서가 제출되었습니다. 테스트 대기 중입니다.</p>
          <div className="text-sm text-gray-400">잠시 후 홈으로 이동합니다...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c] flex flex-col justify-center items-center p-4">
      <div className="mb-10 text-center">
        <h1 className="text-5xl font-black text-white italic tracking-tighter">
          BYCLAN <span className="text-yellow-500">NET</span>
        </h1>
        <p className="text-gray-500 text-xs mt-2 uppercase tracking-widest font-bold">
          스타크래프트 빠른무한 클랜에 오신 것을 환영합니다!
        </p>
      </div>

      <div className="w-full max-w-2xl space-y-6">
        <div className="bg-gray-800 p-8 rounded-xl border border-gray-700 shadow-2xl text-center">
          <div className="text-6xl mb-4">👋</div>
          <h2 className="text-3xl font-bold text-white mb-4">환영합니다, {displayName}님!</h2>

          {isRookieOrHigher ? (
            <div className="mb-6 space-y-3">
              <div className="inline-flex px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-sm font-bold">
                현재 직책: {roleLabel}
              </div>
              <p className="text-gray-300 leading-relaxed">{introText}</p>
            </div>
          ) : isApplied ? (
            <div className="mb-6 space-y-3">
              <div className="inline-flex px-3 py-1 rounded-full border border-yellow-500/30 bg-yellow-500/10 text-yellow-300 text-sm font-bold">
                현재 상태: 가입 심사 대기
              </div>
              <p className="text-gray-300 leading-relaxed">
                신청서는 이미 제출되어 있습니다. 운영진 심사와 테스트 진행 후 다음 단계가 안내됩니다.
              </p>
            </div>
          ) : (
            <p className="text-gray-300 mb-6">
              ByClan 클랜의 운영 방식과 가입 절차를 먼저 확인해보세요. 준비가 되면 아래 버튼에서 바로 신청서를 작성할 수 있습니다.
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!user ? (
              <button
                onClick={() => navigateTo?.('로그인')}
                className="px-6 py-3 bg-yellow-500 text-gray-900 font-bold rounded-lg hover:bg-yellow-400 transition-colors"
              >
                🔐 로그인 후 신청 준비
              </button>
            ) : canApply ? (
              <button
                onClick={() => setShowApplicationForm(true)}
                className="px-6 py-3 bg-yellow-500 text-gray-900 font-bold rounded-lg hover:bg-yellow-400 transition-colors"
              >
                📝 가입 신청하기
              </button>
            ) : (
              <div className="px-6 py-3 bg-gray-900 text-gray-400 font-bold rounded-lg border border-gray-700">
                {isApplied ? '심사 진행 중' : '가입 신청 대상 아님'}
              </div>
            )}

            <button
              onClick={() => navigateTo?.('Home')}
              className="px-6 py-3 bg-gray-700 text-white font-bold rounded-lg hover:bg-gray-600 transition-colors"
            >
              🏠 홈으로
            </button>
          </div>
        </div>

        {!isRookieOrHigher && (
          <>
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-4">📋 가입 절차</h3>
              <div className="space-y-3">
                <StepItem number="1" title="가입 신청" description="기본 정보 제출" />
                <StepItem number="2" title="테스트 진행" description="실력 테스트 및 면접" />
                <StepItem number="3" title="신입 길드원" description="Discord 연동 및 2주 활동" />
                <StepItem number="4" title="정식 길드원" description="모든 클랜 활동 참여 가능" done />
              </div>
            </div>

            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-4">
                {canApply ? '🗂️ 신청 전 체크리스트' : '🧭 가입 전에 확인할 내용'}
              </h3>
              <div className="space-y-3 text-sm text-gray-300 leading-relaxed">
                {canApply ? (
                  <>
                    <p>배틀태그, 주 활동 시간, 연락 가능한 번호를 정확하게 적어주세요.</p>
                    <p>자기소개와 가입 동기는 운영진이 실제로 읽고 심사에 참고합니다. 간단해도 실제 플레이 스타일이 드러나는 편이 좋습니다.</p>
                    <p>테스트 불합격 후 3일 후에 다시 테스트를 볼 수 있습니다.</p>
                    <p>합격하시면 신입길드원으로 2주간 적응기간을 갖게 됩니다. 그동안 레더 게임과 디스코드 활동을 통해 클랜원들과 즐겁게 팀워크를 맞춰보시길 바라겠습니다.</p>
                    <p>신청 후에는 프로필 권한이 applicant로 바뀌며, 심사 결과는 알림과 운영진 처리 내역으로 반영됩니다.</p>
                  </>
                ) : (
                  <>
                    <p>ByClan은 래더 참여, 공지 확인, 커뮤니티 활동이 꾸준한 유저를 선호합니다.</p>
                    <p>가입 신청 전에는 로그인과 기본 프로필 설정이 먼저 필요합니다.</p>
                    <p>테스트 불합격 후 3일 후에 다시 테스트를 볼 수 있습니다.</p>
                    <p>합격하시면 신입길드원으로 2주간 적응기간을 갖게 됩니다. 그동안 레더 게임과 디스코드 활동을 통해 클랜원들과 즐겁게 팀워크를 맞춰보시길 바라겠습니다.</p>
                    <p>테스트 합격 후에는 Discord 연동과 기본 클랜 활동을 통해 정식 멤버 단계로 올라가게 됩니다.</p>
                  </>
                )}
              </div>
            </div>

            {isApplied && (
              <div className="bg-yellow-900/20 border border-yellow-700/40 rounded-xl p-6">
                <h3 className="text-lg font-bold text-yellow-300 mb-3">🔔 신청 현황 확인</h3>
                <p className="text-sm text-gray-300 leading-relaxed mb-4">
                  심사 결과와 운영진 코멘트는 알림함에서 가장 먼저 확인할 수 있습니다. 안내가 바뀌었는지 수시로 확인해주세요.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => navigateTo?.('알림')}
                    className="px-5 py-2.5 rounded-lg font-bold text-sm bg-yellow-500 text-gray-900 hover:bg-yellow-400 transition-colors"
                  >
                    알림함 열기
                  </button>
                  <button
                    onClick={() => navigateTo?.('Home')}
                    className="px-5 py-2.5 rounded-lg font-bold text-sm bg-gray-700 text-white hover:bg-gray-600 transition-colors"
                  >
                    홈으로 이동
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showApplicationForm && canApply && (
        <ApplicationForm
          onSubmit={handleApplicationSubmit}
          onCancel={() => setShowApplicationForm(false)}
          loading={loading}
          error={error}
        />
      )}
    </div>
  );
}

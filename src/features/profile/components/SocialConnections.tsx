/**
 * SocialConnections - 소셜 계정 연동 관리
 * - Discord 연동/해제
 * - Google 연동/해제
 */

'use client';

import { supabase } from '@/supabase';
import type { LinkMessage } from '../types/profile';

interface Profile {
  id: string;
  discord_id?: string;
  google_email?: string;
}

interface SocialConnectionsProps {
  profile: Profile;
  linkMessage: LinkMessage | null;
  discordLinking: boolean;
  googleLinking: boolean;
  onReloadProfile: () => Promise<void>;
}

export function SocialConnections({
  profile,
  linkMessage,
  discordLinking,
  googleLinking,
  onReloadProfile,
}: SocialConnectionsProps) {
  const handleLinkDiscord = async (
    setDiscordLinking: (v: boolean) => void,
    setLinkMessage: (msg: LinkMessage | null) => void
  ) => {
    setDiscordLinking(true);
    setLinkMessage(null);
    try {
      const { error } = await supabase.auth.linkIdentity({
        provider: 'discord',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/profile&link_provider=discord`,
        },
      });
      if (error) throw error;
    } catch (err) {
      setLinkMessage({
        type: 'error',
        text: 'Discord 연동 시작 실패: ' + (err instanceof Error ? err.message : '알 수 없는 오류'),
      });
      setDiscordLinking(false);
    }
  };

  const handleLinkGoogle = async (
    setGoogleLinking: (v: boolean) => void,
    setLinkMessage: (msg: LinkMessage | null) => void
  ) => {
    setGoogleLinking(true);
    setLinkMessage(null);
    try {
      const { error } = await supabase.auth.linkIdentity({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/profile&link_provider=google`,
        },
      });
      if (error) throw error;
    } catch (err) {
      setLinkMessage({
        type: 'error',
        text: 'Google 연동 시작 실패: ' + (err instanceof Error ? err.message : '알 수 없는 오류'),
      });
      setGoogleLinking(false);
    }
  };

  const handleDiscordUnlink = async (setLinkMessage: (msg: LinkMessage | null) => void) => {
    if (
      !confirm(
        '​Discord 연동을 해제하시겠습니까?\nDiscord가 유일한 로그인 수단인 경우 로그아웃됩니다.'
      )
    )
      return;

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
        await supabase.auth.unlinkIdentity(discordIdentity);
        await onReloadProfile();
        setLinkMessage({ type: 'success', text: 'Discord 연동이 해제되었습니다.' });
      }
    } catch (error) {
      alert('Discord 연동 해제 실패: ' + (error instanceof Error ? error.message : '알 수 없는 오류'));
    }
  };

  const handleGoogleUnlink = async (setLinkMessage: (msg: LinkMessage | null) => void) => {
    if (!confirm('Google 연동을 해제하시겠습니까?\nGoogle이 유일한 로그인 수단인 경우 로그아웃됩니다.'))
      return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const googleIdentity = user?.identities?.find((i) => i.provider === 'google');
      const identityCount = user?.identities?.length || 0;

      const { error } = await supabase
        .from('profile_oauth')
        .update({
          google_sub: null,
          google_email: null,
          google_name: null,
          google_avatar_url: null,
        })
        .eq('user_id', profile.id);

      if (error) throw error;

      if (googleIdentity && identityCount > 1) {
        await supabase.auth.unlinkIdentity(googleIdentity);
        await onReloadProfile();
        setLinkMessage({ type: 'success', text: 'Google 연동이 해제되었습니다.' });
      }
    } catch (error) {
      alert('Google 연동 해제 실패: ' + (error instanceof Error ? error.message : '알 수 없는 오류'));
    }
  };

  return (
    <div className="pt-2 border-t border-gray-700">
      <label className="block text-gray-400 text-xs font-bold mb-4 uppercase tracking-widest">
        4. 소셜 계정 연동
      </label>

      {/* 연동 결과 메시지 */}
      {linkMessage && (
        <div
          className={`mb-4 px-4 py-3 rounded-xl text-sm font-bold flex items-start gap-2 ${
            linkMessage.type === 'success'
              ? 'bg-emerald-900/30 border border-emerald-500/50 text-emerald-300'
              : 'bg-red-900/30 border border-red-500/50 text-red-300'
          }`}
        >
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
                {profile.discord_id ? (
                  <span className="text-white">{profile.discord_id}</span>
                ) : (
                  <span className="text-gray-600">연동되지 않음</span>
                )}
              </p>
            </div>
          </div>
          {profile.discord_id ? (
            <button
              onClick={() => handleDiscordUnlink((msg) => {})}
              className="shrink-0 px-3 py-1.5 bg-red-900/30 hover:bg-red-900/50 border border-red-500/50 text-red-400 hover:text-red-300 text-xs font-bold rounded-lg transition-all"
            >
              연동 해제
            </button>
          ) : (
            <button
              onClick={() => handleLinkDiscord((v) => {}, (msg) => {})}
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
              <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115z" />
              <path fill="#34A853" d="M16.04 18.013c-1.09.703-2.474 1.078-4.04 1.078a7.077 7.077 0 0 1-6.723-4.823l-4.04 3.067A11.965 11.965 0 0 0 12 24c2.933 0 5.735-1.043 7.834-3l-3.793-2.987z" />
              <path fill="#4A90D9" d="M19.834 21c2.195-2.048 3.62-5.096 3.62-9 0-.71-.109-1.473-.272-2.182H12v4.637h6.436c-.317 1.559-1.17 2.766-2.395 3.558L19.834 21z" />
              <path fill="#FBBC05" d="M5.277 14.268A7.12 7.12 0 0 1 4.909 12c0-.782.125-1.533.357-2.235L1.24 6.65A11.934 11.934 0 0 0 0 12c0 1.92.445 3.73 1.237 5.335l4.04-3.067z" />
            </svg>
            <div className="min-w-0">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Google</p>
              <p className="text-sm font-medium truncate">
                {profile.google_email ? (
                  <span className="text-white">{profile.google_email}</span>
                ) : (
                  <span className="text-gray-600">연동되지 않음</span>
                )}
              </p>
            </div>
          </div>
          {profile.google_email ? (
            <button
              onClick={() => handleGoogleUnlink((msg) => {})}
              className="shrink-0 px-3 py-1.5 bg-red-900/30 hover:bg-red-900/50 border border-red-500/50 text-red-400 hover:text-red-300 text-xs font-bold rounded-lg transition-all"
            >
              연동 해제
            </button>
          ) : (
            <button
              onClick={() => handleLinkGoogle((v) => {}, (msg) => {})}
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
  );
}

// 파일명: src/hooks/useProfileData.ts

import { useState, useCallback, useEffect, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/supabase';
import type { Database, AuthProfile as UserProfile } from '@/types';
import { extractAccountIdFromAuthUser } from '@/utils/accountId';
import { normalizeRole } from '@/utils/permissions';
import { clearCurrentViewerTestAccountFlag, setCurrentViewerTestAccountFlag } from '@/utils/testData';
import logger from '@/utils/errorLogger';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];

function normalizeProfileRow(profile: ProfileRow | null): UserProfile | null {
  if (!profile) return null;
  return {
    ...profile,
    role: normalizeRole(profile.role),
    clan_point: typeof profile.clan_point === 'number' ? profile.clan_point : 0,
  } as unknown as UserProfile;
}

function getSocialIdentity(authUser: User) {
  const identities = authUser?.identities || [];
  const discordIdentity = identities.find((id) => id.provider === 'discord');
  const googleIdentity = identities.find((id) => id.provider === 'google');
  const meta = authUser?.user_metadata || {};
  const appMeta = authUser?.app_metadata || {};

  return {
    isDiscordProvider: appMeta.provider === 'discord' || meta.provider === 'discord' || !!discordIdentity,
    isGoogleProvider: appMeta.provider === 'google' || meta.provider === 'google' || !!googleIdentity,
    discordId: discordIdentity?.identity_data?.sub || discordIdentity?.id || null,
    discordName: meta.preferred_username || meta.full_name || meta.name || authUser.email?.split('@')[0] || 'User',
    googleSub: meta.sub || googleIdentity?.id || null,
    googleEmail: meta.email || authUser.email || null,
    googleName: meta.full_name || meta.name || authUser.email?.split('@')[0] || 'User',
    googleAvatarUrl: meta.avatar_url || meta.picture || null,
    authProvider: appMeta.provider || meta.provider || identities[0]?.provider || 'email',
  };
}

function sanitizeByIdSeed(seed: string): string {
  return seed.normalize('NFKD').replace(/[^a-zA-Z0-9]/g, '').slice(0, 20) || 'User';
}

async function resolveUniqueById(seed: string, currentUserId?: string): Promise<string> {
  const base = `By_${sanitizeByIdSeed(seed)}`;
  const candidates = Array.from({ length: 30 }, (_, i) => (i === 0 ? base : `${base}${i + 1}`));

  const { data, error } = await supabase.from('profiles').select('id, by_id').in('by_id', candidates);
  if (error) return base;

  const taken = new Map<string, string>();
  (data || []).forEach((row) => taken.set(row.by_id || '', row.id));

  for (const candidate of candidates) {
    if (!taken.has(candidate) || taken.get(candidate) === currentUserId) return candidate;
  }
  return `${base}${Date.now().toString().slice(-6)}`;
}

async function mergeOAuthIntoProfile(profile: UserProfile, userId: string): Promise<UserProfile> {
  const [{ data: oauthData }, { data: metaData }, { data: rankData }] = await Promise.all([
    supabase.from('profile_oauth').select('discord_id, google_email, google_name').eq('user_id', userId).maybeSingle(),
    supabase.from('profile_meta').select('is_test_account_active').eq('user_id', userId).maybeSingle(),
    supabase.from('ladder_rankings').select('personal_mmr, wins, losses, total_mmr').eq('user_id', userId).maybeSingle(),
  ]);

  return { ...oauthData, ...metaData, ...rankData, ...profile } as UserProfile;
}

async function syncSocialProfileData(authUser: User, currentProfile: UserProfile): Promise<UserProfile> {
  const { isDiscordProvider, isGoogleProvider, discordId, discordName, googleSub, googleEmail, googleName, googleAvatarUrl, authProvider } = getSocialIdentity(authUser);

  // 타입을 강제하여 오염된 데이터가 들어가지 않도록 보호합니다.
  const profileUpdates: Partial<ProfileRow> = {};
  const oauthUpdates: Record<string, string | null> = {};

  if (isDiscordProvider && discordId && !currentProfile.discord_id) oauthUpdates.discord_id = discordId;
  if (isGoogleProvider) {
    if (googleSub && currentProfile.google_sub !== googleSub) oauthUpdates.google_sub = googleSub;
    if (googleEmail && currentProfile.google_email !== googleEmail) oauthUpdates.google_email = googleEmail;
    if (googleName && currentProfile.google_name !== googleName) oauthUpdates.google_name = googleName;
    if (googleAvatarUrl && currentProfile.google_avatar_url !== googleAvatarUrl) oauthUpdates.google_avatar_url = googleAvatarUrl;
  }
  if (authProvider && currentProfile.auth_provider !== authProvider) oauthUpdates.auth_provider = authProvider;

  if (!currentProfile.by_id) {
    const safeAuthUser = { ...authUser, email: authUser.email ?? null } as unknown as User;
    const loginId = extractAccountIdFromAuthUser(safeAuthUser, currentProfile as unknown as UserProfile);
    const seed = googleName || discordName || loginId || authUser.email?.split('@')[0] || 'User';
    profileUpdates.by_id = await resolveUniqueById(seed, authUser.id);
  }

  let updatedProfile = { ...currentProfile };

  if (Object.keys(profileUpdates).length > 0) {
    const { data } = await supabase.from('profiles').update(profileUpdates).eq('id', authUser.id).select('*').single();
    if (data) updatedProfile = { ...updatedProfile, ...normalizeProfileRow(data) };
  }
  if (Object.keys(oauthUpdates).length > 0) {
    await supabase.from('profile_oauth').upsert({ user_id: authUser.id, ...oauthUpdates }, { onConflict: 'user_id' });
    updatedProfile = { ...updatedProfile, ...oauthUpdates };
  }

  return updatedProfile;
}

export function useProfileData(user: User | null) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const profileRequestIdRef = useRef(0);

  const needsByIdSetup = profile !== null && (!profile.by_id || profile.by_id.trim() === '');

  const fetchAndSetProfile = useCallback(async (authUser: User, requestId = profileRequestIdRef.current + 1) => {
    profileRequestIdRef.current = requestId;
    setProfileLoading(true);

    try {
      let { data: p, error: profileError } = await supabase.from('profiles').select('*').eq('id', authUser.id).single();

      if (profileError && profileError.code === 'PGRST116') {
        const seed = authUser.email?.split('@')[0] || 'User';
        const uniqueById = await resolveUniqueById(seed, authUser.id);

        const { error: insertError } = await supabase.from('profiles').insert({
          id: authUser.id,
          by_id: uniqueById,
          role: 'guest',
        });

        if (insertError) throw insertError;

        const result = await supabase.from('profiles').select('*').eq('id', authUser.id).single();
        p = result.data;
        profileError = result.error;
      }

      if (profileError) throw profileError;

      let nextProfile = normalizeProfileRow(p);
      if (nextProfile) {
        nextProfile = await mergeOAuthIntoProfile(nextProfile, authUser.id);
        nextProfile = await syncSocialProfileData(authUser, nextProfile);

        if (profileRequestIdRef.current !== requestId) return;

        setProfile(nextProfile);

        if (typeof window !== 'undefined') {
          if (nextProfile.is_test_account) setCurrentViewerTestAccountFlag(true);
          else clearCurrentViewerTestAccountFlag();
        }
      }
    } catch (error) {
      if (profileRequestIdRef.current !== requestId) return;
      logger.captureException(error, { userId: authUser.id, severity: 'ERROR' }); // logger 타입에 맞게 수정
      setProfile(null);
      if (typeof window !== 'undefined') clearCurrentViewerTestAccountFlag();
    } finally {
      if (profileRequestIdRef.current === requestId) setProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      queueMicrotask(() => fetchAndSetProfile(user));
      return;
    }
    profileRequestIdRef.current += 1;
    queueMicrotask(() => {
      setProfile(null);
      setProfileLoading(false);
      if (typeof window !== 'undefined') clearCurrentViewerTestAccountFlag();
    });
  }, [user, fetchAndSetProfile]);

  return {
    profile,
    setProfile,
    profileLoading,
    needsByIdSetup,
    reloadProfile: () => user ? fetchAndSetProfile(user) : Promise.resolve()
  };
}
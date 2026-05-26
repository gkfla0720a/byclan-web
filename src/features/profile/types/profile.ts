/**
 * Profile Feature - TypeScript Types
 */

export type Race = '미지정' | 'Protoss' | 'Terran' | 'Zerg' | 'Random';

export interface ProfileFormState {
  clanNameInput: string;
  race: Race;
  intro: string;
  isNicknameAvailable: boolean;
  originalById: string;
  isUpdating: boolean;
}

export interface SecurityFormState {
  newEmail: string;
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
  securityLoading: boolean;
}

export interface LinkMessage {
  type: 'success' | 'error';
  text: string;
}

export type RoleLabel = Record<string, string>;

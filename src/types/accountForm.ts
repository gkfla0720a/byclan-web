// 파일명: src/types/accountForm.ts

export interface AuthFormData {
  accountId: string;
  nickname: string;
  password: string;
  confirmPassword: string;
  termsAccepted: boolean;
};
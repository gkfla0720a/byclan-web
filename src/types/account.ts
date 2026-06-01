// 파일명: src/types/account.ts

const AccountTypes = () =>{
  interface AccountTypes {
    accountId: string;
    nickname: string;
    password?: string;
  }
};
export default AccountTypes;
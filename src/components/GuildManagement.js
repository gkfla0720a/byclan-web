'use client';

import { useState } from 'react';
import { hasPermission } from '@/utils/permissions';
import { useGuildMembers } from '@/hooks/useGuildMembers';
import { useMasterDelegation } from '@/hooks/useMasterDelegation';
import MemberTable from '@/features/guild/MemberTable';
import ActionModal from '@/features/guild/ActionModal';
import MasterDelegationModal from '@/features/guild/MasterDelegationModal';

export default function GuildManagement() {
  const {
    members, loading, currentManager,
    loadMembers, handleRoleChange, handleRemoveMember, handleForcePromote,
  } = useGuildMembers();

  const {
    masterDelegation, delegationVerification, isDelegationVerified, canDelegateMaster,
    openDelegationModal, closeDelegationModal,
    handlePasswordVerification, handleSendOtp, handleVerifyOtp,
    handleMasterDelegation, setDelegationVerification,
  } = useMasterDelegation(currentManager, members, loadMembers);

  const [actionModal, setActionModal] = useState({ isOpen: false, action: '', member: null });
  const [pendingRole, setPendingRole] = useState('member');

  const canManageMembers = hasPermission(currentManager.role || 'visitor', 'member.manage');

  if (loading) {
    return <div className="text-center py-24 text-cyan-400 font-mono">[ LOADING GUILD DATA... ]</div>;
  }

  if (!canManageMembers) {
    return (
      <div className="w-full py-20 px-4">
        <div className="rounded-3xl border border-red-500/30 bg-gray-950/80 px-8 py-12 text-center shadow-2xl">
          <div className="text-5xl mb-4">🚫</div>
          <h2 className="text-3xl font-black text-red-400 mb-4">클랜원 관리 권한 없음</h2>
          <p className="text-gray-300">현재 계정에는 클랜원 관리 권한이 없어 이 화면에 접근할 수 없습니다.</p>
        </div>
      </div>
    );
  }

  const handleConfirmAction = async () => {
    const { action, member } = actionModal;
    let success = false;

    if (action === 'role') {
      success = await handleRoleChange(member.id, pendingRole, member.role);
      if (success) setPendingRole('member');
    } else if (action === 'remove') {
      success = await handleRemoveMember(member.id);
    }

    if (success) setActionModal({ isOpen: false, action: '', member: null });
  };

  return (
    <div className="w-full py-8 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-linear-to-r from-cyan-400 to-purple-600 mb-2">
          클랜원 관리
        </h1>
        <p className="text-gray-400">클랜원 등급 변경, 제명, 마스터 위임 등의 관리 기능</p>
      </div>

      <MemberTable
        members={members}
        currentManager={currentManager}
        canDelegateMaster={canDelegateMaster}
        onRoleClick={(member) => {
          setPendingRole(member.role);
          setActionModal({ isOpen: true, action: 'role', member });
        }}
        onRemoveClick={(member) => setActionModal({ isOpen: true, action: 'remove', member })}
        onDelegateClick={openDelegationModal}
        onForcePromote={handleForcePromote}
      />

      <ActionModal
        isOpen={actionModal.isOpen}
        action={actionModal.action}
        member={actionModal.member}
        pendingRole={pendingRole}
        onPendingRoleChange={setPendingRole}
        onConfirm={handleConfirmAction}
        onClose={() => setActionModal({ isOpen: false, action: '', member: null })}
      />

      <MasterDelegationModal
        isOpen={masterDelegation.isOpen}
        member={masterDelegation.member}
        currentManager={currentManager}
        delegationVerification={delegationVerification}
        isDelegationVerified={isDelegationVerified}
        onPasswordChange={(val) => setDelegationVerification(prev => ({ ...prev, password: val }))}
        onOtpChange={(val) => setDelegationVerification(prev => ({ ...prev, otp: val }))}
        onMethodChange={(method) => setDelegationVerification(prev => ({ ...prev, method, error: '', success: '' }))}
        onPasswordVerify={handlePasswordVerification}
        onSendOtp={handleSendOtp}
        onVerifyOtp={handleVerifyOtp}
        onDelegate={() => handleMasterDelegation(masterDelegation.member?.id)}
        onClose={closeDelegationModal}
      />
    </div>
  );
}

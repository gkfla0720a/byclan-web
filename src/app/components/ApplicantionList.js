'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabase';

export default function ApplicationList() {
  const [applications, setApplications] = useState([]);
  const [myProfile, setMyProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  // 권한 레벨 (elite 이상인지 체크)
  const powerLevel = { master: 100, admin: 80, elite: 60, member: 40, rookie: 20, associate: 15, guest: 10, expelled: 0 };

  useEffect(() => {
    checkAuthAndFetch();
  }, []);

  const checkAuthAndFetch = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, nickname, role')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          const currentRole = profile.role.trim().toLowerCase();
          setMyProfile({ ...profile, role: currentRole });
          
          // elite 이상만 목록을 볼 수 있음
          if (powerLevel[currentRole] >= powerLevel['elite']) {
            await fetchApplications();
          }
        }
      }
    } catch (err) {
      console.error("권한/데이터 로드 에러:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    // 아직 합격/불합격 처리가 안 된 '대기중' 상태의 신청서만 가져옵니다.
    // tester_id를 profiles 테이블과 조인하여 담당자 닉네임도 가져옵니다.
    const { data, error } = await supabase
      .from('applications')
      .select(`
        *,
        tester:tester_id(nickname)
      `)
      .eq('status', '대기중')
      .order('created_at', { ascending: true }); // 오래된 순

    if (error) {
      console.error("신청서 로드 에러:", error);
    } else {
      setApplications(data);
    }
  };

  // ✅ 담당자 자원하기 (Claim)
  const handleClaimTest = async (appId) => {
    if (!window.confirm('이 신청자의 가입 테스트를 담당하시겠습니까?')) return;

    try {
      setProcessingId(appId);
      const { error } = await supabase
        .from('applications')
        .update({ tester_id: myProfile.id })
        .eq('id', appId);

      if (error) throw error;
      await fetchApplications(); // 목록 새로고침
    } catch (error) {
      alert('담당자 지정 실패: ' + error.message);
    } finally {
      setProcessingId(null);
    }
  };

  // ✅ 결과 처리 (합격/불합격)
  const handleProcessResult = async (app, resultStatus) => {
    const isPass = resultStatus === '합격';
    const confirmMsg = isPass 
      ? `[${app.btag}]님을 '합격' 처리하시겠습니까?\n합격 처리 시 자동으로 [신입 클랜원]으로 승급됩니다.`
      : `[${app.btag}]님을 '불합격' 처리하시겠습니까?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      setProcessingId(app.id);

      // 1. 신청서 상태 업데이트
      const { error: appError } = await supabase
        .from('applications')
        .update({ status: resultStatus, test_result: `${myProfile.nickname}이(가) ${resultStatus} 처리함.` })
        .eq('id', app.id);
      
      if (appError) throw appError;

      // 2. 합격일 경우, 해당 유저의 profiles.role을 'rookie'로 승급
      if (isPass && app.user_id) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ role: 'rookie' })
          .eq('id', app.user_id);
        
        if (profileError) throw profileError;
      }

      alert(`처리가 완료되었습니다. (${resultStatus})`);
      await fetchApplications(); // 처리 완료된 항목은 목록에서 사라짐 (status가 대기중이 아니므로)
      
    } catch (error) {
      alert('결과 처리 실패: ' + error.message);
    } finally {
      setProcessingId(null);
    }
  };


  if (loading) return <div className="text-center py-24 text-gray-500 font-mono">[ FETCHING APPLICATIONS... ]</div>;
  
  if (!myProfile || powerLevel[myProfile.role] < powerLevel['elite']) {
    return <div className="text-center py-24 text-red-400 font-bold">⚠️ 접근 권한이 없습니다. 정예 클랜원 이상 전용입니다.</div>;
  }

  return (
    <div className="w-full max-w-6xl mx-auto py-8 px-4 animate-fade-in-down font-sans">
      <div className="flex items-center justify-between mb-8 border-b border-gray-700 pb-5">
        <div>
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-600">
            가입 심사 관리
          </h2>
          <p className="text-gray-400 mt-1">대기 중인 가입 신청서를 확인하고 테스트를 진행하세요.</p>
        </div>
      </div>

      <div className="space-y-6">
        {applications.map((app) => (
          <div key={app.id} className="bg-gray-800 rounded-2xl border border-gray-700 shadow-xl overflow-hidden hover:border-gray-600 transition-colors">
            
            {/* 카드 헤더 (종족, 티어, 작성일) */}
            <div className="bg-gray-900/50 p-4 border-b border-gray-700 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className={`px-2.5 py-1 text-xs font-bold rounded-md ${
                  app.race.includes('Terran') ? 'bg-blue-900/50 text-blue-300 border border-blue-800' :
                  app.race.includes('Protoss') ? 'bg-yellow-900/50 text-yellow-300 border border-yellow-800' :
                  app.race.includes('Zerg') ? 'bg-purple-900/50 text-purple-300 border border-purple-800' :
                  'bg-gray-700 text-gray-300'
                }`}>
                  {app.race}
                </span>
                <span className="text-sm font-bold text-gray-300">티어: {app.tier}</span>
              </div>
              <span className="text-xs text-gray-500 font-mono">
                {new Date(app.created_at).toLocaleString()}
              </span>
            </div>

            {/* 본문 정보 */}
            <div className="p-6">
              <h3 className="text-2xl font-black text-white mb-4">{app.btag}</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-900 p-3 rounded-lg border border-gray-700">
                  <p className="text-xs text-gray-500 mb-1">연락처</p>
                  <p className="font-mono text-gray-300">{app.phone}</p>
                </div>
                <div className="bg-gray-900 p-3 rounded-lg border border-gray-700">
                  <p className="text-xs text-gray-500 mb-1">자기소개</p>
                  <p className="text-sm text-gray-300 whitespace-pre-wrap">{app.intro}</p>
                </div>
              </div>

              {/* 액션 버튼 영역 */}
              <div className="flex flex-col sm:flex-row justify-between items-center pt-4 border-t border-gray-700/50 gap-4">
                
                {/* 담당자 정보 표시 */}
                <div className="text-sm">
                  {app.tester_id ? (
                    <span className="text-yellow-400 font-bold flex items-center gap-2">
                      ⚔️ 테스트 담당: {app.tester?.nickname || '알 수 없는 요원'}
                      {app.tester_id === myProfile.id && <span className="text-xs bg-yellow-900/50 border border-yellow-700 px-2 py-0.5 rounded-full">나의 임무</span>}
                    </span>
                  ) : (
                    <span className="text-gray-500 italic">아직 담당자가 배정되지 않았습니다.</span>
                  )}
                </div>

                {/* 상황에 맞는 버튼 출력 */}
                <div className="flex gap-2 w-full sm:w-auto">
                  {!app.tester_id ? (
                    // 담당자가 없을 때
                    <button 
                      onClick={() => handleClaimTest(app.id)}
                      disabled={processingId === app.id}
                      className="w-full sm:w-auto px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold rounded-lg shadow-md transition-transform hover:scale-105"
                    >
                      내가 담당하기
                    </button>
                  ) : app.tester_id === myProfile.id ? (
                    // 내가 담당자일 때 (결과 처리 가능)
                    <>
                      <button 
                        onClick={() => handleProcessResult(app, '합격')}
                        disabled={processingId === app.id}
                        className="flex-1 sm:flex-none px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors"
                      >
                        합격 처리
                      </button>
                      <button 
                        onClick={() => handleProcessResult(app, '불합격')}
                        disabled={processingId === app.id}
                        className="flex-1 sm:flex-none px-6 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-colors"
                      >
                        불합격
                      </button>
                    </>
                  ) : (
                    // 남이 담당자일 때
                    <button disabled className="px-6 py-2 bg-gray-700 text-gray-500 font-bold rounded-lg cursor-not-allowed">
                      다른 요원이 진행 중
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {applications.length === 0 && (
          <div className="text-center py-20 bg-gray-900/50 rounded-2xl border-2 border-dashed border-gray-700">
            <span className="text-4xl block mb-4">☕</span>
            <p className="text-gray-400 text-lg">현재 대기 중인 가입 신청서가 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}
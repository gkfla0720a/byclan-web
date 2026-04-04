'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabase';

export default function ApplicationList() {
  const [applications, setApplications] = useState([]);
  const [myProfile, setMyProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  
  // ✨ 탭 상태 관리 ('pending': 대기중, 'completed': 심사 완료)
  const [activeTab, setActiveTab] = useState('pending');

  // ✨ 피드백 팝업창 상태 관리
  const [modalData, setModalData] = useState({ isOpen: false, app: null, status: '', feedback: '' });

  const powerLevel = { master: 100, admin: 80, elite: 60, member: 40, rookie: 20, associate: 15, guest: 10, expelled: 0 };

  useEffect(() => {
    checkAuthAndFetch();
  }, [activeTab]); // 탭이 바뀔 때마다 데이터를 새로 불러옵니다.

  const checkAuthAndFetch = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // ✨ 여기서도 변경된 ByID와 discord_name을 가져오도록 수정
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, ByID, discord_name, role')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          const currentRole = profile.role.trim().toLowerCase();
          setMyProfile({ ...profile, role: currentRole });
          
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
    // ✨ 탭에 따라 불러올 상태('대기중' or '합격/불합격')를 다르게 설정
    const queryStatus = activeTab === 'pending' ? '대기중' : null;

    let query = supabase
      .from('applications')
      // ✨ tester_id와 user_id에서 ByID와 discord_name을 정확히 가져옵니다.
      .select(`
        *,
        tester_id,
        user_id
      `);

    if (activeTab === 'pending') {
      query = query.eq('status', '대기중').order('created_at', { ascending: true });
    } else {
      query = query.neq('status', '대기중').order('created_at', { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
      console.error("신청서 로드 에러:", error);
    } else {
      setApplications(data);
    }
  };

  const handleClaimTest = async (appId) => {
    if (!window.confirm('이 신청자의 가입 테스트를 담당하시겠습니까?')) return;

    try {
      setProcessingId(appId);
      const { error } = await supabase
        .from('applications')
        .update({ tester_id: myProfile.id })
        .eq('id', appId);

      if (error) throw error;
      await fetchApplications(); 
    } catch (error) {
      alert('담당자 지정 실패: ' + error.message);
    } finally {
      setProcessingId(null);
    }
  };

  // ✨ 합격/불합격 버튼을 누르면 팝업창(모달)을 엽니다.
  const openProcessModal = (app, status) => {
    setModalData({
      isOpen: true,
      app: app,
      status: status,
      feedback: status === '합격' ? '테스트 수고하셨습니다! ByClan에 오신 것을 환영합니다.' : '테스트 수고하셨습니다. 아쉽게도 이번에는 불합격입니다.'
    });
  };

  // ✨ 모달창에서 [확인]을 누르면 실제 처리(DB 업데이트 + 알림 발송)가 진행됩니다.
  const confirmProcess = async () => {
    const { app, status, feedback } = modalData;
    const isPass = status === '합격';
    const testerName = myProfile.ByID || myProfile.discord_name || '운영진';

    try {
      setProcessingId(app.id);
      
      // 1. 애플리케이션 상태 및 DB 피드백(test_result) 업데이트
      const finalTestResult = `[${status}] 담당: ${testerName} | 코멘트: ${feedback}`;
      const { error: appError } = await supabase
        .from('applications')
        .update({ status: status, test_result: finalTestResult })
        .eq('id', app.id);
      
      if (appError) throw appError;

      // 2. 합격일 경우 권한 승급
      if (isPass && app.user_id) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ role: 'rookie' })
          .eq('id', app.user_id);
        if (profileError) throw profileError;
      }

      // 3. ✨ 알림 테이블에 데이터 전송 (유저의 알림함으로 쏙!)
      const notiMessage = isPass 
        ? `축하합니다! ByClan 가입 테스트에 합격하셨습니다.\n심사관 코멘트: "${feedback}"\n이제 [신입 클랜원]으로 활동하실 수 있습니다!`
        : `안타깝게도 이번 ByClan 가입 신청은 불합격되었습니다.\n심사관 코멘트: "${feedback}"\n다음에 다시 도전해 주세요.`;

      await supabase.from('notifications').insert({
        user_id: app.user_id,
        title: isPass ? "🎉 가입 합격 알림" : "✉️ 가입 심사 결과",
        message: notiMessage
      });

      alert(`처리가 완료되었습니다. (${status})`);
      setModalData({ isOpen: false, app: null, status: '', feedback: '' });
      await fetchApplications(); 
      
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
    <div className="w-full max-w-6xl mx-auto py-8 px-4 animate-fade-in-down font-sans relative">
      
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-8 border-b border-gray-700 pb-5 gap-4">
        <div>
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-600">
            가입 심사 관리
          </h2>
          <p className="text-gray-400 mt-1">대기 중인 신청서를 확인하고, 과거 심사 기록을 열람하세요.</p>
        </div>
        
        {/* ✨ 탭 전환 버튼 영역 */}
        <div className="flex bg-gray-900 p-1 rounded-xl border border-gray-700">
          <button 
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${activeTab === 'pending' ? 'bg-gray-700 text-yellow-400 shadow-md' : 'text-gray-500 hover:text-gray-300'}`}
          >
            ⏳ 대기 중 ({activeTab === 'pending' ? applications.length : '?'})
          </button>
          <button 
            onClick={() => setActiveTab('completed')}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${activeTab === 'completed' ? 'bg-gray-700 text-yellow-400 shadow-md' : 'text-gray-500 hover:text-gray-300'}`}
          >
            ✅ 심사 기록실
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {applications.map((app) => (
          <div key={app.id} className={`rounded-2xl border shadow-xl overflow-hidden transition-colors ${activeTab === 'completed' ? 'bg-gray-900/50 border-gray-800' : 'bg-gray-800 border-gray-700 hover:border-gray-600'}`}>
            
            {/* 카드 헤더 */}
            <div className={`p-4 border-b flex justify-between items-center ${activeTab === 'completed' ? 'bg-gray-900 border-gray-800' : 'bg-gray-900/50 border-gray-700'}`}>
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
                {/* ✨ 기록실 탭에서는 상태 뱃지를 보여줍니다 */}
                {activeTab === 'completed' && (
                  <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${app.status === '합격' ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-800' : 'bg-red-900/50 text-red-400 border border-red-800'}`}>
                    {app.status}
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-500 font-mono">
                {new Date(app.created_at).toLocaleString()}
              </span>
            </div>

            {/* 본문 정보 */}
            <div className={`p-6 ${activeTab === 'completed' ? 'opacity-80' : ''}`}>
              <div className="flex items-end gap-3 mb-4">
                <h3 className="text-2xl font-black text-white">{app.btag}</h3>
                {/* 디스코드 이름 표시 (있는 경우) */}
                {app.applicant && (
                  <span className="text-sm text-gray-500 mb-1">
                    (Discord: {app.applicant.ByID || app.applicant.discord_name})
                  </span>
                )}
              </div>
              
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

              {/* ✨ 기록실 탭: 심사 피드백 결과 출력 */}
              {activeTab === 'completed' && (
                <div className="mt-4 p-4 bg-gray-950 border border-gray-800 rounded-lg">
                  <p className="text-xs text-yellow-500 font-bold mb-1">📝 심사 기록 및 코멘트</p>
                  <p className="text-sm text-gray-300">{app.test_result || '기록 없음'}</p>
                </div>
              )}

              {/* ✨ 대기중 탭: 액션 버튼 영역 */}
              {activeTab === 'pending' && (
                <div className="flex flex-col sm:flex-row justify-between items-center pt-4 border-t border-gray-700/50 gap-4">
                  <div className="text-sm">
                    {app.tester_id ? (
                      <span className="text-yellow-400 font-bold flex items-center gap-2">
                        ⚔️ 테스트 담당: {app.tester?.ByID || app.tester?.discord_name || '알 수 없는 요원'}
                        {app.tester_id === myProfile.id && <span className="text-xs bg-yellow-900/50 border border-yellow-700 px-2 py-0.5 rounded-full">나의 임무</span>}
                      </span>
                    ) : (
                      <span className="text-gray-500 italic">아직 담당자가 배정되지 않았습니다.</span>
                    )}
                  </div>

                  <div className="flex gap-2 w-full sm:w-auto">
                    {!app.tester_id ? (
                      <button 
                        onClick={() => handleClaimTest(app.id)}
                        disabled={processingId === app.id}
                        className="w-full sm:w-auto px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold rounded-lg shadow-md transition-transform hover:scale-105"
                      >
                        내가 담당하기
                      </button>
                    ) : app.tester_id === myProfile.id ? (
                      <>
                        <button 
                          onClick={() => openProcessModal(app, '합격')}
                          disabled={processingId === app.id}
                          className="flex-1 sm:flex-none px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors"
                        >
                          합격 처리
                        </button>
                        <button 
                          onClick={() => openProcessModal(app, '불합격')}
                          disabled={processingId === app.id}
                          className="flex-1 sm:flex-none px-6 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-colors"
                        >
                          불합격
                        </button>
                      </>
                    ) : (
                      <button disabled className="px-6 py-2 bg-gray-700 text-gray-500 font-bold rounded-lg cursor-not-allowed">
                        다른 요원이 진행 중
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {applications.length === 0 && (
          <div className="text-center py-20 bg-gray-900/50 rounded-2xl border-2 border-dashed border-gray-700">
            <span className="text-4xl block mb-4">{activeTab === 'pending' ? '☕' : '🗄️'}</span>
            <p className="text-gray-400 text-lg">
              {activeTab === 'pending' ? '현재 대기 중인 가입 신청서가 없습니다.' : '아직 완료된 심사 기록이 없습니다.'}
            </p>
          </div>
        )}
      </div>

      {/* ✨ 피드백 작성 모달 (팝업창) */}
      {modalData.isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 w-full max-w-md p-6 rounded-2xl border border-gray-700 shadow-2xl animate-fade-in-down">
            <h3 className={`text-2xl font-black mb-2 ${modalData.status === '합격' ? 'text-emerald-400' : 'text-red-400'}`}>
              {modalData.status} 처리 및 피드백
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              작성하신 코멘트는 심사 기록실에 저장되며, 신청자의 알림함으로 즉시 발송됩니다.
            </p>
            
            <textarea
              value={modalData.feedback}
              onChange={(e) => setModalData({ ...modalData, feedback: e.target.value })}
              className="w-full bg-gray-900 border border-gray-600 p-4 rounded-xl text-white resize-none h-32 focus:border-yellow-500 focus:outline-none mb-6"
              placeholder="피드백 코멘트를 작성해주세요..."
            />
            
            <div className="flex gap-3">
              <button 
                onClick={() => setModalData({ isOpen: false, app: null, status: '', feedback: '' })}
                className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-gray-300 font-bold rounded-xl transition-colors"
              >
                취소
              </button>
              <button 
                onClick={confirmProcess}
                disabled={processingId !== null}
                className={`flex-1 py-3 font-bold rounded-xl text-white transition-colors shadow-lg ${
                  modalData.status === '합격' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-red-600 hover:bg-red-500'
                }`}
              >
                {processingId ? '처리 중...' : '전송 및 완료'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

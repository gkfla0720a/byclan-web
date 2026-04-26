'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase';
import { useAuthContext } from '@/app/context/AuthContext';
import { PermissionChecker } from '@/app/utils/permissions';

export default function PostWritePage() {
  const router = useRouter();
  const { user, profile } = useAuthContext();

  // --- 상태 관리 ---
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [linkUrl, setLinkUrl] = useState(''); // URL 링크 추가용
  const [files, setFiles] = useState([]); // 첨부파일 보관용
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 오늘 날짜 포맷팅 (예: 2026. 04. 26)
  const todayDate = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit'
  });

  // --- 파일 선택 및 용량 검사 로직 ---
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB 제한 (무료 DB 보호)
    
    const validFiles = selectedFiles.filter(file => {
      if (file.size > MAX_SIZE) {
        alert(`[${file.name}] 파일이 5MB를 초과하여 제외되었습니다.`);
        return false;
      }
      return true;
    });

    setFiles([...files, ...validFiles]);
  };

  const removeFile = (indexToRemove) => {
    setFiles(files.filter((_, index) => index !== indexToRemove));
  };

  // --- 글 등록 & 파일 업로드 로직 ---
  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      return alert('제목과 내용을 모두 입력해주세요!');
    }

    setIsSubmitting(true);

    try {
      // 1. 권한 확인
      if (!user) throw new Error('로그인이 필요합니다.');
      const userRole = profile?.role?.trim()?.toLowerCase();
      if (!PermissionChecker.hasPermission(userRole, 'community.post')) {
        throw new Error('게시글 작성 권한이 없습니다.');
      }

      const uploadedFileData = [];

      // 2. 파일이 있다면 Supabase Storage에 먼저 업로드!
      if (files.length > 0) {
        for (const file of files) {
          // 파일명 중복 방지를 위해 난수 추가 (예: 123456789_myimage.png)
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = `public/${fileName}`;

          // Storage 버킷('attachments')에 파일 밀어넣기
          const { error: uploadError } = await supabase.storage
            .from('attachments')
            .upload(filePath, file);

          if (uploadError) throw new Error(`파일 업로드 실패: ${uploadError.message}`);

          // 성공하면 누구나 볼 수 있는 공용 URL 발급받기
          const { data: { publicUrl } } = supabase.storage
            .from('attachments')
            .getPublicUrl(filePath);

          uploadedFileData.push({ name: file.name, url: publicUrl, type: file.type });
        }
      }

      // 💡 필수 항목(is_test_data)을 채우기 위해 테스트 계정 여부 확인
      const isTestAuthor = Boolean(profile?.is_test_account);

      // 3. DB 'posts' 테이블에 글 + 파일URL + 링크 함께 저장하기
      const { error } = await supabase
        .from('posts')
        .insert([
          {
            title: title,
            content: content,
            user_id: user.id,
            // 빈칸이면 null로 깔끔하게 들어가도록 처리
            attachment_urls: uploadedFileData.length > 0 ? uploadedFileData : null,
            link_url: linkUrl ? linkUrl : null,
            // 💡 400 에러의 원인이었던 필수 컬럼 부활!
            is_test_data: isTestAuthor,
            is_test_data_active: isTestAuthor,
          }
        ]);

      if (error) {
        console.error("DB Insert 에러 상세:", error);
        throw new Error(`DB 저장 실패: ${error.message}`);
      }

      alert('글이 성공적으로 등록되었습니다!');
      router.push('/community');

    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4 animate-fade-in-up">
      <button onClick={() => router.back()} className="mb-6 text-gray-400 hover:text-yellow-400 font-bold transition-colors flex items-center gap-2">
        ← 목록으로
      </button>

      <div className="bg-gray-800 rounded-2xl border border-gray-700 shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-gray-700 bg-gray-900/50">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <span className="text-yellow-500">✍️</span> 새 글 작성
          </h1>
        </div>

        <div className="p-6 flex flex-col gap-6">
          
          {/* 💡 요청하신 좌측 작성자, 우측 날짜 UI */}
          <div className="flex justify-between items-center text-sm font-bold text-gray-400 px-2">
            <div className="flex items-center gap-2">
              <span className="bg-gray-700 px-2 py-1 rounded text-gray-200">작성자</span>
              <span className="text-yellow-500">{profile?.by_id || '알 수 없음'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-gray-700 px-2 py-1 rounded text-gray-200">작성일</span>
              <span>{todayDate}</span>
            </div>
          </div>

          {/* 제목 입력 */}
          <input 
            type="text" 
            placeholder="제목을 입력하세요" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-4 rounded-xl bg-gray-900 text-white border border-gray-700 focus:outline-none focus:border-yellow-500 transition-colors font-medium text-lg"
          />

          {/* 첨부파일 & URL 입력 영역 */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 bg-gray-900 p-4 rounded-xl border border-gray-700">
              <label className="block text-sm font-bold text-gray-400 mb-2">📎 첨부파일 (5MB 이하 이미지/문서)</label>
              <input 
                type="file" 
                multiple 
                onChange={handleFileChange}
                className="text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-gray-700 file:text-white hover:file:bg-gray-600 cursor-pointer"
              />
              {files.length > 0 && (
                <ul className="mt-3 space-y-1">
                  {files.map((file, idx) => (
                    <li key={idx} className="flex justify-between items-center bg-gray-800 px-3 py-1.5 rounded text-sm text-gray-300">
                      <span className="truncate max-w-[200px]">{file.name}</span>
                      <button onClick={() => removeFile(idx)} className="text-red-400 hover:text-red-300 font-bold">X</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            
            <div className="flex-1 bg-gray-900 p-4 rounded-xl border border-gray-700">
              <label className="block text-sm font-bold text-gray-400 mb-2">🔗 유튜브 / 외부 링크</label>
              <input 
                type="url" 
                placeholder="https://..." 
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="w-full p-2.5 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-yellow-500 text-sm"
              />
            </div>
          </div>

          {/* 내용 입력 */}
          <textarea 
            placeholder="클랜원들과 나눌 이야기를 적어주세요.&#13;&#10;업로드된 파일과 링크는 글 저장 시 자동으로 함께 첨부됩니다." 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full p-4 min-h-[400px] rounded-xl bg-gray-900 text-gray-200 border border-gray-700 focus:outline-none focus:border-yellow-500 transition-colors resize-y text-lg leading-relaxed"
          />

          {/* 하단 버튼 영역 */}
          <div className="flex justify-end gap-3 mt-2 border-t border-gray-700 pt-6">
            <button onClick={() => router.back()} className="px-6 py-3 bg-gray-700 text-white rounded-lg font-bold hover:bg-gray-600 transition-colors">취소</button>
            <button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`px-8 py-3 rounded-lg font-bold text-gray-900 transition-all ${
                isSubmitting ? 'bg-yellow-600 cursor-not-allowed' : 'bg-yellow-500 hover:bg-yellow-400 shadow-lg hover:scale-105'
              }`}
            >
              {isSubmitting ? '업로드 및 등록 중 🚀' : '등록 완료'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
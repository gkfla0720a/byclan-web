// 파일명: src/components/AdminActivityLogViewer.tsx
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/supabase';

export default function AdminActivityLogViewer() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [rows, setRows] = useState<any[]>([]);

  const [category, setCategory] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL'); // 👈 위험도 필터 추가
  const [targetSearch, setTargetSearch] = useState('');

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return setIsAdmin(false);

      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      const allowed = ['developer', 'master', 'admin'].includes(profile?.role || '');
      setIsAdmin(allowed);
      if (!allowed) return;

      let query = supabase.from('admin_audit_logs').select('*').order('created_at', { ascending: false }).limit(300);

      if (category !== 'ALL') query = query.eq('category', category);
      if (severityFilter !== 'ALL') query = query.eq('severity', severityFilter);

      const { data, error } = await query;
      if (error) throw error;
      setRows(data || []);
    } catch (err) {
      console.error('[AdminActivityLogViewer] 오류:', err);
    } finally {
      setLoading(false);
    }
  }, [category, severityFilter]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      return !targetSearch || String(row.target_id || '').includes(targetSearch) || String(row.target_user_id || '').includes(targetSearch);
    });
  }, [rows, targetSearch]);

  // 위험도에 따른 테마 색상 반환 함수
  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'border-red-500/80 bg-red-950/20 text-red-400';
      case 'WARNING': return 'border-yellow-500/80 bg-yellow-950/20 text-yellow-400';
      default: return 'border-gray-700 bg-gray-900/40 text-gray-400';
    }
  };

  if (loading) return <div className="text-center py-10 text-gray-500">감사 로그 로딩 중...</div>;
  if (!isAdmin) return <div className="text-center py-10 text-red-400">접근 권한이 없습니다.</div>;

  return (
    <div className="w-full py-4 space-y-4">
      {/* 1. 상단 컨트롤 패널 */}
      <div className="bg-gray-900/80 border border-gray-700 rounded-2xl p-4">
        <h2 className="text-white text-xl font-black mb-1">운영진 보안 감사 로그 (Security Audit)</h2>
        <p className="text-gray-500 text-sm mb-4">클랜 운영진의 모든 관리자 권한 행사 내역을 투명하게 추적합니다.</p>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-sm text-white">
            <option value="ALL">모든 위험도</option>
            <option value="INFO">일반 (INFO)</option>
            <option value="WARNING">주의 (WARNING)</option>
            <option value="CRITICAL">치명적 (CRITICAL)</option>
          </select>

          <input
            value={targetSearch}
            onChange={(e) => setTargetSearch(e.target.value)}
            placeholder="대상자 아이디 검색"
            className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-sm text-white sm:col-span-2"
          />

          <button onClick={() => loadLogs()} className="bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg p-2 font-bold transition">
            조회 업데이트
          </button>
        </div>
      </div>

      {/* 2. 로그 리스트 출력 */}
      <div className="space-y-3">
        {filtered.map((row) => (
          <div key={row.id} className={`rounded-xl border p-4 transition-all ${getSeverityStyle(row.severity)}`}>
            <div className="flex justify-between items-start mb-2">
              <div className="flex gap-2">
                <span className="px-2 py-1 text-[10px] font-black tracking-widest rounded bg-black/40 uppercase border border-current">
                  {row.severity || 'INFO'}
                </span>
                <span className="px-2 py-1 text-[10px] font-bold rounded bg-gray-800 text-white">
                  {row.category}
                </span>
              </div>
              <span className="text-xs font-mono opacity-60">{new Date(row.created_at).toLocaleString()}</span>
            </div>

            <p className="text-white font-medium text-base mb-3">{row.summary || row.note}</p>

            <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs opacity-80">
              <p>👤 <span className="font-semibold text-white">{row.actor_by_id}</span> ({row.actor_role})</p>
              <p>🎯 대상: <span className="text-white">{row.target_table}</span> {row.target_user_id ? `(${row.target_user_id})` : ''}</p>
              {row.ip_address && <p>🌐 IP: <span className="font-mono">{row.ip_address}</span></p>}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-500 border border-gray-800 border-dashed rounded-2xl">
            해당 조건의 감사 로그가 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}

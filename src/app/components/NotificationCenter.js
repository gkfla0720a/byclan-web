'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabase';

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setNotifications(data || []);

      // 페이지 접속 시 모든 알림 읽음 처리
      await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id);
    }
    setLoading(false);
  };

  if (loading) return <div className="text-center py-20 text-gray-500">LOADING NOTIFICATIONS...</div>;

  return (
    <div className="w-full max-w-3xl mx-auto py-12 px-4 animate-fade-in-down">
      <h2 className="text-3xl font-black text-white mb-8 border-b border-gray-700 pb-4 flex items-center gap-3">
        <span>🔔</span> 알림함
      </h2>

      <div className="space-y-4">
        {notifications.map(noti => (
          <div key={noti.id} className={`p-6 rounded-2xl border ${noti.is_read ? 'bg-gray-800/40 border-gray-700/50' : 'bg-gray-800 border-yellow-700/50 shadow-lg'}`}>
            <div className="flex justify-between items-start mb-2">
              <h4 className={`font-bold ${noti.is_read ? 'text-gray-400' : 'text-yellow-400'}`}>{noti.title}</h4>
              <span className="text-xs text-gray-500 font-mono">{new Date(noti.created_at).toLocaleDateString()}</span>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">{noti.message}</p>
          </div>
        ))}
        {notifications.length === 0 && (
          <div className="text-center py-20 bg-gray-900/50 rounded-2xl border-2 border-dashed border-gray-800 text-gray-500">
            도착한 알림이 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}

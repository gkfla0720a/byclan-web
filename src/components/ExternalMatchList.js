'use client';
import { useState, useEffect } from 'react';

export default function ExternalMatchList() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    fetch('/api/external-ranking')
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          setData(json.data); 
        } else {
          setErrorMsg(json.error);
        }
      })
      .catch((err) => setErrorMsg('네트워크 통신 중 오류가 발생했습니다.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-4 text-cyan-400">📡 랭킹 데이터 불러오는 중...</div>;
  if (errorMsg) return <div className="p-4 text-red-400">🚨 에러: {errorMsg}</div>;
  if (data.length === 0) return <div className="p-4 text-gray-400">데이터가 없습니다.</div>;

  return (
    <div className="overflow-x-auto bg-[#0a0a0f] p-4 rounded-lg border border-gray-800">
      <div className="mb-4 text-sm text-green-400">
        ✅ 총 {data.length}명의 랭킹 데이터를 성공적으로 불러왔습니다.
      </div>
      
      <table className="w-full text-xs text-left text-gray-300 border-collapse whitespace-nowrap">
        <thead className="text-[10px] text-gray-400 uppercase bg-gray-900 border-b border-gray-700">
          <tr>
            <th className="px-3 py-2 border border-gray-700">순위</th>
            <th className="px-3 py-2 border border-gray-700">닉네임</th>
            <th className="px-3 py-2 border border-gray-700">개인 MMR</th>
            <th className="px-3 py-2 border border-gray-700">팀 MMR</th>
            <th className="px-3 py-2 border border-gray-700">총 MMR</th>
            <th className="px-3 py-2 border border-gray-700">변동 (wc)</th>
            <th className="px-3 py-2 border border-gray-700">총 승</th>
            <th className="px-3 py-2 border border-gray-700">총 패</th>
            <th className="px-3 py-2 border border-gray-700">ppp</th>
            <th className="px-3 py-2 border border-gray-700">ppt</th>
            <th className="px-3 py-2 border border-gray-700">ppz</th>
            <th className="px-3 py-2 border border-gray-700">pzt</th>
            <th className="px-3 py-2 border border-gray-700">other</th>
            <th className="px-3 py-2 border border-gray-700">종족</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={idx} className="bg-[#050508] border-b border-gray-800 hover:bg-gray-800/50">
              <td className="px-3 py-2 border border-gray-800 text-center font-bold">{row.rank}</td>
              <td className="px-3 py-2 border border-gray-800 text-cyan-400 font-bold">{row.nick}</td>
              <td className="px-3 py-2 border border-gray-800 text-yellow-500">{row.mmr}</td>
              <td className="px-3 py-2 border border-gray-800 text-gray-400">{row.teammmr}</td>
              <td className="px-3 py-2 border border-gray-800 text-yellow-400 font-bold">{row.totalmmr}</td>
              
              {/* 변동폭(wc) - 양수, 음수에 따라 색상 다르게 표시 */}
              <td className={`px-3 py-2 border border-gray-800 text-center font-bold ${row.wc > 0 ? 'text-green-400' : row.wc < 0 ? 'text-red-400' : 'text-gray-500'}`}>
                {row.wc > 0 ? `+${row.wc}` : row.wc}
              </td>
              
              <td className="px-3 py-2 border border-gray-800 text-blue-400 text-center">{row.tw}</td>
              <td className="px-3 py-2 border border-gray-800 text-red-400 text-center">{row.tl}</td>
              
              {/* 배열 데이터를 .join(', ') 으로 텍스트화 */}
              <td className="px-3 py-2 border border-gray-800 text-center tracking-widest">{row.ppp ? row.ppp.join(', ') : '-'}</td>
              <td className="px-3 py-2 border border-gray-800 text-center tracking-widest">{row.ppt ? row.ppt.join(', ') : '-'}</td>
              <td className="px-3 py-2 border border-gray-800 text-center tracking-widest">{row.ppz ? row.ppz.join(', ') : '-'}</td>
              <td className="px-3 py-2 border border-gray-800 text-center tracking-widest">{row.pzt ? row.pzt.join(', ') : '-'}</td>
              <td className="px-3 py-2 border border-gray-800 text-center tracking-widest">{row.other ? row.other.join(', ') : '-'}</td>
              
              <td className="px-3 py-2 border border-gray-800 text-center text-gray-300">{row.ztpr}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
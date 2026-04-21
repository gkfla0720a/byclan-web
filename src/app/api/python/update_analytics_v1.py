import os
import requests
import pandas as pd
from trueskill import Rating, rate, setup
from dotenv import load_dotenv
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
load_dotenv(dotenv_path='.env.local')

# TrueSkill 기본 설정 (스타크래프트 팀전에 최적화)
setup(mu=25.0, sigma=8.333, beta=4.166, tau=0.083, draw_probability=0)

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
headers = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}

def fetch_all(table_name):
    url = f"{SUPABASE_URL}/rest/v1/{table_name}?select=*"
    return requests.get(url, headers=headers, verify=False).json()

print("⏳ [1/3] 데이터 불러오기 및 계산 시작...")
raw_matches = fetch_all('legacy_matches')

# 계산을 위한 임시 저장소
player_ratings = {} # { 'nick': Rating객체 }
synergy_data = {}   # { ('A', 'B'): {'wins': 0, 'games': 0} }

# 14,000건의 경기를 순회하며 실력 업데이트
for match in raw_matches:
    if 'raw_data' not in match: continue
    
    # 세트별로 분리
    sets = {}
    for p in match['raw_data']:
        s_id = p.get('Set', 'SET 1')
        if s_id not in sets: sets[s_id] = {'A': [], 'B': [], 'A_Win': False}
        sets[s_id][p['Team']].append(p['Name'])
        if p['Team'] == 'A' and p['Win_Loss'] == '승': sets[s_id]['A_Win'] = True

    for s_id, s_info in sets.items():
        if not s_info['A'] or not s_info['B']: continue
        
        # 1. TrueSkill 실력 업데이트 로직
        def get_rating(nick):
            if nick not in player_ratings: player_ratings[nick] = Rating()
            return player_ratings[nick]

        team_a_ratings = [get_rating(n) for n in s_info['A']]
        team_b_ratings = [get_rating(n) for n in s_info['B']]
        
        # 경기 결과 적용 (0이 승리팀, 1이 패배팀)
        ranks = [0, 1] if s_info['A_Win'] else [1, 0]
        new_a, new_b = rate([team_a_ratings, team_b_ratings], ranks=ranks)
        
        for i, n in enumerate(s_info['A']): player_ratings[n] = new_a[i]
        for i, n in enumerate(s_info['B']): player_ratings[n] = new_b[i]

        # 2. 시너지(궁합) 데이터 수집 로직
        def record_synergy(team_list, is_win):
            for i in range(len(team_list)):
                for j in range(i + 1, len(team_list)):
                    pair = tuple(sorted([team_list[i], team_list[j]]))
                    if pair not in synergy_data: synergy_data[pair] = {'wins': 0, 'games': 0}
                    synergy_data[pair]['games'] += 1
                    if is_win: synergy_data[pair]['wins'] += 1

        record_synergy(s_info['A'], s_info['A_Win'])
        record_synergy(s_info['B'], not s_info['A_Win'])

print("⏳ [2/3] 분석 결과 DB 업로드 중...")

# 3. 선수 분석 결과 저장
analytics_payload = []
for nick, rating in player_ratings.items():
    analytics_payload.append({
        'nick': nick,
        'mu': rating.mu,
        'sigma': rating.sigma,
        'updated_at': 'now()'
    })

# 4. 시너지 결과 저장
synergy_payload = []
for (p1, p2), stats in synergy_data.items():
    if stats['games'] < 5: continue # 최소 5경기 이상 같이 한 경우만 저장
    synergy_payload.append({
        'player_a': p1,
        'player_b': p2,
        'combined_win_rate': stats['wins'] / stats['games'],
        'total_games': stats['games']
    })

# Supabase Upsert (나눠서 업로드 권장)
requests.post(f"{SUPABASE_URL}/rest/v1/player_analytics", headers=headers, json=analytics_payload, verify=False)
requests.post(f"{SUPABASE_URL}/rest/v1/synergy_scores", headers=headers, json=synergy_payload, verify=False)

print(f"✅ 완료! {len(analytics_payload)}명의 선수 분석과 {len(synergy_payload)}쌍의 시너지 데이터가 저장되었습니다.")
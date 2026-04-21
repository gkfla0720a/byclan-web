import os
import requests
import pandas as pd
import numpy as np
from dotenv import load_dotenv
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
load_dotenv(dotenv_path='.env.local')

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
headers = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}

def fetch_all(table_name):
    url = f"{SUPABASE_URL}/rest/v1/{table_name}?select=*"
    res = requests.get(url, headers=headers, verify=False)
    return res.json()

print("🔍 분석 신뢰성 검증 및 V4 모델 학습 시작...")

# 데이터 로드
db_data = fetch_all('legacy_matches')
ranking_data = fetch_all('latest_rankings')
rank_map = { r['nick'].strip().lower(): r for r in ranking_data }

def calculate_reliable_features(players_list, opponent_list):
    """
    지적하신 대로 '팀의 이름'을 지우고 오직 실력적 '격차'를 위한 기본 스탯만 추출합니다.
    """
    def get_info(name): return rank_map.get(name.strip().lower(), {})

    # 1. MMR 관련 (연속형 데이터)
    mmrs = [get_info(p['Name']).get('totalmmr', 2000) for p in players_list]
    
    # 2. 💡 종족 숙련도 (가장 중요한 현실적 접근)
    # 해당 경기에서 부여받은 종족(P, T, Z, R)에 대한 선수의 실제 승률
    mastery_scores = []
    for p in players_list:
        p_info = get_info(p['Name'])
        race_key = f"pp{p['Race'].lower()}" if p['Race'] != 'R' else 'other'
        stats = p_info.get(race_key, [0, 0])
        win_rate = stats[0] / sum(stats) if sum(stats) > 0 else 0.5 # 전적 없으면 50%
        mastery_scores.append(win_rate)

    return {
        'Avg_MMR': np.mean(mmrs),
        'MMR_Std': np.std(mmrs) if len(mmrs) > 1 else 0,
        'MMR_Range': max(mmrs) - min(mmrs) if mmrs else 0,
        'Avg_Mastery': np.mean(mastery_scores), # 팀의 해당 종족 숙련도 평균
        'Ace_Count': sum(1 for p in players_list if p.get('Is_Ace') == 'O')
    }

match_sets_data = []
for row in db_data:
    if 'raw_data' in row and isinstance(row['raw_data'], list):
        sets_dict = {}
        for player in row['raw_data']:
            s_num = player.get('Set', 'SET 1')
            if s_num not in sets_dict: sets_dict[s_num] = {'A': [], 'B': [], 'A_Win': 0}
            sets_dict[s_num][player.get('Team')].append(player)
            if player.get('Team') == 'A' and player.get('Win_Loss') == '승': sets_dict[s_num]['A_Win'] = 1

        for s_num, s_info in sets_dict.items():
            if not s_info['A'] or not s_info['B']: continue
            
            f_a = calculate_reliable_features(s_info['A'], s_info['B'])
            f_b = calculate_reliable_features(s_info['B'], s_info['A'])
            
            # 💡 핵심: 'A팀의 것', 'B팀의 것'을 따로 주지 않고 오직 '격차(Gap)'만 학습시킴
            # 이렇게 해야 모델이 특정 팀명에 집착하지 않습니다.
            match_sets_data.append({
                'MMR_Gap': f_a['Avg_MMR'] - f_b['Avg_MMR'],
                'Std_Gap': f_a['MMR_Std'] - f_b['MMR_Std'],
                'Range_Gap': f_a['MMR_Range'] - f_b['MMR_Range'],
                'Mastery_Gap': f_a['Avg_Mastery'] - f_b['Avg_Mastery'],
                'Ace_Gap': f_a['Ace_Count'] - f_b['Ace_Count'],
                'Target': s_info['A_Win']
            })

df = pd.DataFrame(match_sets_data)
X = df.drop('Target', axis=1)
y = df['Target']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# 신뢰성 리포트
print("\n" + "="*55)
print(f"📊 V4 정밀 모델 신뢰성 검증 완료")
print(f"예측 정확도: {accuracy_score(y_test, model.predict(X_test)) * 100:.2f}%")
print("="*55)

# 요인 분석 (지적하신 오류가 제거된 진짜 순위)
importances = model.feature_importances_
name_map = {
    'MMR_Gap': '양 팀 평균 MMR 격차 (기본 체급)',
    'Mastery_Gap': '부여된 종족에 대한 팀 숙련도 차이 (상성 극복)',
    'Std_Gap': '팀 내 실력 밸런스 차이 (조직력)',
    'Range_Gap': '팀 내 실력 편차 범위 차이',
    'Ace_Gap': '에이스 비중 차이'
}

f_imp = sorted(zip(X.columns, importances), key=lambda x: x[1], reverse=True)
print("\n💡 [분석 결과] 무엇이 진짜 승패를 결정짓는가?")
for i, (f, imp) in enumerate(f_imp, 1):
    print(f"{i}위: {name_map.get(f, f):<30} -> {imp*100:5.2f}%")
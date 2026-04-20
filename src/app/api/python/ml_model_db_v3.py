import os
import requests
import pandas as pd
import numpy as np
from dotenv import load_dotenv
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
import urllib3

# 1. 초기 설정 및 보안 우회
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
load_dotenv(dotenv_path='.env.local')

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
# 쓰기와 정밀 조회를 위해 SERVICE_ROLE_KEY 권장 (없으면 ANON_KEY 사용)
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

headers = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}

def fetch_all(table_name):
    # Supabase는 기본적으로 1000건씩 끊어서 주므로, 전체 데이터를 가져오기 위해 넉넉히 요청하거나 API 호출
    url = f"{SUPABASE_URL}/rest/v1/{table_name}?select=*"
    res = requests.get(url, headers=headers, verify=False)
    return res.json()

print("⏳ DB에서 전적 데이터와 최신 랭킹 데이터를 통합하는 중...")

# 2. 데이터 불러오기
db_data = fetch_all('legacy_matches')
ranking_data = fetch_all('latest_rankings')

# 닉네임으로 랭킹 정보를 바로 찾을 수 있게 맵(Map) 생성
rank_map = { r['nick']: r for r in ranking_data }

# 티어 점수표 (기존 유지)
tier_mapping = {
    '브론즈 3': 1, '브론즈 2': 2, '브론즈 1': 3,
    '실버 3': 4, '실버 2': 5, '실버 1': 6,
    '골드 3': 7, '골드 2': 8, '골드 1': 9,
    '플래티넘 3': 10, '플래티넘 2': 11, '플래티넘 1': 12,
    '다이아몬드 3': 13, '다이아몬드 2': 14, '다이아몬드 1': 15,
    '마스터 3': 16, '마스터 2': 17, '마스터 1': 18,
    '그랜드마스터': 19
}

# 3. 💡 [V3 핵심] 정밀 통계 계산 함수
def calculate_team_synergy(players_list, opponent_list):
    # 선수들의 MMR 정보 (랭킹 데이터에 없으면 기본값 2000점)
    mmrs = [rank_map.get(p['Name'], {}).get('totalmmr', 2000) for p in players_list]
    
    # 지표 A: MMR 불균형 (표준편차)
    mmr_std = np.std(mmrs) if len(mmrs) > 1 else 0
    # 지표 B: MMR 범위 (최고-최저 격차)
    mmr_range = max(mmrs) - min(mmrs) if mmrs else 0
    
    # 지표 C: 종족 역할 충돌 (주종족 중복도)
    pref_races = [rank_map.get(p['Name'], {}).get('race', '') for p in players_list]
    role_conflict = len(pref_races) - len(set(pref_races))
    
    # 지표 D: 종족전 숙련도 (상대 팀 종족에 따른 우리 팀의 승률 합계)
    opp_races = [p.get('Race', '') for p in opponent_list]
    mastery_score = 0
    for p in players_list:
        p_info = rank_map.get(p['Name'], {})
        for orace in opp_races:
            # 랭킹 DB의 ppp, ppt, ppz 배열 [승, 패] 활용
            key = f"pp{orace.lower()}" # ppp, ppt, ppz
            stats = p_info.get(key, [0, 0])
            if sum(stats) > 0:
                mastery_score += stats[0] / sum(stats) # 해당 종족전 승률 합산
                
    return {
        'Avg_MMR': np.mean(mmrs),
        'MMR_Std': mmr_std,
        'MMR_Range': mmr_range,
        'Role_Conflict': role_conflict,
        'Mastery_Score': mastery_score
    }

# 4. 데이터 가공 (세트 단위)
match_sets_data = []

for row in db_data:
    if 'raw_data' in row and isinstance(row['raw_data'], list):
        sets_dict = {} 
        for player in row['raw_data']:
            s_num = player.get('Set', 'SET 1')
            if s_num not in sets_dict:
                sets_dict[s_num] = {'Team_A': [], 'Team_B': [], 'A_Win': 0}
            
            team = player.get('Team')
            if team == 'A':
                sets_dict[s_num]['Team_A'].append(player)
                if player.get('Win_Loss') == '승': sets_dict[s_num]['A_Win'] = 1
            elif team == 'B':
                sets_dict[s_num]['Team_B'].append(player)

        for s_num, s_info in sets_dict.items():
            if not s_info['Team_A'] or not s_info['Team_B']: continue
            
            # [V3] 양 팀의 정밀 지표 추출
            feat_a = calculate_team_synergy(s_info['Team_A'], s_info['Team_B'])
            feat_b = calculate_team_synergy(s_info['Team_B'], s_info['Team_A'])
            
            # 학습용 데이터 1줄 생성
            row_entry = {
                'MMR_Gap': feat_a['Avg_MMR'] - feat_b['Avg_MMR'],
                'Std_Diff': feat_a['MMR_Std'] - feat_b['MMR_Std'], # 격차의 차이
                'Range_Diff': feat_a['MMR_Range'] - feat_b['MMR_Range'],
                'Mastery_Gap': feat_a['Mastery_Score'] - feat_b['Mastery_Score'],
                'A_Conflict': feat_a['Role_Conflict'],
                'B_Conflict': feat_b['Role_Conflict'],
                'A_Power': feat_a['Avg_MMR'],
                'B_Power': feat_b['Avg_MMR'],
                'Target_A_Win': s_info['A_Win']
            }
            match_sets_data.append(row_entry)

df = pd.DataFrame(match_sets_data)
print(f"✅ 정밀 데이터 변환 완료: {len(df)}건의 세트 데이터 생성\n")

# 5. 머신러닝 학습
features = ['MMR_Gap', 'Std_Diff', 'Range_Diff', 'Mastery_Gap', 'A_Conflict', 'B_Conflict', 'A_Power', 'B_Power']
X = df[features]
y = df['Target_A_Win']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

print("🧠 V3 정밀 모델 학습 시작...")
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# 6. 결과 출력
accuracy = accuracy_score(y_test, model.predict(X_test))
print("=" * 50)
print(f"🎉 V3 모델 학습 완료! 예측 정확도: {accuracy * 100:.2f}%")
print("=" * 50)

importances = model.feature_importances_
f_imp = sorted(zip(features, importances), key=lambda x: x[1], reverse=True)

name_map = {
    'MMR_Gap': '양 팀 평균 MMR 격차',
    'Mastery_Gap': '상대 종족전 숙련도 차이',
    'Std_Diff': '팀 내 실력 편차 차이 (분포도)',
    'Range_Diff': '팀 내 최고-최저 실력 격차 차이',
    'A_Conflict': 'A팀 주종족 중복(불협화음)',
    'B_Conflict': 'B팀 주종족 중복(불협화음)',
    'A_Power': 'A팀 총 전력',
    'B_Power': 'B팀 총 전력'
}

print("\n💡 [V3 승리 결정 핵심 요인 TOP 5]")
for i, (f, imp) in enumerate(f_imp[:5], 1):
    print(f"{i}위: {name_map.get(f, f)} -> {imp*100:.1f}%")
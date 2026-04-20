import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
import warnings
warnings.filterwarnings('ignore')

print("⏳ 데이터를 불러오고 전처리를 시작합니다...")

# 1. 엑셀에서 뽑아낸 CSV 데이터 불러오기
try:
    df = pd.read_csv('byclan_records.csv')
    print(f"✅ 총 {len(df)}건의 과거 경기 데이터를 성공적으로 불러왔습니다!\n")
except FileNotFoundError:
    print("🚨 byclan_records.csv 파일을 찾을 수 없습니다. 파이썬 파일과 같은 폴더에 있는지 확인해주세요!")
    exit()

# 2. 데이터 전처리 (문자를 숫자로 변환)
# 2-1. 승패 변환 (승=1, 패=0)
df['Win_Loss_Num'] = df['Win_Loss'].apply(lambda x: 1 if x == '승' else 0)

# 2-2. 종족 변환 (P=0, T=1, Z=2, R=3)
race_mapping = {'P': 0, 'T': 1, 'Z': 2, 'R': 3}
df['Race_Num'] = df['Race'].map(race_mapping).fillna(-1)

# 2-3. 에이스 결정전 출전 여부 (O=1, X=0)
df['Is_Ace_Num'] = df['Is_Ace'].apply(lambda x: 1 if x == 'O' else 0)

# 2-4. 티어(Tier) 점수화 (ByClan 티어 체계에 맞게 가중치 부여)
tier_mapping = {
    '브론즈 3': 1, '브론즈 2': 2, '브론즈 1': 3,
    '실버 3': 4, '실버 2': 5, '실버 1': 6,
    '골드 3': 7, '골드 2': 8, '골드 1': 9,
    '플래티넘 3': 10, '플래티넘 2': 11, '플래티넘 1': 12,
    '다이아몬드 3': 13, '다이아몬드 2': 14, '다이아몬드 1': 15,
    '마스터 3': 16, '마스터 2': 17, '마스터 1': 18,
    '그랜드마스터': 19
}
df['Tier_Num'] = df['Tier'].map(tier_mapping).fillna(0)

# 3. 머신러닝 학습 준비
# X: 인공지능이 힌트로 사용할 데이터 (종족, 티어, 에이스여부)
# y: 인공지능이 맞춰야 할 정답 (승패)
features = ['Race_Num', 'Tier_Num', 'Is_Ace_Num']
X = df[features]
y = df['Win_Loss_Num']

# 학습용 데이터(80%)와 시험용 데이터(20%) 분리
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

print("🧠 랜덤포레스트 인공지능 모델 학습 중...\n")

# 4. 랜덤포레스트 모델 훈련 (의사결정나무 100개를 생성하여 투표)
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# 5. 채점 및 결과 분석
predictions = model.predict(X_test)
accuracy = accuracy_score(y_test, predictions)

print("=" * 40)
print(f"🎉 모델 학습 완료! 예측 정확도: {accuracy * 100:.2f}%")
print("=" * 40)

# 6. 어떤 변수가 승패에 가장 큰 영향을 미쳤을까?
importances = model.feature_importances_
print("\n💡 [승패에 가장 큰 영향을 미친 핵심 지표]")
print(f"1위: 티어(계급) 영향력 -> {importances[1]*100:.1f}%")
print(f"2위: 종족(상성) 영향력 -> {importances[0]*100:.1f}%")
print(f"3위: 에이스 출전 여부 -> {importances[2]*100:.1f}%")
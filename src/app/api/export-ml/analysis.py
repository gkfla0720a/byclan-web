import os
import requests
import pandas as pd
from dotenv import load_dotenv

# 🚨 사내망 보안 경고 메시지(InsecureRequestWarning) 숨기기
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# 1. .env.local 파일로부터 환경변수 읽기
load_dotenv(dotenv_path='.env.local')

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("🚨 환경변수를 찾을 수 없습니다. .env.local 파일을 확인해주세요.")
else:
    # 2. Supabase REST API 직통 호출 (보안 검사 완벽 무시)
    api_url = f"{SUPABASE_URL}/rest/v1/legacy_matches?select=raw_data"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json"
    }

    try:
        # verify=False 가 사내망 방화벽을 뚫는 핵심 열쇠입니다!
        response = requests.get(api_url, headers=headers, verify=False)
        response.raise_for_status() # 에러 발생 시 잡아냄
        
        data = response.json()
        
        if len(data) == 0:
            print("📭 DB에 저장된 데이터가 없습니다. 엑셀에서 매크로를 먼저 실행해 보세요!")
        else:
            # 3. JSON 형태의 raw_data를 판다스 표(DataFrame)로 변환
            data_list = [row['raw_data'] for row in data]
            df = pd.DataFrame(data_list)

            print(f"✅ 사내망 방화벽 우회 성공! DB에서 {len(df)}건의 데이터를 실시간으로 가져왔습니다.")
            
            # 데이터 상위 5개 출력
            print("\n📊 데이터 상위 5행:")
            print(df.head())
            
    except Exception as e:
        print(f"🚨 통신 에러 발생: {e}")
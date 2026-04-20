import os
import pandas as pd
from supabase import create_client
from dotenv import load_dotenv

# 1. .env.local 파일로부터 환경변수 읽기
load_dotenv(dotenv_path='.env.local')

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("🚨 환경변수를 찾을 수 없습니다. .env.local 파일을 확인해주세요.")
else:
    # 2. Supabase 클라이언트 생성
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    # 3. DB에서 데이터 가져오기 (legacy_matches 테이블)
    try:
        response = supabase.table('legacy_matches').select('raw_data').execute()
        
        if len(response.data) == 0:
            print("📭 DB에 저장된 데이터가 없습니다. API를 먼저 실행해 보세요!")
        else:
            # 4. JSON 형태의 raw_data를 표(DataFrame)로 변환
            data_list = [row['raw_data'] for row in response.data]
            df = pd.DataFrame(data_list)

            print(f"✅ DB에서 {len(df)}건의 데이터를 실시간으로 가져왔습니다.")
            
            # 데이터 요약 보기
            print("\n📊 데이터 상위 5행:")
            print(df.head())
            
            # 분석을 위한 기본 통계 (예: 승패 분포)
            print("\n📈 승패 분포:")
            print(df['Win_Loss'].value_counts())
            
    except Exception as e:
        print(f"🚨 에러 발생: {e}")
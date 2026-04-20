import requests
import time
import urllib3

# 사내망 경고 숨기기
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

print("🚀 [데이터 수집] 과거 기록을 DB에 저장합니다...")
print("이 작업은 서버 보호를 위해 약 1~2분 정도 소요됩니다.\n")

total_saved = 0

# 1페이지부터 60페이지까지 순회 (데이터가 더 많다면 60을 70으로 늘리세요)
for page in range(1, 61):
    # 우리가 만든 Next.js API 호출
    url = f"http://localhost:3000/api/export-ml?page={page}"
    
    try:
        # API를 호출하면, API 내부 로직에 의해 자동으로 Supabase에 Upsert(저장) 됩니다.
        response = requests.get(url, verify=False)
        
        if response.status_code == 200:
            data = response.json()
            count = data.get('count', 0)
            total_saved += count
            print(f"✅ {page}페이지 완료: {count}건 DB 저장됨 (누적: {total_saved}건)")
            
            # 더 이상 가져올 데이터가 없으면 조기 종료
            if count == 0:
                print("🏁 더 이상 과거 데이터가 없어 수집을 조기 종료합니다.")
                break
        else:
            # API가 보내준 진짜 에러 메시지(response.text)를 함께 출력합니다!
            print(f"⚠️ {page}페이지 호출 에러 (상태코드: {response.status_code}) - 사유: {response.text}")
            
    except Exception as e:
        print(f"🚨 통신 에러 발생: {e}")
        break
        
    # 타겟 서버(ByClan)를 보호하기 위해 페이지당 1.5초 휴식
    time.sleep(1.5)

print(f"\n🎉 작업 완료! 총 {total_saved}건의 데이터가 Supabase DB에 안전하게 적재되었습니다.")
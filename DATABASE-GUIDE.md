# 데이터베이스 수정 가이드

## 🗄️ Supabase SQL Editor 사용법

### **1. 접속 방법**
1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. ByClan 프로젝트 선택
3. 왼쪽 메뉴에서 **SQL Editor** 클릭
4. `DATABASE-QUERIES.sql` 파일의 내용 복사/붙여넣기

---

### **🔧 현재 필요할 수 있는 수정**

#### **1. 프로필 테이블 스키마 확인**
```sql
-- 현재 profiles 테이블 구조 확인
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;
```

#### **2. 필요한 컬럼 추가**
```sql
-- 승격 관련 컬럼 추가 (없을 경우)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS promoted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS promoted_by UUID REFERENCES profiles(id);
```

#### **3. ladder_matches 테이블 구조 확인**
```sql
-- ladder_matches 테이블 구조 확인
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'ladder_matches' 
ORDER BY ordinal_position;
```

---

### **⚠️ 주의사항**

#### **실행 전 확인:**
- **백업**: 중요 데이터는 백업 후 실행
- **테스트**: 개발 환경에서 먼저 테스트
- **권한**: RLS 정책 확인

#### **실행 순서:**
1. **구조 확인** → 2. **컬럼 추가** → 3. **인덱스 생성** → 4. **데이터 확인**

---

### **🚨 긴급 상황 대비**

#### **백업 쿼리:**
```sql
-- 중요 데이터 백업
CREATE TABLE profiles_backup AS SELECT * FROM profiles;
CREATE TABLE applications_backup AS SELECT * FROM applications;
```

#### **복구 쿼리:**
```sql
-- 문제 발생 시 복구
INSERT INTO profiles SELECT * FROM profiles_backup;
```

---

### **📞 문제 발생 시**

1. **에러 메시지**를 그대로 복사해서 전달
2. **실행한 쿼리**와 **시점** 알려주기
3. **현재 데이터 상태** 스크린샷 제공

---

### **🎯 추천 실행 순서**

#### **1단계: 현재 상태 확인**
```sql
-- 모든 역할별 사용자 수 확인
SELECT role, COUNT(*) as count FROM profiles GROUP BY role ORDER BY count DESC;
```

#### **2단계: 필요한 컬럼 확인**
```sql
-- applications 테이블 구조 확인
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'applications';
```

#### **3단계: 인덱스 생성**
```sql
-- 성능 향상을 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
```

---

## 📱 **모바일에서도 가능**

**GitHub 앱**에서 `DATABASE-QUERIES.sql` 파일 열고 필요한 부분 복사해서 Supabase에 붙여넣기!

---

*이 파일은 필요한 SQL 쿼리를 모아둔 참고용입니다. 상황에 맞게 선택적으로 실행하세요.*

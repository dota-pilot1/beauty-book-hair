# 운영 Mixed Content 에러 — 백엔드 직접 호출 차단

_날짜: 2026-04-26_

---

## 증상

운영 사이트(`https://dxline-tallent.com`)에서 로그인 시도 시 아무 반응 없음.  
브라우저 콘솔에 다음 에러 다수 출력:

```
Mixed Content: The page at 'https://dxline-tallent.com/login' was loaded over HTTPS,
but requested an insecure XMLHttpRequest endpoint 'http://13.124.117.243:4101/api/menus'.
This request has been blocked; the content must be served over HTTPS.
```

로그인, 예약 조회, 메뉴 조회 등 모든 API 호출 차단.

---

## 원인 분석

### 1단계 — CORS 에러 (이전 배포)

최초 배포 시 `.env.production` 파일 없이 빌드 → `NEXT_PUBLIC_API_BASE_URL` 미설정.  
빌드 타임에 기본값 `http://localhost:4101` 이 번들에 하드코딩됨.  
결과: 운영 브라우저가 `localhost:4101` 호출 → CORS 에러.

**임시 수정**: `.env.production` 생성 후 재빌드
```
NEXT_PUBLIC_API_BASE_URL=http://13.124.117.243:4101
```

### 2단계 — Mixed Content 에러 (이번 이슈)

HTTPS 페이지에서 HTTP 엔드포인트 직접 호출은 브라우저가 차단 (Mixed Content Policy).  
`http://13.124.117.243:4101` → EC2 IP 직접 호출이라 HTTPS 불가.

---

## 구조적 원인

```
[브라우저] HTTPS → dxline-tallent.com (CloudFront)
                         ↓
              /api/* → ec2-13-124-117-243... (CloudFront 프록시 행동)
                         ↓ HTTP
              http://13.124.117.243:4101 (EC2 Spring Boot)
```

CloudFront에 `/api/*` 프록시 행동이 **이미 설정되어 있었음**.  
문제는 `.env.production`에서 EC2 IP를 직접 지정하고 있어서 CloudFront를 우회하고 있었던 것.

---

## 해결

`.env.production`의 API URL을 CloudFront 도메인으로 변경:

```diff
- NEXT_PUBLIC_API_BASE_URL=http://13.124.117.243:4101
+ NEXT_PUBLIC_API_BASE_URL=https://dxline-tallent.com
```

이렇게 하면 모든 API 호출이 `https://dxline-tallent.com/api/...` 로 가고,  
CloudFront가 `/api/*` 행동에 따라 EC2로 내부 전달 (HTTP는 CloudFront↔EC2 구간에서만 사용).

재빌드 → S3 업로드 → CloudFront 캐시 무효화로 반영.

---

## CloudFront `/api/*` 행동 확인

```
Distribution ID : E11NF3HMOB52NI
Path Pattern    : /api/*
Target Origin   : ec2-13-124-117-243.ap-northeast-2.compute.amazonaws.com
Origin Protocol : HTTP (CloudFront↔EC2 구간은 HTTP 허용)
```

EC2에 SSL 인증서 없어도 됨 — HTTPS는 CloudFront에서 종료(TLS Termination).

---

## 배포 절차 (이후 표준)

```bash
# 1. .env.production 확인 (반드시 https://dxline-tallent.com 이어야 함)
cat beauty-book--front/.env.production

# 2. 빌드
cd beauty-book--front && npm run build

# 3. S3 업로드
aws s3 sync out/ s3://beauty-book-hair-front --delete

# 4. CloudFront 캐시 무효화
aws cloudfront create-invalidation --distribution-id E11NF3HMOB52NI --paths "/*"
```

---

## 핵심 교훈

| 상황 | API URL |
|------|---------|
| 로컬 개발 | `http://localhost:4101` (`.env.local`) |
| 운영 배포 | `https://dxline-tallent.com` (`.env.production`) |

- `NEXT_PUBLIC_*` 변수는 **빌드 타임에 번들에 고정**됨 → 잘못된 URL로 빌드하면 재빌드 필수
- EC2 IP 직접 호출은 HTTPS 불가 → 반드시 CloudFront 도메인 경유
- `.env.production`은 gitignore 대상이므로 배포 환경에서 수동 확인 필요

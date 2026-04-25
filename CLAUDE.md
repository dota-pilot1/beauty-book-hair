# BeautyBook 프로젝트 — Claude 작업 가이드

## 프로젝트 구조

```
beauty-book-hair/
├── beauty-book-server/     # Spring Boot 백엔드 (포트 4101)
├── beauty-book--front/     # Next.js 14 프론트엔드 (포트 3000 로컬 / 4100 로컬 admin)
├── 배포 가이드/             # SSH 키, 서버 정보, 배포 문서
└── docs-for-운영 정보 관리/ # 구현 현황 및 TODO
```

## 운영 환경

| 항목 | 값 |
|------|-----|
| 프론트 | `https://dxline-tallent.com` (CloudFront → S3 `beauty-book-hair-front`) |
| 백엔드 | `http://13.124.117.243:4101` (EC2 `ubuntu@13.124.117.243`) |
| DB | PostgreSQL Docker 컨테이너, 호스트 포트 `5434`, DB명 `beauty_book` |
| CloudFront 배포 ID | `E11NF3HMOB52NI` |

## SSH 접속

```bash
ssh -i "배포 가이드/hibot-d-server-key.pem" ubuntu@13.124.117.243
```

## DB 직접 접근

```bash
ssh -i "배포 가이드/hibot-d-server-key.pem" ubuntu@13.124.117.243 \
  "docker exec beauty-book-postgres psql -U postgres -d beauty_book -c 'YOUR SQL'"
```

## 배포

### 백엔드
```bash
cd beauty-book-server && ./gradlew clean build -x test
scp -i "배포 가이드/hibot-d-server-key.pem" build/libs/beauty-book-server-*.jar ubuntu@13.124.117.243:~/app.jar
ssh -i "배포 가이드/hibot-d-server-key.pem" ubuntu@13.124.117.243 \
  "pkill -f 'java -jar app.jar'; sleep 2; set -a && source ~/.env && set +a; nohup java -jar app.jar --spring.profiles.active=prod > spring-boot.log 2>&1 &"
```

### 프론트엔드
```bash
# ⚠️ 빌드 전 .env.production 파일 필수 (gitignore 대상 — 수동 생성)
# beauty-book--front/.env.production 내용:
#   NEXT_PUBLIC_API_BASE_URL=http://13.124.117.243:4101

cd beauty-book--front && npm run build
aws s3 sync out/ s3://beauty-book-hair-front --delete
aws cloudfront create-invalidation --distribution-id E11NF3HMOB52NI --paths "/*"
```

## 중요 주의사항

- **운영 배포 후** `/schedule` 어드민 페이지에서 영업시간 반드시 확인 (특히 SUNDAY)
- **운영 배포 후** `/staff` 스케쥴 모달에서 직원별 SUNDAY 근무 여부 확인
- `application.yaml`의 Tomcat 로거 OFF 설정은 운영 필수 (ThrowableProxy 클래스로더 이슈 방지)
- EC2 탄력적 IP 없음 — 재시작 시 IP 바뀔 수 있음

## 기술 스택

- **백엔드**: Spring Boot 4.0.5, JPA/Hibernate, PostgreSQL, JWT, Logback
- **프론트엔드**: Next.js 14 (App Router, SSG), Tanstack Query, Zustand, Radix UI, Tailwind CSS
- **인프라**: AWS EC2 (t3.small, 서울), S3, CloudFront

## 상세 문서

- 구현 현황 및 TODO: `docs-for-운영 정보 관리/구현 현황 및 할일.md`
- 디버깅 히스토리: `개발 관리/디버깅 히스토리/`
- 배포 가이드: `배포 가이드/*.md`

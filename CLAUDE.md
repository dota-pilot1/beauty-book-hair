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
| 백엔드 | `http://13.209.195.64:4101` (EC2 `ubuntu@13.209.195.64`) |
| DB | PostgreSQL Docker 컨테이너, 호스트 포트 `5434`, DB명 `beauty_book` |
| CloudFront 배포 ID | `E11NF3HMOB52NI` |

## SSH 접속

```bash
ssh -i "배포 가이드/hibot-d-server-key.pem" ubuntu@13.209.195.64
```

## DB 직접 접근

```bash
ssh -i "배포 가이드/hibot-d-server-key.pem" ubuntu@13.209.195.64 \
  "docker exec beauty-book-postgres psql -U postgres -d beauty_book -c 'YOUR SQL'"
```

## 배포

### 백엔드
```bash
cd beauty-book-server && ./gradlew clean build -x test
# ⚠️ -plain.jar 제외하고 절대 경로로 명시
scp -i "/Users/terecal/beauty-book-hair/배포 가이드/hibot-d-server-key.pem" \
  "$(pwd)/build/libs/beauty-book-server-0.0.1-SNAPSHOT.jar" \
  ubuntu@13.209.195.64:/home/ubuntu/app.jar
# ⚠️ 로그 파일 초기화 필수 (이전 로그 오염 방지)
ssh -i "/Users/terecal/beauty-book-hair/배포 가이드/hibot-d-server-key.pem" ubuntu@13.209.195.64 << 'ENDSSH'
pkill -f 'java -jar' || true
sleep 1
> ~/spring-boot.log
set -a && source ~/.env && set +a
nohup java -jar ~/app.jar --spring.profiles.active=prod >> ~/spring-boot.log 2>&1 &
sleep 15
grep "Started BeautyBook" ~/spring-boot.log && echo "✅ 성공" || echo "❌ 실패 — spring-boot.log 확인"
ENDSSH
```

### 프론트엔드
```bash
# ⚠️ 빌드 전 .env.production 파일 필수 (gitignore 대상 — 수동 생성)
# beauty-book--front/.env.production 내용:
#   NEXT_PUBLIC_API_BASE_URL=https://dxline-tallent.com
# ⚠️ EC2 직접 IP(http://13.209.195.64:4101) 사용 금지 — HTTPS 혼합콘텐츠 차단됨

cd beauty-book--front && npm run build
# ⚠️ --exclude "beauty-book/*" 필수 — 같은 버킷에 업로드 이미지(beauty-book/ 폴더)가 있어 --delete만 쓰면 이미지 전부 삭제됨
aws s3 sync out/ s3://beauty-book-hair-front --delete --exclude "beauty-book/*" --region ap-northeast-2
aws cloudfront create-invalidation --distribution-id E11NF3HMOB52NI --paths "/*"
```

## 중요 주의사항

- **운영 배포 후** `/schedule` 어드민 페이지에서 영업시간 반드시 확인 (특히 SUNDAY)
- **운영 배포 후** `/staff` 스케쥴 모달에서 직원별 SUNDAY 근무 여부 확인
- **운영 배포 후** `/schedule` → 정기 차단 탭에서 점심 시간 등 차단 데이터 재확인 (운영 DB ≠ 로컬 DB)
- `application.yaml`의 Tomcat 로거 OFF 설정은 운영 필수 (ThrowableProxy 클래스로더 이슈 방지)
- EC2 탄력적 IP: `13.209.195.64` (고정) — 재시작해도 IP 변경 없음
- **CloudFront 오리진 포트는 80 고정** — Nginx(80) → Spring Boot(4101) 프록시 구조. 포트 변경 금지

## 배포 상세 가이드

배포 중 발생한 문제 및 올바른 스크립트는 반드시 아래 문서를 먼저 참고:

- `배포 가이드/배포 과정 문제점 정리.md` — 과거 실수 사례 및 올바른 재배포 스크립트 (검증 완료)
- `배포 가이드/프론트엔드 배포.md` — Next.js 빌드 & S3 배포 상세
- `배포 가이드/백엔드 배포.md` — Spring Boot 빌드 & EC2 배포 상세
- `배포 가이드/CORS 설정 가이드.md` — CORS 에러 발생 시 참고

## 기술 스택

- **백엔드**: Spring Boot 4.0.5, JPA/Hibernate, PostgreSQL, JWT, Logback
- **프론트엔드**: Next.js 14 (App Router, SSG), Tanstack Query, Zustand, Radix UI, Tailwind CSS
- **인프라**: AWS EC2 (t3.small, 서울), S3, CloudFront

## 상세 문서

- 구현 현황 및 TODO: `docs-for-운영 정보 관리/구현 현황 및 할일.md`
- 디버깅 히스토리: `개발 관리/디버깅 히스토리/`
- 배포 가이드: `배포 가이드/*.md`

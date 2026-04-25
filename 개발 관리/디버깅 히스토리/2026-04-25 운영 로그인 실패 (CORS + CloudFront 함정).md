# 운영 로그인 실패 디버깅 (2026-04-25)

## 증상

- `https://dxline-tallent.com/login/` 에서 로그인 시도 시
  - "로그인되었습니다" 토스트와 "로그인에 실패했습니다." 빨간 배너가 동시에 뜨고 페이지 이동 안 됨
  - localStorage에 `twilio.accessToken: undefined`, `twilio.refreshToken: undefined` (literal "undefined" 문자열) 저장됨
  - 토큰을 지워도 같은 증상 반복
- 로컬(`localhost:4100`)에선 정상 동작
- curl로 `/api/auth/login` 직접 호출 (Origin 헤더 없이) 하면 200 + 정상 JSON 반환

## 진짜 원인 (3중 함정)

### 1. 프론트 baseURL 폴백
[axios.ts](../../beauty-book--front/src/shared/api/axios.ts):
```ts
const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4101";
```
빌드 시 `NEXT_PUBLIC_API_BASE_URL`을 안 주고 `npm run build` 하면 폴백값 `http://localhost:4101`이 그대로 번들에 박힘. 운영 배포된 JS가 사용자 PC의 `localhost:4101`로 요청을 쏘게 됨.
- 사용자 PC에 백엔드가 띄워져 있으면 일부 요청이 우연히 통해 "되는 것처럼" 보이고
- 다른 PC/환경에선 전부 실패

### 2. Spring 백엔드 CORS 설정이 prod에서 무력화
[application.yaml](../../beauty-book-server/src/main/resources/application.yaml) 에 다음 줄:
```yaml
spring:
  config:
    import: optional:classpath:application-local.yaml
```
이게 **profile 무관 무조건 import**. `--spring.profiles.active=prod`로 실행해도 application-local.yaml이 로드되어 CORS 설정을 덮어씀:
```yaml
# application-local.yaml
cors:
  allowed-origin: http://localhost:4100,http://localhost:3000
```
결과: EC2에서 `ALLOWED_ORIGIN=https://dxline-tallent.com` 환경변수가 무시되고 localhost만 허용 → `https://dxline-tallent.com` Origin 헤더가 붙은 요청은 전부 **403 "Invalid CORS request"**.

### 3. CloudFront CustomErrorResponse 가 에러를 200으로 변환
CloudFront 설정:
```
403 → /index.html (200)
404 → /index.html (200)
```
SPA fallback 용도였지만 `/api/*` behavior에도 그대로 적용됨. 백엔드의 403 응답을 CloudFront가 가로채서 **200 OK + S3 의 index.html(text/html)** 로 바꿔서 돌려줌.
프론트는 그걸 받아서:
```ts
const res = await authApi.login(...) // res = HTML 문자열을 파싱한 객체 (모든 필드 undefined)
tokenStorage.set(res.accessToken, res.refreshToken) // setItem("twilio.accessToken", undefined) → 문자열 "undefined" 저장
```

## 진단 핵심 단서

### Network 탭의 응답 헤더
```
POST /api/auth/login  →  200 OK
Server: AmazonS3        ← 백엔드가 아니라 S3가 응답!
Content-Type: text/html  ← JSON이 아니라 HTML!
Via: CloudFront
X-Cache: Error from cloudfront  ← CF가 origin 에러를 캐시함
Age: 94
```
"200인데 Server가 AmazonS3" 이거 보이면 즉시 CustomErrorResponse 의심.

### curl 비교
```bash
# Origin 없이 → 200 + JSON (백엔드까지 도달)
curl -X POST https://dxline-tallent.com/api/auth/login \
  -H "Content-Type: application/json" -d '{...}'

# Origin 헤더 추가 → 200 + HTML (S3로 fallback)
curl -X POST https://dxline-tallent.com/api/auth/login \
  -H "Origin: https://dxline-tallent.com" \
  -H "Content-Type: application/json" -d '{...}'
```
응답이 다르면 CORS 차단 + CustomErrorResponse fallback 콤보.

### 백엔드 직접 확인
```bash
# EC2에서
curl -X POST http://localhost:4101/api/auth/login \
  -H "Origin: https://dxline-tallent.com" \
  -H "Content-Type: application/json" -d '{...}'
# → 403 "Invalid CORS request"
```

### 환경변수가 적용되는지 검증
```bash
PID=$(pgrep -f "java -jar")
sudo cat /proc/$PID/environ | tr "\0" "\n" | grep ALLOWED_ORIGIN
# → ALLOWED_ORIGIN=https://dxline-tallent.com  (env는 맞음)
```
env가 맞는데 CORS는 거부 → yaml import 충돌 의심.

## 적용한 수정

### 1. baseURL 빌드 시 명시
```bash
NEXT_PUBLIC_API_BASE_URL="" NODE_ENV=production npm run build
```
빈 문자열로 빌드해서 모든 API 호출이 same-origin 상대경로 (`/api/...` → `https://dxline-tallent.com/api/...`)로 가도록.

### 2. application.yaml 의 local import를 profile-conditional로 분리
[application.yaml](../../beauty-book-server/src/main/resources/application.yaml):
```yaml
# 기존: 무조건 import (제거)
# spring.config.import: optional:classpath:application-local.yaml

# 수정: prod 가 아닐 때만 import
---
spring:
  config:
    activate:
      on-profile: "!prod"
    import: optional:classpath:application-local.yaml
```

### 3. 운영 ALLOWED_ORIGIN 기본값 보강
[application.yaml](../../beauty-book-server/src/main/resources/application.yaml):
```yaml
cors:
  allowed-origin: ${ALLOWED_ORIGIN:https://dxline-tallent.com,http://localhost:3000,http://localhost:4100}
```
env 누락돼도 운영 도메인이 자동으로 허용되도록.

### 4. 프론트 로그인 페이지 race condition 정리
[AuthInitializer.tsx](../../beauty-book--front/src/app/AuthInitializer.tsx):
- `/login` 경로에서는 `restore()` (만료 토큰으로 `/me` 호출하는 부팅 로직) 자체를 스킵
- `auth:logout` 이벤트가 떠도 이미 `authenticated` 상태면 무시

이건 위 3중 함정 해결과는 별개 보호장치이지만, 비슷한 race로 "로그인 직후 강제 로그아웃" 패턴이 또 생기는 걸 막아줌.

## 교훈 / 재발 방지

1. **`process.env.X ?? "localhost:..."` 폴백 위험** — 운영 빌드 시 폴백이 박히면 사용자 PC의 로컬 서버로 요청을 쏘는 무서운 일이 벌어진다. 차라리 폴백을 빈 문자열(상대경로)로 두거나, 빌드 스크립트에서 `NEXT_PUBLIC_*`을 강제 검증하는 게 안전.
2. **`spring.config.import` 무조건 import 금지** — local-only 파일은 반드시 profile-conditional (`activate.on-profile`) 로 감싼다. 또는 그냥 `application-local.yaml` 파일명 규칙(`local` 프로파일 active 시 자동 로드)을 신뢰하고 명시적 import는 제거.
3. **CloudFront CustomErrorResponse 와 API 라우팅 충돌** — SPA fallback (403/404 → /index.html) 은 정적 호스팅엔 좋지만 `/api/*` 거동을 가린다. 장기적으로:
   - CustomErrorResponse를 제거하고 CloudFront Function으로 정적 경로만 rewrite, 또는
   - 별도 distribution / origin path 분리, 또는
   - 백엔드에서 최소한 404는 직접 적절히 응답하게 두기
4. **"200인데 Content-Type 이 의외" 패턴 의심** — JSON API 호출에 `text/html` 200이 오면 100% 어딘가 fallback 중. axios가 JSON.parse 실패해도 silently undefined 만들 수 있다.
5. **백엔드 디버깅 시 process env 직접 확인** — `.env` 파일 내용과 실제 JVM 의 환경변수가 같은지 `/proc/PID/environ` 으로 검증. yaml override 도 `--debug` 플래그나 `/actuator/configprops` 로 점검 가능.

## 관련 커밋
- `fix(auth): /login 페이지에서 stale-token restore + 잘못된 auth:logout 무시`
- `fix(server): application-local.yaml 을 prod 프로파일에서 import하지 않도록`
- `chore(server): ALLOWED_ORIGIN 기본값에 운영 도메인 추가`

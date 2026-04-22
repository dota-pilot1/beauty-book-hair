# BeautyBook

BeautyBook은 미용실 운영을 위한 관리 플랫폼입니다. 현재 저장소에는 Spring Boot 백엔드, Next.js 프론트엔드, Docker 기반 로컬 PostgreSQL 개발 환경이 포함되어 있습니다.

## 실행 정보

### Docker DB

로컬 DB는 [docker-compose.yml](/Users/terecal/beauty-book-container/docker-compose.yml:1) 기준으로 아래 설정을 사용합니다.

```yaml
services:
  postgres:
    container_name: beauty-book-postgres
    image: postgres:15-alpine
    ports:
      - "5434:5432"
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: beauty_book
```

실행:

```bash
docker compose up -d postgres
```

접속 정보:

- Host: `localhost`
- Port: `5434`
- Database: `beauty_book`
- Username: `postgres`
- Password: `postgres`

### Backend

```bash
cd beauty-book-server
./gradlew bootRun
```

- Base URL: `http://localhost:4101`
- Swagger UI: `http://localhost:4101/swagger-ui/index.html`

### Frontend

```bash
cd beauty-book--front
npm install
npm run dev
```

- Frontend URL: `http://localhost:4100`

## 초기 데이터와 가입 정책

애플리케이션 시작 시 initializer 성격의 시더가 기본 데이터를 자동 생성합니다.

- `PermissionCategorySeeder`: 기본 권한 카테고리 생성
- `RoleSeeder`: 기본 역할 생성
- `PermissionSeeder`: 기본 권한 생성

기본 역할은 아래 네 가지입니다.

- `ROLE_ADMIN`
- `ROLE_MANAGER`
- `ROLE_USER`

회원가입 정책:

- 첫 번째로 회원가입하는 유저는 서버에서 무조건 `ROLE_ADMIN`으로 저장됩니다.
- 두 번째 회원가입부터는 기본적으로 `ROLE_USER`로 저장됩니다.

즉, "최초 가입자 = 관리자" 정책은 프론트가 아니라 백엔드에서 강제됩니다.

## 기본 포트

- Frontend: `4100`
- Backend: `4101`
- PostgreSQL: `5434`

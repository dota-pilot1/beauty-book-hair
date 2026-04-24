# DB 정보 관리

## 한눈에 보기

- DB 종류: PostgreSQL 15
- Docker 컨테이너명: `beauty-book-postgres`
- DB 이름: `beauty_book`
- DB 접속 포트: `5434`
- 내부 포트: `5432`
- 백엔드 포트: `4101`
- 프론트 포트: `4100`
- JPA 설정: `ddl-auto=update`
- 현재 상태: 예약 관련 테이블은 아직 없음

## 현재 기준 접속 정보

### 애플리케이션 설정

- datasource url: `jdbc:postgresql://localhost:5434/beauty_book`
- username: `postgres`
- password: `postgres`
- driver: `org.postgresql.Driver`

### 실제 접속 정보

- Host: `localhost`
- Port: `5434`
- Database: `beauty_book`
- Username: `postgres`
- Password: `postgres`

## Docker 정보

### compose 기준

- 서비스명: `postgres`
- 이미지: `postgres:15-alpine`
- 볼륨: `postgres_data:/var/lib/postgresql/data`
- 재시작 정책: `unless-stopped`
- 헬스체크: `pg_isready -U postgres`

### 자주 쓰는 명령어

```bash
docker compose up -d postgres
docker compose ps
docker compose logs -f postgres
docker compose stop postgres
docker compose down
```

### DB 접속 명령어

로컬에 `psql` 이 있으면:

```bash
psql -h localhost -p 5434 -U postgres -d beauty_book
```

컨테이너 내부에서 바로 접속:

```bash
docker exec -it beauty-book-postgres psql -U postgres -d beauty_book
```

## 작업할 때 꼭 기억할 점

- `spring.jpa.hibernate.ddl-auto=update` 이므로 서버 실행 시 엔티티 기준으로 테이블이 자동 반영될 수 있음.
- 즉, 스키마를 명시적으로 버전 관리하는 구조가 아니라 현재는 JPA 엔티티가 사실상 스키마 기준점 역할을 함.
- 새 테이블 추가 전에는 엔티티 설계를 먼저 고정하는 편이 안전함.
- 예약 기능 착수 시 `reservation`, `customer`, `staff`, `service`, `working_schedule` 류 테이블이 새로 생길 가능성이 높음.

## 현재 주요 테이블 목록

- `users`
- `roles`
- `permissions`
- `permission_categories`
- `role_permissions`
- `refresh_tokens`
- `menus`
- `site_settings`

상세 컬럼과 관계는 [주요 테이블 요약.md](/Users/terecal/beauty-book-hair/개발%20관리/디비%20정보%20관리/주요%20테이블%20요약.md) 참고.

## 시드 데이터 기준 초기 상태

### 역할

- `ROLE_USER`
- `ROLE_MANAGER`
- `ROLE_ADMIN`

### 권한 카테고리

- `USER`
- `ROLE`
- `PERMISSION`
- `DASHBOARD`
- `REPORT`
- `SYSTEM`

### 기본 권한

- `USER_VIEW`
- `USER_EDIT`
- `USER_DELETE`
- `ROLE_VIEW`
- `ROLE_EDIT`
- `ROLE_DELETE`
- `PERMISSION_VIEW`
- `PERMISSION_EDIT`
- `PERMISSION_DELETE`

### 기본 메뉴

- `DASHBOARD`
- `ADMIN`
- `ADMIN_USERS`
- `ADMIN_ROLE_PERMISSIONS`
- `ADMIN_SITE_SETTINGS`
- `ADMIN_MENU_MANAGEMENT`

## 빠른 점검용 SQL

```sql
-- 현재 테이블 목록
select tablename
from pg_tables
where schemaname = 'public'
order by tablename;

-- 사용자 / 역할 확인
select u.id, u.email, u.username, r.code as role_code, u.active
from users u
join roles r on r.id = u.role_id
order by u.id;

-- 역할별 권한 확인
select r.code as role_code, p.code as permission_code
from role_permissions rp
join roles r on r.id = rp.role_id
join permissions p on p.id = rp.permission_id
order by r.code, p.code;

-- 메뉴 구조 확인
select m.id, m.code, p.code as parent_code, m.label, m.path, m.required_role, m.display_order, m.visible
from menus m
left join menus p on p.id = m.parent_id
order by coalesce(p.id, m.id), m.display_order, m.id;
```

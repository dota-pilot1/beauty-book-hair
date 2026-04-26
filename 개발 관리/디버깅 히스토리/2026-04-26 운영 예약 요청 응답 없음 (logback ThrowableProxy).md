# 운영 예약 요청 후 응답 없음 — logback ThrowableProxy ClassNotFoundException (2026-04-26)

## 증상

- 운영 서버(`dxline-tallent.com`)에서 예약 요청 버튼 클릭 시 "요청 중..." 상태로 무한 대기
- 로컬 개발 환경에서는 동일 시나리오 정상 동작
- 예약 데이터는 DB에 정상 INSERT됨에도 불구하고 클라이언트가 응답을 수신하지 못함

## 로그 (spring-boot.log)

```
Exception in thread "http-nio-4101-exec-1" java.lang.NoClassDefFoundError: ch/qos/logback/classic/spi/ThrowableProxy
    at ch.qos.logback.classic.spi.LoggingEvent.<init>(LoggingEvent.java:145)
    at ch.qos.logback.classic.Logger.buildLoggingEventAndAppend(Logger.java:429)
    ...
    at org.slf4j.bridge.SLF4JBridgeHandler.publish(SLF4JBridgeHandler.java:313)
    at org.apache.juli.logging.DirectJDKLog.error(DirectJDKLog.java:141)
    at org.apache.tomcat.util.net.NioEndpoint$SocketProcessor.doRun(NioEndpoint.java:1797)
    ...
Caused by: java.lang.ClassNotFoundException: ch.qos.logback.classic.spi.ThrowableProxy
```

동일 에러가 `http-nio-4101-exec-1`, `exec-2`, `exec-4`, `exec-6`, `exec-9`, `exec-10` 등 다수 스레드에서 반복 발생.

## 원인 분석

### 클래스로더 구조

Spring Boot fat JAR는 중첩 클래스로더 구조를 사용한다.

```
System ClassLoader
└── Spring Boot LaunchedURLClassLoader   ← BOOT-INF/lib/*.jar 로드
    └── Application Classes              ← logback-classic.jar 포함
    
Tomcat Internal ClassLoader              ← 별도 클래스로더
```

### 에러 발생 경로

1. 클라이언트(브라우저)가 소켓 연결을 끊음 (타임아웃, 새로고침 등)
2. Tomcat `NioEndpoint`가 소켓 에러를 `java.util.logging(JUL)`으로 로깅 시도
3. Spring Boot가 설치한 `SLF4JBridgeHandler`가 JUL 로그를 가로채 logback으로 전달
4. logback `LoggingEvent` 생성 시 예외 정보를 담기 위해 `ThrowableProxy` 인스턴스화 시도
5. Tomcat 스레드의 클래스로더에는 `ThrowableProxy`가 없음 (BOOT-INF/lib 내부이므로)
6. `NoClassDefFoundError` 발생 → HTTP 스레드 사망 → 클라이언트에 응답 전송 불가

### 왜 로컬에서는 안 터지나

로컬에서는 IDE가 모든 클래스를 flat classpath에 올리므로 클래스로더 분리 없음.  
운영 환경의 fat JAR 실행 시에만 중첩 클래스로더 구조가 적용됨.

### 왜 예약은 DB에 저장됐나

INSERT 쿼리는 HTTP 스레드가 죽기 전에 이미 커밋됨.  
트랜잭션 자체에는 문제 없고, 응답 직렬화·전송 단계에서 스레드가 사망한 것.

## 해결 방법

`application.yaml`에 Tomcat 내부 로거를 `OFF`로 설정해 `ThrowableProxy` 생성 코드 경로 차단.

```yaml
logging:
  level:
    org.apache.tomcat: OFF
    org.apache.catalina: OFF
    org.apache.coyote: OFF
```

logback 레벨이 `OFF`이면 `SLF4JBridgeHandler`가 로그 레벨 체크 단계에서 조기 반환,  
`LoggingEvent` 및 `ThrowableProxy` 생성 코드에 도달하지 않음.

## 재현 조건

- Spring Boot fat JAR로 실행 (`java -jar`)
- Embedded Tomcat 사용
- 클라이언트가 응답 대기 중 소켓 연결을 끊는 경우 (타임아웃, 새로고침, 네트워크 단절)

## 대안 검토

| 방법 | 실현 가능성 | 비고 |
|------|-------------|------|
| Tomcat 로거 OFF | ✅ 채택 | 간단, 부작용 없음 |
| `-Xbootclasspath/a:logback-classic.jar` | △ | JAR 경로 관리 복잡 |
| `java.util.logging.config.file=/dev/null` | ✗ | SLF4JBridgeHandler는 programmatic 설치라 설정 파일 무관 |
| fat JAR 대신 exploded 실행 | △ | 배포 방식 전면 변경 필요 |

## 관련 파일

- `beauty-book-server/src/main/resources/application.yaml` — logging.level 설정 추가
- 커밋: `fix(server): Tomcat 로거 OFF로 logback ThrowableProxy 클래스로더 충돌 해결`

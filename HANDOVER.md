# Suno AI API - 운영 인수인계서

## 1. 개요

Suno AI 유료 계정을 이용한 음악 생성 API 서버.
원격지에서 HTTP 요청으로 AI 음악을 생성할 수 있다.

- **기반 프로젝트**: [gcui-art/suno-api](https://github.com/gcui-art/suno-api)
- **서버 위치**: `C:\dev\api-suno-ai`
- **포트**: `3100`
- **모델**: Suno v5 (`chirp-crow`)
- **프로세스 관리**: PM2 (`suno-api`)

---

## 2. 서비스 구조

```
[클라이언트] --HTTP--> [localhost:3100] --API--> [studio-api.prod.suno.com]
                         (Next.js)                    (Suno 공식 서버)
                         PM2 관리
```

---

## 3. API 엔드포인트

### 3-1. 일반 생성 (프롬프트만)

```
POST http://localhost:3100/api/generate
Content-Type: application/json
```

```json
{
  "prompt": "밝고 신나는 K-pop 댄스곡, 여성 보컬",
  "make_instrumental": false,
  "wait_audio": true
}
```

- `prompt`: 곡 설명 (AI가 가사+스타일 자동 생성)
- `make_instrumental`: `true`면 가사 없는 인스트루멘탈
- `wait_audio`: `true`면 생성 완료까지 대기 후 응답

### 3-2. 커스텀 생성 (가사 직접 입력)

```
POST http://localhost:3100/api/custom_generate
Content-Type: application/json
```

```json
{
  "prompt": "[Verse]\n가사 내용...\n[Chorus]\n후렴 가사...",
  "tags": "hardstyle, EDM, 150bpm, male vocal",
  "title": "곡 제목",
  "make_instrumental": false,
  "wait_audio": true
}
```

- `prompt`: 직접 작성한 가사 ([Verse], [Chorus] 등 구조 태그 사용 가능)
- `tags`: 장르/스타일 (쉼표 구분)
- `title`: 곡 제목
- `negative_tags`: 제외할 스타일 (선택)

### 3-3. 기타 엔드포인트

| 엔드포인트 | 메서드 | 설명 |
|------------|--------|------|
| `/api/generate` | POST | 프롬프트 기반 생성 |
| `/api/custom_generate` | POST | 가사+태그 직접 지정 생성 |
| `/api/generate_lyrics` | POST | 가사만 생성 |
| `/api/extend_audio` | POST | 기존 곡 연장 |
| `/api/get?ids=xxx` | GET | 곡 정보 조회 |
| `/api/get_limit` | GET | 크레딧 잔량 확인 |
| `/docs` | GET | Swagger API 문서 |

### 3-4. 응답 예시

```json
[
  {
    "id": "b0ac4faa-4a42-4b50-aeb6-2b3902c239e8",
    "title": "NO PAIN NO LIMIT",
    "model_name": "chirp-crow",
    "status": "streaming",
    "tags": "hardstyle, EDM, gym workout, aggressive",
    "audio_url": "https://audiopipe.suno.ai/?item_id=b0ac4faa-...",
    "lyric": "[Verse]\n가사 내용..."
  }
]
```

- 한 번에 **2곡** 생성됨 (같은 가사, 다른 버전)
- `audio_url`로 바로 재생 가능
- `https://suno.com/song/{id}` 로 Suno 사이트에서도 확인 가능

---

## 4. PM2 관리 명령어

```bash
pm2 status              # 전체 프로세스 상태
pm2 logs suno-api       # 실시간 로그
pm2 restart suno-api    # 재시작
pm2 stop suno-api       # 중지
pm2 start suno-api      # 시작
```

---

## 5. 주요 설정 파일

### `.env`

```
SUNO_COOKIE=__client=eyJ...; __session=eyJ...; (기타 쿠키들)
TWOCAPTCHA_KEY=c73fdb...
BROWSER=chromium
BROWSER_GHOST_CURSOR=false
BROWSER_LOCALE=en
BROWSER_HEADLESS=true
```

- **SUNO_COOKIE**: Suno 로그인 쿠키 (가장 중요!)
  - `__client` 토큰: auth.suno.com에서 발급, **1년** 유효
  - `__session` 토큰: 약 **1시간** 유효 (자동 갱신됨)
- **TWOCAPTCHA_KEY**: 캡차 자동 해결 서비스 키 ($3 충전됨)
- **BROWSER_HEADLESS**: 캡차 풀 때 브라우저 표시 여부

### `ecosystem.config.js`

PM2 실행 설정. 포트 3100, production 모드.

### `src/lib/SunoApi.ts`

핵심 API 클래스. 수정한 부분:
- **Line 21**: `DEFAULT_MODEL = 'chirp-crow'` (Suno v5)
- **Line 329**: textarea 셀렉터 → `[data-testid="lyrics-textarea"]`
- **Line 333-338**: Style 필드 입력 + Create 버튼 셀렉터 → `button[aria-label="Create song"]`

---

## 6. 쿠키 갱신 방법

쿠키 만료 시 (API 에러 발생 시):

1. 크롬에서 `https://suno.com` 로그인
2. F12 → Application → Cookies
   - `suno.com`에서 모든 쿠키 복사
   - `auth.suno.com`에서 `__client` 값 복사
3. `.env`의 `SUNO_COOKIE=` 뒤에 붙여넣기
4. `pm2 restart suno-api`

또는 자동 스크립트 (제한적):
```bash
node get-cookie.js
```

> **참고**: `__client` 토큰은 1년 유효 (2027-03-17 만료), `__session`은 API가 자동 갱신함.

---

## 7. 커스텀 수정 내역 (원본 대비)

| 파일 | 변경 내용 |
|------|-----------|
| `src/lib/SunoApi.ts` | DEFAULT_MODEL → `chirp-crow` (v5) |
| `src/lib/SunoApi.ts` | textarea 셀렉터 → `[data-testid="lyrics-textarea"]` |
| `src/lib/SunoApi.ts` | Style 필드 자동 입력 추가 |
| `src/lib/SunoApi.ts` | Create 버튼 → `button[aria-label="Create song"]` |
| `ecosystem.config.js` | PM2 설정 (포트 3100) |
| `.env` | Suno 쿠키 + 2Captcha 키 |
| `get-cookie.js` | 쿠키 자동 추출 스크립트 (신규) |
| `test-generate.js` | 일반 생성 테스트 (신규) |
| `test-custom.js` | 커스텀 생성 테스트 (신규) |

---

## 8. 트러블슈팅

| 증상 | 원인 | 해결 |
|------|------|------|
| `Failed to get session id` | 쿠키 만료/잘못됨 | `.env` 쿠키 갱신 → pm2 restart |
| `Failed model quick validation` | 모델명 오류 | `chirp-crow` (v5) 확인 |
| `Timeout waiting for locator` | Suno UI 변경 | 셀렉터 업데이트 필요 |
| `EADDRINUSE :::3100` | 포트 충돌 | `taskkill /F /PID (포트점유PID)` 후 재시작 |
| `CAPTCHA required` | 캡차 필요 | 2Captcha로 자동 해결 또는 브라우저에서 수동 생성 1회 |
| 한글 깨짐 | Content-Type 설정 | `charset=utf-8` 헤더 확인 |

---

## 9. 비용 정보

- **Suno 유료 플랜**: 구독 중 (크레딧 기반)
- **2Captcha**: $3 충전 (캡차 1건당 ~$0.003, 약 1000회 사용 가능)
- 현재 세션 유효 시 캡차 불필요 → 2Captcha 비용 0

---

## 10. 향후 TODO

- [ ] 외부 접속 방화벽 규칙 추가 (포트 3100)
- [ ] 유튜브 자동 업로드 연동
- [ ] 자막(가사) 자동 생성 및 영상 합성
- [ ] Suno UI 변경 시 셀렉터 자동 감지
- [ ] 크레딧 잔량 알림 기능

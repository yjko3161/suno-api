# Suno AI API (v5 / chirp-crow)

HTTP API로 [Suno AI](https://suno.com) 음악을 생성하는 서버.
커스텀 가사, 장르, 제목을 지정해서 AI 음악을 만들 수 있다.

> 기반 프로젝트: [gcui-art/suno-api](https://github.com/gcui-art/suno-api) (LGPL-3.0)

---

## 주요 기능

- **Suno v5** (`chirp-crow`) 모델 지원
- 프롬프트 기반 자동 생성 / 커스텀 가사 직접 입력
- 2Captcha 연동으로 hCaptcha 자동 해결
- PM2로 백그라운드 서비스 운영
- OpenAI 호환 API (`/v1/chat/completions`)

---

## 빠른 시작

### 1. 설치

```bash
git clone https://github.com/yjko3161/api-suno-ai.git
cd api-suno-ai
npm install
```

### 2. 쿠키 발급

1. 크롬에서 [suno.com](https://suno.com) 로그인
2. `F12` > `Network` 탭 > `?__clerk_api_version` 포함된 요청 클릭
3. `Header` > `Cookie` 값 전체 복사
4. `F12` > `Application` > Cookies > `auth.suno.com` > `__client` 값도 복사

### 3. 환경 설정

`.env` 파일 생성:

```bash
SUNO_COOKIE=__client=eyJ...; __session=eyJ...; (복사한 쿠키 전체)
TWOCAPTCHA_KEY=your_2captcha_api_key
BROWSER=chromium
BROWSER_GHOST_CURSOR=false
BROWSER_LOCALE=en
BROWSER_HEADLESS=true
```

### 4. 실행

```bash
# 개발 모드
npm run dev

# 프로덕션
npm run build
npm start -- -p 3100

# PM2로 백그라운드 실행
pm2 start ecosystem.config.js
```

### 5. 테스트

```bash
# 크레딧 확인
curl http://localhost:3100/api/get_limit

# 음악 생성 테스트
node test-generate.js

# 커스텀 가사로 생성
node test-custom.js
```

---

## API 사용법

### 일반 생성 (AI가 가사 자동 작성)

```bash
curl -X POST http://localhost:3100/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "신나는 K-pop 댄스곡, 여성 보컬",
    "make_instrumental": false,
    "wait_audio": true
  }'
```

### 커스텀 생성 (가사 직접 입력)

```bash
curl -X POST http://localhost:3100/api/custom_generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "[Verse]\n여기에 가사...\n[Chorus]\n후렴 가사...",
    "tags": "hardstyle, EDM, 150bpm, male vocal",
    "title": "곡 제목",
    "make_instrumental": false,
    "wait_audio": true
  }'
```

### 응답 예시

```json
[
  {
    "id": "b0ac4faa-4a42-4b50-aeb6-2b3902c239e8",
    "title": "NO PAIN NO LIMIT",
    "model_name": "chirp-crow",
    "status": "streaming",
    "tags": "hardstyle, EDM, gym workout",
    "audio_url": "https://audiopipe.suno.ai/?item_id=b0ac4faa-...",
    "lyric": "[Verse]\n가사 내용..."
  }
]
```

한 번 요청에 **2곡**이 생성되며, `https://suno.com/song/{id}`에서도 확인 가능.

---

## 전체 엔드포인트

| 엔드포인트 | 메서드 | 설명 |
|------------|--------|------|
| `/api/generate` | POST | 프롬프트 기반 생성 |
| `/api/custom_generate` | POST | 가사+태그 직접 지정 |
| `/api/generate_lyrics` | POST | 가사만 생성 |
| `/api/extend_audio` | POST | 곡 연장 |
| `/api/generate_stems` | POST | 보컬/MR 분리 |
| `/api/get?ids=xxx` | GET | 곡 정보 조회 |
| `/api/get_limit` | GET | 크레딧 잔량 |
| `/api/get_aligned_lyrics` | GET | 가사 타임스탬프 |
| `/v1/chat/completions` | POST | OpenAI 호환 API |
| `/docs` | GET | Swagger 문서 |

---

## Suno 모델 버전

| 버전 | 모델 ID |
|------|---------|
| v3 | `chirp-v3-0` |
| v3.5 | `chirp-v3-5` |
| v4 | `chirp-v4` |
| v4.5 | `chirp-auk` |
| **v5** | **`chirp-crow`** (기본값) |

모델 변경: `src/lib/SunoApi.ts`의 `DEFAULT_MODEL` 수정 또는 요청 시 `model` 파라미터 지정.

---

## PM2 관리

```bash
pm2 status              # 상태 확인
pm2 logs suno-api       # 로그 보기
pm2 restart suno-api    # 재시작
pm2 stop suno-api       # 중지
```

---

## 쿠키 갱신

API 에러 발생 시 쿠키 만료일 가능성이 높음:

1. `suno.com` 재로그인
2. F12 > Network/Application에서 쿠키 복사
3. `.env`의 `SUNO_COOKIE` 교체
4. `pm2 restart suno-api`

> `__client` 토큰은 약 1년, `__session`은 자동 갱신됨.

---

## 트러블슈팅

| 증상 | 해결 |
|------|------|
| `Failed to get session id` | `.env` 쿠키 갱신 |
| `Failed model quick validation` | 모델명 확인 (`chirp-crow`) |
| `EADDRINUSE :::3100` | 포트 충돌 - 기존 프로세스 종료 후 재시작 |
| `CAPTCHA required` + 타임아웃 | 2Captcha 키 확인, 또는 브라우저에서 수동 1회 생성 |

---

## 원본 대비 변경사항

- `DEFAULT_MODEL` → `chirp-crow` (Suno v5)
- Playwright 셀렉터 업데이트 (Suno 2025 UI 대응)
  - `[data-testid="lyrics-textarea"]`
  - `button[aria-label="Create song"]`
  - Style 필드 자동 입력 추가
- PM2 설정 (`ecosystem.config.js`)
- 운영 인수인계서 (`HANDOVER.md`)
- 테스트/유틸 스크립트

---

## License

LGPL-3.0 (원본 프로젝트와 동일)

## Credits

- [gcui-art/suno-api](https://github.com/gcui-art/suno-api) - 원본 프로젝트
- [Suno AI](https://suno.com) - AI 음악 생성 서비스
- [2Captcha](https://2captcha.com) - hCaptcha 자동 해결

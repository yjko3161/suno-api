/**
 * Suno 쿠키 자동 추출 스크립트
 * 크롬 열림 → 로그인 → Enter 치면 쿠키 추출 → .env 저장 → pm2 재시작
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const ENV_PATH = path.join(__dirname, '.env');

function waitForEnter(msg) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(msg, () => { rl.close(); resolve(); }));
}

(async () => {
  console.log('크롬 열는 중...\n');

  const browser = await chromium.launch({
    headless: false,
    channel: 'chrome'
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // 네트워크 요청에서 쿠키 캡처
  let capturedCookie = '';
  page.on('request', req => {
    const url = req.url();
    if (url.includes('suno.com') || url.includes('clerk')) {
      const headers = req.headers();
      if (headers['cookie'] && headers['cookie'].includes('__session')) {
        capturedCookie = headers['cookie'];
      }
    }
  });

  await page.goto('https://suno.com');

  console.log('==========================================');
  console.log('  1. 브라우저에서 Suno 로그인하세요');
  console.log('  2. 로그인 완료되면 여기서 Enter 누르세요');
  console.log('==========================================\n');

  await waitForEnter('로그인 완료 후 Enter >> ');

  // Enter 후 페이지 이동해서 쿠키 확실히 갱신
  console.log('쿠키 수집 중...');
  await page.goto('https://suno.com/create');
  await page.waitForTimeout(3000);

  // 방법1: 네트워크 요청에서 캡처한 쿠키
  if (!capturedCookie) {
    // 방법2: context.cookies()에서 직접 수집
    const cookies = await context.cookies([
      'https://suno.com',
      'https://clerk.suno.com',
      'https://auth.suno.com'
    ]);
    capturedCookie = cookies.map(c => `${c.name}=${c.value}`).join('; ');
  }

  // 방법3: 페이지에서 document.cookie 가져오기
  const pageCookie = await page.evaluate(() => document.cookie);

  // 가장 긴 쿠키 사용 (가장 완전한 것)
  const cookie = capturedCookie.length > pageCookie.length ? capturedCookie : pageCookie;

  await browser.close();

  if (!cookie || !cookie.includes('__session')) {
    console.log('\n쿠키 추출 실패! __session을 찾지 못했습니다.');
    console.log('수동으로 F12 > Network에서 복사해주세요.');
    process.exit(1);
  }

  // .env 파일 업데이트
  let envContent = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, 'utf-8') : '';

  if (envContent.includes('SUNO_COOKIE=')) {
    envContent = envContent.replace(/SUNO_COOKIE=.*/, `SUNO_COOKIE=${cookie}`);
  } else {
    envContent += `\nSUNO_COOKIE=${cookie}\n`;
  }

  fs.writeFileSync(ENV_PATH, envContent);

  console.log('\n.env에 쿠키 저장 완료!');

  // pm2 자동 재시작
  const { execSync } = require('child_process');
  try {
    execSync('pm2 restart suno-api', { stdio: 'inherit' });
    console.log('\nsuno-api 재시작 완료! http://localhost:3100 에서 확인하세요.');
  } catch (e) {
    console.log('pm2 restart suno-api 를 수동으로 실행하세요.');
  }
})();

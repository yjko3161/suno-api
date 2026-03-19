/**
 * Suno 페이지의 Create 관련 셀렉터 디버그
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// .env에서 쿠키 읽기
const envContent = fs.readFileSync(path.join(__dirname, '.env'), 'utf-8');
const cookieMatch = envContent.match(/SUNO_COOKIE=(.*)/);
const rawCookie = cookieMatch ? cookieMatch[1].trim() : '';

(async () => {
  console.log('브라우저 실행...');
  const browser = await chromium.launch({ headless: false, channel: 'chrome' });
  const context = await browser.newContext();

  // 쿠키 설정
  const cookies = rawCookie.split(';').map(c => {
    const [name, ...rest] = c.trim().split('=');
    return {
      name: name.trim(),
      value: rest.join('='),
      domain: '.suno.com',
      path: '/'
    };
  }).filter(c => c.name && c.value);

  // __client 쿠키는 auth.suno.com 도메인으로
  const clientCookie = cookies.find(c => c.name === '__client');
  if (clientCookie) {
    cookies.push({ ...clientCookie, domain: '.clerk.suno.com' });
  }

  await context.addCookies(cookies);

  const page = await context.newPage();
  await page.goto('https://suno.com/create', { waitUntil: 'domcontentloaded' });

  console.log('페이지 로딩 대기 (10초)...');
  await page.waitForTimeout(10000);

  // 모든 textarea, input 찾기
  const elements = await page.evaluate(() => {
    const results = [];

    // textarea 찾기
    document.querySelectorAll('textarea').forEach(el => {
      results.push({
        tag: 'textarea',
        id: el.id,
        name: el.name,
        placeholder: el.placeholder,
        'data-testid': el.getAttribute('data-testid'),
        'aria-label': el.getAttribute('aria-label'),
        className: el.className.substring(0, 100),
        parentText: el.closest('div')?.querySelector('label,span,h3,h4')?.textContent || ''
      });
    });

    // input 찾기
    document.querySelectorAll('input[type="text"], input:not([type])').forEach(el => {
      results.push({
        tag: 'input',
        id: el.id,
        name: el.name,
        placeholder: el.placeholder,
        'data-testid': el.getAttribute('data-testid'),
        'aria-label': el.getAttribute('aria-label'),
        className: el.className.substring(0, 100),
        parentText: el.closest('div')?.querySelector('label,span,h3,h4')?.textContent || ''
      });
    });

    // Create 버튼 찾기
    document.querySelectorAll('button').forEach(el => {
      const text = el.textContent?.trim() || '';
      const ariaLabel = el.getAttribute('aria-label') || '';
      if (text.toLowerCase().includes('create') || ariaLabel.toLowerCase().includes('create')) {
        results.push({
          tag: 'button',
          text: text.substring(0, 50),
          'aria-label': ariaLabel,
          'aria-disabled': el.getAttribute('aria-disabled'),
          disabled: el.disabled,
          'data-testid': el.getAttribute('data-testid'),
          className: el.className.substring(0, 100)
        });
      }
    });

    return results;
  });

  console.log('\n=== 발견된 입력 요소들 ===');
  elements.forEach((el, i) => {
    console.log(`\n[${i}] <${el.tag}>`);
    Object.entries(el).forEach(([k, v]) => {
      if (v && k !== 'tag') console.log(`  ${k}: ${v}`);
    });
  });

  // 스크린샷
  await page.screenshot({ path: path.join(__dirname, 'debug-screenshot.png'), fullPage: true });
  console.log('\n스크린샷 저장: debug-screenshot.png');

  console.log('\n브라우저 30초 후 자동 닫힘...');
  await page.waitForTimeout(30000);
  await browser.close();
})();

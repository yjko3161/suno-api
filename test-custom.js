const http = require('http');
const fs = require('fs');

const data = JSON.stringify({
  prompt: `[Intro - FX + Whisper]
Feel it...
Pain is rising...
Heartbeat... faster...

[Build Up]
팔을 들어 올려 더 높이
손목이 아파도 DON'T STOP ME
숨이 차올라도 KEEP GOING
지금이야 한계를 넘는 타이밍

점점 빨라지는 심장 박동
온몸이 불타는 듯한 감정
이건 고통이 아냐 각성
3... 2... 1...

[DROP]
NO PAIN! NO LIMIT!
I BREAK IT! I BREAK IT!
한계 따윈 없지 KILL IT!
I TAKE IT! I TAKE IT!

(HEY! HEY! HEY!)
몸이 부서져도 GO HARD!
(HEY! HEY! HEY!)
멈추면 끝이야 GO HARD!

[Kick Drop - Hardstyle]
둥-둥-둥-둥 (HARD KICK)
PAIN! PAIN! PAIN! PAIN!
둥-둥-둥-둥
STRONG! STRONG! STRONG! STRONG!

[Verse]
근육통? 그건 내 연료
아픈 만큼 올라가는 온도
몸이 비명을 질러도 IGNORE
나는 이미 괴물이 됐어 MORE

[Build Up 2]
더 빠르게 더 세게 더 높이
한계 따윈 지금 다 부수지
멈추는 건 선택지가 아니지
DROP 또 간다 준비해 READY

[DROP 2]
NO PAIN! NO LIMIT!
I BREAK IT! I BREAK IT!
불타는 내 몸이 WEAPON
I TAKE IT! I TAKE IT!

(HEY! HEY! HEY!)
한 세트 더 간다 GO HARD!
(HEY! HEY! HEY!)
오늘 끝까지 간다 GO HARD!

[Final Hard Drop]
둥-둥-둥-둥 (DISTORTED KICK)
BREAK! BREAK! BREAK! BREAK!
둥-둥-둥-둥
RISE! RISE! RISE! RISE!

[Outro]
Pain... is power...
I... become... unstoppable...`,
  tags: "hardstyle, EDM, gym workout, aggressive, heavy bass, distorted kick, 150bpm, male vocal, shouting, intense",
  title: "NO PAIN NO LIMIT",
  make_instrumental: false,
  wait_audio: true
});

const req = http.request('http://localhost:3100/api/custom_generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' }
}, res => {
  let body = '';
  res.setEncoding('utf8');
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    const result = JSON.parse(body);
    if (result.error) { console.log('Error:', result.error); process.exit(1); }
    const songs = Array.isArray(result) ? result : [result];
    songs.forEach((s, i) => {
      console.log(`\n=== Song ${i+1} ===`);
      console.log('ID:', s.id);
      console.log('Title:', s.title);
      console.log('Model:', s.model_name);
      console.log('Status:', s.status);
      console.log('Tags:', s.tags);
      console.log('Audio:', s.audio_url);
      console.log('Suno:', `https://suno.com/song/${s.id}`);
    });
    fs.writeFileSync('C:/dev/api-suno-ai/test-custom-result.json', JSON.stringify(songs, null, 2), 'utf8');
    console.log('\n결과 저장 완료!');
  });
});

req.write(data);
req.end();

const http = require('http');
const fs = require('fs');

// 생성 테스트
const data = JSON.stringify({
  prompt: "밝고 신나는 K-pop 댄스곡, 여성 보컬",
  make_instrumental: false,
  wait_audio: true
});

const req = http.request('http://localhost:3100/api/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' }
}, res => {
  let body = '';
  res.setEncoding('utf8');
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    const result = JSON.parse(body);
    const songs = Array.isArray(result) ? result : [result];
    if (result.error) { console.log('Error:', result.error); process.exit(1); }
    songs.forEach((s, i) => {
      console.log(`\n=== Song ${i+1} ===`);
      console.log('ID:', s.id);
      console.log('Title:', s.title);
      console.log('Model:', s.model_name);
      console.log('Status:', s.status);
      console.log('Tags:', s.tags);
      console.log('Audio:', s.audio_url);
      console.log('Lyric:\n', s.lyric);
    });
    // 결과를 파일로도 저장
    fs.writeFileSync('C:/dev/api-suno-ai/test-result.json', JSON.stringify(songs, null, 2), 'utf8');
    console.log('\n결과 저장: C:/dev/api-suno-ai/test-result.json');
  });
});

req.write(data);
req.end();

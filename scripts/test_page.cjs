const http = require('http');
http.get('http://localhost:3002/academies', (res) => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    const match = d.match(/kakaoMapKey[^w]+['"]([^'"]+)['"]/);
    console.log('Key in page:', match ? match[1] : 'NOT FOUND');
    console.log('Has dapi.kakao.com script:', d.includes('dapi.kakao.com'));
    console.log('Has loadKakaoSDK:', d.includes('loadKakaoSDK'));
    console.log('Page length:', d.length);
  });
});

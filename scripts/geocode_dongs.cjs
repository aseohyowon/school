const https = require('https');
const fs = require('fs');
const path = require('path');

const KAKAO_KEY = '8b00c4fc5f8da3eeda2dafad1e8e1ab3';
const ACADEMIES_PATH = path.join(__dirname, '..', 'public', 'academies.json');
const OUTPUT_PATH = path.join(__dirname, '..', 'public', 'dong_coords.json');
const PROGRESS_PATH = path.join(__dirname, '..', 'public', 'dong_coords_progress.json');

const RAW = fs.readFileSync(ACADEMIES_PATH, 'utf-8');
const data = JSON.parse(RAW);
const academies = data.academies || data;

const cache = new Map();

for (const a of academies) {
  if (!a.dong) continue;

  let rawDong = a.dong.trim();

  let cleanDong = rawDong
    .replace(/^[-–—\s,;]+|[-–—\s,;]+$/g, '')
    .replace(/\([^)]*\)/g, '')
    .replace(/\[[^\]]*\]/g, '')
    .trim();

  if (!cleanDong) cleanDong = rawDong;

  const key = `${a.city}|${cleanDong}`;
  if (!cache.has(key)) {
    cache.set(key, {
      city: a.city,
      dong: cleanDong,
      rawDong,
      count: 0,
      sampleAddress: `${a.city} ${a.district || ''} ${cleanDong}`
    });
  }
  cache.get(key).count++;
}

const dongList = [...cache.values()].sort((a, b) => b.count - a.count);
console.log(`Unique (city, cleanDong): ${dongList.length}`);
console.log(`Total academies covered: ${cache.size}`);

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function geocode(query) {
  return new Promise((resolve, reject) => {
    const q = encodeURIComponent(query);
    const options = {
      hostname: 'dapi.kakao.com',
      path: `/v2/local/search/address.json?query=${q}&size=1`,
      headers: {
        'Authorization': `KakaoAK ${KAKAO_KEY}`,
        'Origin': 'http://localhost:3002',
        'KA': 'sdk/v1 os/javascript lang/ko-KR device/win32 origin/http://localhost:3002'
      }
    };
    https.get(options, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}: ${d.substring(0,200)}`));
          return;
        }
        try {
          const j = JSON.parse(d);
          resolve(j.documents && j.documents.length > 0
            ? { lat: parseFloat(j.documents[0].y), lng: parseFloat(j.documents[0].x), address: j.documents[0].address_name }
            : null);
        } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

async function main() {
  let results = {};
  if (fs.existsSync(PROGRESS_PATH)) {
    try {
      results = JSON.parse(fs.readFileSync(PROGRESS_PATH, 'utf-8'));
      console.log(`Resuming from progress: ${Object.keys(results).length} done`);
    } catch (e) { console.log('Progress file invalid, starting fresh'); }
  }

  let success = 0, fail = 0;
  const total = dongList.length;

  for (let i = 0; i < total; i++) {
    const { city, dong, sampleAddress } = dongList[i];
    const key = `${city}|${dong}`;

    if (results[key]) { success++; continue; }

    const addressQuery = dong.includes(' ') ? sampleAddress : `${city} ${dong}`;

    try {
      const coord = await geocode(addressQuery);
      if (coord) {
        results[key] = coord;
        success++;
        process.stdout.write(`✓ ${key} → ${coord.lat.toFixed(5)}, ${coord.lng.toFixed(5)}\n`);
      } else {
        results[key] = null;
        fail++;
        process.stdout.write(`✗ ${key} → not found\n`);
      }
    } catch (err) {
      results[key] = null;
      fail++;
      process.stdout.write(`✗ ${key} → ${err.message.substring(0,60)}\n`);
    }

    if (i % 50 === 49 || i === total - 1) {
      fs.writeFileSync(PROGRESS_PATH, JSON.stringify(results), 'utf-8');
      process.stdout.write(`—— ${i+1}/${total} (OK:${success}, Fail:${fail})\n`);
    }

    await sleep(50);
  }

  console.log(`\nDone. Success: ${success}, Fail: ${fail}, Total: ${total}`);
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(results, null, 2), 'utf-8');
  if (fs.existsSync(PROGRESS_PATH)) fs.unlinkSync(PROGRESS_PATH);
  console.log(`Saved to ${OUTPUT_PATH}`);
}

main().catch(e => { console.error(e); process.exit(1); });

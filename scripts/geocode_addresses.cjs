const https = require('https');
const fs = require('fs');
const path = require('path');

const KAKAO_KEY = '8b00c4fc5f8da3eeda2dafad1e8e1ab3';
const ACADEMIES_PATH = path.join(__dirname, '..', 'public', 'academies.json');
const PROGRESS_PATH = path.join(__dirname, '..', 'public', 'addr_coords_progress.json');

const data = JSON.parse(fs.readFileSync(ACADEMIES_PATH, 'utf-8'));
const academies = data.academies || data;

const addrMap = new Map();
for (const a of academies) {
  if (!a.address) continue;
  const key = a.address.trim();
  if (!addrMap.has(key)) {
    addrMap.set(key, { count: 0, sampleName: a.name });
  }
  addrMap.get(key).count++;
}
const addrs = [...addrMap.keys()];
console.log(`Total unique addresses: ${addrs.length}`);

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function geocode(address) {
  return new Promise((resolve, reject) => {
    const q = encodeURIComponent(address);
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
          reject(new Error(`HTTP ${res.statusCode}: ${d.substring(0,100)}`));
          return;
        }
        try {
          const j = JSON.parse(d);
          resolve(j.documents && j.documents.length > 0
            ? { lat: parseFloat(j.documents[0].y), lng: parseFloat(j.documents[0].x) }
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
      console.log(`Resuming: ${Object.keys(results).length} done`);
    } catch (e) {}
  }

  let success = 0, fail = 0, total = addrs.length, done = Object.keys(results).length;

  for (let i = 0; i < total; i++) {
    const addr = addrs[i];
    if (results[addr]) { continue; }

    try {
      const coord = await geocode(addr);
      if (coord) {
        results[addr] = coord;
        success++;
      } else {
        results[addr] = null;
        fail++;
      }
    } catch (err) {
      results[addr] = null;
      fail++;
      if (String(err).includes('429') || String(err).includes('Too Many')) {
        console.log(`\nRate limited at ${i+1}/${total}, waiting 5s...`);
        await sleep(5000);
        try {
          const coord = await geocode(addr);
          if (coord) { results[addr] = coord; success++; }
          else { results[addr] = null; fail++; }
        } catch(e2) { results[addr] = null; fail++; }
      }
    }

    if ((i + 1) % 200 === 0 || i === total - 1) {
      fs.writeFileSync(PROGRESS_PATH, JSON.stringify(results), 'utf-8');
      const pct = ((i + 1) / total * 100).toFixed(1);
      process.stdout.write(`\r${i+1}/${total} (${pct}%) OK:${success} Fail:${fail}`);
    }

    await sleep(50);
  }

  console.log(`\nDone. OK:${success} Fail:${fail} Total:${total}`);

  let applied = 0;
  for (const a of academies) {
    if (!a.address) continue;
    const coord = results[a.address.trim()];
    if (coord) {
      a.lat = parseFloat(coord.lat.toFixed(5));
      a.lng = parseFloat(coord.lng.toFixed(5));
      applied++;
    }
  }

  console.log(`Applied to ${applied} academies`);

  if (fs.existsSync(PROGRESS_PATH)) {
    const backup = PROGRESS_PATH.replace('_progress.json', '_backup.json');
    fs.renameSync(PROGRESS_PATH, backup);
    console.log(`Progress saved as ${backup}`);
  }

  const out = { total: academies.length, academies };
  fs.writeFileSync(ACADEMIES_PATH, JSON.stringify(out), 'utf-8');
  console.log(`Saved ${ACADEMIES_PATH} (${(fs.statSync(ACADEMIES_PATH).size / 1024 / 1024).toFixed(1)}MB)`);
}

main().catch(e => { console.error(e); process.exit(1); });

const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, '..', 'public', 'academies.json');
const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
const academies = data.academies;

function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i);
    h |= 0;
  }
  return h >>> 0;
}

// Real dong centers from Nominatim (administrative boundary centroids)
const dongCenters = {
  // 수원시 장안구
  '수원시||장안구||정자동': [37.2966073, 126.9928359],
  '수원시||장안구||조원동': [37.3039794, 127.0122244],
  '수원시||장안구||천천동': [37.2958836, 126.9789152],
  '수원시||장안구||송죽동': [37.3033091, 127.0008226],
  '수원시||장안구||파장동': [37.3093591, 126.9965323],
  '수원시||장안구||영화동': [37.2927500, 127.0136100],
  '수원시||장안구||율전동': [37.3001515, 126.9695950],
  '수원시||장안구||연무동': [37.2925332, 127.0265670],
  '수원시||장안구||이목동': [37.3162616, 126.9848665],
  '수원시||장안구||하광교동': [37.3164277, 127.0241442],
  // 수원시 권선구
  '수원시||권선구||권선동': [37.2508559, 127.0307889],
  '수원시||권선구||세류동': [37.2571500, 127.0124100],
  '수원시||권선구||평동': [37.2548637, 126.9925828],
  '수원시||권선구||고색동': [37.2516324, 126.9830331],
  '수원시||권선구||오목천동': [37.2422065, 126.9654559],
  '수원시||권선구||곡반정동': [37.2400617, 127.0331544],
  '수원시||권선구||구운동': [37.2783252, 126.9742236],
  '수원시||권선구||호매실동': [37.2663933, 126.9571912],
  '수원시||권선구||입북동': [37.2939700, 126.9574685],
  '수원시||권선구||당수동': [37.2906215, 126.9447431],
  '수원시||권선구||서둔동': [37.2722831, 126.9869531],
  '수원시||권선구||탑동': [37.2717780, 126.9757474],
  '수원시||권선구||금곡동': [37.2728973, 126.9521411],
  // 수원시 영통구
  '수원시||영통구||영통동': [37.2645833, 127.0775472],
  '수원시||영통구||매탄동': [37.2661800, 127.0472300],
  '수원시||영통구||망포동': [37.2388116, 127.0516653],
  '수원시||영통구||원천동': [37.2735544, 127.0591495],
  '수원시||영통구||이의동': [37.2993838, 127.0491242],
  // 수원시 팔달구
  '수원시||팔달구||인계동': [37.2682080, 127.0293802],
  '수원시||팔달구||화서동': [37.2811000, 126.9996100],
  '수원시||팔달구||우만동': [37.2843300, 127.0327900],
  '수원시||팔달구||매교동': [37.2678861, 127.0165984],
  '수원시||팔달구||지동': [37.2821700, 127.0247700],
  '수원시||팔달구||교동': [37.2715709, 127.0133925],
  '수원시||팔달구||고등동': [37.2734763, 127.0031678],
  '수원시||팔달구||중동': [37.2739500, 127.0163800],
  '수원시||팔달구||북수동': [37.2858200, 127.0164400],
  '수원시||팔달구||신풍동': [37.2840100, 127.0129200],
};

// District centers (average of dong centers)
const districtCenters = {};
const distDongCounts = {};
Object.entries(dongCenters).forEach(([key, [lat, lng]]) => {
  const parts = key.split('||');
  const dk = parts[0] + '||' + parts[1];
  if (!districtCenters[dk]) { districtCenters[dk] = [0, 0]; distDongCounts[dk] = 0; }
  districtCenters[dk][0] += lat;
  districtCenters[dk][1] += lng;
  distDongCounts[dk]++;
});
Object.keys(districtCenters).forEach(k => {
  districtCenters[k][0] /= distDongCounts[k];
  districtCenters[k][1] /= distDongCounts[k];
});

// City centers (fallback)
const cityCenters = {
  '수원시': [37.277, 127.017],
  '성남시': [37.420, 127.127],
  '안양시': [37.394, 126.957],
  '과천시': [37.430, 126.988],
  '부천시': [37.499, 126.783],
  '광명시': [37.479, 126.865],
  '안산시': [37.322, 126.827],
  '평택시': [36.995, 127.113],
  '군포시': [37.362, 126.935],
  '의왕시': [37.345, 126.970],
  '여주시': [37.296, 127.637],
  '화성시': [37.200, 126.831],
  '오산시': [37.150, 127.077],
  '광주시': [37.415, 127.257],
  '하남시': [37.539, 127.214],
  '양평군': [37.492, 127.488],
  '이천시': [37.272, 127.435],
  '용인시': [37.262, 127.215],
  '안성시': [37.008, 127.280],
  '김포시': [37.615, 126.716],
  '시흥시': [37.380, 126.803],
  '의정부시': [37.738, 127.034],
  '동두천시': [37.905, 127.061],
  '양주시': [37.797, 127.045],
  '고양시': [37.658, 126.832],
  '남양주시': [37.637, 127.216],
  '구리시': [37.594, 127.131],
  '파주시': [37.760, 126.780],
  '연천군': [38.097, 127.075],
  '포천시': [37.895, 127.200],
  '가평군': [37.831, 127.510],
};

const DIST_SPREAD = 0.001; // ~110m spread from center

function isValidDong(d) {
  return /^[가-힣]{2,}동$/.test(d);
}

// Pre-collect district info for grid fallback
const cityDistricts = {};
academies.forEach(a => {
  if (!cityDistricts[a.city]) cityDistricts[a.city] = new Set();
  cityDistricts[a.city].add(a.district);
});

academies.forEach(a => {
  let centerLat, centerLng, useSpread = DIST_SPREAD;
  const dk = `${a.city}||${a.district}`;

  if (a.dong && isValidDong(a.dong)) {
    const dongKey = `${dk}||${a.dong}`;
    const dc = dongCenters[dongKey];
    if (dc) {
      centerLat = dc[0];
      centerLng = dc[1];
    } else if (districtCenters[dk]) {
      centerLat = districtCenters[dk][0];
      centerLng = districtCenters[dk][1];
    } else {
      centerLat = cityCenters[a.city] ? cityCenters[a.city][0] : 37.5;
      centerLng = cityCenters[a.city] ? cityCenters[a.city][1] : 127.5;
    }
  } else if (districtCenters[dk]) {
    centerLat = districtCenters[dk][0];
    centerLng = districtCenters[dk][1];
  } else {
    // Grid-based fallback for cities without real coordinates
    const center = cityCenters[a.city];
    if (!center) return;
    const dists = [...cityDistricts[a.city]].sort();
    const di = dists.indexOf(a.district);
    if (di < 0) return;
    const count = academies.filter(x => x.city === a.city).length;
    const sf = 0.5 + (count / 5000) * 2;
    const lngSpan = 0.030 * Math.min(2.5, sf);
    const latSpan = 0.025 * Math.min(2.5, sf);
    const cols = Math.max(1, Math.ceil(Math.sqrt(dists.length)));
    const rows = Math.max(1, Math.ceil(dists.length / cols));
    const col = di % cols;
    const row = Math.floor(di / cols);
    const cellW = lngSpan / cols;
    const cellH = latSpan / rows;
    const margin = 0.15;
    centerLat = center[0] - latSpan / 2 + row * cellH + cellH * margin;
    centerLng = center[1] - lngSpan / 2 + col * cellW + cellW * margin;
    useSpread = Math.min(cellH, cellW) * (1 - 2 * margin) * 0.4;
  }

  // Generate spread from center using hash
  const h = hash(a.city + '||' + a.district + '||' + (a.dong || '') + '||' + a.name);
  const latOff = ((h % 10001) / 10000 - 0.5) * 2 * useSpread;
  const lngOff = (((h >> 10) % 10001) / 10000 - 0.5) * 2 * useSpread;

  a.lat = +(centerLat + latOff).toFixed(7);
  a.lng = +(centerLng + lngOff).toFixed(7);
});

// Verify 수원시 장안구 조원동
const jd = academies.filter(a => a.city === '수원시' && a.district === '장안구' && a.dong === '조원동');
if (jd.length > 0) {
  const lats = jd.map(a => a.lat); const lngs = jd.map(a => a.lng);
  console.log(`조원동 (${jd.length}): lat ${Math.min(...lats).toFixed(5)}~${Math.max(...lats).toFixed(5)}, lng ${Math.min(...lngs).toFixed(5)}~${Math.max(...lngs).toFixed(5)}`);
  console.log(`  dongCenter: 37.30398, 127.01222  spread: ±${DIST_SPREAD}°`);
}

// Verify all dongs in 장안구
console.log('\n수원시 장안구 동별 좌표:');
const swJa = academies.filter(a => a.city === '수원시' && a.district === '장안구');
const dg = {};
swJa.forEach(a => {
  if (!dg[a.dong]) dg[a.dong] = { lats: [], lngs: [] };
  dg[a.dong].lats.push(a.lat); dg[a.dong].lngs.push(a.lng);
});
Object.entries(dg).sort().forEach(([d, r]) => {
  const clat = Math.min(...r.lats); const clng = Math.min(...r.lngs);
  const dlat = Math.max(...r.lats); const dlng = Math.max(...r.lngs);
  console.log(`  ${d||'(empty)'} (${r.lats.length}): ${clat.toFixed(5)}~${dlat.toFixed(5)}, ${clng.toFixed(5)}~${dlng.toFixed(5)}`);
});

fs.writeFileSync(jsonPath, JSON.stringify(data), 'utf-8');
console.log(`\nSaved: ${(fs.statSync(jsonPath).size / 1024 / 1024).toFixed(1)}MB`);

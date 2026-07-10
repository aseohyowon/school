const fs = require('fs');
const path = require('path');

const ACADEMIES_PATH = path.join(__dirname, '..', 'public', 'academies.json');
const DONG_COORDS_PATH = path.join(__dirname, '..', 'public', 'dong_coords.json');

const data = JSON.parse(fs.readFileSync(ACADEMIES_PATH, 'utf-8'));
const academies = data.academies || data;
const dongCoords = JSON.parse(fs.readFileSync(DONG_COORDS_PATH, 'utf-8'));

const SPREAD = 0.001;

function hashSpread(id, max = SPREAD) {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = ((h << 5) - h) + id.charCodeAt(i); h |= 0;
  }
  return (Math.abs(h) % 1000) / 1000 * max * 2 - max;
}

for (const a of academies) {
  const dong = a.dong ? a.dong.trim() : '';
  if (dong) {
    const key = `${a.city}|${dong}`;
    const coord = dongCoords[key];
    if (coord && coord.lat && coord.lng) {
      a._lat = coord.lat + hashSpread(a.id || a.NAME || a.name || '');
      a._lng = coord.lng + hashSpread((a.id || a.NAME || a.name || '') + 'lng');
    }
  }
}

const districtCenters = new Map();
for (const a of academies) {
  if (!a._lat) continue;
  const key = `${a.city}|${a.district}`;
  if (!districtCenters.has(key)) districtCenters.set(key, { sumLat: 0, sumLng: 0, count: 0 });
  const c = districtCenters.get(key);
  c.sumLat += a._lat;
  c.sumLng += a._lng;
  c.count++;
}

const cityCenters = new Map();
for (const a of academies) {
  if (!a._lat) continue;
  const key = a.city;
  if (!cityCenters.has(key)) cityCenters.set(key, { sumLat: 0, sumLng: 0, count: 0 });
  const c = cityCenters.get(key);
  c.sumLat += a._lat;
  c.sumLng += a._lng;
  c.count++;
}

let matchDong = 0, matchDist = 0, matchCity = 0, matchDefault = 0;

for (const a of academies) {
  if (a._lat) {
    a.lat = parseFloat(a._lat.toFixed(5));
    a.lng = parseFloat(a._lng.toFixed(5));
    delete a._lat; delete a._lng;
    matchDong++;
    continue;
  }

  const distKey = `${a.city}|${a.district}`;
  const dc = districtCenters.get(distKey);
  if (dc && dc.count > 0) {
    const lat = dc.sumLat / dc.count + hashSpread(a.id || a.NAME || a.name || '');
    const lng = dc.sumLng / dc.count + hashSpread((a.id || a.NAME || a.name || '') + 'lng');
    a.lat = parseFloat(lat.toFixed(5));
    a.lng = parseFloat(lng.toFixed(5));
    matchDist++;
    continue;
  }

  const cc = cityCenters.get(a.city);
  if (cc && cc.count > 0) {
    const lat = cc.sumLat / cc.count + hashSpread(a.id || a.NAME || a.name || '');
    const lng = cc.sumLng / cc.count + hashSpread((a.id || a.NAME || a.name || '') + 'lng');
    a.lat = parseFloat(lat.toFixed(5));
    a.lng = parseFloat(lng.toFixed(5));
    matchCity++;
    continue;
  }

  const lat = 37.5 + hashSpread(a.id || a.NAME || a.name || '');
  const lng = 127.0 + hashSpread((a.id || a.NAME || a.name || '') + 'lng');
  a.lat = parseFloat(lat.toFixed(5));
  a.lng = parseFloat(lng.toFixed(5));
  matchDefault++;
}

const total = academies.length;
console.log(`Total: ${total}`);
console.log(`Dong match:   ${matchDong} (${(matchDong/total*100).toFixed(1)}%)`);
console.log(`District avg: ${matchDist} (${(matchDist/total*100).toFixed(1)}%)`);
console.log(`City avg:     ${matchCity} (${(matchCity/total*100).toFixed(1)}%)`);
console.log(`Default:      ${matchDefault} (${(matchDefault/total*100).toFixed(1)}%)`);

const out = { total, academies };
fs.writeFileSync(ACADEMIES_PATH, JSON.stringify(out), 'utf-8');
console.log(`Saved to ${ACADEMIES_PATH}`);

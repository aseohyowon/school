const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { XMLParser } = require('fast-xml-parser');

const xlsxPath = 'C:\\Users\\gydnj\\AppData\\Local\\Temp\\opencode\\academy_raw.xlsx';
const jsonPath = path.join(__dirname, '..', 'public', 'academies.json');
const extractDir = 'C:\\Users\\gydnj\\AppData\\Local\\Temp\\opencode\\xlsx_extract';

console.log('Extracting XLSX...');
if (fs.existsSync(extractDir)) fs.rmSync(extractDir, { recursive: true });
fs.mkdirSync(extractDir, { recursive: true });
execSync(`powershell -Command "Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::ExtractToDirectory('${xlsxPath}', '${extractDir}')"`, { stdio: 'pipe', shell: 'powershell' });

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_', textNodeName: '#text' });

function getCV(cell, ss) {
  if (!cell) return '';
  const t = cell['@_t'] || '';
  const v = cell['x:v'];
  if (v === undefined && cell['x:is'] && cell['x:is']['x:t']) return String(cell['x:is']['x:t']);
  if (t === 's' && v !== undefined) return ss[parseInt(v)] || '';
  if (v !== undefined) return String(v);
  return '';
}

function extractDong(addr) {
  if (!addr) return '';
  const s = String(addr);
  // Find parenthesized content
  const parens = s.match(/\(([^)]+)\)/g);
  if (!parens) return '';
  
  for (const p of parens) {
    // Match Korean-word dong: 한글로만 된 이름 + "동"
    const m = p.match(/([가-힣]+)동/);
    if (m) return m[0]; // e.g., "조원동"
  }
  return '';
}

const ssData = parser.parse(fs.readFileSync(path.join(extractDir, 'xl', 'sharedStrings.xml'), 'utf-8'));
const siItems = ssData['x:sst']['x:si'];
const sharedStrings = (Array.isArray(siItems) ? siItems : [siItems]).map(item => {
  if (item['x:t']) return item['x:t'];
  if (item['x:r']) return (Array.isArray(item['x:r']) ? item['x:r'] : [item['x:r']]).map(r => r['x:t']).join('');
  return '';
});

const wbData = parser.parse(fs.readFileSync(path.join(extractDir, 'xl', 'workbook.xml'), 'utf-8'));
const wbSheets = Array.isArray(wbData['x:workbook']['x:sheets']['x:sheet'])
  ? wbData['x:workbook']['x:sheets']['x:sheet']
  : [wbData['x:workbook']['x:sheets']['x:sheet']];
const sheetIdxToName = {};
wbSheets.forEach((s, i) => { sheetIdxToName[`sheet${i+1}.xml`] = s['@_name']; });

const sheetCityMap = {
  '수원':'수원시','성남':'성남시','안양':'안양시','과천':'과천시','부천':'부천시',
  '광명':'광명시','안산':'안산시','평택':'평택시','군포':'군포시','의왕':'의왕시',
  '여주':'여주시','화성오산':null,'화성(센터)':'화성시',
  '광주':'광주시','하남':'하남시','양평':'양평군','이천':'이천시','용인':'용인시',
  '안성':'안성시','김포':'김포시','시흥':'시흥시',
  '의정부':'의정부시','동두천':'동두천시','양주':'양주시','고양':'고양시',
  '남양주':'남양주시','구리':'구리시','파주':'파주시','연천':'연천군','포천':'포천시','가평':'가평군'
};

const wsDir = path.join(extractDir, 'xl', 'worksheets');
const sheetFiles = fs.readdirSync(wsDir).filter(f => f.endsWith('.xml'))
  .sort((a,b) => parseInt(a.match(/\d+/)[0]) - parseInt(b.match(/\d+/)[0]));

console.log('Processing sheets...');
const lookup = new Map();

sheetFiles.forEach(sf => {
  const sheetName = sheetIdxToName[sf];
  if (!sheetName) return;
  const defaultCity = sheetCityMap[sheetName];
  if (defaultCity === undefined) return;

  const data = parser.parse(fs.readFileSync(path.join(wsDir, sf), 'utf-8'));
  const rows = data['x:worksheet']['x:sheetData']['x:row'];
  const rowList = Array.isArray(rows) ? rows : [rows];

  rowList.forEach(row => {
    const rn = parseInt(row['@_r']);
    if (rn < 6) return;

    const cl = Array.isArray(row['x:c']) ? row['x:c'] : (row['x:c'] ? [row['x:c']] : []);
    const cells = {};
    cl.forEach(c => { const col = c['@_r'].match(/^[A-Z]+/); if (col) cells[col[0]] = getCV(c, sharedStrings); });

    const name = String(cells['B'] || '');
    const addr = String(cells['E'] || '');
    if (!name || !addr) return;

    let city = defaultCity;
    if (!city) {
      const m = addr.match(/경기도\s+(\S+시)/);
      city = m ? m[1] : (addr.includes('오산') ? '오산시' : '화성시');
    }

    const key = `${city}||${name}`;
    if (!lookup.has(key)) {
      const dong = extractDong(addr);
      lookup.set(key, dong);
    }
  });
});

console.log(`Unique entries in lookup: ${lookup.size}`);

// Read current academies.json
console.log('Updating academies.json...');
const current = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
const academies = current.academies;
let added = 0, missing = 0;

academies.forEach(a => {
  const key = `${a.city}||${a.name}`;
  const dong = lookup.get(key);
  if (dong) {
    a.dong = dong;
    added++;
  } else {
    a.dong = '';
    missing++;
  }
});

console.log(`Dong found: ${added}, missing: ${missing}`);

// Stats
const dongSet = new Set(academies.filter(a => a.dong).map(a => a.dong));
console.log(`Unique dongs: ${dongSet.size}`);

// Check 수원시 장안구 dongs
const swJaDongs = [...new Set(academies.filter(a => a.city === '수원시' && a.district === '장안구' && a.dong).map(a => a.dong))].sort();
console.log(`수원시 장안구 dongs: ${swJaDongs}`);

// Fix 다능보습학원
const dn = academies.find(a => a.name === '다능보습학원');
if (dn) {
  console.log(`\n다능보습학원: ${dn.city} ${dn.district} dong=${dn.dong}`);
  dn.lat = 37.2990989929;
  dn.lng = 127.0182260509;
  dn.phone = '031-256-7966';
  console.log(`  → lat/lng fixed`);
}

fs.writeFileSync(jsonPath, JSON.stringify(current), 'utf-8');
const newSize = fs.statSync(jsonPath).size;
console.log(`\nSaved: ${(newSize / 1024 / 1024).toFixed(1)}MB`);
fs.rmSync(extractDir, { recursive: true });
console.log('Done!');

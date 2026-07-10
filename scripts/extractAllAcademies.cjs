const { XMLParser } = require('fast-xml-parser');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

const filePath = 'C:\\Users\\gydnj\\AppData\\Local\\Temp\\opencode\\academy_raw.xlsx';
const extractDir = 'C:\\Users\\gydnj\\AppData\\Local\\Temp\\opencode\\xlsx_extract_all';
const outputFile = path.join(__dirname, '..', 'public', 'academies.json');

// Clean and extract
if (fs.existsSync(extractDir)) fs.rmSync(extractDir, { recursive: true });
fs.mkdirSync(extractDir, { recursive: true });
execSync(`powershell -Command "Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::ExtractToDirectory('${filePath}', '${extractDir}')"`);

// Parse shared strings
const ssXml = fs.readFileSync(path.join(extractDir, 'xl', 'sharedStrings.xml'), 'utf-8');
const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_', textNodeName: '#text' });
const ssData = parser.parse(ssXml);
const siItems = ssData['x:sst']['x:si'];
const sharedStrings = siItems.map(item => {
  if (item['x:t']) return item['x:t'];
  if (item['x:r']) {
    const runs = Array.isArray(item['x:r']) ? item['x:r'] : [item['x:r']];
    return runs.map(r => r['x:t']).join('');
  }
  return '';
});

console.log(`Shared strings: ${sharedStrings.length}`);

function getCellValue(cell) {
  if (!cell) return '';
  const type = cell['@_t'];
  const value = cell['x:v'];
  if (type === 's' && value !== undefined) return sharedStrings[parseInt(value)] || '';
  if (type === 'str') return value || '';
  return value !== undefined ? String(value) : '';
}

// City bounds for coordinate generation (approximate)
const cityBounds = {
  '수원': { latMin: 37.24, latMax: 37.32, lngMin: 126.96, lngMax: 127.08 },
  '성남': { latMin: 37.37, latMax: 37.46, lngMin: 127.10, lngMax: 127.18 },
  '안양': { latMin: 37.37, latMax: 37.42, lngMin: 126.90, lngMax: 126.98 },
  '과천': { latMin: 37.41, latMax: 37.45, lngMin: 126.97, lngMax: 127.02 },
  '부천': { latMin: 37.47, latMax: 37.54, lngMin: 126.74, lngMax: 126.83 },
  '광명': { latMin: 37.45, latMax: 37.50, lngMin: 126.83, lngMax: 126.89 },
  '안산': { latMin: 37.28, latMax: 37.35, lngMin: 126.78, lngMax: 126.88 },
  '평택': { latMin: 36.95, latMax: 37.05, lngMin: 127.05, lngMax: 127.15 },
  '군포': { latMin: 37.33, latMax: 37.38, lngMin: 126.90, lngMax: 126.96 },
  '의왕': { latMin: 37.33, latMax: 37.38, lngMin: 126.96, lngMax: 127.02 },
  '여주': { latMin: 37.25, latMax: 37.35, lngMin: 127.60, lngMax: 127.75 },
  '화성오산': { latMin: 37.12, latMax: 37.24, lngMin: 126.98, lngMax: 127.08 },
  '화성(센터)': { latMin: 37.12, latMax: 37.24, lngMin: 126.98, lngMax: 127.08 },
  '광주': { latMin: 37.38, latMax: 37.45, lngMin: 127.22, lngMax: 127.30 },
  '하남': { latMin: 37.51, latMax: 37.56, lngMin: 127.18, lngMax: 127.25 },
  '양평': { latMin: 37.45, latMax: 37.55, lngMin: 127.40, lngMax: 127.60 },
  '이천': { latMin: 37.24, latMax: 37.32, lngMin: 127.40, lngMax: 127.50 },
  '용인': { latMin: 37.20, latMax: 37.35, lngMin: 127.08, lngMax: 127.23 },
  '안성': { latMin: 36.98, latMax: 37.08, lngMin: 127.20, lngMax: 127.35 },
  '김포': { latMin: 37.59, latMax: 37.66, lngMin: 126.68, lngMax: 126.75 },
  '시흥': { latMin: 37.35, latMax: 37.42, lngMin: 126.77, lngMax: 126.83 },
  '의정부': { latMin: 37.71, latMax: 37.77, lngMin: 127.01, lngMax: 127.08 },
  '동두천': { latMin: 37.88, latMax: 37.95, lngMin: 127.05, lngMax: 127.12 },
  '양주': { latMin: 37.75, latMax: 37.85, lngMin: 127.00, lngMax: 127.12 },
  '고양': { latMin: 37.62, latMax: 37.70, lngMin: 126.78, lngMax: 126.90 },
  '남양주': { latMin: 37.58, latMax: 37.68, lngMin: 127.15, lngMax: 127.30 },
  '구리': { latMin: 37.58, latMax: 37.62, lngMin: 127.12, lngMax: 127.16 },
  '파주': { latMin: 37.70, latMax: 37.85, lngMin: 126.72, lngMax: 126.85 },
  '연천': { latMin: 37.95, latMax: 38.10, lngMin: 127.00, lngMax: 127.15 },
  '포천': { latMin: 37.80, latMax: 37.95, lngMin: 127.12, lngMax: 127.25 },
  '가평': { latMin: 37.70, latMax: 37.90, lngMin: 127.40, lngMax: 127.60 },
};

function hashToRange(str, min, max) {
  const hash = crypto.createHash('md5').update(str).digest('hex');
  const intVal = parseInt(hash.slice(0, 8), 16);
  const range = Math.round((max - min) * 10000);
  if (range <= 0) return min;
  const offset = (intVal % range) / 10000;
  return min + offset;
}

function extractDistrict(address) {
  if (!address || typeof address !== 'string') return '';
  // Try to extract 구 from 경기도 XX시 XX구 pattern
  const guMatch = address.match(/경기도\s+\S+시\s+(\S+구)/);
  if (guMatch) return guMatch[1];
  // Try to extract 읍/면/동
  const match = address.match(/(\S+읍|\S+면|\S+동)\s/);
  if (match) return match[1].trim();
  // Fallback: extract last meaningful part
  const parts = address.split(' ');
  for (let i = parts.length - 1; i >= 0; i--) {
    if (parts[i].includes('동') || parts[i].includes('구') || parts[i].includes('읍') || parts[i].includes('면')) {
      return parts[i];
    }
  }
  return '';
}

function getCityFromAddress(address) {
  if (!address || typeof address !== 'string') return '';
  const match = address.match(/경기도\s+(\S+시)/);
  if (match) return match[1];
  return '';
}

// Sheet name to sheet file mapping from workbook.xml
const sheetMap = {
  '수원': 'sheet1.xml', '성남': 'sheet2.xml', '안양': 'sheet3.xml',
  '과천': 'sheet4.xml', '부천': 'sheet5.xml', '광명': 'sheet6.xml',
  '안산': 'sheet7.xml', '평택': 'sheet8.xml', '군포': 'sheet9.xml',
  '의왕': 'sheet10.xml', '여주': 'sheet11.xml', '화성오산': 'sheet12.xml',
  '화성(센터)': 'sheet13.xml', '광주': 'sheet14.xml', '하남': 'sheet15.xml',
  '양평': 'sheet16.xml', '이천': 'sheet17.xml', '용인': 'sheet18.xml',
  '안성': 'sheet19.xml', '김포': 'sheet20.xml', '시흥': 'sheet21.xml',
  '의정부': 'sheet22.xml', '동두천': 'sheet23.xml', '양주': 'sheet24.xml',
  '고양': 'sheet25.xml', '남양주': 'sheet26.xml', '구리': 'sheet27.xml',
  '파주': 'sheet28.xml', '연천': 'sheet29.xml', '포천': 'sheet30.xml',
  '가평': 'sheet31.xml',
};

const cityNameMap = {
  '수원': '수원시', '성남': '성남시', '안양': '안양시',
  '과천': '과천시', '부천': '부천시', '광명': '광명시',
  '안산': '안산시', '평택': '평택시', '군포': '군포시',
  '의왕': '의왕시', '여주': '여주시', '화성오산': '화성시',
  '화성(센터)': '화성시', '광주': '광주시', '하남': '하남시',
  '양평': '양평군', '이천': '이천시', '용인': '용인시',
  '안성': '안성시', '김포': '김포시', '시흥': '시흥시',
  '의정부': '의정부시', '동두천': '동두천시', '양주': '양주시',
  '고양': '고양시', '남양주': '남양주시', '구리': '구리시',
  '파주': '파주시', '연천': '연천군', '포천': '포천시',
  '가평': '가평군',
};

const allAcademies = [];
let totalRows = 0;
let totalUnique = 0;

for (const [sheetName, sheetFile] of Object.entries(sheetMap)) {
  const sheetXmlPath = path.join(extractDir, 'xl', 'worksheets', sheetFile);
  if (!fs.existsSync(sheetXmlPath)) {
    console.log(`Sheet file not found: ${sheetFile} (${sheetName})`);
    continue;
  }

  const xml = fs.readFileSync(sheetXmlPath, 'utf-8');
  const data = parser.parse(xml);
  const rows = data['x:worksheet']?.['x:sheetData']?.['x:row'];
  if (!rows || !Array.isArray(rows)) {
    console.log(`No rows in ${sheetName}`);
    continue;
  }

  const city = cityNameMap[sheetName] || sheetName;
  const bounds = cityBounds[sheetName] || { latMin: 37.0, latMax: 38.0, lngMin: 126.5, lngMax: 127.8 };

  const localMap = new Map();
  let sheetDataRows = 0;

  for (const row of rows) {
    const rowNum = parseInt(row['@_r']);
    if (rowNum <= 5) continue;

    const cells = Array.isArray(row['x:c']) ? row['x:c'] : (row['x:c'] ? [row['x:c']] : []);
    if (cells.length < 2) continue;

    const name = getCellValue(cells[1]);
    const address = getCellValue(cells[4]);
    const phone = getCellValue(cells[6]);

    if (!name || !address) continue;
    sheetDataRows++;

    const key = name + '|' + address;
    if (!localMap.has(key)) {
      const subjectClass = getCellValue(cells[9]);
      const subjectProcess = getCellValue(cells[8]);
      const field = getCellValue(cells[3]);
      const academyType = getCellValue(cells[2]);

      localMap.set(key, {
        name, address, phone: phone || '',
        subjects: new Set(),
        field: field || '', academyType: academyType || '',
      });
    }

    const entry = localMap.get(key);
    const subject = getCellValue(cells[9]) || getCellValue(cells[8]) || '';
    if (subject && typeof subject === 'string') {
      const clean = subject.replace(/\s+/g, '').trim();
      if (clean) entry.subjects.add(clean);
    }
  }

  for (const [_, entry] of localMap) {
    const lat = hashToRange(entry.name + entry.address, bounds.latMin, bounds.latMax);
    const lng = hashToRange(entry.address + entry.name, bounds.lngMin, bounds.lngMax);
    const district = extractDistrict(entry.address);
    const subjects = Array.from(entry.subjects).slice(0, 4);

    let shortAddress = String(entry.address || '');
    const addrCity = getCityFromAddress(entry.address);
    const roadMatch = shortAddress.match(/(경기도\s+\S+시\s+\S+구[^,，]+)/);
    if (roadMatch) shortAddress = roadMatch[1].trim();

    allAcademies.push({
      name: entry.name,
      lat: parseFloat(lat.toFixed(7)),
      lng: parseFloat(lng.toFixed(7)),
      address: shortAddress,
      phone: entry.phone,
      subjects: subjects.length > 0 ? subjects : ['일반'],
      city: addrCity || city,
      district: district || '',
      field: entry.field?.trim() || '',
    });
  }

  console.log(`${sheetName}: ${sheetDataRows} rows → ${localMap.size} unique academies`);
  totalRows += sheetDataRows;
  totalUnique += localMap.size;
}

console.log(`\nTotal: ${totalRows} data rows → ${totalUnique} unique academies`);

// Write JSON output
const output = { academies: allAcademies, total: allAcademies.length };
const dir = path.dirname(outputFile);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(outputFile, JSON.stringify(output, null, 0), 'utf-8');
console.log(`Output: ${outputFile} (${fs.statSync(outputFile).size} bytes, ${allAcademies.length} academies)`);

// Cleanup
fs.rmSync(extractDir, { recursive: true });

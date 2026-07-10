const { XMLParser } = require('fast-xml-parser');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const filePath = 'C:\\Users\\gydnj\\AppData\\Local\\Temp\\opencode\\academy_raw.xlsx';
const extractDir = 'C:\\Users\\gydnj\\AppData\\Local\\Temp\\opencode\\xlsx_extract';

// Remove and recreate extract dir
if (fs.existsSync(extractDir)) {
  fs.rmSync(extractDir, { recursive: true });
}
fs.mkdirSync(extractDir, { recursive: true });

// Extract ZIP to temp folder
execSync(`powershell -Command "Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::ExtractToDirectory('${filePath}', '${extractDir}')"`);

// Read shared strings
const sharedStringsXml = fs.readFileSync(path.join(extractDir, 'xl', 'sharedStrings.xml'), 'utf-8');
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text'
});

const ssData = parser.parse(sharedStringsXml);
const siItems = ssData['x:sst']['x:si'];
const sharedStrings = siItems.map(item => {
  if (item['x:t']) {
    return item['x:t'];
  }
  if (item['x:r']) {
    const runs = Array.isArray(item['x:r']) ? item['x:r'] : [item['x:r']];
    return runs.map(r => r['x:t']).join('');
  }
  return '';
});

console.log(`Shared strings: ${sharedStrings.length}`);

function getCellValue(cell, sharedStrings) {
  if (!cell) return '';
  const type = cell['@_t'];
  const value = cell['x:v'];
  if (type === 's' && value !== undefined) {
    const idx = parseInt(value);
    return sharedStrings[idx] || '';
  }
  if (type === 'str') {
    return value || '';
  }
  return value !== undefined ? value : '';
}

// Read sheet1.xml (Suwon data)
const sheetXml = fs.readFileSync(path.join(extractDir, 'xl', 'worksheets', 'sheet1.xml'), 'utf-8');
const sheetData = parser.parse(sheetXml);
const rows = sheetData['x:worksheet']['x:sheetData']['x:row'];

console.log(`Total rows in Suwon sheet: ${rows.length}`);

// Row 5 is the header
const headerRow = rows.find(r => parseInt(r['@_r']) === 5);
if (headerRow) {
  const cells = Array.isArray(headerRow['x:c']) ? headerRow['x:c'] : [headerRow['x:c']];
  console.log('\nHeaders:');
  cells.forEach((cell, i) => {
    const val = getCellValue(cell, sharedStrings);
    console.log(`  Col ${cell['@_r']}: "${val}"`);
  });
}

// Print first 5 data rows (starts from row 6)
console.log('\nFirst 5 data rows:');
let count = 0;
for (const row of rows) {
  const rowNum = parseInt(row['@_r']);
  if (rowNum < 6 || rowNum > 10) continue;
  
  const cells = Array.isArray(row['x:c']) ? row['x:c'] : (row['x:c'] ? [row['x:c']] : []);
  const values = cells.map(c => getCellValue(c, sharedStrings));
  console.log(`  Row ${rowNum}:`, values.join(' | '));
  count++;
}

// Count total data rows (after row 5)
const dataRowCount = rows.filter(r => parseInt(r['@_r']) > 5).length;
console.log(`\nTotal data rows in Suwon sheet: ${dataRowCount}`);

// Clean up
fs.rmSync(extractDir, { recursive: true });

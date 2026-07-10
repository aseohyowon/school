const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { XMLParser } = require('fast-xml-parser');

const filePath = 'C:\\Users\\gydnj\\AppData\\Local\\Temp\\opencode\\academy_raw.xlsx';
const extractDir = 'C:\\Users\\gydnj\\AppData\\Local\\Temp\\opencode\\xlsx_extract';

// Clean and extract
if (fs.existsSync(extractDir)) fs.rmSync(extractDir, { recursive: true });
fs.mkdirSync(extractDir, { recursive: true });

execSync(`powershell -Command "Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::ExtractToDirectory('${filePath}', '${extractDir}')"`, { stdio: 'pipe' });

// Read workbook.xml to see how sheets are stored
const wbPath = path.join(extractDir, 'xl', 'workbook.xml');
const wbXml = fs.readFileSync(wbPath, 'utf-8');

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text'
});

const wb = parser.parse(wbXml);
if (wb['x:workbook'] && wb['x:workbook']['x:sheets'] && wb['x:workbook']['x:sheets']['x:sheet']) {
  const sheets = Array.isArray(wb['x:workbook']['x:sheets']['x:sheet']) 
    ? wb['x:workbook']['x:sheets']['x:sheet'] 
    : [wb['x:workbook']['x:sheets']['x:sheet']];
  console.log('Sheets from workbook.xml:');
  sheets.forEach((s, i) => {
    console.log(`  ${i}: name="${s['@_name']}" r:id="${s['@_r:id']}" sheetId="${s['@_sheetId']}"`);
  });
}

// Read relationships to find actual sheet file names
const relsPath = path.join(extractDir, 'xl', 'worksheets', '_rels', 'sheet1.xml.rels');
if (fs.existsSync(relsPath)) {
  console.log('_rels exists');
}

// List worksheet files
const wsDir = path.join(extractDir, 'xl', 'worksheets');
if (fs.existsSync(wsDir)) {
  const files = fs.readdirSync(wsDir);
  console.log('\nWorksheet files:', files.filter(f => f.endsWith('.xml')));
}

// Read shared strings
const ssPath = path.join(extractDir, 'xl', 'sharedStrings.xml');
if (fs.existsSync(ssPath)) {
  const ssData = parser.parse(fs.readFileSync(ssPath, 'utf-8'));
  const siItems = ssData['x:sst']['x:si'];
  const ssList = (Array.isArray(siItems) ? siItems : [siItems]).map(item => {
    if (item['x:t']) return item['x:t'];
    if (item['x:r']) {
      const runs = Array.isArray(item['x:r']) ? item['x:r'] : [item['x:r']];
      return runs.map(r => r['x:t']).join('');
    }
    return '';
  });
  console.log('\nShared strings:', ssList.length);

  // Read sheet1.xml (likely corresponds to first sheet)
  const sheetPath = path.join(extractDir, 'xl', 'worksheets', 'sheet1.xml');
  if (fs.existsSync(sheetPath)) {
    const sheetData = parser.parse(fs.readFileSync(sheetPath, 'utf-8'));
    const rows = sheetData['x:worksheet']['x:sheetData']['x:row'];
    const rowList = Array.isArray(rows) ? rows : [rows];
    console.log('Sheet1 rows:', rowList.length);

    // Find header (row 5)
    const headerRow = rowList.find(r => parseInt(r['@_r']) === 5);
    if (headerRow) {
      const cells = Array.isArray(headerRow['x:c']) ? headerRow['x:c'] : [headerRow['x:c']];
      console.log('\nHeaders:');
      cells.forEach(cell => {
        const type = cell['@_t'];
        const val = cell['x:v'];
        let text = '';
        if (type === 's' && val !== undefined) text = ssList[parseInt(val)] || '';
        else if (type === 'str') text = val || '';
        else text = val !== undefined ? val : '';
        console.log(`  ${cell['@_r']}: "${text}"`);
      });
    }

    // Print first 5 data rows (rows 6-10)
    console.log('\nFirst 5 data rows:');
    for (const row of rowList) {
      const rn = parseInt(row['@_r']);
      if (rn < 6 || rn > 10) continue;
      const cells = Array.isArray(row['x:c']) ? row['x:c'] : (row['x:c'] ? [row['x:c']] : []);
      const values = cells.map(c => {
        const type = c['@_t'];
        const val = c['x:v'];
        if (type === 's' && val !== undefined) return ssList[parseInt(val)] || '';
        if (type === 'str') return val || '';
        return val !== undefined ? val : '';
      });
      console.log(`  Row ${rn}:`, values.join(' ||| '));
    }
  }
}

// Clean up
fs.rmSync(extractDir, { recursive: true });

const fs = require('fs');
const { execSync } = require('child_process');
const { XMLParser } = require('fast-xml-parser');

const xlsxPath = 'C:\\Users\\gydnj\\AppData\\Local\\Temp\\opencode\\academy_raw.xlsx';
const extractDir = 'C:\\Users\\gydnj\\AppData\\Local\\Temp\\opencode\\xlsx_diag';

if (fs.existsSync(extractDir)) fs.rmSync(extractDir, { recursive: true });
fs.mkdirSync(extractDir, { recursive: true });

const psCmd = `powershell -Command "Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::ExtractToDirectory('${xlsxPath}', '${extractDir}')"`;
execSync(psCmd, { stdio: 'pipe', shell: 'powershell' });

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_', textNodeName: '#text' });

function getSS() {
  const d = parser.parse(fs.readFileSync(extractDir + '/xl/sharedStrings.xml', 'utf-8'));
  const items = d['x:sst']['x:si'];
  const list = (Array.isArray(items) ? items : [items]).map(item => {
    if (item['x:t']) return item['x:t'];
    if (item['x:r']) return (Array.isArray(item['x:r']) ? item['x:r'] : [item['x:r']]).map(r => r['x:t']).join('');
    return '';
  });
  return list;
}

function getCV(cell, ss) {
  if (!cell) return '';
  const t = cell['@_t'] || '';
  const v = cell['x:v'];
  if (v === undefined && cell['x:is'] && cell['x:is']['x:t']) return String(cell['x:is']['x:t']);
  if (t === 's' && v !== undefined) return ss[parseInt(v)] || '';
  if (v !== undefined) return String(v);
  return '';
}

const ss = getSS();

const rows1 = parser.parse(fs.readFileSync(extractDir + '/xl/worksheets/sheet1.xml', 'utf-8'))['x:worksheet']['x:sheetData']['x:row'];
const rowList1 = Array.isArray(rows1) ? rows1 : [rows1];

let suwonAccts = {};
rowList1.forEach(row => {
  const rn = parseInt(row['@_r']);
  if (rn < 6) return;
  const cl = Array.isArray(row['x:c']) ? row['x:c'] : (row['x:c'] ? [row['x:c']] : []);
  const cells = {};
  cl.forEach(c => { const col = c['@_r'].match(/^[A-Z]+/); if (col) cells[col[0]] = getCV(c, ss); });
  const name = cells['B']; const addr = cells['E'];
  if (!name || !addr) return;
  if (!suwonAccts[name]) suwonAccts[name] = addr;
});

// Find addresses that contain '동' patterns
console.log('=== Addresses with suspicious dong patterns ===');
const badPatterns = ['(201동', '(601동', '3차,B동', '상가동'];
Object.entries(suwonAccts).forEach(([name, addr]) => {
  badPatterns.forEach(p => {
    if (addr.includes(p)) {
      const m = addr.match(/\(([^)]+)\)/g);
      console.log(`  ${name}: ${addr}`);
      console.log(`    parens: ${m ? m.join(' | ') : 'none'}`);
    }
  });
});

// Show first 5 addresses for 장안구
console.log('\n=== First 5 장안구 addresses ===');
let cnt = 0;
Object.entries(suwonAccts).forEach(([name, addr]) => {
  if (addr.includes('장안구') && cnt < 5) {
    console.log(`  ${name}: ${addr}`);
    cnt++;
  }
});

// Show the paren content for each
console.log('\n=== Analyzing all unique paren content ===');
const parenSet = {};
Object.values(suwonAccts).forEach(addr => {
  const parens = addr.match(/\([^)]+\)/g);
  if (parens) parens.forEach(p => { parenSet[p] = (parenSet[p] || 0) + 1; });
});
Object.entries(parenSet).sort((a,b) => b[1] - a[1]).slice(0,30).forEach(([p, c]) => {
  console.log(`  [${c}] ${p}`);
});

fs.rmSync(extractDir, { recursive: true });
console.log('\nDone');

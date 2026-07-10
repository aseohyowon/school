const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const filePath = 'C:\\Users\\gydnj\\AppData\\Local\\Temp\\opencode\\academy_raw.xlsx';

try {
  const workbook = XLSX.readFile(filePath, { 
    raw: true,
    cellDates: false,
    cellStyles: false,
    sheetStubs: true,
    codepage: 949
  });
  
  console.log('Sheet names:', workbook.SheetNames);
  console.log('Type:', workbook.type);
  console.log('Sheets keys:', Object.keys(workbook.Sheets));
  
  // Try accessing sheets via index
  for (let i = 0; i < workbook.SheetNames.length && i < 3; i++) {
    const name = workbook.SheetNames[i];
    const sheet = workbook.Sheets[name];
    console.log(`\n[${i}] "${name}":`, sheet ? 'FOUND' : 'NOT FOUND');
    if (sheet) {
      console.log('  Ref:', sheet['!ref']);
      console.log('  Merges:', sheet['!merges']);
      console.log('  Cell count:', Object.keys(sheet).filter(k => !k.startsWith('!')).length);
      
      // Try to extract first row data
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
      console.log('  Rows:', rows.length);
      for (let r = 0; r < Math.min(3, rows.length); r++) {
        console.log(`  [${r}]:`, JSON.stringify(rows[r]).slice(0, 500));
      }
    }
  }
} catch (err) {
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);
}

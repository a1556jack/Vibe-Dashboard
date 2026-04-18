import xlsx from 'xlsx';

try {
    const workbook = xlsx.readFile('../RAW DATA.xlsx');
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const json = xlsx.utils.sheet_to_json(sheet, { header: 1 }).slice(0, 3);
    console.log(JSON.stringify(json, null, 2));
} catch (e) {
    console.error("Error reading file:", e.message);
}

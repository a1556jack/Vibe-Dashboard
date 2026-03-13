
const Papa = require('papaparse');

const SPREADSHEET_ID = '110UQXJ-yN6bchhrKw4zEerYef44Qy5nNqiXLNVyZTEw';
const SHEET_0_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=0`;

async function checkSummary() {
    console.log(`Checking ${SHEET_0_URL}...`);
    try {
        const response = await fetch(SHEET_0_URL);
        const csvText = await response.text();
        
        const results = Papa.parse(csvText, { header: false });
        const rows = results.data;
        
        const headerRow = rows[0];
        console.log('Header Row:', headerRow);
        
        const months = [];
        for (let i = 4; i < headerRow.length; i += 2) {
            const raw = headerRow[i]?.trim();
            if (raw) months.push(raw);
        }
        console.log('Months in summary:', months);
    } catch (e) {
        console.error(`Error:`, e.message);
    }
}

checkSummary();

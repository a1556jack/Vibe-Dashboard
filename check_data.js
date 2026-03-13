
const Papa = require('papaparse');

const RAW_DATA_URLS = [
    'https://docs.google.com/spreadsheets/d/1YpvxHOROTX-HFoy3wO8BkofVtfzDHwVQYYOxN9_eWT4/export?format=csv&gid=445516446',
    'https://docs.google.com/spreadsheets/d/1YpvxHOROTX-HFoy3wO8BkofVtfzDHwVQYYOxN9_eWT4/export?format=csv&gid=0',
];

async function checkRegions() {
    for (const url of RAW_DATA_URLS) {
        console.log(`Checking ${url}...`);
        try {
            const response = await fetch(url);
            const csvText = await response.text();
            
            const results = Papa.parse(csvText, { header: false });
            const rows = results.data;
            
            const regions = new Set();
            const yearMonths = new Set();
            
            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                const dateStr = row[6]?.trim();
                // Check if it's a date in YYYY-MM-DD format or similar
                if (!dateStr || !dateStr.includes('-')) continue;
                
                const region = row[4]?.trim();
                if (region) regions.add(region);
                
                const match = dateStr.match(/^(\d{4})-(\d{2})/);
                if (match) {
                    yearMonths.add(`${match[1].slice(2)}.${match[2]}`);
                }
            }
            
            console.log(`Regions found:`, Array.from(regions));
            console.log(`YearMonths found:`, Array.from(yearMonths).sort());
        } catch (e) {
            console.error(`Error checking ${url}:`, e.message);
        }
    }
}

checkRegions();

import { fetchRawData } from './src/lib/sheet-data.ts'; fetchRawData().then(data => console.log('Parsed Raw Data Months:', Array.from(new Set(data.map(r => r.yearMonth))))).catch(console.error);  

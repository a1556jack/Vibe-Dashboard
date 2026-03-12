import Papa from 'papaparse';

// ============================================================
// Types
// ============================================================

export interface FinancialDetailRow {
    조치: number;
    현장: number;
    소액: number;
    합계: number;
    조치_pct: number;
    현장_pct: number;
    소액_pct: number;
    합계_pct: number;
}

export interface FinancialMonthData {
    month: string;
    용역수입: FinancialDetailRow;
    변동비: FinancialDetailRow;
    공헌이익: number;
    공헌이익_pct: number;
}

// Keep backward-compatible simple interface for chart
export interface FinancialData {
    month: string;
    revenue: number;
    variableCost: number;
    contributionMargin: number;
}

export interface BillingData {
    month: string;
    현장_정상시공비: number;
    현장_지급분: number;
    현장_청구분: number;
    소액_정상시공비: number;
    소액_지급분: number;
    소액_청구분: number;
    합계_정상시공비: number;
    합계_지급분: number;
    합계_청구분: number;
    심야시공합계_정상시공비: number;
    심야시공합계_지급분: number;
    심야시공합계_청구분: number;
}

export interface NightworkRatioData {
    month: string;
    totalAmount: number;
    nightworkAmount: number;
    nightworkRatio: number;
}

export interface EquipmentCostData {
    month: string;
    비계약지게차_퍼시스: number;
    비계약지게차_데스커: number;
    비계약지게차_합계: number;
    계약지게차: number;
    사다리차: number;
    장비전체합계: number;
    시공결과금액_퍼시스: number;
    시공결과금액_데스커: number;
    시공결과금액_전체: number;
    장비비율_퍼시스: number;
    장비비율_데스커: number;
    장비비율_전체: number;
}

export interface NightworkCapData {
    month: string;
    지급상한공제시공비: number;
    주중심야: number;
    주말심야: number;
    심야추가시공비합계: number;
    지급상한시공비율: number;
}

export interface TravelSupportData {
    month: string;
    현장_정상시공: number;
    현장_기타지원: number;
    현장_기타지원비율: number;
    소액_정상시공: number;
    소액_출장비: number;
    소액_기타지원: number;
    소액_출장비비율: number;
    소액_기타지원비율: number;
}

export interface RawDataRow {
    // Basic
    서비스센터: string;
    권역시공팀: string;
    시공팀: string;
    시공일: string;
    대리점: string;
    건명: string;
    주소: string;
    시공예정금액: number;
    시공결과금액: number;
    시공외지급: number;
    정상시공: number;
    // A. Billable
    분해설치_청: number;
    공수비_청: number;
    추가분해설치: number;
    공수비: number;
    인건비: number;
    대기비: number;
    제품반입비: number;
    추가제품반입비: number;
    // B. Support
    장비용차: number;
    장비용차_지: number;
    출장비_지: number;
    파레트회수비: number;
    숙식비_지: number;
    추가숙박비: number;
    AS지원_불요: number;
    AS: number;
    주중야간: number;
    주중심야: number;
    주말야간: number;
    주말심야: number;
    기타지원: number;
    // C. Deductions
    시공하자공제: number;
    기타공제: number;
    // D. Split
    공동시공분할: number;
    // Helper
    yearMonth: string; // "25.01"
}

// ============================================================
// Config
// ============================================================

const SPREADSHEET_ID = '110UQXJ-yN6bchhrKw4zEerYef44Qy5nNqiXLNVyZTEw';

function sheetUrl(sheetName: string): string {
    const encoded = encodeURIComponent(sheetName);
    return `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encoded}`;
}

// Original export URL for the first sheet (gid=0)
// ============================================================
// Generic CSV Fetcher
// ============================================================

// 15-second timeout for fetch to handle many concurrent sheets
async function fetchWithTimeout(url: string, options: any = {}, timeout = 15000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
        });
        clearTimeout(id);
        return response;
    } catch (error) {
        clearTimeout(id);
        throw error;
    }
}

async function fetchCSV(url: string): Promise<string[][]> {
    try {
        console.log(`[sheet-data] Fetching: ${url.substring(0, 100)}...`);
        const response = await fetchWithTimeout(url, {
            next: { revalidate: 300 },
            cache: 'no-store' // Bypass cache for debugging
        });

        if (!response.ok) {
            console.error('[sheet-data] Fetch failed:', response.status, url);
            return [];
        }

        const csvText = await response.text();
        if (!csvText || csvText.length < 10) {
            console.error('[sheet-data] Empty response text');
            return [];
        }

        return new Promise((resolve, reject) => {
            Papa.parse(csvText, {
                header: false,
                skipEmptyLines: true,
                complete: (results) => {
                    resolve(results.data as string[][]);
                },
                error: (error: Error) => {
                    console.error('[sheet-data] Parse error:', error);
                    reject(error);
                },
            });
        });
    } catch (error) {
        console.error('[sheet-data] Fetch error:', error);
        return [];
    }
}

const SHEET_0_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=0`;

const RAW_DATA_URLS = [
    // 25년 통합 (GID: 445516446)
    'https://docs.google.com/spreadsheets/d/1YpvxHOROTX-HFoy3wO8BkofVtfzDHwVQYYOxN9_eWT4/export?format=csv&gid=445516446',

    // 26년 통합 (GID: 0)
    'https://docs.google.com/spreadsheets/d/1YpvxHOROTX-HFoy3wO8BkofVtfzDHwVQYYOxN9_eWT4/export?format=csv&gid=0',
];

function parseNum(val: string | undefined): number {
    if (!val) return 0;
    return parseFloat(val.replace(/,/g, '').replace(/"/g, '').replace(/%/g, ''));
}

function parsePercent(val: string | undefined): number {
    if (!val) return 0;
    const str = val.replace(/,/g, '').replace(/"/g, '').replace(/%/g, '').trim();
    return parseFloat(str) || 0;
}

function formatMonth(raw: string): string {
    const match = raw.match(/(\d+)년\s*(\d+)월/);
    if (match) {
        const year = match[1].length === 4 ? match[1].slice(2) : match[1];
        const month = match[2].padStart(2, '0');
        return `${year}.${month}`;
    }
    return raw;
}

// ============================================================
// 1. 경인 퍼시스 채산_종합 (Detailed)
// ============================================================

export async function fetchFinancialDetailData(): Promise<{ months: FinancialMonthData[], average: FinancialMonthData | null }> {
    try {
        const rows = await fetchCSV(SHEET_0_URL);
        if (rows.length < 5) return { months: [], average: null };

        // CSV structure:
        // Row 0: Headers ['','','25년 평균','','25년 1월','','25년 2월','',...] (pairs: value, %)
        // Row 1: 용역수입, 조치, val, pct, val, pct, ...
        // Row 2: '', 현장, val, pct, ...
        // Row 3: '', 소액, val, pct, ...
        // Row 4: '', 합계, val, pct, ...
        // Row 5: 변동비, 조치, val, pct, ...
        // Row 6: '', 현장, ...
        // Row 7: '', 소액, ...
        // Row 8: '', 합계, ...
        // Row 9: 공헌이익, '', val, pct, ...

        const headerRow = rows[0];
        // Find row indices
        let rev조치 = -1, rev현장 = -1, rev소액 = -1, rev합계 = -1;
        let cost조치 = -1, cost현장 = -1, cost소액 = -1, cost합계 = -1;
        let marginIdx = -1;
        let currentBlock = '';

        for (let i = 0; i < rows.length; i++) {
            const col0 = rows[i][0]?.trim();
            const col1 = rows[i][1]?.trim();
            if (col0 === '용역수입') { currentBlock = '용역수입'; rev조치 = i; }
            if (col0 === '변동비') { currentBlock = '변동비'; cost조치 = i; }
            if (col0 === '공헌이익') { marginIdx = i; }

            if (currentBlock === '용역수입') {
                if (col1 === '현장') rev현장 = i;
                if (col1 === '소액') rev소액 = i;
                if (col1 === '합계') rev합계 = i;
            }
            if (currentBlock === '변동비') {
                if (col1 === '현장') cost현장 = i;
                if (col1 === '소액') cost소액 = i;
                if (col1 === '합계') cost합계 = i;
            }
        }

        function extractDetailRow(rowIndices: { 조치: number, 현장: number, 소액: number, 합계: number }, colIdx: number): FinancialDetailRow {
            return {
                조치: parseNum(rows[rowIndices.조치]?.[colIdx]) * 1000000,
                현장: parseNum(rows[rowIndices.현장]?.[colIdx]) * 1000000,
                소액: parseNum(rows[rowIndices.소액]?.[colIdx]) * 1000000,
                합계: parseNum(rows[rowIndices.합계]?.[colIdx]) * 1000000,
                조치_pct: parsePercent(rows[rowIndices.조치]?.[colIdx + 1]),
                현장_pct: parsePercent(rows[rowIndices.현장]?.[colIdx + 1]),
                소액_pct: parsePercent(rows[rowIndices.소액]?.[colIdx + 1]),
                합계_pct: parsePercent(rows[rowIndices.합계]?.[colIdx + 1]),
            };
        }

        const revIndices = { 조치: rev조치, 현장: rev현장, 소액: rev소액, 합계: rev합계 };
        const costIndices = { 조치: cost조치, 현장: cost현장, 소액: cost소액, 합계: cost합계 };

        // Extract average (column index 2)
        const average: FinancialMonthData = {
            month: '25년 평균',
            용역수입: extractDetailRow(revIndices, 2),
            변동비: extractDetailRow(costIndices, 2),
            공헌이익: parseNum(rows[marginIdx]?.[2]) * 1000000,
            공헌이익_pct: parsePercent(rows[marginIdx]?.[3]),
        };

        // Extract monthly data (columns 4, 6, 8, ... in pairs)
        const months: FinancialMonthData[] = [];
        for (let i = 4; i < headerRow.length; i += 2) {
            const monthRaw = headerRow[i]?.trim();
            if (!monthRaw) continue;

            const revData = extractDetailRow(revIndices, i);
            // Relax condition: intentionally do not drop the month if 합계 is 0,
            // because the user might just be adding headers and not yet populated the actual data.
            // if (isNaN(revData.합계) || revData.합계 === 0) continue;

            months.push({
                month: formatMonth(monthRaw),
                용역수입: revData,
                변동비: extractDetailRow(costIndices, i),
                공헌이익: parseNum(rows[marginIdx]?.[i]) * 1000000,
                공헌이익_pct: parsePercent(rows[marginIdx]?.[i + 1]),
            });
        }

        return { months, average };
    } catch (error) {
        console.error('[sheet-data] fetchFinancialDetailData error:', error);
        return { months: [], average: null };
    }
}

// Backward-compatible simple fetcher (used by chart)
export function toSimpleFinancialData(detail: FinancialMonthData): FinancialData {
    return {
        month: detail.month,
        revenue: detail.용역수입.합계,
        variableCost: detail.변동비.합계,
        contributionMargin: detail.공헌이익,
    };
}

// ============================================================
// 2. 경인 청구
// ============================================================

export async function fetchBillingData(): Promise<BillingData[]> {
    try {
        const rows = await fetchCSV(sheetUrl('경인 청구'));
        if (rows.length < 5) return [];

        // Row structure:
        // Row 0: headers ["","","","","25년 1월 정상시공비","지급분","청구분",...]
        // Rows: 경인_현장 (주중주간, 주말주간, 주중/주말 야간, 주중/주말 심야)
        // Rows: 경인_소액 (same pattern)
        // Row 합계
        // Row 심야시공합계

        const headerRow = rows[0];
        const months: string[] = [];

        // Extract months from header: every 3rd column starting at col 4
        for (let i = 4; i < headerRow.length; i += 3) {
            const raw = headerRow[i]?.trim() || '';
            if (raw) months.push(formatMonth(raw));
        }

        // Find key rows
        let sumRow: string[] | null = null;
        let nightSumRow: string[] | null = null;

        for (let i = 0; i < rows.length; i++) {
            const col0 = rows[i][0]?.trim();
            if (col0 === '합계') sumRow = rows[i];
            if (col0 === '심야시공합계') nightSumRow = rows[i];
        }

        if (!sumRow) return [];

        const result: BillingData[] = [];
        for (let m = 0; m < months.length; m++) {
            const baseCol = 4 + m * 3;
            result.push({
                month: months[m],
                현장_정상시공비: 0, 현장_지급분: 0, 현장_청구분: 0,
                소액_정상시공비: 0, 소액_지급분: 0, 소액_청구분: 0,
                합계_정상시공비: parseNum(sumRow[baseCol]),
                합계_지급분: parseNum(sumRow[baseCol + 1]),
                합계_청구분: parseNum(sumRow[baseCol + 2]),
                심야시공합계_정상시공비: nightSumRow ? parseNum(nightSumRow[baseCol]) : 0,
                심야시공합계_지급분: nightSumRow ? parseNum(nightSumRow[baseCol + 1]) : 0,
                심야시공합계_청구분: nightSumRow ? parseNum(nightSumRow[baseCol + 2]) : 0,
            });
        }
        return result;
    } catch (error) {
        console.error('[sheet-data] fetchBillingData error:', error);
        return [];
    }
}

// ============================================================
// 3. 경인 퍼시스 심야 시공 비율
// ============================================================

export async function fetchNightworkRatioData(): Promise<NightworkRatioData[]> {
    try {
        const rows = await fetchCSV(sheetUrl('경인 퍼시스 심야 시공 비율'));
        if (rows.length < 4) return [];

        // Row 0: headers ["","","","2025년 1월",...]
        // Row 1: 전체_시공결과금액
        // Row 2: 심야시공_시공결과금액
        // Row 3: 심야시공_금액비율(%)

        const headerRow = rows[0];
        const totalRow = rows[1];
        const nightRow = rows[2];
        const ratioRow = rows[3];

        const result: NightworkRatioData[] = [];
        for (let i = 3; i < headerRow.length; i++) {
            const monthRaw = headerRow[i]?.trim();
            if (!monthRaw) continue;
            result.push({
                month: formatMonth(monthRaw),
                totalAmount: parseNum(totalRow[i]),
                nightworkAmount: parseNum(nightRow[i]),
                nightworkRatio: parsePercent(ratioRow[i]),
            });
        }
        return result;
    } catch (error) {
        console.error('[sheet-data] fetchNightworkRatioData error:', error);
        return [];
    }
}

// ============================================================
// 4. 경인 퍼시스 장비 비용
// ============================================================

export async function fetchEquipmentCostData(): Promise<{ months: EquipmentCostData[], average: EquipmentCostData | null }> {
    try {
        const rows = await fetchCSV(sheetUrl('경인 퍼시스 장비 비용'));
        if (rows.length < 2) return { months: [], average: null };

        // Row 0: headers
        // Row 1+: monthly data rows starting with "25년 1월" etc.
        const months: EquipmentCostData[] = [];
        let average: EquipmentCostData | null = null;

        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            const rawMonth = row[0]?.trim();
            if (!rawMonth) continue;

            const data: EquipmentCostData = {
                month: formatMonth(rawMonth),
                비계약지게차_퍼시스: parseNum(row[1]),
                비계약지게차_데스커: parseNum(row[2]),
                비계약지게차_합계: parseNum(row[3]),
                계약지게차: parseNum(row[4]),
                사다리차: parseNum(row[5]),
                장비전체합계: parseNum(row[6]),
                시공결과금액_퍼시스: parseNum(row[7]),
                시공결과금액_데스커: parseNum(row[8]),
                시공결과금액_전체: parseNum(row[9]),
                장비비율_퍼시스: parsePercent(row[10]),
                장비비율_데스커: parsePercent(row[11]),
                장비비율_전체: parsePercent(row[12]),
            };

            if (rawMonth.includes('평균')) {
                average = { ...data, month: '25년 평균' };
            } else {
                months.push(data);
            }
        }
        return { months, average };
    } catch (error) {
        console.error('[sheet-data] fetchEquipmentCostData error:', error);
        return { months: [], average: null };
    }
}

// ============================================================
// 5. 경인 심야시공 지급 상한
// ============================================================

export async function fetchNightworkCapData(): Promise<NightworkCapData[]> {
    try {
        const rows = await fetchCSV(sheetUrl('경인 심야시공 지급 상한'));
        if (rows.length < 2) return [];

        // Row 0: headers ["구분","2025년 1월",...]
        // Row 1: 지급 상한 공제 시공비
        // Row 2: 주중 심야
        // Row 3: 주말 심야
        // Row 4: 심야 추가 시공비 합계
        // Row 5: 지급상한 시공비율

        const headerRow = rows[0];
        const deductionRow = rows[1];
        const weekdayNightRow = rows[2];
        const weekendNightRow = rows[3];
        const totalRow = rows[4];
        const ratioRow = rows[5];

        const result: NightworkCapData[] = [];
        for (let i = 1; i < headerRow.length; i++) {
            const monthRaw = headerRow[i]?.trim();
            if (!monthRaw) continue;
            result.push({
                month: formatMonth(monthRaw),
                지급상한공제시공비: parseNum(deductionRow[i]),
                주중심야: parseNum(weekdayNightRow[i]),
                주말심야: parseNum(weekendNightRow[i]),
                심야추가시공비합계: parseNum(totalRow[i]),
                지급상한시공비율: parsePercent(ratioRow[i]),
            });
        }
        return result;
    } catch (error) {
        console.error('[sheet-data] fetchNightworkCapData error:', error);
        return [];
    }
}

// ============================================================
// 6. 경인 출장비/기타지원
// ============================================================

export async function fetchTravelSupportData(): Promise<TravelSupportData[]> {
    try {
        const rows = await fetchCSV(sheetUrl('경인 출장비/기타지원'));
        if (rows.length < 2) return [];

        // Row 0: headers ["구분","","2025년 1월",...]
        // Row 1: 경인_현장, 정상시공
        // Row 2: "", 기타지원
        // Row 3: "", 기타지원 비율
        // Row 4: 경인_소액, 정상시공
        // Row 5: "", 출장비(지)
        // Row 6: "", 기타지원
        // Row 7: "", 출장비 비율
        // Row 8: "", 기타지원 비율

        const headerRow = rows[0];
        const 현장_정상 = rows[1];
        const 현장_기타 = rows[2];
        const 현장_기타비율 = rows[3];
        const 소액_정상 = rows[4];
        const 소액_출장 = rows[5];
        const 소액_기타 = rows[6];
        const 소액_출장비율 = rows[7];
        const 소액_기타비율 = rows[8];

        const result: TravelSupportData[] = [];
        for (let i = 2; i < headerRow.length; i++) {
            const monthRaw = headerRow[i]?.trim();
            if (!monthRaw) continue;
            result.push({
                month: formatMonth(monthRaw),
                현장_정상시공: parseNum(현장_정상[i]),
                현장_기타지원: parseNum(현장_기타[i]),
                현장_기타지원비율: parsePercent(현장_기타비율[i]),
                소액_정상시공: parseNum(소액_정상[i]),
                소액_출장비: parseNum(소액_출장[i]),
                소액_기타지원: parseNum(소액_기타[i]),
                소액_출장비비율: parsePercent(소액_출장비율[i]),
                소액_기타지원비율: parsePercent(소액_기타비율[i]),
            });
        }
        return result;
    } catch (error) {
        console.error('[sheet-data] fetchTravelSupportData error:', error);
        return [];
    }
}

// ============================================================
// 7. RAW DATA
// ============================================================

export async function fetchRawData(): Promise<RawDataRow[]> {
    try {
        // Fetch in smaller batches to avoid overwhelming the connection / timeout
        const results: string[][] = [];
        const batchSize = 4;
        for (let i = 0; i < RAW_DATA_URLS.length; i += batchSize) {
            const batchUrls = RAW_DATA_URLS.slice(i, i + batchSize);
            const batchResults = await Promise.all(batchUrls.map(url => fetchCSV(url)));
            batchResults.forEach(res => results.push(...res));
        }

        const allRows = results.flat();
        if (allRows.length < 3) return [];

        const result: RawDataRow[] = [];
        for (let i = 0; i < allRows.length; i++) {
            const row = allRows[i];
            // Skip header rows by checking if date column looks like a date
            const dateStr = row[6]?.trim();
            if (!dateStr || !dateStr.includes('-')) continue; // Skip invalid rows or subtotals

            // Extract YYYY-MM
            const match = dateStr.match(/^(\d{4})-(\d{2})/);
            let yearMonth = '';
            if (match) {
                yearMonth = `${match[1].slice(2)}.${match[2]}`; // "2025-01" -> "25.01", "2026-01" -> "26.01"
            }

            result.push({
                서비스센터: row[0]?.trim(),
                권역시공팀: row[4]?.trim(),
                시공팀: row[5]?.trim(),
                시공일: dateStr,
                대리점: row[7]?.trim(),
                건명: row[8]?.trim(),
                주소: row[9]?.trim(),
                시공예정금액: parseNum(row[10]),
                시공결과금액: parseNum(row[11]),
                시공외지급: parseNum(row[14]),
                정상시공: parseNum(row[15]),

                분해설치_청: parseNum(row[17]),
                공수비_청: parseNum(row[21]),
                추가분해설치: parseNum(row[22]),
                공수비: parseNum(row[23]),
                인건비: parseNum(row[24]),
                대기비: parseNum(row[25]),
                제품반입비: parseNum(row[28]),
                추가제품반입비: parseNum(row[29]),

                장비용차: parseNum(row[34]),
                장비용차_지: parseNum(row[33]),
                출장비_지: parseNum(row[38]),
                파레트회수비: parseNum(row[39]),
                숙식비_지: parseNum(row[31]),
                추가숙박비: parseNum(row[32]),
                AS지원_불요: parseNum(row[35]),
                AS: parseNum(row[36]),
                주중야간: parseNum(row[43]),
                주중심야: parseNum(row[44]),
                주말야간: parseNum(row[46]),
                주말심야: parseNum(row[47]),
                기타지원: parseNum(row[51]),

                시공하자공제: parseNum(row[55]),
                기타공제: parseNum(row[58]),
                공동시공분할: parseNum(row[60]),

                yearMonth
            });
        }
        return result;
    } catch (error) {
        console.error('[sheet-data] fetchRawData error:', error);
        return [];
    }
}


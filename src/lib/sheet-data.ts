import Papa from 'papaparse';
import { supabase } from './supabase';

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
    // Expanded sub-categories
    hyunjangTotal?: number;
    hyunjangNight?: number;
    hyunjangRatio?: number;
    soaekTotal?: number;
    soaekNight?: number;
    soaekRatio?: number;
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

export interface TeamBreakdown {
    region: string;
    team: string;
    resultAmount: number;
    normalCost: number;
    extraCost: number;
    workDays: number;
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

// 60-second timeout for fetch to handle many concurrent sheets or slow Google response
async function fetchWithTimeout(url: string, options: any = {}, timeout = 60000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
        });
        clearTimeout(id);
        return response;
    } catch (error: any) {
        clearTimeout(id);
        if (error.name === 'AbortError') {
            console.error(`[sheet-data] Fetch timed out for URL: ${url.substring(0, 100)}...`);
        }
        throw error;
    }
}

async function fetchCSV(url: string): Promise<string[][]> {
    try {
        console.log(`[sheet-data] Fetching: ${url.substring(0, 100)}...`);
        const response = await fetchWithTimeout(url, {
            cache: 'no-store', // Bypass cache to ensure we get fresh data on deployment
        });

        if (!response.ok) {
            console.error('[sheet-data] Fetch failed:', response.status, url);
            return [];
        }

        const csvText = await response.text();
        if (!csvText || csvText.length < 10) {
            console.error(`[sheet-data] Empty response text from: ${url.substring(0, 100)}`);
            return [];
        }

        const parsed = await new Promise<string[][]>((resolve, reject) => {
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
        console.log(`[sheet-data] Fetched ${parsed.length} rows from: ${url.substring(0, 100)}`);
        return parsed;
    } catch (error) {
        console.error(`[sheet-data] Fetch error for ${url}:`, error);
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
    const str = val.replace(/,/g, '').replace(/"/g, '').replace(/%/g, '').trim();
    if (!str) return 0;
    const n = parseFloat(str);
    return isNaN(n) ? 0 : n;
}

function parsePercent(val: string | undefined): number {
    if (!val) return 0;
    const str = val.replace(/,/g, '').replace(/"/g, '').replace(/%/g, '').trim();
    return parseFloat(str) || 0;
}

export function formatMonth(raw: string): string {
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
        const { data, error } = await supabase.from('financial_details').select('*');
        if (error) throw error;
        if (!data || data.length === 0) return { months: [], average: null };

        const months: FinancialMonthData[] = [];
        let average: FinancialMonthData | null = null;

        for (const row of data) {
            const mapped: FinancialMonthData = {
                month: row.month,
                용역수입: {
                    조치: row.rev_action, 현장: row.rev_hyunjang, 소액: row.rev_soaek, 합계: row.rev_total,
                    조치_pct: row.rev_action_pct, 현장_pct: row.rev_hyunjang_pct, 소액_pct: row.rev_soaek_pct, 합계_pct: row.rev_total_pct,
                },
                변동비: {
                    조치: row.cost_action, 현장: row.cost_hyunjang, 소액: row.cost_soaek, 합계: row.cost_total,
                    조치_pct: row.cost_action_pct, 현장_pct: row.cost_hyunjang_pct, 소액_pct: row.cost_soaek_pct, 합계_pct: row.cost_total_pct,
                },
                공헌이익: row.margin,
                공헌이익_pct: row.margin_pct,
            };

            if (row.month === '25년 평균') {
                average = mapped;
            } else {
                months.push(mapped);
            }
        }
        
        // Sort months string alphabetically
        months.sort((a,b) => a.month.localeCompare(b.month));

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

        const headerRow = rows[0];
        
        // Find row indices by label (searching ANY column for robustness)
        const findRowIdx = (label: string) => rows.findIndex(r => r.some(c => c?.trim() === label));
        
        const idxTotal = findRowIdx('경인_통합');
        const idxHyunjang = findRowIdx('경인_현장');
        const idxSoaek = findRowIdx('경인_소액');
        
        const getGroupRows = (startIdx: number) => {
            if (startIdx === -1) return null;
            return {
                total: rows[startIdx],
                night: rows[startIdx + 1],
                ratio: rows[startIdx + 2]
            };
        };

        const totalRows = getGroupRows(idxTotal);
        const hyunjangRows = getGroupRows(idxHyunjang);
        const soaekRows = getGroupRows(idxSoaek);

        const result: NightworkRatioData[] = [];
        
        for (let i = 3; i < headerRow.length; i++) {
            const monthRaw = headerRow[i]?.trim();
            if (!monthRaw || monthRaw.length < 3) continue; 
            
            const month = formatMonth(monthRaw);

            result.push({
                month,
                totalAmount: totalRows ? parseNum(totalRows.total[i]) : 0,
                nightworkAmount: totalRows ? parseNum(totalRows.night[i]) : 0,
                nightworkRatio: totalRows ? parsePercent(totalRows.ratio[i]) : 0,
                hyunjangTotal: hyunjangRows ? parseNum(hyunjangRows.total[i]) : 0,
                hyunjangNight: hyunjangRows ? parseNum(hyunjangRows.night[i]) : 0,
                hyunjangRatio: hyunjangRows ? parsePercent(hyunjangRows.ratio[i]) : 0,
                soaekTotal: soaekRows ? parseNum(soaekRows.total[i]) : 0,
                soaekNight: soaekRows ? parseNum(soaekRows.night[i]) : 0,
                soaekRatio: soaekRows ? parsePercent(soaekRows.ratio[i]) : 0,
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

export async function fetchRawData(targetMonths?: string[]): Promise<RawDataRow[]> {
    try {
        let query = supabase.from('raw_data').select('*');
        
        if (targetMonths && targetMonths.length > 0) {
            const formattedMonths = targetMonths.map(m => formatMonth(m));
            query = query.in('year_month', formattedMonths);
        }

        const { data, error } = await query;
        if (error) throw error;
        if (!data) return [];

        return data.map((row: any) => ({
            서비스센터: row.service_center,
            권역시공팀: row.region_team,
            시공팀: row.team,
            시공일: row.work_date,
            대리점: row.agency,
            건명: row.project_name,
            주소: row.address,
            시공예정금액: row.expected_cost,
            시공결과금액: row.result_cost,
            시공외지급: row.extra_pay,
            정상시공: row.normal_pay,

            분해설치_청: row.disassembly_req,
            공수비_청: row.labor_req,
            추가분해설치: row.extra_disassembly,
            공수비: row.labor_cost,
            인건비: row.manpower_cost,
            대기비: row.waiting_cost,
            제품반입비: row.carry_in_cost,
            추가제품반입비: row.extra_carry_in,

            장비용차: row.equipment_rent,
            장비용차_지: row.equipment_rent_pay,
            출장비_지: row.travel_pay,
            파레트회수비: row.pallet_return,
            숙식비_지: row.lodging_pay,
            추가숙박비: row.extra_lodging,
            AS지원_불요: row.as_support_unnecessary,
            AS: row.as_support,
            주중야간: row.weekday_night,
            주중심야: row.weekday_midnight,
            주말야간: row.weekend_night,
            주말심야: row.weekend_midnight,
            기타지원: row.etc_support,

            시공하자공제: row.defect_deduction,
            기타공제: row.etc_deduction,
            공동시공분할: row.joint_split,
            yearMonth: row.year_month
        }));
    } catch (error) {
        console.error('[sheet-data] fetchRawData error:', error);
        return [];
    }
}

export async function fetchAggregatedTeamData(targetMonths?: string[]): Promise<Record<string, TeamBreakdown[]>> {
    const rawData = await fetchRawData(targetMonths);
    const result: Record<string, TeamBreakdown[]> = {};
    
    // Group raw data by month first for efficiency
    const rowsByMonth: Record<string, RawDataRow[]> = {};
    for (const row of rawData) {
        if (!rowsByMonth[row.yearMonth]) rowsByMonth[row.yearMonth] = [];
        rowsByMonth[row.yearMonth].push(row);
    }

    const monthsToProcess = targetMonths && targetMonths.length > 0 
        ? targetMonths 
        : Object.keys(rowsByMonth).sort();

    for (const month of monthsToProcess) {
        const monthRows = rowsByMonth[month] || [];
        const map = new Map<string, { region: string; team: string; resultAmt: number; normal: number; extra: number; dates: Set<string> }>();

        monthRows.forEach(row => {
            const teamKey = `${row.권역시공팀}|${row.시공팀}`;
            if (!map.has(teamKey)) {
                map.set(teamKey, { region: row.권역시공팀, team: row.시공팀, resultAmt: 0, normal: 0, extra: 0, dates: new Set() });
            }
            const data = map.get(teamKey)!;
            data.resultAmt += (row.시공결과금액 || 0);
            data.normal += row.정상시공;
            data.extra += (row.시공외지급 || 0);
            data.dates.add(row.시공일);
        });

        const monthBreakdown: TeamBreakdown[] = Array.from(map.values()).map(d => ({
            region: d.region,
            team: d.team,
            resultAmount: d.resultAmt,
            normalCost: d.normal,
            extraCost: d.extra,
            workDays: d.dates.size
        }));

        // Sort by region, then by total cost
        monthBreakdown.sort((a, b) => {
            if (a.region !== b.region) return a.region.localeCompare(b.region);
            return (b.normalCost + b.extraCost) - (a.normalCost + a.extraCost);
        });

        result[month] = monthBreakdown;
    }
    
    return result;
}

export async function fetchRawDataSummary(targetMonths: string[]): Promise<any> {
    const rawData = await fetchRawData(targetMonths);
    if (rawData.length === 0) return { message: "No raw data available for these months." };

    // Group by Service Center and Team for a high-level summary
    const summary: any = {
        total_rows: rawData.length,
        by_service_center: {} as Record<string, any>,
        recent_projects: rawData.slice(-10).map(r => ({
            date: r.시공일,
            team: r.시공팀,
            customer: r.대리점,
            project: r.건명,
            amount: r.시공결과금액
        }))
    };

    rawData.forEach(row => {
        if (!summary.by_service_center[row.서비스센터]) {
            summary.by_service_center[row.서비스센터] = { count: 0, total_amount: 0 };
        }
        summary.by_service_center[row.서비스센터].count++;
        summary.by_service_center[row.서비스센터].total_amount += row.시공결과금액;
    });

    return summary;
}

import fs from 'fs';

let content = fs.readFileSync('src/lib/sheet-data.ts', 'utf-8');

// 1. Add Supabase import
if (!content.includes("import { supabase }")) {
    content = content.replace("import Papa from 'papaparse';", "import Papa from 'papaparse';\nimport { supabase } from './supabase';");
}

// 2. Replace fetchFinancialDetailData
const newFinancialDataCode = `export async function fetchFinancialDetailData(): Promise<{ months: FinancialMonthData[], average: FinancialMonthData | null }> {
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

// Backward-compatible simple fetcher`;

// Using split/join to replace precisely
const parts1 = content.split('export async function fetchFinancialDetailData(): Promise<{ months: FinancialMonthData[], average: FinancialMonthData | null }> {');
const remainingParts1 = parts1[1].split('// Backward-compatible simple fetcher');
content = parts1[0] + newFinancialDataCode + remainingParts1.slice(1).join('// Backward-compatible simple fetcher');


// 3. Replace fetchRawData
const newRawDataCode = `export async function fetchRawData(targetMonths?: string[]): Promise<RawDataRow[]> {
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

export async function fetchAggregatedTeamData`;

const parts2 = content.split('export async function fetchRawData(targetMonths?: string[]): Promise<RawDataRow[]> {');
const remainingParts2 = parts2[1].split('export async function fetchAggregatedTeamData');
content = parts2[0] + newRawDataCode + remainingParts2.slice(1).join('export async function fetchAggregatedTeamData');


fs.writeFileSync('src/lib/sheet-data.ts', content);
console.log('Successfully refactored src/lib/sheet-data.ts');

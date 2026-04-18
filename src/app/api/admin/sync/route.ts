import { NextResponse } from 'next/server';
import { fetchFinancialDetailData, fetchRawData } from '@/lib/google-sheets-fetcher';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        console.log('[sync] Starting Sync for Financial Details & Raw Data from Google Sheets to Supabase...');
        
        // 1. Sync Financial Details
        console.log('[sync] Fetching Financial Data...');
        const financialData = await fetchFinancialDetailData();
        const { months, average } = financialData;
        const allFinancials = [...months];
        if (average) allFinancials.push(average);

        const financialPayload = allFinancials.map(entry => ({
            month: entry.month,
            rev_action: entry.용역수입.조치,
            rev_hyunjang: entry.용역수입.현장,
            rev_soaek: entry.용역수입.소액,
            rev_total: entry.용역수입.합계,
            rev_action_pct: entry.용역수입.조치_pct,
            rev_hyunjang_pct: entry.용역수입.현장_pct,
            rev_soaek_pct: entry.용역수입.소액_pct,
            rev_total_pct: entry.용역수입.합계_pct,

            cost_action: entry.변동비.조치,
            cost_hyunjang: entry.변동비.현장,
            cost_soaek: entry.변동비.소액,
            cost_total: entry.변동비.합계,
            cost_action_pct: entry.변동비.조치_pct,
            cost_hyunjang_pct: entry.변동비.현장_pct,
            cost_soaek_pct: entry.변동비.소액_pct,
            cost_total_pct: entry.변동비.합계_pct,

            margin: entry.공헌이익,
            margin_pct: entry.공헌이익_pct,
        }));

        if (financialPayload.length > 0) {
            console.log(`[sync] Upserting ${financialPayload.length} rows to financial_details...`);
            const { error: finError } = await supabase.from('financial_details').upsert(financialPayload);
            if (finError) throw new Error(`financial_details upsert error: ${finError.message}`);
        }

        // 2. Sync Raw Data
        console.log('[sync] Fetching Raw Data...');
        const rawDataRows = await fetchRawData(); 

        const rawPayload = rawDataRows.map(row => ({
            service_center: row.서비스센터,
            region_team: row.권역시공팀,
            team: row.시공팀,
            work_date: row.시공일,
            agency: row.대리점,
            project_name: row.건명,
            address: row.주소,
            expected_cost: row.시공예정금액,
            result_cost: row.시공결과금액,
            extra_pay: row.시공외지급,
            normal_pay: row.정상시공,

            disassembly_req: row.분해설치_청,
            labor_req: row.공수비_청,
            extra_disassembly: row.추가분해설치,
            labor_cost: row.공수비,
            manpower_cost: row.인건비,
            waiting_cost: row.대기비,
            carry_in_cost: row.제품반입비,
            extra_carry_in: row.추가제품반입비,

            equipment_rent: row.장비용차,
            equipment_rent_pay: row.장비용차_지,
            travel_pay: row.출장비_지,
            pallet_return: row.파레트회수비,
            lodging_pay: row.숙식비_지,
            extra_lodging: row.추가숙박비,
            as_support_unnecessary: row.AS지원_불요,
            as_support: row.AS,
            weekday_night: row.주중야간,
            weekday_midnight: row.주중심야,
            weekend_night: row.주말야간,
            weekend_midnight: row.주말심야,
            etc_support: row.기타지원,

            defect_deduction: row.시공하자공제,
            etc_deduction: row.기타공제,
            
            joint_split: row.공동시공분할,
            year_month: row.yearMonth
        }));

        console.log(`[sync] Deleting existing raw_data to prevent duplication...`);
        const { error: delError } = await supabase.from('raw_data').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (delError) throw new Error(`raw_data delete error: ${delError.message}`);

        console.log(`[sync] Inserting ${rawPayload.length} rows to raw_data...`);
        const BATCH_SIZE = 500;
        for (let i = 0; i < rawPayload.length; i += BATCH_SIZE) {
            const chunk = rawPayload.slice(i, i + BATCH_SIZE);
            const { error: rawError } = await supabase.from('raw_data').insert(chunk);
            if (rawError) throw new Error(`raw_data insert error (batch ${i}): ${rawError.message}`);
        }

        console.log('[sync] Sync Completed Successfully!');
        return NextResponse.json({ success: true, message: '데이터 동기화가 성공적으로 완료되었습니다!' });

    } catch (error: any) {
        console.error('[sync] Sync Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

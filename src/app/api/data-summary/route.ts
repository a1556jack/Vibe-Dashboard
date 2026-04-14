export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { fetchFinancialDetailData, fetchRawDataSummary } from "@/lib/sheet-data";

export async function GET() {
  try {
    // 1. Fetch the overall financial details to see what months exist
    const finRes = await fetchFinancialDetailData();
    const availableMonths = finRes.months.map(m => m.month);
    
    // Sort months to find the latest
    availableMonths.sort();
    
    // 2. Assemble a rich context payload
    // Note: We skip fetchRawDataSummary because it pulls 68,000 rows and causes a 10s Vercel Serverless timeout.
    const payload = {
      available_months: availableMonths,
      latest_month: availableMonths[availableMonths.length - 1],
      overall_financials: finRes.months, // contains revenue, cost, etc. for every single month
      financial_average: finRes.average,
    };

    return NextResponse.json(payload);
  } catch (error) {
    console.error("Data Summary API Error:", error);
    return NextResponse.json({ error: "Failed to fetch summary" }, { status: 500 });
  }
}

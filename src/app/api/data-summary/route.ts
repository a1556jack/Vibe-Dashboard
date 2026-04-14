import { NextResponse } from "next/server";
import { fetchFinancialDetailData, fetchRawDataSummary } from "@/lib/sheet-data";

export async function GET() {
  try {
    // 1. Fetch the overall financial details to see what months exist
    const finRes = await fetchFinancialDetailData();
    const availableMonths = finRes.months.map(m => m.month);
    
    // Sort months to find the latest
    availableMonths.sort();
    
    // 2. We can provide the whole array of financial months so the AI knows the global stats!
    // But we'll also fetch detailed raw data (like teams and locations) for the last 3 months
    const recentMonths = availableMonths.slice(-3); // e.g. ["26.01", "26.02", "26.03"]
    const rawDataSummary = await fetchRawDataSummary(recentMonths);

    // 3. Assemble a rich context payload
    const payload = {
      available_months: availableMonths,
      latest_month: availableMonths[availableMonths.length - 1],
      overall_financials: finRes.months, // contains revenue and cost for every single month!
      financial_average: finRes.average,
      recent_operations_summary: rawDataSummary
    };

    return NextResponse.json(payload);
  } catch (error) {
    console.error("Data Summary API Error:", error);
    return NextResponse.json({ error: "Failed to fetch summary" }, { status: 500 });
  }
}

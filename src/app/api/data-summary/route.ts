import { NextResponse } from "next/server";
import { fetchRawDataSummary } from "@/lib/sheet-data";

export async function GET() {
  try {
    // Default to recent months
    const summary = await fetchRawDataSummary(["25.01", "25.02", "25.03"]);
    return NextResponse.json(summary);
  } catch (error) {
    console.error("Data Summary API Error:", error);
    return NextResponse.json({ error: "Failed to fetch summary" }, { status: 500 });
  }
}

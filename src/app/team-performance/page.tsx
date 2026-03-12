export const dynamic = 'force-dynamic'

import { fetchRawData, fetchFinancialDetailData } from "@/lib/sheet-data"
import { TeamPerformanceClient } from "./TeamPerformanceClient"

export default async function TeamPerformancePage() {
    const rawData = await fetchRawData()
    const { months } = await fetchFinancialDetailData()
    return <TeamPerformanceClient rawData={rawData} availableMonths={months.map(m => m.month)} />
}

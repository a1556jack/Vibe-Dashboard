export const dynamic = 'force-dynamic'

import { fetchRawData, fetchFinancialDetailData } from "@/lib/sheet-data"
import { TeamPerformanceClient } from "./TeamPerformanceClient"

export default async function TeamPerformancePage() {
    const { months } = await fetchFinancialDetailData()
    const targetMonths = months.map(m => m.month)
    const rawData = await fetchRawData(targetMonths)
    
    return <TeamPerformanceClient rawData={rawData} availableMonths={targetMonths} />
}

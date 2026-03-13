export const dynamic = 'force-dynamic'

import { fetchAggregatedTeamData, fetchFinancialDetailData } from "@/lib/sheet-data"
import { TeamPerformanceClient } from "./TeamPerformanceClient"

export default async function TeamPerformancePage() {
    const { months } = await fetchFinancialDetailData()
    const targetMonths = months.map(m => m.month)
    const aggregatedData = await fetchAggregatedTeamData(targetMonths)
    
    return <TeamPerformanceClient aggregatedData={aggregatedData} availableMonths={targetMonths} />
}

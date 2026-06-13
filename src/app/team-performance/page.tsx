export const dynamic = 'force-dynamic'

import { fetchAggregatedTeamData } from "@/lib/sheet-data"
import { TeamPerformanceClient } from "./TeamPerformanceClient"

export default async function TeamPerformancePage() {
    // Fetch all aggregated data without restricting to financial_details months
    const aggregatedData = await fetchAggregatedTeamData()
    const availableMonths = Object.keys(aggregatedData).sort()
    
    return <TeamPerformanceClient aggregatedData={aggregatedData} availableMonths={availableMonths} />
}

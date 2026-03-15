export const dynamic = 'force-dynamic'

import { fetchNightworkRatioData, fetchFinancialDetailData } from "@/lib/sheet-data"
import { NightworkRatioClient } from "./NightworkRatioClient"

export default async function NightworkRatioPage() {
    const [ratioData, finData] = await Promise.all([
        fetchNightworkRatioData(),
        fetchFinancialDetailData()
    ])
    return <NightworkRatioClient data={ratioData} financialData={finData} />
}

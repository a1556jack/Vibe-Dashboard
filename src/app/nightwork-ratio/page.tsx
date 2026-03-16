export const dynamic = 'force-dynamic'

import { fetchNightworkRatioData, fetchFinancialDetailData, fetchNightworkCapData } from "@/lib/sheet-data"
import { NightworkRatioClient } from "./NightworkRatioClient"

export default async function NightworkRatioPage() {
    const [ratioData, finData, capData] = await Promise.all([
        fetchNightworkRatioData(),
        fetchFinancialDetailData(),
        fetchNightworkCapData()
    ])
    return <NightworkRatioClient data={ratioData} financialData={finData} capData={capData} />
}

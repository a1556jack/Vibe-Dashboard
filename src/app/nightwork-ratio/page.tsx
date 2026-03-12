export const dynamic = 'force-dynamic'

import { fetchNightworkRatioData } from "@/lib/sheet-data"
import { NightworkRatioClient } from "./NightworkRatioClient"

export default async function NightworkRatioPage() {
    const data = await fetchNightworkRatioData()
    return <NightworkRatioClient data={data} />
}

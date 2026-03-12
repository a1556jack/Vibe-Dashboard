export const dynamic = 'force-dynamic'

import { fetchNightworkCapData } from "@/lib/sheet-data"
import { NightworkCapClient } from "./NightworkCapClient"

export default async function NightworkCapPage() {
    const data = await fetchNightworkCapData()
    return <NightworkCapClient data={data} />
}

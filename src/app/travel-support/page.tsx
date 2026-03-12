export const dynamic = 'force-dynamic'

import { fetchTravelSupportData } from "@/lib/sheet-data"
import { TravelSupportClient } from "./TravelSupportClient"

export default async function TravelSupportPage() {
    const data = await fetchTravelSupportData()
    return <TravelSupportClient data={data} />
}

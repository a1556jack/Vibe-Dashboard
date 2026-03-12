export const dynamic = 'force-dynamic'

import { fetchEquipmentCostData } from "@/lib/sheet-data"
import { EquipmentPageClient } from "./EquipmentPageClient"

export default async function EquipmentPage() {
    const { months, average } = await fetchEquipmentCostData()
    return <EquipmentPageClient months={months} average={average} />
}

export const dynamic = 'force-dynamic'

import { fetchEquipmentCostData, fetchFinancialDetailData, fetchNightworkRatioData } from "@/lib/sheet-data"
import { EquipmentPageClient } from "./EquipmentPageClient"

export default async function EquipmentPage() {
    const [equipRes, finRes, nightRes] = await Promise.all([
        fetchEquipmentCostData(),
        fetchFinancialDetailData(),
        fetchNightworkRatioData()
    ]);

    return <EquipmentPageClient 
        months={equipRes.months} 
        average={equipRes.average} 
        finData={finRes.months}
        nightRatioData={nightRes.months}
    />
}

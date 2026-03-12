export const dynamic = 'force-dynamic'

import {
  fetchFinancialDetailData,
  fetchBillingData,
  fetchNightworkRatioData,
  fetchEquipmentCostData,
  fetchNightworkCapData,
  fetchTravelSupportData,
  fetchRawData
} from "@/lib/sheet-data"
import { OverviewClient } from "./OverviewClient"

export default async function OverviewPage() {
  const [
    finRes, billingData, nightRatioData,
    equipRes, capData, travelData, rawData
  ] = await Promise.all([
    fetchFinancialDetailData(),
    fetchBillingData(),
    fetchNightworkRatioData(),
    fetchEquipmentCostData(),
    fetchNightworkCapData(),
    fetchTravelSupportData(),
    fetchRawData()
  ]);

  return <OverviewClient
    months={finRes.months}
    average={finRes.average}
    billingData={billingData}
    nightRatioData={nightRatioData}
    equipData={equipRes.months}
    equipAvg={equipRes.average}
    capData={capData}
    travelData={travelData}
    rawData={rawData}
  />
}

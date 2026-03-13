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
    equipRes, capData, travelData
  ] = await Promise.all([
    fetchFinancialDetailData(),
    fetchBillingData(),
    fetchNightworkRatioData(),
    fetchEquipmentCostData(),
    fetchNightworkCapData(),
    fetchTravelSupportData()
  ]);

  const targetMonths = finRes.months.map(m => m.month);
  // Start filtered raw data fetch
  const rawDataPromise = fetchRawData(targetMonths);

  return <OverviewClient
    months={finRes.months}
    average={finRes.average}
    billingData={billingData}
    nightRatioData={nightRatioData}
    equipData={equipRes.months}
    equipAvg={equipRes.average}
    capData={capData}
    travelData={travelData}
    rawDataPromise={rawDataPromise}
  />
}

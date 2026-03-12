export const dynamic = 'force-dynamic'

import { fetchBillingData } from "@/lib/sheet-data"
import { BillingPageClient } from "./BillingPageClient"

export default async function BillingPage() {
    const data = await fetchBillingData()
    return <BillingPageClient data={data} />
}

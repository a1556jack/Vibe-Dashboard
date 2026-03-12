"use client"

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend } from "recharts"
import { motion } from "framer-motion"
import { DataTable } from "@/components/dashboard/DataTable"
import type { BillingData } from "@/lib/sheet-data"

const fmt = (v: number) => `₩${(v / 1000000).toLocaleString('ko-KR', { maximumFractionDigits: 0 })}M`

export function BillingPageClient({ data }: { data: BillingData[] }) {
    if (!data || data.length === 0) {
        return <div className="flex items-center justify-center h-64 text-gray-500">데이터를 불러오는 중...</div>
    }

    const chartData = data.map(d => ({
        month: d.month,
        정상시공비: d.합계_정상시공비,
        지급분: d.합계_지급분,
        청구분: d.합계_청구분,
    }))

    const columns = [
        { key: 'month', label: '월', format: (v: any) => String(v) },
        { key: '합계_정상시공비', label: '정상시공비', format: fmt },
        { key: '합계_지급분', label: '지급분', format: fmt },
        { key: '합계_청구분', label: '청구분', format: fmt },
        { key: '심야시공합계_정상시공비', label: '심야 정상시공비', format: fmt },
        { key: '심야시공합계_지급분', label: '심야 지급분', format: fmt },
        { key: '심야시공합계_청구분', label: '심야 청구분', format: fmt },
    ]

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">경인 청구</h2>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 backdrop-blur-sm shadow-sm"
            >
                <h3 className="mb-6 text-lg font-semibold text-white">청구 현황 (정상시공비 vs 지급분 vs 청구분)</h3>
                <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis dataKey="month" stroke="#525252" tickLine={false} axisLine={false} tick={{ fill: '#a1a1aa', fontSize: 11 }} />
                            <YAxis stroke="#525252" tickLine={false} axisLine={false} tick={{ fill: '#a1a1aa', fontSize: 11 }} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} />
                            <Tooltip
                                contentStyle={{ backgroundColor: 'rgba(20,20,23,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                                formatter={(value: any, name: any) => [`₩${Number(value).toLocaleString()}`, name]}
                            />
                            <Legend wrapperStyle={{ color: '#a1a1aa', fontSize: 12 }} />
                            <Bar name="정상시공비" dataKey="정상시공비" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                            <Bar name="지급분" dataKey="지급분" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                            <Bar name="청구분" dataKey="청구분" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>

            <DataTable title="청구 상세 데이터" columns={columns} data={data} />
        </div>
    )
}

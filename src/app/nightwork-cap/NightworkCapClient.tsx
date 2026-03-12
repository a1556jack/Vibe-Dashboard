"use client"

import { Bar, Line, ComposedChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend } from "recharts"
import { motion } from "framer-motion"
import { DataTable } from "@/components/dashboard/DataTable"
import type { NightworkCapData } from "@/lib/sheet-data"

const fmtM = (v: number) => `₩${(v / 10000).toLocaleString('ko-KR', { maximumFractionDigits: 0 })}만`

export function NightworkCapClient({ data }: { data: NightworkCapData[] }) {
    if (!data || data.length === 0) {
        return <div className="flex items-center justify-center h-64 text-gray-500">데이터를 불러오는 중...</div>
    }

    const chartData = data.map(d => ({
        month: d.month,
        주중심야: d.주중심야,
        주말심야: d.주말심야,
        지급상한공제: d.지급상한공제시공비,
        상한비율: d.지급상한시공비율,
    }))

    const columns = [
        { key: 'month', label: '월', format: (v: any) => String(v) },
        { key: '지급상한공제시공비', label: '지급상한 공제 시공비', format: fmtM },
        { key: '주중심야', label: '주중 심야', format: fmtM },
        { key: '주말심야', label: '주말 심야', format: fmtM },
        { key: '심야추가시공비합계', label: '심야 추가 합계', format: fmtM },
        { key: '지급상한시공비율', label: '지급상한 비율', format: (v: number) => `${v.toFixed(2)}%` },
    ]

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">경인 심야시공 지급 상한</h2>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 backdrop-blur-sm shadow-sm"
            >
                <h3 className="mb-6 text-lg font-semibold text-white">심야시공 지급 현황 & 상한 비율</h3>
                <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartData} margin={{ top: 10, right: 40, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis dataKey="month" stroke="#525252" tickLine={false} axisLine={false} tick={{ fill: '#a1a1aa', fontSize: 11 }} />
                            <YAxis yAxisId="left" stroke="#525252" tickLine={false} axisLine={false} tick={{ fill: '#a1a1aa', fontSize: 11 }} tickFormatter={(v) => `${(v / 10000).toFixed(0)}만`} />
                            <YAxis yAxisId="right" orientation="right" stroke="#525252" tickLine={false} axisLine={false} tick={{ fill: '#a1a1aa', fontSize: 11 }} tickFormatter={(v) => `${v}%`} domain={[0, 25]} />
                            <Tooltip
                                contentStyle={{ backgroundColor: 'rgba(20,20,23,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                                formatter={(value: any, name: any) => {
                                    const val = Number(value);
                                    if (name === '상한비율') return [`${val.toFixed(2)}%`, name];
                                    return [`₩${val.toLocaleString()}`, name];
                                }}
                            />
                            <Legend wrapperStyle={{ color: '#a1a1aa', fontSize: 12 }} />
                            <Bar yAxisId="left" name="주중심야" dataKey="주중심야" stackId="stack" fill="#8b5cf6" radius={[0, 0, 0, 0]} />
                            <Bar yAxisId="left" name="주말심야" dataKey="주말심야" stackId="stack" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                            <Bar yAxisId="left" name="지급상한공제" dataKey="지급상한공제" fill="#ef4444" opacity={0.6} radius={[4, 4, 0, 0]} />
                            <Line yAxisId="right" name="상한비율" dataKey="상한비율" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 4 }} />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>

            <DataTable title="심야시공 지급 상한 상세" columns={columns} data={data} />
        </div>
    )
}

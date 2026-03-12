"use client"

import { Bar, Line, ComposedChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend } from "recharts"
import { motion } from "framer-motion"
import { DataTable } from "@/components/dashboard/DataTable"
import type { NightworkRatioData } from "@/lib/sheet-data"

const fmtB = (v: number) => `₩${(v / 100000000).toLocaleString('ko-KR', { maximumFractionDigits: 0 })}억`

export function NightworkRatioClient({ data }: { data: NightworkRatioData[] }) {
    if (!data || data.length === 0) {
        return <div className="flex items-center justify-center h-64 text-gray-500">데이터를 불러오는 중...</div>
    }

    const chartData = data.map(d => ({
        month: d.month,
        전체금액: d.totalAmount,
        심야금액: d.nightworkAmount,
        심야비율: d.nightworkRatio,
    }))

    const columns = [
        { key: 'month', label: '월', format: (v: any) => String(v) },
        { key: 'totalAmount', label: '전체 시공금액', format: fmtB },
        { key: 'nightworkAmount', label: '심야 시공금액', format: fmtB },
        { key: 'nightworkRatio', label: '심야 비율', format: (v: number) => `${v.toFixed(2)}%` },
    ]

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">경인 퍼시스 심야 시공 비율</h2>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 backdrop-blur-sm shadow-sm"
            >
                <h3 className="mb-6 text-lg font-semibold text-white">전체 vs 심야 시공금액 & 비율</h3>
                <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartData} margin={{ top: 10, right: 40, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis dataKey="month" stroke="#525252" tickLine={false} axisLine={false} tick={{ fill: '#a1a1aa', fontSize: 11 }} />
                            <YAxis yAxisId="left" stroke="#525252" tickLine={false} axisLine={false} tick={{ fill: '#a1a1aa', fontSize: 11 }} tickFormatter={(v) => `${(v / 100000000).toFixed(0)}억`} />
                            <YAxis yAxisId="right" orientation="right" stroke="#525252" tickLine={false} axisLine={false} tick={{ fill: '#a1a1aa', fontSize: 11 }} tickFormatter={(v) => `${v}%`} domain={[0, 60]} />
                            <Tooltip
                                contentStyle={{ backgroundColor: 'rgba(20,20,23,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                                formatter={(value: any, name: any) => {
                                    if (name === '심야비율') return [`${Number(value).toFixed(1)}%`, name];
                                    return [`₩${Number(value).toLocaleString()}`, name];
                                }}
                            />
                            <Legend wrapperStyle={{ color: '#a1a1aa', fontSize: 12 }} />
                            <Bar yAxisId="left" name="전체금액" dataKey="전체금액" fill="#8b5cf6" opacity={0.6} radius={[4, 4, 0, 0]} />
                            <Bar yAxisId="left" name="심야금액" dataKey="심야금액" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                            <Line yAxisId="right" name="심야비율" dataKey="심야비율" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 4 }} />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>

            <DataTable title="심야 시공 비율 상세" columns={columns} data={data} />
        </div>
    )
}

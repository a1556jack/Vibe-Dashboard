"use client"

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend } from "recharts"
import { motion } from "framer-motion"
import { DataTable } from "@/components/dashboard/DataTable"
import type { TravelSupportData } from "@/lib/sheet-data"

const fmtM = (v: number) => `₩${(v / 10000).toLocaleString('ko-KR', { maximumFractionDigits: 0 })}만`

export function TravelSupportClient({ data }: { data: TravelSupportData[] }) {
    if (!data || data.length === 0) {
        return <div className="flex items-center justify-center h-64 text-gray-500">데이터를 불러오는 중...</div>
    }

    const chartData = data.map(d => ({
        month: d.month,
        현장_정상시공: d.현장_정상시공,
        현장_기타지원: d.현장_기타지원,
        소액_정상시공: d.소액_정상시공,
        소액_출장비: d.소액_출장비,
        소액_기타지원: d.소액_기타지원,
    }))

    const columns = [
        { key: 'month', label: '월', format: (v: any) => String(v) },
        { key: '현장_정상시공', label: '현장 정상시공', format: fmtM },
        { key: '현장_기타지원', label: '현장 기타지원', format: fmtM },
        { key: '현장_기타지원비율', label: '현장 기타지원(%)', format: (v: number) => `${v.toFixed(2)}%` },
        { key: '소액_정상시공', label: '소액 정상시공', format: fmtM },
        { key: '소액_출장비', label: '소액 출장비', format: fmtM },
        { key: '소액_기타지원', label: '소액 기타지원', format: fmtM },
        { key: '소액_출장비비율', label: '소액 출장비(%)', format: (v: number) => `${v.toFixed(2)}%` },
        { key: '소액_기타지원비율', label: '소액 기타지원(%)', format: (v: number) => `${v.toFixed(2)}%` },
    ]

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">경인 출장비/기타지원</h2>

            <div className="grid gap-6 lg:grid-cols-2">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 backdrop-blur-sm shadow-sm"
                >
                    <h3 className="mb-6 text-lg font-semibold text-white">현장 시공 vs 기타지원</h3>
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="month" stroke="#525252" tickLine={false} axisLine={false} tick={{ fill: '#a1a1aa', fontSize: 10 }} />
                                <YAxis stroke="#525252" tickLine={false} axisLine={false} tick={{ fill: '#a1a1aa', fontSize: 10 }} tickFormatter={(v) => `${(v / 100000000).toFixed(0)}억`} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'rgba(20,20,23,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                                    formatter={(value: any, name: any) => [`₩${Number(value).toLocaleString()}`, name]}
                                />
                                <Legend wrapperStyle={{ color: '#a1a1aa', fontSize: 11 }} />
                                <Bar name="현장 정상시공" dataKey="현장_정상시공" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                <Bar name="현장 기타지원" dataKey="현장_기타지원" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 backdrop-blur-sm shadow-sm"
                >
                    <h3 className="mb-6 text-lg font-semibold text-white">소액 시공 vs 출장비 vs 기타지원</h3>
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="month" stroke="#525252" tickLine={false} axisLine={false} tick={{ fill: '#a1a1aa', fontSize: 10 }} />
                                <YAxis stroke="#525252" tickLine={false} axisLine={false} tick={{ fill: '#a1a1aa', fontSize: 10 }} tickFormatter={(v) => `${(v / 100000000).toFixed(0)}억`} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'rgba(20,20,23,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                                    formatter={(value: any, name: any) => [`₩${Number(value).toLocaleString()}`, name]}
                                />
                                <Legend wrapperStyle={{ color: '#a1a1aa', fontSize: 11 }} />
                                <Bar name="소액 정상시공" dataKey="소액_정상시공" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                                <Bar name="소액 출장비" dataKey="소액_출장비" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                                <Bar name="소액 기타지원" dataKey="소액_기타지원" fill="#10b981" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            </div>

            <DataTable title="출장비/기타지원 상세 데이터" columns={columns} data={data} />
        </div>
    )
}

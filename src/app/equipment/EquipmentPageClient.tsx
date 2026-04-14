"use client"

import { Bar, Line, ComposedChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend, ReferenceLine } from "recharts"
import { motion } from "framer-motion"
import { DataTable } from "@/components/dashboard/DataTable"
import type { EquipmentCostData, FinancialMonthData, NightworkRatioData } from "@/lib/sheet-data"

const fmtM = (v: number) => `₩${(v / 10000).toLocaleString('ko-KR', { maximumFractionDigits: 0 })}만`

export function EquipmentPageClient({ months, average, finData, nightRatioData }: {
    months: EquipmentCostData[]
    average: EquipmentCostData | null
    finData: FinancialMonthData[]
    nightRatioData: NightworkRatioData[]
}) {
    if (!months || months.length === 0) {
        return <div className="flex items-center justify-center h-64 text-gray-500">데이터를 불러오는 중...</div>
    }

    const chartData = months.map(d => {
        const finMatch = finData.find(f => f.month === d.month);
        const nightMatch = nightRatioData.find(n => n.month === d.month);

        let hyunjangMargin = 0;
        if (finMatch && finMatch.용역수입.현장 > 0) {
            hyunjangMargin = (1 - (finMatch.변동비.현장 / finMatch.용역수입.현장)) * 100;
        }

        return {
            month: d.month,
            장비전체합계: d.장비전체합계,
            장비비율_퍼시스: d.장비비율_퍼시스,
            현장공헌이익률: hyunjangMargin,
            심야시공비율: nightMatch?.nightworkRatio || 0,
        };
    })

    const avgTotal = average ? average.장비전체합계 : (months.length > 0 ? months.reduce((acc, curr) => acc + curr.장비전체합계, 0) / months.length : 0);
    const avgRatio = average ? average.장비비율_퍼시스 : (months.length > 0 ? months.reduce((acc, curr) => acc + curr.장비비율_퍼시스, 0) / months.length : 0);

    const tableData = months.map(d => ({
        ...d,
        지게차_총합: d.비계약지게차_합계 + d.계약지게차
    }))

    const columns = [
        { key: 'month', label: '월', format: (v: any) => String(v) },
        { key: '지게차_총합', label: '지게차', format: fmtM },
        { key: '사다리차', label: '사다리차', format: fmtM },
        { key: '장비전체합계', label: '합계', format: fmtM },
        { key: '장비비율_퍼시스', label: '퍼시스 비율', format: (v: number) => `${Number(v.toFixed(3))}%` },
    ]

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">경인 퍼시스 장비 비용</h2>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 backdrop-blur-sm shadow-sm"
            >
                <h3 className="mb-6 text-lg font-semibold text-white">월별 장비 비용 현황 및 비율</h3>
                <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis dataKey="month" stroke="#525252" tickLine={false} axisLine={false} tick={{ fill: '#a1a1aa', fontSize: 11 }} />
                            <YAxis yAxisId="left" stroke="#525252" tickLine={false} axisLine={false} tick={{ fill: '#a1a1aa', fontSize: 11 }} tickFormatter={(v) => `${(v / 10000).toFixed(0)}만`} />
                            <YAxis yAxisId="right" orientation="right" stroke="#525252" tickLine={false} axisLine={false} tick={{ fill: '#a1a1aa', fontSize: 11 }} tickFormatter={(v) => `${v.toFixed(1)}%`} />

                            <Tooltip
                                contentStyle={{ backgroundColor: 'rgba(20,20,23,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff' }}
                                formatter={(value: any, name: any) => {
                                    if (name === "장비 전체 합계") return [`₩${Number(value).toLocaleString()}`, name];
                                    if (name === "현장 공헌이익률") return [`${Number(value).toFixed(1)}%`, name];
                                    if (name === "심야 시공 비율") return [`${Number(value).toFixed(1)}%`, name];
                                    return [`${Number(value).toFixed(3)}%`, "퍼시스 장비 비율"];
                                }}
                            />
                            <Legend wrapperStyle={{ color: '#a1a1aa', fontSize: 12 }} />

                            {avgTotal > 0 && (
                                <ReferenceLine yAxisId="left" y={avgTotal} stroke="#8b5cf6" strokeDasharray="6 4" strokeOpacity={0.5} label={{ value: `평균 합계 ${fmtM(avgTotal)}`, position: 'insideTopLeft', fill: '#8b5cf6', fontSize: 11 }} />
                            )}
                            {avgRatio > 0 && (
                                <ReferenceLine yAxisId="right" y={avgRatio} stroke="#10b981" strokeDasharray="6 4" strokeOpacity={0.5} label={{ value: `평균 비율 ${Number(avgRatio.toFixed(3))}%`, position: 'insideTopRight', fill: '#10b981', fontSize: 11 }} />
                            )}

                            <Bar yAxisId="left" name="장비 전체 합계" dataKey="장비전체합계" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={40} />
                            <Line yAxisId="right" name="퍼시스 장비 비율" type="monotone" dataKey="장비비율_퍼시스" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 4 }} activeDot={{ r: 6 }} />
                            <Line yAxisId="right" name="현장 공헌이익률" type="monotone" dataKey="현장공헌이익률" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b', r: 3 }} activeDot={{ r: 5 }} />
                            <Line yAxisId="right" name="심야 시공 비율" type="monotone" dataKey="심야시공비율" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 3 }} activeDot={{ r: 5 }} />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>

            <DataTable title="장비 비용 요약 (지게차/사다리차/합계/비율)" columns={columns} data={tableData} />
        </div>
    )
}

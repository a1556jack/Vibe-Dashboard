"use client"

import { Bar, Line, ComposedChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend } from "recharts"
import { motion } from "framer-motion"
import { DataTable } from "@/components/dashboard/DataTable"
import type { NightworkRatioData, FinancialMonthData, NightworkCapData } from "@/lib/sheet-data"

const fmtB = (v: number) => `₩${((v || 0) / 100000000).toLocaleString('ko-KR', { maximumFractionDigits: 1 })}억`
const fmtPct = (v: number | undefined | null) => (typeof v === 'number') ? `${v.toFixed(2)}%` : '0.00%'

interface Column {
    key: string;
    label: string;
    format: (value: any) => string;
}

export function NightworkRatioClient({ 
    data, 
    financialData,
    capData 
}: { 
    data: NightworkRatioData[],
    financialData: { months: FinancialMonthData[], average: FinancialMonthData | null },
    capData: NightworkCapData[]
}) {
    if (!data || data.length === 0) {
        return <div className="flex items-center justify-center h-64 text-gray-500">데이터를 불러오는 중...</div>
    }

    // Merge data by month
    const chartData = data.map(d => {
        const fin = financialData.months.find(f => f.month === d.month);
        const cap = capData.find(c => c.month === d.month);
        
        // Calculate Margin Rates based on formula: (1 - Variable Cost / Revenue)
        const hyunjangMargin = fin && fin.용역수입.현장 > 0 
            ? (1 - (fin.변동비.현장 / fin.용역수입.현장)) * 100 
            : 0;
            
        const soaekMargin = fin && fin.용역수입.소액 > 0 
            ? (1 - (fin.변동비.소액 / fin.용역수입.소액)) * 100 
            : 0;

        return {
            month: d.month,
            // Total (Integrated)
            전체금액: d.totalAmount,
            심야금액: d.nightworkAmount,
            심야비율: d.nightworkRatio,
            // On-site (현장)
            현장전체: d.hyunjangTotal || 0,
            현장심야: d.hyunjangNight || 0,
            현장비율: d.hyunjangRatio || 0,
            현장이익률: hyunjangMargin,
            지급상한시공비율: cap ? cap.지급상한시공비율 : null,
            // Small Amount (소액)
            소액전체: d.soaekTotal || 0,
            소액심야: d.soaekNight || 0,
            소액비율: d.soaekRatio || 0,
            소액이익률: soaekMargin,
        }
    })

    const columns: Column[] = [
        { key: 'month', label: '월', format: (v: any) => String(v) },
        { key: 'totalAmount', label: '전체 (통합) 비율', format: (v: any) => {
            const row = data.find(d => d.totalAmount === v);
            return row ? fmtPct(row.nightworkRatio) : String(v || '');
        } },
        { key: 'hyunjangRatio', label: '현장 심야 비율', format: (v: any) => fmtPct(v) },
        { key: 'soaekRatio', label: '소액 심야 비율', format: (v: any) => fmtPct(v) },
        { key: 'nightworkAmount', label: '통합 심야금액', format: (v: any) => fmtB(v) },
    ]

    const RatioChart = ({ title, data, barKeyTotal, barKeyNight, lineRatioKey, lineMarginKey, lineMarginName, lineCapRatioKey }: { 
        title: string, 
        data: any[], 
        barKeyTotal: string, 
        barKeyNight: string, 
        lineRatioKey: string,
        lineMarginKey?: string,
        lineMarginName?: string,
        lineCapRatioKey?: string
    }) => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 backdrop-blur-sm shadow-sm"
        >
            <h3 className="mb-6 text-lg font-semibold text-white">{title}</h3>
            <div className="h-[380px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="month" stroke="#525252" tickLine={false} axisLine={false} tick={{ fill: '#a1a1aa', fontSize: 11 }} />
                        <YAxis yAxisId="left" stroke="#525252" tickLine={false} axisLine={false} tick={{ fill: '#a1a1aa', fontSize: 11 }} tickFormatter={(v) => `${(v / 100000000).toFixed(0)}억`} />
                        <YAxis yAxisId="right" orientation="right" stroke="#525252" tickLine={false} axisLine={false} tick={{ fill: '#a1a1aa', fontSize: 11 }} tickFormatter={(v) => `${v}%`} domain={[0, (dataMax: number) => Math.max(80, dataMax + 10)]} />
                        <Tooltip
                            contentStyle={{ backgroundColor: 'rgba(20,20,23,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: 12 }}
                            formatter={(value: any, name: any) => {
                                const nameStr = String(name);
                                if (nameStr.includes('비율') || nameStr.includes('이익률')) return [`${Number(value).toFixed(1)}%`, nameStr];
                                return [`₩${Number(value).toLocaleString()}`, nameStr];
                            }}
                        />
                        <Legend wrapperStyle={{ color: '#a1a1aa', fontSize: 12, paddingTop: 10 }} />
                        <Bar yAxisId="left" name="전체 시공금액" dataKey={barKeyTotal} fill="#818cf8" opacity={0.3} radius={[4, 4, 0, 0]} />
                        <Bar yAxisId="left" name="심야 시공금액" dataKey={barKeyNight} fill="#f59e0b" radius={[4, 4, 0, 0]} />
                        <Line yAxisId="right" name="심야 시공 비율" dataKey={lineRatioKey} stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 4 }} />
                        {lineMarginKey && (
                            <Line yAxisId="right" name={lineMarginName || "공헌이익률"} dataKey={lineMarginKey} stroke="#f43f5e" strokeWidth={2} strokeDasharray="5 5" dot={{ fill: '#f43f5e', r: 3 }} />
                        )}
                        {lineCapRatioKey && (
                            <Line yAxisId="right" name="지급상한 비율" dataKey={lineCapRatioKey} stroke="#a855f7" strokeWidth={2} strokeDasharray="3 3" dot={{ fill: '#a855f7', r: 3 }} />
                        )}
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    )

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">경인 퍼시스 심야 시공 분석</h2>
                <div className="text-xs text-gray-400 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                    공헌이익률 공식: (1 - 변동비 / 용역수입)
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-1">
                {/* 1. 경인_통합 (기존 메인 차트) */}
                <RatioChart 
                    title="1. 경인_통합 (전체 지표)"
                    data={chartData}
                    barKeyTotal="전체금액"
                    barKeyNight="심야금액"
                    lineRatioKey="심야비율"
                />

                <div className="grid gap-6 md:grid-cols-2">
                    {/* 2. 경인_현장 */}
                    <RatioChart 
                        title="2. 경인_현장 심야 비율 & 이익률"
                        data={chartData}
                        barKeyTotal="현장전체"
                        barKeyNight="현장심야"
                        lineRatioKey="현장비율"
                        lineMarginKey="현장이익률"
                        lineMarginName="현장 공헌이익률"
                        lineCapRatioKey="지급상한시공비율"
                    />

                    {/* 3. 경인_소액 */}
                    <RatioChart 
                        title="3. 경인_소액 심야 비율 & 이익률"
                        data={chartData}
                        barKeyTotal="소액전체"
                        barKeyNight="소액심야"
                        lineRatioKey="소액비율"
                        lineMarginKey="소액이익률"
                        lineMarginName="소액 공헌이익률"
                    />
                </div>
            </div>

            <DataTable title="심야 시공 비율 상세 데이터" columns={columns as any} data={data} />
        </div>
    )
}

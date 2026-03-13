"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { DollarSign, TrendingDown, BarChart3, Percent, ArrowUp, ArrowDown, Minus, ChevronDown, Sparkles, Loader2, AlertTriangle, Info, CheckCircle2 } from "lucide-react"
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, ReferenceLine, Legend } from "recharts"
import { motion, AnimatePresence } from "framer-motion"

import type { FinancialMonthData, BillingData, NightworkRatioData, EquipmentCostData, NightworkCapData, TravelSupportData, RawDataRow } from "@/lib/sheet-data"
import { toSimpleFinancialData } from "@/lib/sheet-data"
import { generateAnalysisReport, type AnalysisResult, type InsightCard } from "@/lib/analysis-engine"

// ============================================================
// Sub Components
// ============================================================

function StatCard({ title, value, trend, trendValue, icon }: {
    title: string
    value: string
    trend: "up" | "down" | "neutral"
    trendValue: string
    icon: React.ReactNode
}) {
    const trendColor = trend === "up" ? "text-emerald-400" : trend === "down" ? "text-rose-400" : "text-gray-400"
    const TrendIcon = trend === "up" ? ArrowUp : trend === "down" ? ArrowDown : Minus

    return (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 backdrop-blur-sm shadow-sm">
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-400">{title}</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[rgba(255,255,255,0.05)]">
                    {icon}
                </div>
            </div>
            <p className="mt-2 text-2xl font-bold text-white">{value}</p>
            <div className={`mt-1 flex items-center gap-1 text-xs ${trendColor}`}>
                <TrendIcon className="h-3 w-3" />
                <span>{trendValue} 전월 대비</span>
            </div>
        </div>
    )
}

function InsightItem({ alert }: { alert: InsightCard }) {
    const icons = {
        warning: <AlertTriangle className="h-4 w-4 text-rose-400" />,
        info: <Info className="h-4 w-4 text-blue-400" />,
        success: <CheckCircle2 className="h-4 w-4 text-emerald-400" />
    }
    const colors = {
        warning: 'border-rose-500/20 bg-rose-500/10 text-rose-200',
        info: 'border-blue-500/20 bg-blue-500/10 text-blue-200',
        success: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200'
    }

    return (
        <div className={`p-3 rounded-lg border ${colors[alert.type]} flex gap-3 text-sm`}>
            <div className="mt-0.5 shrink-0">{icons[alert.type]}</div>
            <div>
                <p className="font-semibold mb-0.5">{alert.title}</p>
                <p className="opacity-80 text-xs leading-relaxed">{alert.description}</p>
            </div>
        </div>
    )
}

function SectionTable({ title, currentMonth, prevMonth, data, prevData, bgColor }: {
    title: string
    currentMonth: string
    prevMonth: string | null
    data: { label: string; value: number; pct: number }[]
    prevData: { label: string; value: number; pct: number }[] | null
    bgColor: string
}) {
    const fmtM = (v: number) => {
        if (v === 0) return '₩0';
        return `₩${(v / 1000000).toLocaleString('ko-KR', { maximumFractionDigits: 0 })}M`;
    }

    return (
        <div className="overflow-hidden rounded-lg border border-[var(--border)]">
            <div className={`px-5 py-4 ${bgColor}`}>
                <span className="text-base font-semibold text-white">{title}</span>
            </div>
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-[var(--border)] bg-[rgba(255,255,255,0.02)]">
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">구분</th>
                        {prevMonth && (
                            <>
                                <th className="px-3 py-3 text-right text-sm font-medium text-gray-400" colSpan={2}>{prevMonth}</th>
                            </>
                        )}
                        <th className="px-3 py-3 text-right text-sm font-bold text-indigo-300" colSpan={2}>{currentMonth}</th>
                    </tr>
                    <tr className="border-b border-[var(--border)]">
                        <th className="px-4 py-2 text-left text-xs text-gray-500"></th>
                        {prevMonth && (
                            <>
                                <th className="px-3 py-2 text-right text-xs text-gray-500">금액</th>
                                <th className="px-3 py-2 text-right text-xs text-gray-500">비율</th>
                            </>
                        )}
                        <th className="px-3 py-2 text-right text-xs text-gray-400">금액</th>
                        <th className="px-3 py-2 text-right text-xs text-gray-400">비율</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                    {data.map((row, i) => (
                        <tr key={i} className="hover:bg-white/[0.04] transition-colors">
                            <td className="px-4 py-3.5 text-gray-200 text-sm font-medium">{row.label}</td>
                            {prevData && (
                                <>
                                    <td className="px-3 py-3.5 text-right text-gray-400 font-mono text-sm">{fmtM(prevData[i].value)}</td>
                                    <td className="px-3 py-3.5 text-right text-gray-500 text-sm">{prevData[i].pct.toFixed(1)}%</td>
                                </>
                            )}
                            <td className="px-3 py-3.5 text-right text-gray-100 font-mono text-base font-medium">{fmtM(row.value)}</td>
                            <td className="px-3 py-3.5 text-right text-indigo-200 text-sm font-medium">{row.pct.toFixed(1)}%</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

// ============================================================
// Main Component
// ============================================================

export function OverviewClient({
    months,
    average,
    billingData,
    nightRatioData,
    equipData,
    equipAvg,
    capData,
    travelData,
    rawDataPromise
}: {
    months: FinancialMonthData[]
    average: FinancialMonthData | null
    billingData: BillingData[]
    nightRatioData: NightworkRatioData[]
    equipData: EquipmentCostData[]
    equipAvg: EquipmentCostData | null
    capData: NightworkCapData[]
    travelData: TravelSupportData[]
    rawDataPromise: Promise<RawDataRow[]>
}) {
    const [mounted, setMounted] = useState(false)
    const [rawData, setRawData] = useState<RawDataRow[]>([])
    const [isRawDataLoading, setIsRawDataLoading] = useState(true)

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        rawDataPromise.then(data => {
            setRawData(data)
            setIsRawDataLoading(false)
        }).catch(err => {
            console.error("Failed to load raw data:", err)
            setIsRawDataLoading(false)
        })
    }, [rawDataPromise])
    const rawDataMonths = useMemo(() => {
        const set = new Set(rawData.map(r => r.yearMonth).filter(Boolean));
        return Array.from(set).sort((a, b) => b.localeCompare(a));
    }, [rawData]);

    const [selectedMonth, setSelectedMonth] = useState<string>(months.length > 0 ? months[months.length - 1].month : '')
    const [showMonthDropdown, setShowMonthDropdown] = useState(false)
    const [insightMonth, setInsightMonth] = useState<string>('')
    const [showInsightDropdown, setShowInsightDropdown] = useState(false)
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)

    // Set initial insight month when rawData arrives or component mounts
    useEffect(() => {
        if (rawDataMonths.length > 0 && !insightMonth) {
            setInsightMonth(rawDataMonths[0])
        } else if (months.length > 0 && !insightMonth) {
            setInsightMonth(months[months.length - 1].month)
        }
    }, [rawDataMonths, months, insightMonth])

    const selectedData = useMemo(() => months.find(m => m.month === selectedMonth), [months, selectedMonth])
    const selectedIdx = useMemo(() => months.findIndex(m => m.month === selectedMonth), [months, selectedMonth])
    const prevData = useMemo(() => selectedIdx > 0 ? months[selectedIdx - 1] : null, [months, selectedIdx])

    // Clear report on month change
    useEffect(() => {
        setAnalysisResult(null);
    }, [selectedMonth, insightMonth])

    const handleAnalyze = () => {
        if (isRawDataLoading) return;
        setIsAnalyzing(true)
        // simulate a small delay for engine thinking
        setTimeout(() => {
            const result = generateAnalysisReport(
                selectedMonth, insightMonth, months, average,
                billingData, nightRatioData,
                equipData, equipAvg,
                capData, travelData, rawData
            )
            setAnalysisResult(result)
            setIsAnalyzing(false)
        }, 800)
    }

    // Chart data
    const chartData = useMemo(() => months.map(m => {
        const s = toSimpleFinancialData(m)
        return {
            month: m.month,
            용역수입: s.revenue,
            변동비: s.variableCost,
            공헌이익: s.contributionMargin,
        }
    }), [months])

    // Averages for reference lines
    const avgRevenue = average ? average.용역수입.합계 : 0
    const avgCost = average ? average.변동비.합계 : 0
    const avgMargin = average ? average.공헌이익 : 0

    if (!selectedData) {
        return <div className="flex items-center justify-center h-64 text-gray-500">데이터를 불러오는 중...</div>
    }

    const fmtB = (v: number) => `₩${(v / 100000000).toLocaleString('ko-KR', { maximumFractionDigits: 1 })}억`
    const fmtM = (v: number) => `₩${Math.round(v / 1000000).toLocaleString('ko-KR')}M`

    function trendInfo(curr: number, prev: number | null): { trend: "up" | "down" | "neutral", value: string } {
        if (prev === null || prev === 0) return { trend: "neutral", value: "N/A" }
        const diff = ((curr - prev) / Math.abs(prev)) * 100
        return {
            trend: diff > 0 ? "up" : diff < 0 ? "down" : "neutral",
            value: `${Math.abs(diff).toFixed(1)}%`,
        }
    }

    const revTrend = trendInfo(selectedData.용역수입.합계, prevData?.용역수입.합계 ?? null)
    const costTrend = trendInfo(selectedData.변동비.합계, prevData?.변동비.합계 ?? null)
    const marginTrend = trendInfo(selectedData.공헌이익, prevData?.공헌이익 ?? null)
    const marginPctTrend = trendInfo(selectedData.공헌이익_pct, prevData?.공헌이익_pct ?? null)

    // YoY Logic
    const yoyData = useMemo(() => {
        const match = selectedMonth.match(/^(\d+)년\s*(.*)$/);
        if (!match) return null;
        const currentYear = parseInt(match[1], 10);
        const yoyMonthStr = `${currentYear - 1}년 ${match[2]}`;
        return months.find(m => m.month === yoyMonthStr) || null;
    }, [months, selectedMonth]);

    const revYoyTrend = trendInfo(selectedData.용역수입.합계, yoyData?.용역수입.합계 ?? null);
    const costYoyTrend = trendInfo(selectedData.변동비.합계, yoyData?.변동비.합계 ?? null);
    const marginYoyTrend = trendInfo(selectedData.공헌이익, yoyData?.공헌이익 ?? null);

    const revAvgTrend = trendInfo(selectedData.용역수입.합계, average?.용역수입.합계 ?? null);
    const costAvgTrend = trendInfo(selectedData.변동비.합계, average?.변동비.합계 ?? null);
    const marginAvgTrend = trendInfo(selectedData.공헌이익, average?.공헌이익 ?? null);

    if (!mounted) return null

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">경인 퍼시스 채산_종합</h2>
                <div className="relative">
                    <button
                        onClick={() => setShowMonthDropdown(!showMonthDropdown)}
                        className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm text-white hover:bg-white/[0.05] transition-colors"
                    >
                        <span>{selectedMonth}</span>
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                    </button>
                    <AnimatePresence>
                        {showMonthDropdown && (
                            <motion.div
                                initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                                className="absolute right-0 top-full mt-1 z-50 w-36 rounded-lg border border-[var(--border)] bg-[var(--card)] py-1 shadow-xl max-h-60 overflow-y-auto"
                            >
                                {months.map(m => (
                                    <button
                                        key={m.month}
                                        onClick={() => { setSelectedMonth(m.month); setShowMonthDropdown(false); }}
                                        className={`w-full px-4 py-2 text-left text-sm transition-colors ${m.month === selectedMonth ? 'bg-indigo-500/20 text-indigo-300' : 'text-gray-300 hover:bg-white/[0.05]'}`}
                                    >
                                        {m.month}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Top section: 2x2 grid for KPIs and Chart/Report side by side */}
            <div className="flex flex-col xl:flex-row gap-6">

                {/* Left side: 2x2 KPIs */}
                <div className="w-full xl:w-1/2">
                    <div className="grid gap-4 grid-cols-2">
                        <StatCard title="Total Revenue (용역수입)" value={fmtB(selectedData.용역수입.합계)} trend={revTrend.trend} trendValue={revTrend.value} icon={<DollarSign className="h-5 w-5 text-indigo-400" />} />
                        <StatCard title="Variable Costs (변동비)" value={fmtB(selectedData.변동비.합계)} trend={costTrend.trend} trendValue={costTrend.value} icon={<TrendingDown className="h-5 w-5 text-rose-400" />} />
                        <StatCard title="Contribution Margin (공헌이익)" value={fmtB(selectedData.공헌이익)} trend={marginTrend.trend} trendValue={marginTrend.value} icon={<BarChart3 className="h-5 w-5 text-emerald-400" />} />
                        <StatCard title="Margin Rate" value={`${selectedData.공헌이익_pct.toFixed(1)}%`} trend={marginPctTrend.trend} trendValue={marginPctTrend.value} icon={<Percent className="h-5 w-5 text-amber-400" />} />
                    </div>
                </div>

                {/* Right side: Multi-Comparison Dashboard */}
                <div className="w-full xl:w-1/2">
                    <div className="h-full rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 backdrop-blur-sm shadow-sm flex flex-col justify-center">
                        <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
                            <h3 className="text-base font-semibold text-white flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-indigo-400" />
                                종합 다중 비교 분석 <span className="text-gray-400 text-xs font-normal">({selectedMonth} 기준)</span>
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-white/5 pb-2 text-xs text-gray-400">
                                        <th className="text-left font-medium p-2 w-[22%]">구분</th>
                                        <th className="text-right font-medium p-2 w-[26%] bg-white/5 rounded-t-lg text-white">당월 실적</th>
                                        <th className="text-right font-medium p-2 w-[17%]">전월 대비</th>
                                        <th className="text-right font-medium p-2 w-[17%]">전년비 (YoY)</th>
                                        <th className="text-right font-medium p-2 w-[18%]">전년 평균비</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {/* Revenue Row */}
                                    <tr className="hover:bg-white/[0.02] transition-colors">
                                        <td className="p-3 text-gray-300 font-medium text-[13px]">용역수입</td>
                                        <td className="p-3 text-right font-mono font-bold text-indigo-300 bg-white/5">{fmtB(selectedData.용역수입.합계)}</td>
                                        <td className={`p-3 text-right text-xs font-mono font-medium ${revTrend.trend === 'up' ? 'text-emerald-400' : revTrend.trend === 'down' ? 'text-rose-400' : 'text-gray-500'}`}>{revTrend.trend === 'up' ? '▲' : revTrend.trend === 'down' ? '▼' : '-'} {revTrend.value}</td>
                                        <td className={`p-3 text-right text-xs font-mono font-medium ${yoyData ? (revYoyTrend.trend === 'up' ? 'text-emerald-400' : revYoyTrend.trend === 'down' ? 'text-rose-400' : 'text-gray-400') : 'text-gray-600'}`}>{yoyData ? `${revYoyTrend.trend === 'up' ? '▲' : revYoyTrend.trend === 'down' ? '▼' : '-'} ${revYoyTrend.value}` : 'N/A'}</td>
                                        <td className={`p-3 text-right text-xs font-mono font-medium ${average ? (revAvgTrend.trend === 'up' ? 'text-emerald-400' : revAvgTrend.trend === 'down' ? 'text-rose-400' : 'text-gray-400') : 'text-gray-600'}`}>{average ? `${revAvgTrend.trend === 'up' ? '▲' : revAvgTrend.trend === 'down' ? '▼' : '-'} ${revAvgTrend.value}` : 'N/A'}</td>
                                    </tr>
                                    {/* Costs Row */}
                                    <tr className="hover:bg-white/[0.02] transition-colors">
                                        <td className="p-3 text-gray-300 font-medium text-[13px]">변동비</td>
                                        <td className="p-3 text-right font-mono font-bold text-rose-300 bg-white/5">{fmtB(selectedData.변동비.합계)}</td>
                                        <td className={`p-3 text-right text-xs font-mono font-medium ${costTrend.trend === 'up' ? 'text-rose-400' : costTrend.trend === 'down' ? 'text-emerald-400' : 'text-gray-500'}`}>{costTrend.trend === 'up' ? '▲' : costTrend.trend === 'down' ? '▼' : '-'} {costTrend.value}</td>
                                        <td className={`p-3 text-right text-xs font-mono font-medium ${yoyData ? (costYoyTrend.trend === 'up' ? 'text-rose-400' : costYoyTrend.trend === 'down' ? 'text-emerald-400' : 'text-gray-400') : 'text-gray-600'}`}>{yoyData ? `${costYoyTrend.trend === 'up' ? '▲' : costYoyTrend.trend === 'down' ? '▼' : '-'} ${costYoyTrend.value}` : 'N/A'}</td>
                                        <td className={`p-3 text-right text-xs font-mono font-medium ${average ? (costAvgTrend.trend === 'up' ? 'text-rose-400' : costAvgTrend.trend === 'down' ? 'text-emerald-400' : 'text-gray-400') : 'text-gray-600'}`}>{average ? `${costAvgTrend.trend === 'up' ? '▲' : costAvgTrend.trend === 'down' ? '▼' : '-'} ${costAvgTrend.value}` : 'N/A'}</td>
                                    </tr>
                                    {/* Margin Row */}
                                    <tr className="hover:bg-white/[0.02] transition-colors">
                                        <td className="p-3 text-gray-300 font-medium text-[13px]">공헌이익</td>
                                        <td className="p-3 text-right font-mono font-bold text-emerald-300 bg-white/5 rounded-b-lg">{fmtB(selectedData.공헌이익)}</td>
                                        <td className={`p-3 text-right text-xs font-mono font-medium ${marginTrend.trend === 'up' ? 'text-emerald-400' : marginTrend.trend === 'down' ? 'text-rose-400' : 'text-gray-500'}`}>{marginTrend.trend === 'up' ? '▲' : marginTrend.trend === 'down' ? '▼' : '-'} {marginTrend.value}</td>
                                        <td className={`p-3 text-right text-xs font-mono font-medium ${yoyData ? (marginYoyTrend.trend === 'up' ? 'text-emerald-400' : marginYoyTrend.trend === 'down' ? 'text-rose-400' : 'text-gray-400') : 'text-gray-600'}`}>{yoyData ? `${marginYoyTrend.trend === 'up' ? '▲' : marginYoyTrend.trend === 'down' ? '▼' : '-'} ${marginYoyTrend.value}` : 'N/A'}</td>
                                        <td className={`p-3 text-right text-xs font-mono font-medium ${average ? (marginAvgTrend.trend === 'up' ? 'text-emerald-400' : marginAvgTrend.trend === 'down' ? 'text-rose-400' : 'text-gray-400') : 'text-gray-600'}`}>{average ? `${marginAvgTrend.trend === 'up' ? '▲' : marginAvgTrend.trend === 'down' ? '▼' : '-'} ${marginAvgTrend.value}` : 'N/A'}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Middle section: Chart and Report */}
            <div className="grid gap-6 lg:grid-cols-[65%_1fr]">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 backdrop-blur-sm shadow-sm h-[400px]">
                    <h3 className="mb-2 text-lg font-semibold text-white">월별 추이 (점선: 25년 평균)</h3>
                    <ResponsiveContainer width="100%" height="90%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} /><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} /></linearGradient>
                                <linearGradient id="marginGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis dataKey="month" stroke="#525252" tickLine={false} axisLine={false} tick={{ fill: '#a1a1aa', fontSize: 11 }} />
                            <YAxis stroke="#525252" tickLine={false} axisLine={false} tick={{ fill: '#a1a1aa', fontSize: 11 }} tickFormatter={(v) => `${(v / 100000000).toFixed(0)}억`} />
                            <Tooltip contentStyle={{ backgroundColor: 'rgba(20,20,23,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', fontSize: 12 }} formatter={(value: any, name: any) => [`₩${Number(value).toLocaleString()}`, name]} />
                            <Legend wrapperStyle={{ color: '#a1a1aa', fontSize: 12 }} />
                            {avgRevenue > 0 && <ReferenceLine y={avgRevenue} stroke="#8b5cf6" strokeDasharray="6 4" strokeOpacity={0.7} label={{ value: `용역수입 평균 ${fmtM(avgRevenue)}`, position: 'insideTopRight', fill: '#8b5cf690', fontSize: 10 }} />}
                            {avgCost > 0 && <ReferenceLine y={avgCost} stroke="#f43f5e" strokeDasharray="6 4" strokeOpacity={0.7} label={{ value: `변동비 평균 ${fmtM(avgCost)}`, position: 'insideTopRight', fill: '#f43f5e90', fontSize: 10 }} />}
                            {avgMargin > 0 && <ReferenceLine y={avgMargin} stroke="#10b981" strokeDasharray="6 4" strokeOpacity={0.7} label={{ value: `공헌이익 평균 ${fmtM(avgMargin)}`, position: 'insideBottomRight', fill: '#10b98190', fontSize: 10 }} />}
                            <Area name="용역수입" type="monotone" dataKey="용역수입" stroke="#8b5cf6" strokeWidth={2} fill="url(#revGrad)" dot={{ fill: '#8b5cf6', r: 3 }} activeDot={{ r: 6 }} />
                            <Area name="변동비" type="monotone" dataKey="변동비" stroke="#f43f5e" strokeWidth={2} fill="none" dot={{ fill: '#f43f5e', r: 3 }} activeDot={{ r: 6 }} />
                            <Area name="공헌이익" type="monotone" dataKey="공헌이익" stroke="#10b981" strokeWidth={2} fill="url(#marginGrad)" dot={{ fill: '#10b981', r: 3 }} activeDot={{ r: 6 }} />
                        </AreaChart>
                    </ResponsiveContainer>
                </motion.div>

                {/* Right side: Auto Analysis Report Area */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 flex flex-col h-full backdrop-blur-sm shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-4 shrink-0">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded bg-indigo-500/20">
                                <Sparkles className="h-4 w-4 text-indigo-400" />
                            </div>
                            <h3 className="font-semibold text-white">자동 분석 리포트</h3>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 text-sm bg-black/20 rounded-lg py-1 px-3 border border-white/5">
                                <span className="text-gray-400 text-[11px] font-medium">인사이트 대상월:</span>
                                <div className="relative">
                                    <button
                                        onClick={() => setShowInsightDropdown(!showInsightDropdown)}
                                        className="flex items-center gap-1.5 text-indigo-300 hover:text-indigo-200 transition-colors font-medium text-xs"
                                    >
                                        <span>{insightMonth}</span>
                                        <ChevronDown className="h-3 w-3" />
                                    </button>
                                    <AnimatePresence>
                                        {showInsightDropdown && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                                                className="absolute right-0 top-full mt-2 z-[60] w-28 rounded-md border border-[var(--border)] bg-[#1e1e24] py-1 shadow-[0_8px_30px_rgb(0,0,0,0.5)] max-h-48 overflow-y-auto custom-scrollbar"
                                            >
                                                {rawDataMonths.map(m => (
                                                    <button
                                                        key={m}
                                                        onClick={() => { setInsightMonth(m); setShowInsightDropdown(false); }}
                                                        className={`w-full px-3 py-1.5 text-left text-xs transition-colors rounded-sm ${m === insightMonth ? 'bg-indigo-500/20 text-indigo-300' : 'text-gray-300 hover:bg-white/[0.05]'}`}
                                                    >
                                                        {m}
                                                    </button>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                            <button
                                onClick={handleAnalyze}
                                disabled={isAnalyzing || isRawDataLoading}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${isAnalyzing || isRawDataLoading ? 'bg-indigo-500/50 text-white cursor-not-allowed' : 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'}`}
                            >
                                {isAnalyzing ? <><Loader2 className="h-4 w-4 animate-spin" /> 분석 중...</> : 
                                 isRawDataLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> 데이터 로딩 중...</> : '분석 실행'}
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        {!analysisResult && !isAnalyzing && (
                            <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-3">
                                <Sparkles className="h-8 w-8 opacity-20" />
                                <p className="text-sm">분석 실행 버튼을 눌러 {selectedMonth} 리포트 시동</p>
                            </div>
                        )}

                        {isAnalyzing && (
                            <div className="h-full flex flex-col items-center justify-center text-indigo-400/60 space-y-4">
                                <Loader2 className="h-8 w-8 animate-spin" />
                                <p className="text-sm animate-pulse">데이터 교차 검증 중...</p>
                            </div>
                        )}

                        {analysisResult && !isAnalyzing && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-4">
                                {/* Main Text Report */}
                                <div>
                                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">종합 리포트 (데이터 결합)</div>
                                    <div className="p-4 rounded-lg bg-black/20 border border-white/5 font-mono text-sm text-gray-300 whitespace-pre-wrap leading-relaxed h-[240px] overflow-y-auto custom-scrollbar">
                                        {analysisResult.reportText}
                                    </div>
                                </div>

                                {/* Insights Cards */}
                                {analysisResult.insights.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">핵심 인사이트 ({insightMonth} 대상)</div>
                                        {analysisResult.insights.map((insight, i) => <InsightItem key={i} alert={insight} />)}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Bottom section: Breakdowns & Tables */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* 1. Revenue SubTable */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-4">
                    <SectionTable
                        title="용역수입" currentMonth={selectedMonth} prevMonth={prevData?.month ?? null} bgColor="bg-indigo-500/20"
                        data={[
                            { label: '조치', value: selectedData.용역수입.조치, pct: selectedData.용역수입.조치_pct },
                            { label: '현장', value: selectedData.용역수입.현장, pct: selectedData.용역수입.현장_pct },
                            { label: '소액', value: selectedData.용역수입.소액, pct: selectedData.용역수입.소액_pct },
                            { label: '합계', value: selectedData.용역수입.합계, pct: selectedData.용역수입.합계_pct }
                        ]}
                        prevData={prevData ? [
                            { label: '조치', value: prevData.용역수입.조치, pct: prevData.용역수입.조치_pct },
                            { label: '현장', value: prevData.용역수입.현장, pct: prevData.용역수입.현장_pct },
                            { label: '소액', value: prevData.용역수입.소액, pct: prevData.용역수입.소액_pct },
                            { label: '합계', value: prevData.용역수입.합계, pct: prevData.용역수입.합계_pct }
                        ] : null}
                    />
                </motion.div>

                {/* 2. Costs SubTable */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="space-y-4">
                    <SectionTable
                        title="변동비" currentMonth={selectedMonth} prevMonth={prevData?.month ?? null} bgColor="bg-rose-500/20"
                        data={[
                            { label: '조치', value: selectedData.변동비.조치, pct: selectedData.변동비.조치_pct },
                            { label: '현장', value: selectedData.변동비.현장, pct: selectedData.변동비.현장_pct },
                            { label: '소액', value: selectedData.변동비.소액, pct: selectedData.변동비.소액_pct },
                            { label: '합계', value: selectedData.변동비.합계, pct: selectedData.변동비.합계_pct }
                        ]}
                        prevData={prevData ? [
                            { label: '조치', value: prevData.변동비.조치, pct: prevData.변동비.조치_pct },
                            { label: '현장', value: prevData.변동비.현장, pct: prevData.변동비.현장_pct },
                            { label: '소액', value: prevData.변동비.소액, pct: prevData.변동비.소액_pct },
                            { label: '합계', value: prevData.변동비.합계, pct: prevData.변동비.합계_pct }
                        ] : null}
                    />
                </motion.div>
            </div>
        </div>
    )
}

export default OverviewClient;

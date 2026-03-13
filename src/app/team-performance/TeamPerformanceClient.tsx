"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend } from "recharts"
import { ChevronDown, CheckSquare, Square } from "lucide-react"
import { generateTeamBreakdown } from "@/lib/analysis-engine"
import type { RawDataRow } from "@/lib/sheet-data"

type CategoryFilter = "ALL" | "현장" | "소액" | "조치"

function MultiSelectDropdown({
    label,
    options,
    selected,
    onChange
}: {
    label: string,
    options: string[],
    selected: Set<string>,
    onChange: (val: string) => void
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [ref]);

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2 bg-[rgba(255,255,255,0.05)] border border-[var(--border)] text-white text-sm rounded-lg px-3 py-2 outline-none hover:bg-[rgba(255,255,255,0.1)] transition-colors min-w-[140px] justify-between"
            >
                <div className="flex flex-col items-start leading-tight">
                    <span className="text-[10px] text-gray-400">{label}</span>
                    <span className="truncate max-w-[100px]">{selected.size === options.length && options.length > 0 ? '전체 선택됨' : `${selected.size}개 선택됨`}</span>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-400" />
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                        className="absolute right-0 top-full mt-1 z-50 w-56 rounded-lg border border-[var(--border)] bg-[var(--card)] shadow-xl max-h-60 flex flex-col overflow-hidden"
                    >
                        <div className="overflow-y-auto custom-scrollbar p-1">
                            {options.map(option => {
                                const isChecked = selected.has(option);
                                return (
                                    <button
                                        key={option}
                                        onClick={() => onChange(option)}
                                        className="w-full flex items-center justify-between px-3 py-2 text-left text-sm text-gray-300 hover:bg-[rgba(255,255,255,0.05)] rounded-md transition-colors"
                                    >
                                        <span className="truncate mr-2">{option}</span>
                                        {isChecked ? <CheckSquare className="h-4 w-4 text-indigo-400 shrink-0" /> : <Square className="h-4 w-4 text-gray-500 shrink-0" />}
                                    </button>
                                )
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export function TeamPerformanceClient({
    rawData,
    availableMonths
}: {
    rawData: RawDataRow[],
    availableMonths: string[]
}) {
    const [mounted, setMounted] = useState(false)
    useEffect(() => {
        setMounted(true)
    }, [])

    // 0. Extract all unique regions from raw data for mapping
    const allUniqueRegions = useMemo(() => {
        return Array.from(new Set(rawData.map(r => r.권역시공팀))).filter(Boolean).sort()
    }, [rawData])

    const hyunjangRegions = useMemo(() => allUniqueRegions.filter(r => r.startsWith('H')), [allUniqueRegions])
    const soaekRegions = useMemo(() => allUniqueRegions.filter(r => r.startsWith('F')), [allUniqueRegions])
    const jochiRegions = useMemo(() => allUniqueRegions.filter(r => !r.startsWith('H') && !r.startsWith('F')), [allUniqueRegions])

    // Set default month to the latest available month
    const [selectedMonths, setSelectedMonths] = useState<Set<string>>(new Set())
    
    useEffect(() => {
        if (availableMonths.length > 0 && selectedMonths.size === 0) {
            setSelectedMonths(new Set([availableMonths[availableMonths.length - 1]]))
        }
    }, [availableMonths, selectedMonths.size])

    const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("ALL")
    const [checkedRegions, setCheckedRegions] = useState<Set<string>>(new Set())

    // Synchronize selectedMonths when availableMonths changes (Hydration fix)
    useEffect(() => {
        if (availableMonths.length > 0 && Array.from(selectedMonths).every(m => m === "" || !availableMonths.includes(m))) {
            setSelectedMonths(new Set([availableMonths[availableMonths.length - 1]]));
        }
    }, [availableMonths, selectedMonths])

    const handleMonthToggle = (m: string) => {
        setSelectedMonths(prev => {
            const next = new Set(prev);
            if (next.has(m) && next.size > 1) { // Prevent unselecting last item
                next.delete(m);
            } else {
                next.add(m);
            }
            return next;
        });
    }

    const handleRegionToggle = (r: string) => {
        setCheckedRegions(prev => {
            const next = new Set(prev);
            if (next.has(r)) next.delete(r);
            else next.add(r);
            return next;
        });
    }

    // 1. Get raw breakdown (supports multiple months)
    const allBreakdown = useMemo(() => {
        if (!selectedMonths.size || !rawData.length) return []
        return generateTeamBreakdown(rawData, Array.from(selectedMonths))
    }, [rawData, selectedMonths])

    // 2. Filter by Category
    const { categoryFilteredBreakdown, availableRegionsForCategory } = useMemo(() => {
        let validRegions: string[] = []
        if (selectedCategory === "현장") validRegions = hyunjangRegions
        else if (selectedCategory === "소액") validRegions = soaekRegions
        else if (selectedCategory === "조치") validRegions = jochiRegions
        else validRegions = allUniqueRegions

        const filtered = allBreakdown.filter(r => validRegions.includes(r.region))
        const activeRegions = Array.from(new Set(filtered.map(r => r.region))).sort()

        return { categoryFilteredBreakdown: filtered, availableRegionsForCategory: activeRegions }
    }, [allBreakdown, selectedCategory, hyunjangRegions, soaekRegions, jochiRegions, allUniqueRegions])

    // Update checked regions when category changes
    useEffect(() => {
        setCheckedRegions(new Set(availableRegionsForCategory))
    }, [availableRegionsForCategory])

    // 3. Final filtering by checkboxes (for team details table)
    const finalBreakdown = useMemo(() => {
        const result = categoryFilteredBreakdown.filter(r => checkedRegions.has(r.region))
        result.sort((a, b) => {
            if (a.region !== b.region) return a.region.localeCompare(b.region)
            return (b.normalCost + b.extraCost) - (a.normalCost + a.extraCost)
        })
        return result
    }, [categoryFilteredBreakdown, checkedRegions])

    // 4. Data for Region Average Chart & Region Summary Table (ignores checkedRegions)
    const regionSummaryData = useMemo(() => {
        const regionMap = new Map<string, any>()

        categoryFilteredBreakdown.forEach(r => {
            const total = r.normalCost + r.extraCost
            if (!regionMap.has(r.region)) {
                regionMap.set(r.region, { totalResult: r.resultAmount, totalNormal: r.normalCost, totalExtra: r.extraCost, totalTotal: total, teamCount: 1 })
            } else {
                const prev = regionMap.get(r.region)!
                prev.totalResult += r.resultAmount
                prev.totalNormal += r.normalCost
                prev.totalExtra += r.extraCost
                prev.totalTotal += total
                prev.teamCount += 1
            }
        })

        const arr = Array.from(regionMap.entries()).map(([region, data]) => ({
            region,
            totalResult: data.totalResult,
            avgResult: data.totalResult / data.teamCount,
            totalNormal: data.totalNormal,
            avgNormal: data.totalNormal / data.teamCount,
            totalExtra: data.totalExtra,
            avgExtra: data.totalExtra / data.teamCount,
            totalTotal: data.totalTotal,
            avgTotal: data.totalTotal / data.teamCount,
            teamCount: data.teamCount
        }))

        return arr.sort((a, b) => b.avgTotal - a.avgTotal)
    }, [categoryFilteredBreakdown])


    const fmtCurrency = (v: number) => `₩${Math.round(v).toLocaleString('ko-KR')}`
    const fmtM = (v: number) => `₩${(v / 10000).toLocaleString('ko-KR', { maximumFractionDigits: 0 })}만`


    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                    권역별 실적 분석
                    <span className={`text-[10px] font-normal px-2 py-0.5 rounded border mt-1 ${rawData.length === 0 ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse' : 'bg-white/5 text-gray-500 border-white/10'}`}>
                        {rawData.length.toLocaleString()} rows | {availableMonths.length} months
                    </span>
                </h2>

                <div className="flex flex-wrap items-center gap-3">
                    <MultiSelectDropdown
                        label="월별 필터 (다중)"
                        options={availableMonths}
                        selected={selectedMonths}
                        onChange={handleMonthToggle}
                    />

                    <select
                        className="bg-[rgba(255,255,255,0.05)] border border-[var(--border)] text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block px-3 py-3 outline-none min-w-[120px]"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value as CategoryFilter)}
                    >
                        <option value="ALL" className="bg-[#1a1a24]">전체 그룹</option>
                        <option value="현장" className="bg-[#1a1a24]">경인 현장</option>
                        <option value="소액" className="bg-[#1a1a24]">경인 소액</option>
                        <option value="조치" className="bg-[#1a1a24]">조치/기타</option>
                    </select>

                    <MultiSelectDropdown
                        label="상세 권역 필터"
                        options={availableRegionsForCategory}
                        selected={checkedRegions}
                        onChange={handleRegionToggle}
                    />
                </div>
            </div>

            {/* Diagnostic Alerts */}
            {rawData.length === 0 && (
                <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-200 text-sm flex items-start gap-3">
                    <div className="mt-0.5 p-1 rounded bg-rose-500/20">⚠️</div>
                    <div>
                        <p className="font-bold mb-1">Raw Data 로드 실패 (0 rows)</p>
                        <p className="text-xs opacity-80">서버에서 구글 시트 데이터를 가져오지 못했습니다. 시트 권한 설정이나 서버의 외부 네트워크 연결 상태를 확인해 주세요.</p>
                    </div>
                </div>
            )}

            {rawData.length > 0 && availableMonths.length > 0 && Array.from(selectedMonths).every(m => !rawData.some(r => r.yearMonth === m)) && (
                <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-200 text-sm flex items-start gap-3">
                    <div className="mt-0.5 p-1 rounded bg-amber-500/20">ℹ️</div>
                    <div>
                        <p className="font-bold mb-1">데이터 불일치 감지</p>
                        <p className="text-xs opacity-80">선택된 월({Array.from(selectedMonths).join(', ')})에 해당하는 실적 데이터가 Raw Data에 존재하지 않습니다. 상단 필터에서 다른 월을 선택해 보세요.</p>
                    </div>
                </div>
            )}

            {/* Region Averages Chart */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 backdrop-blur-sm shadow-sm"
            >
                <div className="mb-6 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        권역별 시공비 평균 차트
                        <span className="text-xs font-normal text-gray-500 bg-gray-500/10 px-2 py-0.5 rounded-full border border-gray-500/20">대분류 그룹 필터만 적용</span>
                    </h3>
                </div>
                <div className="h-[350px] w-full relative">
                    {/* Fixed height container for Recharts stability */}
                    {mounted ? (
                        <ResponsiveContainer width="99%" height="99%" key={regionSummaryData.length}>
                            <BarChart data={regionSummaryData} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="region" stroke="#525252" tickLine={false} axisLine={false} tick={{ fill: '#a1a1aa', fontSize: 11 }} />
                                <YAxis stroke="#525252" tickLine={false} axisLine={false} tick={{ fill: '#a1a1aa', fontSize: 11 }} tickFormatter={(v) => `${(v / 10000).toFixed(0)}만`} />

                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                                    contentStyle={{ backgroundColor: 'rgba(20,20,23,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff' }}
                                    formatter={(value: any, name: any) => [fmtCurrency(Number(value)), name]}
                                />
                                <Legend wrapperStyle={{ color: '#a1a1aa', fontSize: 12, paddingTop: '10px' }} />

                                <Bar name="평균 전체시공비" dataKey="avgTotal" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={20} />
                                <Bar name="평균 정상시공비" dataKey="avgNormal" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                                <Bar name="평균 기타시공비" dataKey="avgExtra" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-white/5 rounded-lg animate-pulse" />
                    )}
                </div>
            </motion.div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Region Summary Table */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] p-0 backdrop-blur-sm shadow-sm overflow-hidden flex flex-col h-[500px]"
                >
                    <div className="px-6 py-4 bg-[rgba(255,255,255,0.02)] border-b border-[var(--border)] shrink-0">
                        <h3 className="text-base font-semibold text-white flex items-center gap-2">
                            권역별 상세 실적표
                            <span className="text-xs font-normal text-gray-500 bg-gray-500/10 px-2 py-0.5 rounded-full border border-gray-500/20">대분류 그룹 필터</span>
                        </h3>
                    </div>

                    <div className="flex-1 overflow-auto custom-scrollbar">
                        <table className="w-full text-left text-[11px] sm:text-xs">
                            <thead className="bg-[var(--card)]/90 backdrop-blur-md border-b border-[var(--border)] sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="px-4 py-3 text-gray-400 font-medium whitespace-nowrap bg-[var(--card)]">권역</th>
                                    <th className="px-4 py-3 text-emerald-400 font-medium text-right whitespace-nowrap bg-[var(--card)]">시공결과<br /><span className="text-[10px] text-gray-500 font-normal">(전체/평균)</span></th>
                                    <th className="px-4 py-3 text-indigo-400 font-medium text-right whitespace-nowrap bg-[var(--card)]">전체시공비<br /><span className="text-[10px] text-gray-500 font-normal">(전체/평균)</span></th>
                                    <th className="px-4 py-3 text-gray-300 font-medium text-right whitespace-nowrap bg-[var(--card)]">정상시공비<br /><span className="text-[10px] text-gray-500 font-normal">(전체/평균)</span></th>
                                    <th className="px-4 py-3 text-rose-400 font-medium text-right whitespace-nowrap bg-[var(--card)]">기타시공비<br /><span className="text-[10px] text-gray-500 font-normal">(전체/평균)</span></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border)]">
                                {regionSummaryData.length === 0 ? (
                                    <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">데이터가 없습니다.</td></tr>
                                ) : (
                                    regionSummaryData.map((row, i) => (
                                        <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="px-4 py-3 text-gray-200 font-medium">{row.region} <span className="text-[10px] text-gray-500 ml-1">({row.teamCount}팀)</span></td>

                                            <td className="px-4 py-3 text-right">
                                                <div className="font-mono text-emerald-300">{fmtM(row.totalResult)}</div>
                                                <div className="font-mono text-[10px] text-emerald-500">{fmtM(row.avgResult)}</div>
                                            </td>

                                            <td className="px-4 py-3 text-right">
                                                <div className="font-mono text-indigo-300">{fmtM(row.totalTotal)}</div>
                                                <div className="font-mono text-[10px] text-indigo-500">{fmtM(row.avgTotal)}</div>
                                            </td>

                                            <td className="px-4 py-3 text-right">
                                                <div className="font-mono text-gray-300">{fmtM(row.totalNormal)}</div>
                                                <div className="font-mono text-[10px] text-gray-500">{fmtM(row.avgNormal)}</div>
                                            </td>

                                            <td className="px-4 py-3 text-right">
                                                <div className="font-mono text-rose-300">{fmtM(row.totalExtra)}</div>
                                                <div className="font-mono text-[10px] text-rose-500">{fmtM(row.avgExtra)}</div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </motion.div>

                {/* Team Details Table */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] p-0 backdrop-blur-sm shadow-sm overflow-hidden flex flex-col h-[500px]"
                >
                    <div className="px-6 py-4 bg-[rgba(255,255,255,0.02)] border-b border-[var(--border)] shrink-0 flex items-center justify-between">
                        <h3 className="text-base font-semibold text-white flex items-center gap-2">
                            팀별 상세 실적표
                            <span className="text-xs font-normal text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">상세 권역 필터</span>
                        </h3>
                    </div>

                    <div className="flex-1 overflow-auto custom-scrollbar">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-[var(--card)]/90 backdrop-blur-md border-b border-[var(--border)] sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="px-4 py-3 text-gray-400 font-medium whitespace-nowrap bg-[var(--card)]">소속</th>
                                    <th className="px-4 py-3 text-emerald-400 font-medium text-right whitespace-nowrap bg-[var(--card)]">시공결과금액(원)</th>
                                    <th className="px-4 py-3 text-indigo-400 font-medium text-right whitespace-nowrap bg-[var(--card)]">전체 시공비(원)</th>
                                    <th className="px-4 py-3 text-gray-300 font-medium text-right whitespace-nowrap bg-[var(--card)]">정상시공비(원)</th>
                                    <th className="px-4 py-3 text-rose-400 font-medium text-right whitespace-nowrap bg-[var(--card)]">기타시공비(원)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border)]">
                                {finalBreakdown.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                            조회되는 데이터가 없습니다.
                                        </td>
                                    </tr>
                                ) : (
                                    finalBreakdown.map((row, i) => (
                                        <tr key={`${row.region}-${row.team}-${i}`} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="px-4 py-2">
                                                <div className="font-medium text-gray-300 truncate max-w-[120px]">{row.team}</div>
                                                <div className="text-[10px] text-gray-500">{row.region}</div>
                                            </td>
                                            <td className="px-4 py-2 text-right font-mono text-emerald-300">
                                                {fmtCurrency(row.resultAmount)}
                                            </td>
                                            <td className="px-4 py-2 text-right font-mono text-indigo-300">
                                                {fmtCurrency(row.normalCost + row.extraCost)}
                                            </td>
                                            <td className="px-4 py-2 text-right font-mono text-gray-300">
                                                {fmtCurrency(row.normalCost)}
                                            </td>
                                            <td className="px-4 py-2 text-right font-mono text-rose-300">
                                                {fmtCurrency(row.extraCost)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}

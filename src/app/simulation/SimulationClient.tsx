"use client"

import React, { useState, useMemo, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import * as XLSX from "xlsx"
import { UploadCloud, Save, History, Play, AlertTriangle, AlertCircle, CheckCircle2 } from "lucide-react"
import { 
    SimulationConfig, 
    DEFAULT_SIMULATION_CONFIG, 
    RawDataRow, 
    processSimulationRow 
} from "@/lib/simulation-engine"
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, ReferenceLine
} from "recharts"
import { supabase } from "@/lib/supabase"

export function SimulationClient() {
    const [config, setConfig] = useState<SimulationConfig>(DEFAULT_SIMULATION_CONFIG)
    const [isParsing, setIsParsing] = useState(false)
    const [rawRows, setRawRows] = useState<RawDataRow[]>([])
    const [isSaving, setIsSaving] = useState(false)
    const [scenarioName, setScenarioName] = useState("")
    const [showSaveModal, setShowSaveModal] = useState(false)

    // Handle File Drop
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsParsing(true);
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

                // Parse standard format starting from row 1 (1-indexed)
                const headers = data[0];
                const parsed: RawDataRow[] = [];

                for (let i = 1; i < data.length; i++) {
                    const row = data[i];
                    if (!row || row.length < 10) continue;
                    
                    // Col indexes based on [시공일자, 요일, 주야, 브랜드1, 브랜드2, 대리점, 확정시간(6), 현장여부(7), 수주금액(8), 건명(9), 주소(10), 권역시공팀(11), 시공팀(12), 맵핑(13), 지급시공비(14)]
                    const timeStr = row[6] ? String(row[6]) : "";
                    if (!timeStr) continue;

                    const isField = String(row[7]).toUpperCase() === 'Y';
                    
                    let originalPay = Number(row[14]);
                    if (isNaN(originalPay)) originalPay = 0;

                    parsed.push({
                        date: String(row[0]),
                        dayOfWeek: String(row[1]),
                        timeStr: timeStr,
                        isField: isField,
                        regionTeam: String(row[11]),
                        team: String(row[12]),
                        originalPay: originalPay,
                        // dummy defaults for computed fields
                        timeCategory: "주간",
                        simulatedCharge: 0,
                        simulatedPay: 0
                    });
                }
                
                setRawRows(parsed);
            } catch (err) {
                console.error(err);
                alert("엑셀 파일 파싱 중 오류가 발생했습니다.");
            } finally {
                setIsParsing(false);
            }
        };
        reader.readAsBinaryString(file);
    };

    // Calculate simulated results
    const processedData = useMemo(() => {
        if (rawRows.length === 0) return [];
        return rawRows.map(r => processSimulationRow(r, config));
    }, [rawRows, config]);

    // Aggregate by Region
    const regionSummary = useMemo(() => {
        if (processedData.length === 0) return [];
        const acc = new Map<string, { currentPay: number, simPay: number, simCharge: number }>();

        processedData.forEach(row => {
            // Extract center (first 2 chars of regionTeam)
            // Wait, PRD 2.2 says M열(시공팀)의 앞 2글자. Let's use `team` (M열).
            const center = row.team.substring(0, 2);
            if (!acc.has(center)) {
                acc.set(center, { currentPay: 0, simPay: 0, simCharge: 0 });
            }
            const curr = acc.get(center)!;
            curr.currentPay += row.originalPay;
            curr.simPay += row.simulatedPay;
            curr.simCharge += row.simulatedCharge;
        });

        // Convert to array and calc diff
        return Array.from(acc.entries()).map(([center, values]) => {
            const diffPay = values.simPay - values.currentPay;
            const diffPayPercent = values.currentPay > 0 ? (diffPay / values.currentPay) * 100 : 0;
            return {
                center,
                ...values,
                diffPay,
                diffPayPercent
            };
        }).sort((a,b) => b.currentPay - a.currentPay);
    }, [processedData]);

    const globalTotals = useMemo(() => {
        let currentPay = 0;
        let simCharge = 0;
        let simPay = 0;
        
        regionSummary.forEach(r => {
            currentPay += r.currentPay;
            simCharge += r.simCharge;
            simPay += r.simPay;
        });

        const manualCosts = config.extraCosts.travel + config.extraCosts.equipment + config.extraCosts.others;
        const margin = simCharge - (simPay + manualCosts);

        return { currentPay, simCharge, simPay, manualCosts, margin };
    }, [regionSummary, config]);

    const alerts = useMemo(() => {
        let warning = 0;
        let danger = 0;
        regionSummary.forEach(r => {
            if (Math.abs(r.diffPayPercent) >= 10) danger++;
            else if (Math.abs(r.diffPayPercent) >= 5) warning++;
        });

        const isCritical = warning >= 10 || danger >= 5;
        return { warning, danger, isCritical };
    }, [regionSummary]);

    const handleSaveSnapshot = async () => {
        if (!scenarioName.trim()) return alert("시나리오 이름을 입력해주세요.");
        setIsSaving(true);
        try {
            const res = await supabase.from('simulation_scenarios').insert([{
                name: scenarioName,
                config: config,
                result_summary: {
                    globalTotals,
                    alerts
                }
            }]);
            if (res.error) throw res.error;
            alert("저장되었습니다!");
            setShowSaveModal(false);
            setScenarioName("");
        } catch (e: any) {
            alert("저장 실패: " + e.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleConfigChange = (section: keyof SimulationConfig, field: string, val: any) => {
        setConfig(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: val
            }
        }));
    };

    const fmt = (v: number) => `₩${Math.round(v).toLocaleString()}`;

    return (
        <div className="space-y-6">
            
            {/* Header & Upload */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[var(--card)] p-4 rounded-xl border border-[var(--border)]">
                <div>
                    <h3 className="text-lg font-semibold text-white">데이터 소스</h3>
                    <p className="text-xs text-gray-400">RAW DATA.xlsx 파일을 업로드하면 연산이 즉시 시작됩니다.</p>
                </div>
                <div>
                    <label className="cursor-pointer bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 border border-indigo-500/30">
                        {isParsing ? <Play className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                        {rawRows.length > 0 ? `다시 업로드 (${rawRows.length.toLocaleString()}건 완료)` : '파일 업로드 (RAW DATA.xlsx)'}
                        <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleFileUpload} />
                    </label>
                </div>
            </div>

            {alerts.isCritical && (
                <motion.div initial={{ opacity:0, y:-10 }} animate={{opacity:1, y:0}} className="bg-rose-500/20 border border-rose-500/50 p-4 rounded-xl flex items-start gap-4">
                    <AlertTriangle className="h-6 w-6 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                        <h4 className="text-rose-400 font-bold">부적합 편성 경고 (Critical Risk)</h4>
                        <p className="text-rose-300 text-sm mt-1">
                            변경 설정 적용 시 25년도 현행 기준 시공비와의 격차가 큰 권역이 다수 발견되었습니다. <br />
                            (주의 ±5%권역: {alerts.warning}개 / 위험 ±10%권역: {alerts.danger}개)<br />
                            해당 시간대 및 요율의 변경은 사업성에 적합하지 않는 것으로 판단됩니다. 재산정 필요합니다.
                        </p>
                    </div>
                </motion.div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                
                {/* Left Config Panel */}
                <div className="lg:col-span-1 space-y-4">
                    
                    {/* Time Panel */}
                    <div className="bg-[var(--card)] p-4 rounded-xl border border-[var(--border)]">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-semibold text-white">시간대 범위 설정</h3>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs text-gray-400">주간 시작~종료</label>
                                <div className="flex items-center gap-2 mt-1">
                                    <input type="time" className="bg-[#1a1a24] text-white border border-gray-700 rounded px-2 py-1 text-sm w-full" value={config.timeRange.dayStart} onChange={e=>handleConfigChange("timeRange", "dayStart", e.target.value)} />
                                    <span className="text-gray-500">~</span>
                                    <input type="time" className="bg-[#1a1a24] text-white border border-gray-700 rounded px-2 py-1 text-sm w-full" value={config.timeRange.dayEnd} onChange={e=>handleConfigChange("timeRange", "dayEnd", e.target.value)} />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-gray-400">심야 시작~종료 (나머지는 야간)</label>
                                <div className="flex items-center gap-2 mt-1">
                                    <input type="time" className="bg-[#1a1a24] text-white border border-gray-700 rounded px-2 py-1 text-sm w-full" value={config.timeRange.nightStart2} onChange={e=>handleConfigChange("timeRange", "nightStart2", e.target.value)} />
                                    <span className="text-gray-500">~</span>
                                    <input type="time" className="bg-[#1a1a24] text-white border border-gray-700 rounded px-2 py-1 text-sm w-full" value={config.timeRange.nightEnd2} onChange={e=>handleConfigChange("timeRange", "nightEnd2", e.target.value)} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Rates Panel */}
                    <div className="bg-[var(--card)] p-4 rounded-xl border border-[var(--border)]">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-semibold text-white">주/야 요율 설정 (%)</h3>
                        </div>
                        
                        <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                            {/* Weekday Day */}
                            <div className="bg-white/5 p-3 rounded border border-white/10">
                                <h4 className="text-xs font-medium text-emerald-400 mb-2">주중 주간</h4>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div><label className="text-gray-500">청구</label><input type="number" value={config.rates.weekdayDay.charge} onChange={e=>handleConfigChange("rates", "weekdayDay", { ...config.rates.weekdayDay, charge: Number(e.target.value) })} className="w-full bg-[#1a1a24] border border-gray-700 px-2 py-1 rounded text-white" /></div>
                                    <div><label className="text-gray-500">지급</label><input type="number" value={config.rates.weekdayDay.pay} onChange={e=>handleConfigChange("rates", "weekdayDay", { ...config.rates.weekdayDay, pay: Number(e.target.value) })} className="w-full bg-[#1a1a24] border border-gray-700 px-2 py-1 rounded text-white" /></div>
                                </div>
                            </div>
                            {/* Weekday Night */}
                            <div className="bg-white/5 p-3 rounded border border-white/10">
                                <h4 className="text-xs font-medium text-indigo-400 mb-2">주중 야간</h4>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div><label className="text-gray-500">청구</label><input type="number" value={config.rates.weekdayNight.charge} onChange={e=>handleConfigChange("rates", "weekdayNight", { ...config.rates.weekdayNight, charge: Number(e.target.value) })} className="w-full bg-[#1a1a24] border border-gray-700 px-2 py-1 rounded text-white" /></div>
                                    <div><label className="text-gray-500">지급</label><input type="number" value={config.rates.weekdayNight.pay} onChange={e=>handleConfigChange("rates", "weekdayNight", { ...config.rates.weekdayNight, pay: Number(e.target.value) })} className="w-full bg-[#1a1a24] border border-gray-700 px-2 py-1 rounded text-white" /></div>
                                </div>
                            </div>
                            {/* Weekday Late Night */}
                            <div className="bg-white/5 p-3 rounded border border-white/10">
                                <h4 className="text-xs font-medium text-purple-400 mb-2">주중 심야</h4>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div><label className="text-gray-500">청구</label><input type="number" value={config.rates.weekdayLateNight.charge} onChange={e=>handleConfigChange("rates", "weekdayLateNight", { ...config.rates.weekdayLateNight, charge: Number(e.target.value) })} className="w-full bg-[#1a1a24] border border-gray-700 px-2 py-1 rounded text-white" /></div>
                                    <div><label className="text-gray-500">지급</label><input type="number" value={config.rates.weekdayLateNight.pay} onChange={e=>handleConfigChange("rates", "weekdayLateNight", { ...config.rates.weekdayLateNight, pay: Number(e.target.value) })} className="w-full bg-[#1a1a24] border border-gray-700 px-2 py-1 rounded text-white" /></div>
                                </div>
                            </div>

                            {/* Weekend Day */}
                            <div className="bg-white/5 p-3 rounded border border-white/10">
                                <h4 className="text-xs font-medium text-emerald-400 mb-2">주말 주간 (현장/소액 다름)</h4>
                                <div className="space-y-2 text-xs">
                                    <div><label className="text-gray-500">청구 (공통)</label><input type="number" value={config.rates.weekendDay.charge} onChange={e=>handleConfigChange("rates", "weekendDay", { ...config.rates.weekendDay, charge: Number(e.target.value) })} className="w-full bg-[#1a1a24] border border-gray-700 px-2 py-1 rounded text-white" /></div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div><label className="text-gray-500">지급 (현장)</label><input type="number" value={config.rates.weekendDay.payField} onChange={e=>handleConfigChange("rates", "weekendDay", { ...config.rates.weekendDay, payField: Number(e.target.value) })} className="w-full bg-[#1a1a24] border border-gray-700 px-2 py-1 rounded text-white" /></div>
                                        <div><label className="text-gray-500">지급 (소액)</label><input type="number" value={config.rates.weekendDay.paySmall} onChange={e=>handleConfigChange("rates", "weekendDay", { ...config.rates.weekendDay, paySmall: Number(e.target.value) })} className="w-full bg-[#1a1a24] border border-gray-700 px-2 py-1 rounded text-white" /></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[var(--card)] p-4 rounded-xl border border-[var(--border)]">
                        <button onClick={() => setShowSaveModal(true)} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg py-2 text-sm font-semibold flex items-center justify-center gap-2 transition-colors">
                            <Save className="h-4 w-4" /> 현재 결과 스냅샷 저장
                        </button>
                    </div>

                </div>

                {/* Right Viz Panel */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Top Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-[var(--card)] p-5 rounded-xl border border-[var(--border)] flex flex-col justify-between">
                            <span className="text-sm text-gray-400">현행 지급 용역료 총액</span>
                            <span className="text-2xl font-mono text-white mt-2">{fmt(globalTotals.currentPay)}</span>
                        </div>
                        <div className="bg-[var(--card)] p-5 rounded-xl border border-[var(--border)] flex flex-col justify-between relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-3 opacity-20">
                                <Play className="h-16 w-16 text-indigo-400" />
                            </div>
                            <span className="text-sm text-indigo-300">시뮬레이션 지급 총액</span>
                            <span className="text-2xl font-mono text-indigo-400 mt-2">{fmt(globalTotals.simPay)}</span>
                            <div className="text-xs text-indigo-500/80 mt-1">차액: {fmt(globalTotals.simPay - globalTotals.currentPay)}</div>
                        </div>
                        <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/10 p-5 rounded-xl border border-emerald-500/30 flex flex-col justify-between">
                            <span className="text-sm text-emerald-400 font-bold">예상 공헌이익 (수익)</span>
                            <span className="text-2xl font-mono text-emerald-300 mt-2">{fmt(globalTotals.margin)}</span>
                            <div className="text-[10px] text-emerald-500/80 mt-1">청구({fmt(globalTotals.simCharge)}) - 지급({fmt(globalTotals.simPay)})</div>
                        </div>
                    </div>

                    {/* Chart Area */}
                    <div className="bg-[var(--card)] p-6 rounded-xl border border-[var(--border)] h-[400px]">
                        <h3 className="text-sm font-semibold text-white mb-4">센터별 지급 시공비 증감 시뮬레이션</h3>
                        {regionSummary.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={regionSummary} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis dataKey="center" stroke="#525252" tick={{ fill: '#a1a1aa', fontSize: 12 }} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#525252" tick={{ fill: '#a1a1aa', fontSize: 11 }} tickFormatter={(v) => `${(v/10000).toFixed(0)}만`} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'rgba(20,20,23,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px' }}
                                        formatter={(val: any) => fmt(Number(val))}
                                    />
                                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                                    <Bar dataKey="currentPay" name="현행 기준 지급비" fill="#3f3f46" radius={[4,4,0,0]} barSize={30} />
                                    <Bar dataKey="simPay" name="시뮬레이션 지급비" fill="#6366f1" radius={[4,4,0,0]} barSize={30}>
                                        {regionSummary.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={Math.abs(entry.diffPayPercent) >= 10 ? '#f43f5e' : (Math.abs(entry.diffPayPercent) >= 5 ? '#f59e0b' : '#6366f1')} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
                                <UploadCloud className="h-10 w-10 mb-2 opacity-50" />
                                <p>엑셀 파일을 업로드하면 시뮬레이션이 시작됩니다.</p>
                            </div>
                        )}
                    </div>

                    {/* Table */}
                    {regionSummary.length > 0 && (
                        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm whitespace-nowrap">
                                    <thead className="bg-white/5 border-b border-white/10">
                                        <tr>
                                            <th className="px-4 py-3 text-gray-400 font-medium">센터 (시공팀)</th>
                                            <th className="px-4 py-3 text-gray-400 font-medium text-right">현행 지급비</th>
                                            <th className="px-4 py-3 text-indigo-400 font-medium text-right">예상 지급비</th>
                                            <th className="px-4 py-3 text-white font-medium text-right">차액</th>
                                            <th className="px-4 py-3 text-white font-medium text-right">증감률</th>
                                            <th className="px-4 py-3 text-gray-400 font-medium text-center">판정</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {regionSummary.map(row => (
                                            <tr key={row.center} className="hover:bg-white/[0.02]">
                                                <td className="px-4 py-3 text-gray-200 font-medium">{row.center}</td>
                                                <td className="px-4 py-3 text-right font-mono text-gray-400">{fmt(row.currentPay)}</td>
                                                <td className="px-4 py-3 text-right font-mono text-indigo-300">{fmt(row.simPay)}</td>
                                                <td className={`px-4 py-3 text-right font-mono ${row.diffPay > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                                    {row.diffPay > 0 ? '+' : ''}{fmt(row.diffPay)}
                                                </td>
                                                <td className={`px-4 py-3 text-right font-mono ${row.diffPayPercent > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                                    {row.diffPayPercent > 0 ? '+' : ''}{row.diffPayPercent.toFixed(1)}%
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    {Math.abs(row.diffPayPercent) >= 10 ? (
                                                        <span className="inline-flex items-center gap-1 bg-rose-500/20 text-rose-400 px-2 py-1 rounded text-xs font-bold"><AlertTriangle className="w-3 h-3"/> 경고</span>
                                                    ) : Math.abs(row.diffPayPercent) >= 5 ? (
                                                        <span className="inline-flex items-center gap-1 bg-amber-500/20 text-amber-400 px-2 py-1 rounded text-xs font-bold"><AlertCircle className="w-3 h-3"/> 주의</span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded text-xs"><CheckCircle2 className="w-3 h-3"/> 적정</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                </div>
            </div>

            {/* Save Modal */}
            {showSaveModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <motion.div initial={{ scale:0.95, opacity:0 }} animate={{ scale:1, opacity:1 }} className="bg-[#1a1a24] border border-gray-700 p-6 rounded-xl w-full max-w-md shadow-2xl">
                        <h2 className="text-xl font-bold text-white mb-2">시나리오 스냅샷 저장</h2>
                        <p className="text-sm text-gray-400 mb-6">현재 설정된 시간대와 요율, 그리고 이에 따른 시뮬레이션 결과 요약을 데이터베이스에 영구 기록합니다.</p>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">시나리오 이름지정</label>
                                <input type="text" placeholder="예: 주간 축소 및 주말 심야 200% 상향안" value={scenarioName} onChange={e => setScenarioName(e.target.value)} className="w-full bg-black/20 border border-gray-700 px-3 py-2 rounded-lg text-white" />
                            </div>
                            
                            <div className="flex gap-3 justify-end mt-6">
                                <button onClick={() => setShowSaveModal(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">취소</button>
                                <button onClick={handleSaveSnapshot} disabled={isSaving} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                                    {isSaving ? <Play className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    저장하기
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

        </div>
    )
}

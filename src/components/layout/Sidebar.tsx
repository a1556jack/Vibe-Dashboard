"use client"

import { BarChart3, Receipt, Moon, Truck, Shield, Wallet, Users, RefreshCw, GraduationCap, Calculator } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const navigation = [
    { name: "경인 퍼시스 채산_종합", href: "/", icon: BarChart3 },
    { name: "경인 청구", href: "/billing", icon: Receipt },
    { name: "경인 퍼시스 심야 시공 비율", href: "/nightwork-ratio", icon: Moon },
    { name: "경인 퍼시스 장비 비용", href: "/equipment", icon: Truck },
    { name: "경인 심야시공 지급 상한", href: "/nightwork-cap", icon: Shield },
    { name: "경인 출장비/기타지원", href: "/travel-support", icon: Wallet },
    { name: "권역별 실적 분석", href: "/team-performance", icon: Users },
    { name: "수익성 시뮬레이션", href: "/simulation", icon: Calculator },
    { name: "AI 봇 훈련센터", href: "/ai-training", icon: GraduationCap },
]

export function Sidebar() {
    const pathname = usePathname()
    const [isSyncing, setIsSyncing] = useState(false)

    const handleSync = async () => {
        setIsSyncing(true)
        try {
            const res = await fetch('/api/admin/sync', { method: 'POST' })
            const data = await res.json()
            if (data.success) {
                alert('동기화 완료!')
                window.location.reload()
            } else {
                alert('오류 발생: ' + data.error)
            }
        } catch (err) {
            alert('네트워크 오류')
        } finally {
            setIsSyncing(false)
        }
    }

    return (
        <div className="flex h-screen w-72 flex-col justify-between border-r border-[var(--border)] bg-[var(--sidebar)] p-4 text-[var(--sidebar-foreground)]">
            <div>
                <div className="mb-8 flex items-center gap-2 px-2">
                    <div className="h-8 w-8 rounded-lg bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>
                    <span className="text-lg font-bold text-white tracking-tight">경인 퍼시스</span>
                </div>
                <nav className="space-y-1">
                    {navigation.map((item) => {
                        const Icon = item.icon
                        const isActive = pathname === item.href
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                                    isActive
                                        ? "bg-[rgba(255,255,255,0.08)] text-white shadow-sm"
                                        : "hover:bg-[rgba(255,255,255,0.04)] hover:text-white text-gray-400"
                                )}
                            >
                                <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-indigo-400" : "text-gray-500")} />
                                <span className="truncate">{item.name}</span>
                            </Link>
                        )
                    })}
                </nav>
            </div>
            
            <div className="mt-8 border-t border-[rgba(255,255,255,0.1)] pt-4 mb-4 px-2">
                <button 
                    onClick={handleSync} 
                    disabled={isSyncing}
                    className={cn(
                        "flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                        isSyncing 
                            ? "bg-indigo-500/20 text-indigo-300 cursor-not-allowed" 
                            : "bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20"
                    )}
                >
                    <RefreshCw className={cn("h-4 w-4 shrink-0", isSyncing && "animate-spin")} />
                    <span>{isSyncing ? "동기화 진행 중..." : "데이터 동기화 (Sync)"}</span>
                </button>
            </div>
        </div>
    )
}

"use client"

import { BarChart3, Receipt, Moon, Truck, Shield, Wallet, Users } from "lucide-react"
import Link from "next/link"
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
]

export function Sidebar() {
    const pathname = usePathname()

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
        </div>
    )
}

"use client"

import { motion } from "framer-motion"

interface StatCardProps {
    title: string
    value: string
    change: string
    trend: "up" | "down" | "neutral"
    icon: React.ReactNode
}

export function StatCard({ title, value, change, trend, icon }: StatCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5 }}
            transition={{ duration: 0.2 }}
            className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 backdrop-blur-sm shadow-lg hover:shadow-indigo-500/10 hover:border-indigo-500/30"
        >
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-400">{title}</p>
                    <h3 className="mt-2 text-3xl font-bold text-white tracking-tight">{value}</h3>
                </div>
                <div className="rounded-xl bg-indigo-500/10 p-3 ring-1 ring-indigo-500/20">
                    {icon}
                </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
                <span className={`text-sm font-medium flex items-center gap-1 ${trend === 'up' ? 'text-emerald-400' :
                    trend === 'down' ? 'text-red-400' : 'text-gray-400'
                    }`}>
                    {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {change}
                </span>
                <span className="text-sm text-gray-500">vs last month</span>
            </div>
        </motion.div>
    )
}

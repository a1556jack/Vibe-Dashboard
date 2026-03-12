"use client"

import { motion } from "framer-motion"

const activities = [
    {
        id: 1,
        user: "Alice Smith",
        action: "deployed",
        target: "Production Server",
        time: "2h ago",
        avatar: "AS",
        color: "bg-emerald-500/20 text-emerald-400"
    },
    {
        id: 2,
        user: "Bob Jones",
        action: "pushed",
        target: "main",
        time: "4h ago",
        avatar: "BJ",
        color: "bg-blue-500/20 text-blue-400"
    },
    {
        id: 3,
        user: "Charlie Brown",
        action: "completed",
        target: "Task #1234",
        time: "5h ago",
        avatar: "CB",
        color: "bg-purple-500/20 text-purple-400"
    },
    {
        id: 4,
        user: "David Lee",
        action: "reviewed",
        target: "PR #882",
        time: "8h ago",
        avatar: "DL",
        color: "bg-orange-500/20 text-orange-400"
    },
]

export function RecentActivity() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="col-span-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 backdrop-blur-sm lg:col-span-1 shadow-sm"
        >
            <h3 className="mb-6 text-lg font-semibold text-white">Recent Activity</h3>
            <div className="space-y-6">
                {activities.map((item) => (
                    <div key={item.id} className="flex items-start gap-4">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${item.color}`}>
                            {item.avatar}
                        </div>
                        <div>
                            <p className="text-sm font-medium text-white">
                                {item.user} <span className="text-gray-500">{item.action}</span>
                            </p>
                            <p className="text-xs text-indigo-400 font-medium">{item.target}</p>
                            <p className="text-xs text-gray-500 mt-1">{item.time}</p>
                        </div>
                    </div>
                ))}
                <button className="w-full py-2 mt-4 text-sm font-medium text-center text-gray-400 transition-colors rounded-lg hover:text-white hover:bg-white/5">
                    View All Activity
                </button>
            </div>
        </motion.div>
    )
}

"use client"

import { Bell, Search } from "lucide-react"

export function Topbar() {
    return (
        <header className="sticky top-0 z-10 flex h-16 w-full items-center justify-between border-b border-[var(--border)] bg-[rgba(15,15,18,0.6)] px-6 backdrop-blur-xl">
            <div className="flex items-center gap-4">
                <h1 className="text-xl font-semibold text-white tracking-tight">Overview</h1>
            </div>
            <div className="flex items-center gap-4">
                <div className="relative hidden md:block">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="h-9 w-64 rounded-full border border-[var(--border)] bg-[rgba(255,255,255,0.03)] pl-9 pr-4 text-sm text-[var(--foreground)] outline-none focus:border-indigo-500/50 focus:bg-[rgba(255,255,255,0.05)] transition-all"
                    />
                </div>
                <button className="relative rounded-full p-2 hover:bg-[rgba(255,255,255,0.05)] transition-colors">
                    <Bell className="h-5 w-5 text-gray-400" />
                    <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-indigo-500 ring-2 ring-[var(--background)]"></span>
                </button>
                <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 ring-2 ring-[var(--border)] cursor-pointer"></div>
            </div>
        </header>
    )
}

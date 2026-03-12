"use client"

import { motion } from "framer-motion"
import { Loader2 } from "lucide-react"

export default function Loading() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] w-full space-y-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                    duration: 0.5,
                    repeat: Infinity,
                    repeatType: "reverse"
                }}
                className="relative flex items-center justify-center"
            >
                <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full" />
                <Loader2 className="h-10 w-10 text-indigo-500 animate-spin relative z-10" />
            </motion.div>

            <div className="space-y-2 text-center">
                <h2 className="text-lg font-semibold text-white/90">데이터 시각화 준비 중</h2>
                <p className="text-sm text-gray-500 animate-pulse">Google Sheets에서 최신 정보를 가져오고 있습니다...</p>
            </div>

            {/* Skeleton-like placeholders to reduce layout shift */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-5xl mt-8 px-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-32 rounded-xl bg-white/[0.03] border border-white/[0.05] animate-pulse" />
                ))}
            </div>
        </div>
    )
}

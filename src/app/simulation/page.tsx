import { SimulationClient } from "./SimulationClient"

export const metadata = {
    title: '요금 체계 개편 시뮬레이션 | Vibe Dashboard',
    description: '퍼시스 시공 용역료 체계 개편 시뮬레이션 프로그램',
}

export default function SimulationPage() {
    return (
        <div className="flex-1 space-y-6 p-4 pt-6 md:p-8 md:pt-8 bg-[var(--background)]">
            <div className="flex flex-col space-y-2">
                <h2 className="text-3xl font-bold tracking-tight text-white">수익성 시뮬레이션 🧪</h2>
                <p className="text-gray-400 text-sm">
                    RAW DATA 시트를 업로드하고 요율 및 시간대를 변경하여 비용 증감을 실시간으로 시뮬레이션 해보세요.
                </p>
            </div>
            
            <SimulationClient />
        </div>
    )
}

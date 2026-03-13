"use client"

import React, { Component, ErrorInfo, ReactNode } from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"

interface Props {
    children: ReactNode
}

interface State {
    hasError: boolean
    error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    }

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error }
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo)
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/5 p-8 text-center">
                    <div className="mb-4 rounded-full bg-rose-500/10 p-3 text-rose-500">
                        <AlertTriangle className="h-8 w-8" />
                    </div>
                    <h2 className="mb-2 text-xl font-bold text-white">애플리케이션 오류 발생</h2>
                    <p className="mb-6 text-sm text-gray-400 max-w-md">
                        화면을 불러오는 중 오류가 발생했습니다. 아래 메시지를 확인하거나 페이지를 새로고침해 주세요.
                    </p>
                    <div className="mb-6 w-full max-w-lg overflow-auto rounded-lg bg-black/40 p-4 text-left font-mono text-xs text-rose-300 border border-rose-500/20">
                        {this.state.error?.toString()}
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
                    >
                        <RefreshCw className="h-4 w-4" />
                        페이지 새로고침
                    </button>
                </div>
            )
        }

        return this.props.children
    }
}

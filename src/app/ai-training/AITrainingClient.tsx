"use client"

import { useState, useEffect, useRef } from "react"
import { Topbar } from "@/components/layout/Topbar"
import { Trash2, FileSpreadsheet, Plus, MessageSquare, Power, PowerOff, Upload, FileText, FileDown, ToggleLeft, ToggleRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface KnowledgeItem {
    id: string
    type: 'text_rule' | 'file_knowledge'
    title: string | null
    content: string
    file_name: string | null
    is_active: boolean
    created_at: string
}

export function AITrainingClient() {
    const [items, setItems] = useState<KnowledgeItem[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    
    const [newRule, setNewRule] = useState("")
    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        fetchKnowledge()
    }, [])

    const fetchKnowledge = async () => {
        try {
            const res = await fetch('/api/ai-training')
            const result = await res.json()
            if (result.success) setItems(result.data)
        } catch (error) {
            console.error("Failed to load knowledge base:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const addTextRule = async () => {
        if (!newRule.trim()) return
        setIsSaving(true)
        try {
            const formData = new FormData()
            formData.append('type', 'text_rule')
            formData.append('content', newRule)

            const res = await fetch('/api/ai-training', { method: 'POST', body: formData })
            if (res.ok) {
                setNewRule("")
                fetchKnowledge()
            }
        } catch (error) {
            console.error("Failed to add rule:", error)
        } finally {
            setIsSaving(false)
        }
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsSaving(true)
        try {
            const formData = new FormData()
            formData.append('type', 'file_knowledge')
            formData.append('file', file)

            const res = await fetch('/api/ai-training', { method: 'POST', body: formData })
            const result = await res.json()
            
            if (result.success) {
                alert(`파일 업로드(RAG 학습)성공: ${file.name}`)
                fetchKnowledge()
            } else {
                alert(`에러 발생: ${result.error}`)
            }
        } catch (error) {
            console.error("Failed to upload file:", error)
        } finally {
            setIsSaving(false)
            if (fileInputRef.current) fileInputRef.current.value = ""
        }
    }

    const deleteItem = async (id: string) => {
        if (!confirm('정말 삭제하시겠습니까? (이 지식은 AI 메모리에서 즉시 사라집니다.)')) return
        try {
            await fetch(`/api/ai-training?id=${id}`, { method: 'DELETE' })
            fetchKnowledge()
        } catch (error) {
            console.error("Failed to delete rule:", error)
        }
    }

    const toggleActive = async (id: string, currentStatus: boolean) => {
        try {
            await fetch(`/api/ai-training`, { 
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, is_active: !currentStatus })
            })
            fetchKnowledge()
        } catch (error) {
            console.error("Failed to toggle rule:", error)
        }
    }

    return (
        <div className="flex h-screen flex-col overflow-hidden bg-[var(--background)]">
            <Topbar />

            <div className="flex-1 overflow-y-auto p-4 lg:p-8 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 hover:[&::-webkit-scrollbar-thumb]:bg-white/20">
                <div className="mx-auto max-w-5xl space-y-8">
                    
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* 1. 텍스트 지식 추가 */}
                        <div className="rounded-xl border border-white/5 bg-white/5 p-6 backdrop-blur-xl">
                            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
                                <MessageSquare className="h-5 w-5 text-indigo-400" />
                                텍스트 규칙 가르치기
                            </h2>
                            <p className="mb-4 text-sm text-gray-400">
                                챗봇이 반드시 기억하고 지켜야 할 회사 규정, 혹은 답변 스타일을 직접 지시하세요.
                            </p>
                            <textarea
                                value={newRule}
                                onChange={(e) => setNewRule(e.target.value)}
                                placeholder="예: 심야 시공 지급 상한선을 넘긴 항목을 얘기할 땐 무조건 '초과 경고!' 라고 붙여줘."
                                className="h-32 w-full resize-none rounded-lg border border-white/10 bg-black/20 p-3 text-sm text-white placeholder:text-gray-600 focus:border-indigo-500/50 focus:outline-none"
                            />
                            <div className="mt-4 flex justify-end">
                                <button
                                    onClick={addTextRule}
                                    disabled={isSaving || !newRule.trim()}
                                    className="flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-600 disabled:opacity-50"
                                >
                                    <Plus className="h-4 w-4" />
                                    저장하기
                                </button>
                            </div>
                        </div>

                        {/* 2. 파일 문서 추가 (RAG) */}
                        <div className="rounded-xl border border-white/5 bg-white/5 p-6 backdrop-blur-xl">
                            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
                                <FileSpreadsheet className="h-5 w-5 text-emerald-400" />
                                엑셀 파일 문서 주입하기 (RAG)
                            </h2>
                            <p className="mb-4 text-sm text-gray-400">
                                단가표, 대리점 리스트 등 방대한 자료가 담긴 엑셀(.xlsx) 문서를 학습시킵니다.
                            </p>
                            
                            <div className="flex h-32 flex-col items-center justify-center rounded-lg border border-dashed border-white/20 bg-black/20 p-4 transition-colors hover:border-emerald-500/50 hover:bg-emerald-500/5">
                                <Upload className="mb-2 h-6 w-6 text-gray-400" />
                                <span className="text-sm font-medium text-gray-300">엑셀/CSV 업로드 (.xlsx 권장)</span>
                                <input
                                    type="file"
                                    accept=".xlsx,.csv,.txt"
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                    disabled={isSaving}
                                    className="absolute inset-0 cursor-pointer opacity-0"
                                />
                            </div>
                            <div className="mt-4 text-xs text-gray-500">
                                * 업로드 즉시 파일의 모든 텍스트가 추출되어 AI의 지식 베이스에 영구 저장됩니다.
                            </div>
                        </div>
                    </div>

                    {/* 목록 뷰 */}
                    <div className="rounded-xl border border-white/5 bg-white/5 p-6 backdrop-blur-xl">
                        <h2 className="mb-6 text-lg font-bold text-white">현재 AI가 학습 중인 지식 목록</h2>
                        {isLoading ? (
                            <div className="text-center text-gray-500">불러오는 중...</div>
                        ) : items.length === 0 ? (
                            <div className="text-center text-gray-500 p-8 border border-dashed border-white/10 rounded-lg">학습된 지식이 없습니다. 위에서 추가해주세요.</div>
                        ) : (
                            <div className="space-y-4">
                                {items.map((item) => (
                                    <div key={item.id} className={cn(
                                        "flex items-start justify-between gap-4 rounded-lg border p-4 transition-all",
                                        item.is_active ? "border-white/10 bg-white/5" : "border-white/5 bg-transparent opacity-50"
                                    )}>
                                        <div className="flex items-start gap-4 flex-1">
                                            <div className={cn("mt-1 rounded border p-2", item.type === 'file_knowledge' ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : "border-indigo-500/30 bg-indigo-500/10 text-indigo-400")}>
                                                {item.type === 'file_knowledge' ? <FileText className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-gray-200">
                                                    {item.type === 'file_knowledge' ? `[파일 학습] ${item.file_name}` : '수동 텍스트 규칙'}
                                                </h3>
                                                <div className="mt-1 text-sm text-gray-400 line-clamp-3">
                                                    {item.content}
                                                </div>
                                                <div className="mt-2 text-xs text-gray-500">
                                                    생성일: {new Date(item.created_at).toLocaleDateString('ko-KR')}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex flex-col items-end gap-2">
                                            <button 
                                                onClick={() => toggleActive(item.id, item.is_active)}
                                                className={cn("flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors", item.is_active ? "bg-green-500/20 text-green-400 hover:bg-green-500/30" : "bg-gray-800 text-gray-400 hover:bg-gray-700")}
                                            >
                                                {item.is_active ? "활성화 됨" : "비활성화 됨"}
                                            </button>
                                            <button 
                                                onClick={() => deleteItem(item.id)}
                                                className="text-gray-500 hover:text-red-400 p-1"
                                                title="삭제"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    )
}

"use client"

import { motion } from "framer-motion"

interface Column {
    key: string;
    label: string;
    format?: (value: any) => string;
}

interface DataTableProps {
    title: string;
    columns: Column[];
    data: Record<string, any>[];
}

function defaultFormat(value: any): string {
    if (typeof value === 'number') {
        if (Math.abs(value) >= 1000000) {
            return `₩${(value / 1000000).toLocaleString('ko-KR', { maximumFractionDigits: 0 })}M`;
        }
        if (value < 1 && value > -1 && value !== 0) {
            return `${(value * 100).toFixed(1)}%`;
        }
        return value.toLocaleString('ko-KR');
    }
    return String(value ?? '');
}

export function DataTable({ title, columns, data }: DataTableProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 backdrop-blur-sm shadow-sm"
        >
            <h3 className="mb-4 text-lg font-semibold text-white">{title}</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-[var(--border)]">
                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    className="px-3 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap"
                                >
                                    {col.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                        {data.map((row, i) => (
                            <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                                {columns.map((col) => (
                                    <td
                                        key={col.key}
                                        className="px-3 py-3 text-gray-300 whitespace-nowrap font-mono text-xs"
                                    >
                                        {col.format ? col.format(row[col.key]) : defaultFormat(row[col.key])}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </motion.div>
    )
}

import { useState, useCallback } from 'react';
import { generateAnalysisReport, type AnalysisResult } from '@/lib/analysis-engine';
import type { FinancialMonthData, BillingData, NightworkRatioData, EquipmentCostData, NightworkCapData, TravelSupportData, RawDataRow } from "@/lib/sheet-data";

interface UseAnalysisProps {
    selectedMonth: string;
    insightMonth: string;
    months: FinancialMonthData[];
    average: FinancialMonthData | null;
    billingData: BillingData[];
    nightRatioData: NightworkRatioData[];
    equipData: EquipmentCostData[];
    equipAvg: EquipmentCostData | null;
    capData: NightworkCapData[];
    travelData: TravelSupportData[];
    rawData: RawDataRow[];
}

export function useAnalysis({
    selectedMonth,
    insightMonth,
    months,
    average,
    billingData,
    nightRatioData,
    equipData,
    equipAvg,
    capData,
    travelData,
    rawData
}: UseAnalysisProps) {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

    const handleAnalyze = useCallback(() => {
        setIsAnalyzing(true);
        setTimeout(() => {
            const result = generateAnalysisReport(
                selectedMonth, insightMonth, months, average,
                billingData, nightRatioData, equipData, equipAvg,
                capData, travelData, rawData
            );
            setAnalysisResult(result);
            setIsAnalyzing(false);
        }, 800);
    }, [selectedMonth, insightMonth, months, average, billingData, nightRatioData, equipData, equipAvg, capData, travelData, rawData]);

    const clearAnalysis = useCallback(() => {
        setAnalysisResult(null);
    }, []);

    return { isAnalyzing, analysisResult, handleAnalyze, clearAnalysis };
}

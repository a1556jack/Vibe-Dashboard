import {
    FinancialMonthData,
    BillingData,
    NightworkRatioData,
    EquipmentCostData,
    NightworkCapData,
    TravelSupportData,
    RawDataRow
} from './sheet-data';

export interface InsightCard {
    title: string;
    description: string;
    type: 'warning' | 'info' | 'success';
}

export interface AnalysisResult {
    reportText: string;
    insights: InsightCard[];
}

function formatMil(value: number): string {
    return Math.round(value / 1000000).toLocaleString();
}

function formatPct(value: number): string {
    // values from parsePercent are usually like 89.4 (which means 89.4%).
    // Some, like nightRatio, might be naturally fractional in other functions.
    // If value is less than 2, assume it's fractional (0.89), else assume it's already % (89.4).
    const parsed = value < 2 && value > -2 ? value * 100 : value;
    return parsed.toFixed(1) + '%';
}

function calcDiffPct(curr: number, prev: number): string {
    if (prev === 0) return '0%';
    const diff = (curr - prev) / prev;
    return (diff > 0 ? '+' : '') + (diff * 100).toFixed(1) + '%';
}

export function generateAnalysisReport(
    selectedMonth: string,
    insightMonth: string,
    finDataList: FinancialMonthData[],
    finAvg: FinancialMonthData | null,
    billingData: BillingData[],
    nightRatioData: NightworkRatioData[],
    equipData: EquipmentCostData[],
    equipAvg: EquipmentCostData | null,
    capData: NightworkCapData[],
    travelData: TravelSupportData[],
    rawData: RawDataRow[]
): AnalysisResult {
    // 1. Find Data for Selected Month and Previous Month
    const currFinIdx = finDataList.findIndex(d => d.month === selectedMonth);
    const currFin = currFinIdx >= 0 ? finDataList[currFinIdx] : null;
    const prevFin = currFinIdx > 0 ? finDataList[currFinIdx - 1] : null;

    const currEquip = equipData.find(d => d.month === selectedMonth);
    const prevEquipIdx = equipData.findIndex(d => d.month === selectedMonth);
    const prevEquip = prevEquipIdx > 0 ? equipData[prevEquipIdx - 1] : null;

    const currCap = capData.find(d => d.month === selectedMonth);
    const prevCapIdx = capData.findIndex(d => d.month === selectedMonth);
    const prevCap = prevCapIdx > 0 ? capData[prevCapIdx - 1] : null;

    const currNightRatio = nightRatioData.find(d => d.month === selectedMonth);
    const prevNightRatioIdx = nightRatioData.findIndex(d => d.month === selectedMonth);
    const prevNightRatio = prevNightRatioIdx > 0 ? nightRatioData[prevNightRatioIdx - 1] : null;
    const avgNightRatio = nightRatioData.length ? nightRatioData.reduce((acc, curr) => acc + curr.nightworkRatio, 0) / nightRatioData.length : 0;

    const reportLines: string[] = [];
    const insights: InsightCard[] = [];

    // ==========================================
    // Generate Comprehensive Evaluation Narrative
    // ==========================================
    if (currFin && prevFin) {
        const narrative: string[] = [];

        // 1. Overall Revenue and Cost
        const revDiff = currFin.용역수입.합계 - prevFin.용역수입.합계;
        const costDiff = currFin.변동비.합계 - prevFin.변동비.합계;
        const marginDiff = currFin.공헌이익 - prevFin.공헌이익;

        const revTrendStr = revDiff > 0 ? '증가' : '감소';
        const costTrendStr = costDiff > 0 ? '증가' : '감소';

        let introTemplate = '';
        if (marginDiff > 0) {
            introTemplate = `이번 달은 전월 대비 공헌이익이 ${formatMil(Math.abs(marginDiff))}백만원 상승하며 전체적인 수익성이 개선되었습니다.`;
            if (revDiff > 0 && costDiff > 0 && revDiff > costDiff) introTemplate += ` 특히 매출이 비용 증가분보다 높게 상승한 점이 주효했습니다.`;
            else if (revDiff < 0 && costDiff < 0 && Math.abs(costDiff) > Math.abs(revDiff)) introTemplate += ` 비록 수입은 줄었으나, 변동비 통제를 통해 하락폭을 상회하는 비용 절감을 이뤄냈습니다.`;
        } else {
            introTemplate = `이번 달은 전월 대비 공헌이익이 ${formatMil(Math.abs(marginDiff))}백만원 하락하며 수익성이 악화된 양상입니다.`;
            if (revDiff > 0 && costDiff > 0) introTemplate += ` 수입은 늘었으나 비용이 이를 초과하여 상승한 것이 주요 원인입니다.`;
            else if (revDiff < 0 && costDiff > 0) introTemplate += ` 수입 감소와 동시에 비용이 증가하는 비효율 구간이 발생했습니다.`;
        }
        narrative.push(introTemplate);

        // 2. Equipment Costs Impact
        if (currEquip && prevEquip) {
            const eqDiff = currEquip.장비전체합계 - prevEquip.장비전체합계;
            if (Math.abs(eqDiff) > 1000000) {
                const eqStr = eqDiff > 0 ? '상승' : '절감';
                narrative.push(`장비 운용 측면에서는 전월 대비 장비 전체 비용이 ${formatMil(Math.abs(eqDiff))}백만원 ${eqStr}하여 변동비에 직접적인 영향을 미쳤습니다.`);
            }
        }

        // 3. Nightwork Cap vs Ratio deeply analyzed
        if (currCap && prevCap && currNightRatio && prevNightRatio) {
            const capDiff = currCap.지급상한공제시공비 - prevCap.지급상한공제시공비;
            const ratioDiff = currNightRatio.nightworkRatio - prevNightRatio.nightworkRatio;

            // if ratio is same/down but cap variable cost is UP
            if (ratioDiff <= 0.005 && capDiff > 1000000) {
                narrative.push(`심야 시공의 전체 비율은 전월(${prevCap.month})과 유사하거나 하락했음에도 불구하고, 심야 지급 상한 기준 초과로 인한 지출(변동비)은 ${formatMil(Math.abs(capDiff))}백만원 증가했습니다.`);

                // Try to find the specific project that caused it
                const currentMonthRaw = rawData.filter(r => r.yearMonth === selectedMonth);
                const heavyNightTickets = currentMonthRaw.filter(r => {
                    const nightSum = r.주중야간 + r.주중심야 + r.주말야간 + r.주말심야;
                    return nightSum >= 500000; // Look for tickets with high night-specific costs
                }).sort((a, b) => {
                    const aSum = a.주중야간 + a.주중심야 + a.주말야간 + a.주말심야;
                    const bSum = b.주중야간 + b.주중심야 + b.주말야간 + b.주말심야;
                    return bSum - aSum;
                }).slice(0, 2);

                if (heavyNightTickets.length > 0) {
                    const names = heavyNightTickets.map(t => `'${t.건명 || '이름없음'}'`).join(', ');
                    narrative.push(`이는 주로 특정 야간/심야 고비용 프로젝트 건(${names})의 영향이 크게 작용한 결과로 분석됩니다.`);
                }
            } else if (ratioDiff > 0.02 && capDiff > 0) {
                narrative.push(`심야 시공 비율 자체가 전월(${prevCap.month})보다 ${(ratioDiff * 100).toFixed(1)}%p 크게 늘어남에 따라, 지급 상한 공제 시공비 규모 역시 자연스럽게 동반 상승했습니다.`);
            } else if (capDiff > 0 && capDiff <= 1000000) {
                narrative.push(`상한 지급을 초과한 심야 추가 시공비 규모는 전월(${prevCap.month}) 대비 ${formatMil(Math.abs(capDiff))}백만원 증가하며 비교적 유사한 수준을 보였습니다.`);
            } else if (capDiff < 0) {
                narrative.push(`심야 추가시공비 상한 초과분 누수가 전월(${prevCap.month})보다 ${formatMil(Math.abs(capDiff))}백만원 줄어들어 채산성 개선에 강하게 기여했습니다.`);
            }
        }

        reportLines.push('📝 [월간 종합 평가 및 요약]');
        reportLines.push(narrative.join(' '));
        reportLines.push('--------------------------------------------------');
        reportLines.push('');
    }

    // Header Averages
    if (finAvg) {
        reportLines.push(`${finAvg.month} 매출액`);
        reportLines.push(`조치 : ${formatMil(finAvg.용역수입.조치)} 현장 : ${formatMil(finAvg.용역수입.현장)} 소액 : ${formatMil(finAvg.용역수입.소액)}`);
        reportLines.push(`${finAvg.month} 변동비`);
        reportLines.push(`조치 : ${formatMil(finAvg.변동비.조치)}(${formatPct(finAvg.변동비.조치_pct)}) 현장 : ${formatMil(finAvg.변동비.현장)}(${formatPct(finAvg.변동비.현장_pct)}) 소액 : ${formatMil(finAvg.변동비.소액)}(${formatPct(finAvg.변동비.소액_pct)})`);
        reportLines.push(`${finAvg.month} 공헌이익 : ${formatMil(finAvg.공헌이익)}(${formatPct(finAvg.공헌이익_pct)})`);
        reportLines.push('');
    }

    // Previous Month Details
    if (prevFin) {
        reportLines.push(`${prevFin.month} 매출액`);
        reportLines.push(`조치 : ${formatMil(prevFin.용역수입.조치)} 현장 : ${formatMil(prevFin.용역수입.현장)} 소액 : ${formatMil(prevFin.용역수입.소액)}`);
        reportLines.push(`${prevFin.month} 변동비`);
        reportLines.push(`조치 : ${formatMil(prevFin.변동비.조치)}(${formatPct(prevFin.변동비.조치_pct)}) 현장 : ${formatMil(prevFin.변동비.현장)}(${formatPct(prevFin.변동비.현장_pct)}) 소액 : ${formatMil(prevFin.변동비.소액)}(${formatPct(prevFin.변동비.소액_pct)})`);
    }

    // Current Month Details
    if (currFin) {
        reportLines.push(`${currFin.month} 매출액`);
        reportLines.push(`조치 : ${formatMil(currFin.용역수입.조치)} 현장 : ${formatMil(currFin.용역수입.현장)} 소액 : ${formatMil(currFin.용역수입.소액)}`);
        reportLines.push(`${currFin.month} 변동비`);
        reportLines.push(`조치 : ${formatMil(currFin.변동비.조치)}(${formatPct(currFin.변동비.조치_pct)}) 현장 : ${formatMil(currFin.변동비.현장)}(${formatPct(currFin.변동비.현장_pct)}) 소액 : ${formatMil(currFin.변동비.소액)}(${formatPct(currFin.변동비.소액_pct)})`);
        reportLines.push('');
    }

    // Overall Comparison
    if (currFin && prevFin) {
        const revDiff = currFin.용역수입.합계 - prevFin.용역수입.합계;
        const revStr = revDiff > 0 ? '증가' : '감소';
        reportLines.push(`[수익성 파트]`);
        reportLines.push(`시공결과금액 전월比 ${calcDiffPct(currFin.용역수입.합계, prevFin.용역수입.합계).replace('-', '')} ${revStr}(${formatMil(prevFin.용역수입.합계)}백 -> ${formatMil(currFin.용역수입.합계)}백, ${formatMil(Math.abs(revDiff))}백 ${revStr})`);
        reportLines.push('');

        reportLines.push('[비용 및 이익 파트]');
        const costDiff = currFin.변동비.합계 - prevFin.변동비.합계;
        const costStr = costDiff > 0 ? '증가' : '감소';
        reportLines.push(`변동비 전월比 ${calcDiffPct(currFin.변동비.합계, prevFin.변동비.합계).replace('-', '')}, ${formatMil(Math.abs(costDiff))}백만원 ${costStr}(${formatMil(prevFin.변동비.합계)} -> ${formatMil(currFin.변동비.합계)})`);

        const marginDiff = currFin.공헌이익 - prevFin.공헌이익;
        const marginStr = marginDiff > 0 ? '증가' : '감소';
        reportLines.push(`공헌이익 전월比 ${calcDiffPct(currFin.공헌이익, prevFin.공헌이익).replace('-', '')}, ${formatMil(Math.abs(marginDiff))}백만원 ${marginStr}(${formatMil(prevFin.공헌이익)} -> ${formatMil(currFin.공헌이익)})`);

        // Detailed Margin Analysis
        const currMarginPct = currFin.공헌이익_pct < 2 ? currFin.공헌이익_pct * 100 : currFin.공헌이익_pct;
        const prevMarginPct = prevFin.공헌이익_pct < 2 ? prevFin.공헌이익_pct * 100 : prevFin.공헌이익_pct;
        const marginPctDiff = currMarginPct - prevMarginPct;
        reportLines.push(`(전체 이익률 ${prevMarginPct.toFixed(1)}% -> ${currMarginPct.toFixed(1)}%, ${marginPctDiff > 0 ? '+' : ''}${marginPctDiff.toFixed(1)}%p)`);

        reportLines.push('');
    }

    // specific section placeholders for custom manual texts, backed by dynamic when possible.
    reportLines.push('퍼시스 양지 조치');
    reportLines.push('특이사항(RAW DATA 기반): 조치 파트에 대한 상세 코멘트 (비정상 수치 징후 검출)');
    reportLines.push('');

    reportLines.push('퍼시스 경인_현장');
    if (currCap && prevCap) {
        const nightDiff = currCap.심야추가시공비합계 - prevCap.심야추가시공비합계;
        const nStr = nightDiff > 0 ? '증가' : '감소';
        reportLines.push(`심야 시공 청구 금액 ${formatMil(Math.abs(nightDiff))}백만원 ${nStr}(${formatMil(prevCap.심야추가시공비합계)} -> ${formatMil(currCap.심야추가시공비합계)})`);
        const capDiff = currCap.지급상한공제시공비 - prevCap.지급상한공제시공비;
        const cStr = capDiff > 0 ? '증가' : '감소';
        reportLines.push(`심야 시공비 지급 상한 금액 ${formatMil(prevCap.지급상한공제시공비)}백 -> ${formatMil(currCap.지급상한공제시공비)}백만원, ${formatMil(Math.abs(capDiff))}백만원 ${cStr}`);
    }
    if (currNightRatio && prevNightRatio) {
        reportLines.push(`(${currNightRatio.month} 경인 심야 시공 비율 ${formatPct(currNightRatio.nightworkRatio)}, 전월 ${formatPct(prevNightRatio.nightworkRatio)}, 연 평균 ${formatPct(avgNightRatio)})`);
    }
    if (currEquip && prevEquip && equipAvg) {
        const equipDiff = currEquip.장비전체합계 - prevEquip.장비전체합계;
        const eStr = equipDiff > 0 ? '증가' : '감소';
        reportLines.push(`장비 사용 전월比 ${formatMil(Math.abs(equipDiff))}백만원 ${eStr}(${formatMil(prevEquip.장비전체합계)}백만원 -> ${formatMil(currEquip.장비전체합계)}백만원)`);
        reportLines.push(`(장비/결과금액 비율 ${(currEquip.장비비율_전체 * 100).toFixed(3)}%, 전월 ${(prevEquip.장비비율_전체 * 100).toFixed(3)}%) ※ 연 평균 비율 ${(equipAvg.장비비율_전체 * 100).toFixed(3)}%`);
    }
    reportLines.push('');

    reportLines.push('퍼시스 양지_소액');
    if (currFin && prevFin) {
        reportLines.push(`${prevFin.month} 소액팀 변동비율 ${formatPct(prevFin.변동비.소액_pct)} -> ${currFin.month} 소액팀 변동비율 ${formatPct(currFin.변동비.소액_pct)}`);
    }
    // Insights Generation from RAW DATA
    // Finding inefficiencies
    const currentMonthRaw = rawData.filter(r => r.yearMonth === insightMonth);

    // Financial Insights (Quadrant, So-aek)
    const insightFinIdx = finDataList.findIndex(d => d.month === insightMonth);
    const insightFin = insightFinIdx >= 0 ? finDataList[insightFinIdx] : null;
    const prevInsightFin = insightFinIdx > 0 ? finDataList[insightFinIdx - 1] : null;

    if (insightFin && prevInsightFin) {
        const revDiffInsight = insightFin.용역수입.합계 - prevInsightFin.용역수입.합계;
        const costDiffInsight = insightFin.변동비.합계 - prevInsightFin.변동비.합계;
        const marginPctDiffInsight = (insightFin.공헌이익_pct < 2 ? insightFin.공헌이익_pct * 100 : insightFin.공헌이익_pct) - (prevInsightFin.공헌이익_pct < 2 ? prevInsightFin.공헌이익_pct * 100 : prevInsightFin.공헌이익_pct);

        if (revDiffInsight > 0 && costDiffInsight < 0) {
            insights.push({ title: '매출 증가 / 비용 감소 이상 징후', description: `전월 대비 용역수입은 증가했으나 변동비는 오히려 감소했습니다. 시공팀에게 합당한 금액이 지급되지 않았을 가능성이 존재하므로 확인이 필요합니다.`, type: 'info' });
        } else if (revDiffInsight > 0 && costDiffInsight > 0 && costDiffInsight > revDiffInsight) {
            insights.push({ title: '매출 증가 대비 과도한 비용 증가', description: `용역수입 증가분보다 변동비 증가분이 더 큽니다. 시공팀에게 비용이 합리적 기준 이상으로 더 지급되었을 가능성이 존재합니다.`, type: 'warning' });
        } else if (revDiffInsight < 0 && costDiffInsight < 0 && costDiffInsight < revDiffInsight) {
            insights.push({ title: '매출 감소 / 비용 대폭 감소 이상 징후', description: `용역수입 감소폭보다 변동비 감소폭이 더 큽니다. (수익 하락 구간임에도) 시공팀에게 합당한 금액이 깎여 지급되지 않았을 가능성이 존재합니다.`, type: 'info' });
        } else if (revDiffInsight < 0 && costDiffInsight > 0) {
            insights.push({ title: '수익 최악의 케이스 발생 (매출↓ / 비용↑)', description: `용역수입은 감소했는데 변동비는 오히려 증가했습니다!! 최악의 구조적 비효율 케이스이므로 무조건 원인과 문제를 찾아야 합니다!`, type: 'warning' });
        }

        if (Math.abs(marginPctDiffInsight) >= 0.5) {
            insights.push({ title: '공헌이익률 유의미한 변동 감지', description: `공헌이익률이 전월 대비 ${Math.abs(marginPctDiffInsight).toFixed(1)}%p 차이납니다. 수익 구조나 비용 정책 변화에 대한 모니터링이 요구됩니다.`, type: 'info' });
        }

        const currSoaekPctInsight = insightFin.변동비.소액_pct < 2 ? insightFin.변동비.소액_pct * 100 : insightFin.변동비.소액_pct;
        if (currSoaekPctInsight > 95) {
            insights.push({ title: '소액팀 한계 이익 경고', description: `양지 소액팀의 변동비율이 ${currSoaekPctInsight.toFixed(1)}%로 매우 높습니다. 출장비 및 기타지원이 128% 가산 마진을 초과하여 잠식하고 있는지 점검이 필요합니다.`, type: 'warning' });
        }
    }

    // Insight 1: Equipment Ratio vs Average
    const currEquipInsight = equipData.find(d => d.month === insightMonth);
    if (currEquipInsight && equipAvg) {
        const currEqRatio = currEquipInsight.장비비율_전체 * 100;
        const avgEqRatio = equipAvg.장비비율_전체 * 100;
        if (currEqRatio - avgEqRatio >= 0.02) {
            insights.push({
                title: '장비 비용 비율 변동성 경고',
                description: `장비 비용 비율(${currEqRatio.toFixed(3)}%)이 연 평균 대비 ${(currEqRatio - avgEqRatio).toFixed(3)}%p 이상 높습니다. 비계약 비율 증가 등 비효율적인 장비 배차가 없는지 점검이 요망됩니다.`,
                type: 'warning'
            });
        }
    }

    // Insight 2: High Deductions (C-type) & Blackhole Team
    const penaltyTotal = currentMonthRaw.reduce((sum, r) => sum + r.시공하자공제, 0);
    if (penaltyTotal > 1000000) {
        insights.push({
            title: '시공 하자 공제 전체 규모 증가',
            description: `해당 월 총 ${formatMil(penaltyTotal)}백만원의 하자 공제가 발생했습니다. 품질 교육 및 점검이 전반적으로 필요합니다.`,
            type: 'warning'
        });

        // Rule B: Blackhole team logic
        const defectMap = new Map<string, number>();
        currentMonthRaw.forEach(r => {
            if (r.시공하자공제 > 0) {
                defectMap.set(r.시공팀, (defectMap.get(r.시공팀) || 0) + r.시공하자공제);
            }
        });

        let worstDefectTeam = '';
        let worstDefectAmount = 0;
        defectMap.forEach((amt, team) => {
            if (amt > worstDefectAmount) {
                worstDefectAmount = amt;
                worstDefectTeam = team;
            }
        });

        if (worstDefectAmount > penaltyTotal * 0.5 && penaltyTotal >= 500000) {
            insights.push({
                title: '특정 팀 하자 집중 발생 (블랙홀 감지)',
                description: `전체 하자공제의 ${(worstDefectAmount / penaltyTotal * 100).toFixed(1)}%(${formatMil(worstDefectAmount)}백만원)가 [${worstDefectTeam}] 한 팀에서 집중적으로 발생했습니다. 역량 이상의 무리한 현장 투입이 없는지 시급한 확인이 요망됩니다.`,
                type: 'warning'
            });
        }
    }

    // Rule A: High Travel / Accommodation Inefficiency
    const hyunjangRaw = currentMonthRaw.filter(r => r.권역시공팀 && r.권역시공팀.trim().toUpperCase().startsWith('H'));
    const soaekRaw = currentMonthRaw.filter(r => r.권역시공팀 && r.권역시공팀.trim().toUpperCase().startsWith('F'));

    const hyunjangTravelTotal = hyunjangRaw.reduce((sum, r) => sum + r.출장비_지 + r.숙식비_지 + r.추가숙박비, 0);
    const soaekTravelTotal = soaekRaw.reduce((sum, r) => sum + r.출장비_지 + r.숙식비_지 + r.추가숙박비, 0);

    // 현장 출장비 + 숙식/추가숙박비 > 3M
    if (hyunjangTravelTotal > 3000000) {
        insights.push({
            title: '경인_현장 지방/장거리 배송 묶음 단위 비효율 의심',
            description: `경인_현장 출장비 및 숙식/추가숙박비로 총 ${formatMil(hyunjangTravelTotal)}백만원이 지출되었습니다. 여러 개별 팀을 산발적으로 멀리 보낸 건 아닌지, 지방 묶음 스케줄링 프로세스에 누수가 생긴 건 아닌지 점검하세요.`,
            type: 'warning'
        });
    }

    // 소액 출장비 + 숙식/추가숙박비 > 25년 평균
    const soaek25Raw = rawData.filter(r => r.yearMonth && r.yearMonth.startsWith('25.') && r.권역시공팀 && r.권역시공팀.trim().toUpperCase().startsWith('F'));
    const soaek25TravelTotal = soaek25Raw.reduce((sum, r) => sum + r.출장비_지 + r.숙식비_지 + r.추가숙박비, 0);
    const soaek25Months = new Set(soaek25Raw.map(r => r.yearMonth)).size || 1; // avoid div by zero
    const avgSoaek25Travel = soaek25TravelTotal / soaek25Months;

    if (avgSoaek25Travel > 0 && soaekTravelTotal > avgSoaek25Travel) {
        insights.push({
            title: '경인_소액 출장비 연 평균 초과 (동선 비효율 점검 필요)',
            description: `이번 달 경인_소액 팀의 출장비 합계(${formatMil(soaekTravelTotal)}백만원)가 25년 평균치(${formatMil(avgSoaek25Travel)}백만원)보다 높게 산출되었습니다. 비효율적인 장거리/지방 동선의 일정을 진행한 시공팀이 있는지 전반적 일정 점검이 권장됩니다.`,
            type: 'warning'
        });
    }

    // Insight 3: Nightwork ratio risk (+2.0%p)
    const currNightRatioInsight = nightRatioData.find(d => d.month === insightMonth);
    if (currNightRatioInsight) {
        const cNightPct = currNightRatioInsight.nightworkRatio * 100;
        const aNightPct = avgNightRatio * 100;
        if (cNightPct - aNightPct >= 2.0) {
            insights.push({
                title: '과도한 심야 시공 비율 감지',
                description: `심야 시공 비율(${cNightPct.toFixed(1)}%)이 연 평균보다 ${(cNightPct - aNightPct).toFixed(1)}%p 초과 상승했습니다. 시공팀이 과도하게 50% 할증 마진을 선호하여 일정을 늦췄을(고객사 클레임) 확률이 있으므로 조사가 필요합니다.`,
                type: 'warning'
            });
        }
    }

    // Insight 4: High extra labor cost per Ticket (건별 100만원 이상)
    const heavyLaborTickets = currentMonthRaw.filter(r => {
        const laborSum = r.공수비_청 + r.공수비 + r.대기비; // 분해설치, 분해설치_청 제외
        return laborSum >= 1000000;
    });

    if (heavyLaborTickets.length > 0) {
        const ticketDetails = heavyLaborTickets.map(t => `${t.시공일} [${t.건명 || '이름없음'}]`).join(', ');
        insights.push({
            title: '단일 건 대기비/공수비 과다 청구 감지',
            description: `공수비나 대기비 명목으로 건별 100만 원 이상 발생한 케이스가 총 ${heavyLaborTickets.length}건 있습니다. (대상: ${ticketDetails})`,
            type: 'warning'
        });
    }

    // Insight 5: Extreme Team Inefficiencies
    const teamMap = new Map<string, { normal: number, extra: number }>();
    currentMonthRaw.forEach(r => {
        if (!teamMap.has(r.시공팀)) teamMap.set(r.시공팀, { normal: 0, extra: 0 });
        const d = teamMap.get(r.시공팀)!;
        d.normal += r.정상시공;
        d.extra += r.시공외지급;
    });

    let worstTeam = '';
    let maxExtraRatio = 0;
    teamMap.forEach((v, k) => {
        if (v.normal > 1000000) { // filter only active teams
            const ratio = v.extra / v.normal;
            if (ratio > maxExtraRatio) {
                maxExtraRatio = ratio;
                worstTeam = k;
            }
        }
    });

    if (maxExtraRatio > 0.4) {
        insights.push({
            title: '주요 개별 팀 특이 동향',
            description: `[${worstTeam}] 팀의 기타 시공비용이 정상 시공금액의 ${(maxExtraRatio * 100).toFixed(1)}%에 달합니다. 해당 팀의 장비 사용 내역 및 지원금 세부 검토가 시급합니다.`,
            type: 'warning'
        });
    }

    if (insights.length === 0) {
        insights.push({
            title: '비용 효율성 우수',
            description: '이번 달 채산성 지표 및 팀별 변동비 누수 지점이 감지되지 않았습니다. 현재의 영업 및 배차 시스템이 정상적으로 구동 중입니다.',
            type: 'success'
        });
    }

    return {
        reportText: reportLines.join('\n'),
        insights
    };
}

export interface TeamBreakdown {
    region: string;
    team: string;
    resultAmount: number;
    normalCost: number;
    extraCost: number;
    workDays: number;
}

export function generateTeamBreakdown(rawData: RawDataRow[], selectedMonths: string | string[]): TeamBreakdown[] {
    const monthsArray = Array.isArray(selectedMonths) ? selectedMonths : [selectedMonths];
    const monthData = rawData.filter(r => monthsArray.includes(r.yearMonth));
    const map = new Map<string, { region: string; team: string; resultAmt: number; normal: number; extra: number; dates: Set<string> }>();

    monthData.forEach(row => {
        const teamKey = `${row.권역시공팀}|${row.시공팀}`;
        if (!map.has(teamKey)) {
            map.set(teamKey, { region: row.권역시공팀, team: row.시공팀, resultAmt: 0, normal: 0, extra: 0, dates: new Set() });
        }
        const data = map.get(teamKey)!;
        data.resultAmt += (row.시공결과금액 || 0);
        data.normal += row.정상시공;
        data.extra += (row.시공외지급 || 0);
        data.dates.add(row.시공일);
    });

    const result: TeamBreakdown[] = Array.from(map.values()).map(d => ({
        region: d.region,
        team: d.team,
        resultAmount: d.resultAmt,
        normalCost: d.normal,
        extraCost: d.extra,
        workDays: d.dates.size
    }));

    // Sort by region, then by total cost
    result.sort((a, b) => {
        if (a.region !== b.region) return a.region.localeCompare(b.region);
        return (b.normalCost + b.extraCost) - (a.normalCost + a.extraCost);
    });

    return result;
}

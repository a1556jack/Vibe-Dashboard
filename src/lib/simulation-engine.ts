export interface SimulationConfig {
    timeRange: {
        dayStart: string; // e.g., "07:00"
        dayEnd: string;   // e.g., "16:30"
        nightStart2: string; // e.g., "21:00"
        nightEnd2: string;   // e.g., "04:30"
    };
    rates: {
        weekdayDay: { charge: number; pay: number };
        weekdayNight: { charge: number; pay: number };
        weekdayLateNight: { charge: number; pay: number };
        weekendDay: { charge: number; payField: number; paySmall: number };
        weekendNight: { charge: number; pay: number };
        weekendLateNight: { charge: number; pay: number };
    };
    extraCosts: {
        travel: number;
        equipment: number;
        others: number;
    };
}

export const DEFAULT_SIMULATION_CONFIG: SimulationConfig = {
    timeRange: {
        dayStart: "07:00",
        dayEnd: "16:30",
        nightStart2: "21:00", // 심야 시작
        nightEnd2: "04:30"    // 심야 종료
    },
    rates: {
        weekdayDay: { charge: 130, pay: 100 },
        weekdayNight: { charge: 146, pay: 110 },
        weekdayLateNight: { charge: 196, pay: 150 },
        weekendDay: { charge: 146, payField: 110, paySmall: 105 },
        weekendNight: { charge: 146, pay: 110 },
        weekendLateNight: { charge: 196, pay: 150 }
    },
    extraCosts: {
        travel: 0,
        equipment: 0,
        others: 0
    }
};

export interface RawDataRow {
    date: string; // 시공일자
    dayOfWeek: string; // 요일
    timeStr: string; // 확정시간 e.g. "17시00분"
    isField: boolean; // 현장여부 (Y -> true)
    regionTeam: string; // 권역시공팀 e.g. "FB17이정일"
    team: string; // 시공팀
    originalPay: number; // 지급시공비(O열)
    // Results
    timeCategory: "주간" | "야간" | "심야" | "알수없음";
    simulatedCharge: number;
    simulatedPay: number;
}

// Helper: Convert "17시00분" or "17:00" to minutes from midnight
function timeToMinutes(timeStr: string): number {
    if (!timeStr) return -1;
    const match = timeStr.match(/(\d+)[시:]\s*(\d+)분?/);
    if (match) {
        return parseInt(match[1]) * 60 + parseInt(match[2]);
    }
    return -1;
}

// "07:00" -> 420
function parseConfigTime(timeStr: string): number {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
}

export function determineTimeCategory(minutes: number, config: SimulationConfig): "주간" | "야간" | "심야" {
    if (minutes < 0) return "주간"; // fallback
    
    const dayStart = parseConfigTime(config.timeRange.dayStart);
    const dayEnd = parseConfigTime(config.timeRange.dayEnd);
    const lateNightStart = parseConfigTime(config.timeRange.nightStart2); // 21:00
    const lateNightEnd = parseConfigTime(config.timeRange.nightEnd2); // 04:30

    // 심야 (Late Night)
    // Starts at 21:00, goes to 23:59 AND 00:00 to 04:30
    if (lateNightStart > lateNightEnd) {
        // e.g. 21:00 ~ 04:30
        if (minutes >= lateNightStart || minutes <= lateNightEnd) return "심야";
    } else {
        // e.g. 01:00 ~ 04:00 (if they configure it weirdly)
        if (minutes >= lateNightStart && minutes <= lateNightEnd) return "심야";
    }

    // 주간 (Day)
    if (minutes >= dayStart && minutes < dayEnd) {
        return "주간";
    }

    // 나머지는 야간 (Night)
    return "야간";
}

export function processSimulationRow(row: Omit<RawDataRow, "timeCategory" | "simulatedCharge" | "simulatedPay">, config: SimulationConfig): RawDataRow {
    const minutes = timeToMinutes(row.timeStr);
    const timeCategory = determineTimeCategory(minutes, config);
    
    const isWeekend = row.dayOfWeek === "토" || row.dayOfWeek === "일";
    const isField = row.isField;

    let chargeRate = 1.0;
    let payRate = 1.0;

    const { rates } = config;

    if (!isWeekend) {
        if (timeCategory === "주간") { chargeRate = rates.weekdayDay.charge / 100; payRate = rates.weekdayDay.pay / 100; }
        else if (timeCategory === "야간") { chargeRate = rates.weekdayNight.charge / 100; payRate = rates.weekdayNight.pay / 100; }
        else { chargeRate = rates.weekdayLateNight.charge / 100; payRate = rates.weekdayLateNight.pay / 100; }
    } else {
        if (timeCategory === "주간") { 
            chargeRate = rates.weekendDay.charge / 100; 
            payRate = isField ? (rates.weekendDay.payField / 100) : (rates.weekendDay.paySmall / 100); 
        }
        else if (timeCategory === "야간") { chargeRate = rates.weekendNight.charge / 100; payRate = rates.weekendNight.pay / 100; }
        else { chargeRate = rates.weekendLateNight.charge / 100; payRate = rates.weekendLateNight.pay / 100; }
    }

    const baseCost = row.originalPay;

    return {
        ...row,
        timeCategory,
        simulatedCharge: baseCost * chargeRate,
        simulatedPay: baseCost * payRate
    };
}

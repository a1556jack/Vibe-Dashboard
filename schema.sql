-- 테이블 기존 자료 삭제 (초기화용, 테이블이 이미 있으면 삭제 후 다시 만듦)
DROP TABLE IF EXISTS raw_data;
DROP TABLE IF EXISTS financial_details;

-- 1. 경인 퍼시스 채산 데이터 (Financial Details) 테이블 생성
CREATE TABLE financial_details (
    month TEXT PRIMARY KEY, -- 예: '25.01', '25.02', '25년 평균' 등
    rev_action NUMERIC DEFAULT 0,
    rev_hyunjang NUMERIC DEFAULT 0,
    rev_soaek NUMERIC DEFAULT 0,
    rev_total NUMERIC DEFAULT 0,
    rev_action_pct NUMERIC DEFAULT 0,
    rev_hyunjang_pct NUMERIC DEFAULT 0,
    rev_soaek_pct NUMERIC DEFAULT 0,
    rev_total_pct NUMERIC DEFAULT 0,
    cost_action NUMERIC DEFAULT 0,
    cost_hyunjang NUMERIC DEFAULT 0,
    cost_soaek NUMERIC DEFAULT 0,
    cost_total NUMERIC DEFAULT 0,
    cost_action_pct NUMERIC DEFAULT 0,
    cost_hyunjang_pct NUMERIC DEFAULT 0,
    cost_soaek_pct NUMERIC DEFAULT 0,
    cost_total_pct NUMERIC DEFAULT 0,
    margin NUMERIC DEFAULT 0,
    margin_pct NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 경인 시공비 지급분 RAW DATA 테이블 생성
CREATE TABLE raw_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_center TEXT,
    region_team TEXT,
    team TEXT,
    work_date TEXT,
    agency TEXT,
    project_name TEXT,
    address TEXT,
    expected_cost NUMERIC DEFAULT 0,
    result_cost NUMERIC DEFAULT 0,
    extra_pay NUMERIC DEFAULT 0,
    normal_pay NUMERIC DEFAULT 0,
    
    -- A. Billable (청구분)
    disassembly_req NUMERIC DEFAULT 0,
    labor_req NUMERIC DEFAULT 0,
    extra_disassembly NUMERIC DEFAULT 0,
    labor_cost NUMERIC DEFAULT 0,
    manpower_cost NUMERIC DEFAULT 0,
    waiting_cost NUMERIC DEFAULT 0,
    carry_in_cost NUMERIC DEFAULT 0,
    extra_carry_in NUMERIC DEFAULT 0,
    
    -- B. Support (지원분)
    equipment_rent NUMERIC DEFAULT 0,
    equipment_rent_pay NUMERIC DEFAULT 0,
    travel_pay NUMERIC DEFAULT 0,
    pallet_return NUMERIC DEFAULT 0,
    lodging_pay NUMERIC DEFAULT 0,
    extra_lodging NUMERIC DEFAULT 0,
    as_support_unnecessary NUMERIC DEFAULT 0,
    as_support NUMERIC DEFAULT 0,
    weekday_night NUMERIC DEFAULT 0,
    weekday_midnight NUMERIC DEFAULT 0,
    weekend_night NUMERIC DEFAULT 0,
    weekend_midnight NUMERIC DEFAULT 0,
    etc_support NUMERIC DEFAULT 0,
    
    -- C. Deductions (공제)
    defect_deduction NUMERIC DEFAULT 0,
    etc_deduction NUMERIC DEFAULT 0,
    
    -- D. Split (분할)
    joint_split NUMERIC DEFAULT 0,
    
    -- Helper (연월, 예: "25.01")
    year_month TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 데이터 조회를 빠르게 하기 위해 year_month 컬럼에 인덱스 추가
CREATE INDEX idx_raw_data_year_month ON raw_data (year_month);

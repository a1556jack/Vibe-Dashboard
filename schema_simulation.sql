-- 시뮬레이션 시나리오 저장 테이블
CREATE TABLE IF NOT EXISTS public.simulation_scenarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    config JSONB NOT NULL,
    result_summary JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Row Level Security) - 누구나 접근/생성 가능하게 허용 (대시보드 내부용)
ALTER TABLE public.simulation_scenarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read access"
ON public.simulation_scenarios
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Allow anonymous insert"
ON public.simulation_scenarios
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Allow anonymous delete"
ON public.simulation_scenarios
FOR DELETE
TO anon, authenticated
USING (true);

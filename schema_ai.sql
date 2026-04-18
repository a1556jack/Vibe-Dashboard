-- 기존 테이블이 있다면 초기화용 (선택사항)
-- DROP TABLE IF EXISTS chatbot_knowledge;

-- AI 지식 베이스 테이블 생성
CREATE TABLE chatbot_knowledge (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT DEFAULT 'text_rule', -- 'text_rule' (단순 규칙) 또는 'file_knowledge' (엑셀 파싱 등 파일 지식)
    title TEXT,
    content TEXT NOT NULL, -- 규칙 내용 또는 엑셀에서 뽑아낸 막대한 텍스트 정보
    file_name TEXT, -- 업로드한 파일 이름 (타입이 파일일 경우만)
    is_active BOOLEAN DEFAULT true, -- On / Off 토글용
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 최신순 정렬 등을 빠르게 하기 위한 인덱스 명시
CREATE INDEX idx_chatbot_knowledge_created_at ON chatbot_knowledge(created_at DESC);

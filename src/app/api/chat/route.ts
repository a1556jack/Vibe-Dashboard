import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
// This is a simplified version. In a real production app, 
// you would use the @google/generative-ai SDK.
export async function POST(req: Request) {
  try {
    const { messages, context } = await req.json();

    // Fetch AI knowledge from Supabase
    const { data: knowledgeItems, error: knowledgeError } = await supabase
      .from('chatbot_knowledge')
      .select('*')
      .eq('is_active', true);

    // Fetch recent RAW DATA from Supabase for deep analysis
    const { data: rawDataRows, error: rawError } = await supabase
      .from('raw_data')
      .select('work_date, region_team, team, project_name, agency, result_cost, normal_pay, extra_pay, year_month')
      .order('work_date', { ascending: false })
      .limit(5000); // 5000건으로 상향 (Gemini 1.5 Flash의 대용량 컨텍스트 윈도우 한계 내 최적화)

    let customKnowledgeText = "";
    if (!knowledgeError && knowledgeItems && knowledgeItems.length > 0) {
      customKnowledgeText = "\n\n[학습된 업무 지식 및 규칙 사항 (우선 순위가 가장 높음)]\n" + 
        knowledgeItems.map((item: any) => 
          item.type === 'file_knowledge' 
            ? `\n--- (문서 정보: ${item.file_name}) ---\n${item.content}` 
            : `- (텍스트 규칙): ${item.content}`
        ).join("\n");
    }

    let rawDataText = "";
    if (!rawError && rawDataRows && rawDataRows.length > 0) {
      rawDataText = "\n\n[실제 RAW DATA (방대한 최근 5000건의 상세 시공 내역 전체)]\n" +
      "사용자가 개별 건명, 특정 팀의 실적, 혹은 날짜별 원본 데이터(RAW DATA)에 대해 물어보면 반드시 이 데이터를 적극적으로 분석하여 답변하세요.\n" +
      JSON.stringify(rawDataRows);
    }

    // Prepare the system prompt with dashboard data context
    const systemPrompt = `
      당신은 퍼시스 Vibe Dashboard의 최고 레벨 AI 어시스턴트입니다. 
      사용자가 제공한 대시보드 데이터와 학습된 지식을 바탕으로 완벽하게 답변해 주세요.
      
      [대시보드 실시간 데이터 컨텍스트]
      ${JSON.stringify(context, null, 2)}
      ${customKnowledgeText}
      ${rawDataText}
      
      답변 가이드라인:
      1. 사용자가 'RAW DATA' 나 '원본 데이터', '상세 내역' 등을 물어보면 [실제 RAW DATA]를 직접 뒤져서 정확한 수치와 건명을 답변하세요.
      2. 한국어로 친절하고 도메인 전문가처럼 답변하세요.
      3. ★만약 질문이나 상황이 "학습된 업무 지식 및 규칙 사항"과 관련되어 있다면, 해당 지침을 최우선(절대적)으로 적용하여 답변을 생성하세요.★
      4. 데이터나 지식에 없는 내용에 대해서는 억지로 추측하지 마세요.
    `;

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ 
        content: "현재 시스템에 GEMINI_API_KEY가 등록되지 않았습니다. 환경 변수(.env.local 또는 Vercel 설정)에 발급받은 키를 추가해 주세요." 
      });
    }

    const formattedMessages = messages.map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemPrompt }]
        },
        contents: formattedMessages
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API Error:", errorText);
      return NextResponse.json({ content: `[에러 발생] Google 측 상세 응답:\n${errorText}` });
    }

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "답변을 생성하지 못했습니다.";
    
    return NextResponse.json({ content: reply });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Failed to generate response" }, { status: 500 });
  }
}

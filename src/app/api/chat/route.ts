import { NextResponse } from "next/server";

// This is a simplified version. In a real production app, 
// you would use the @google/generative-ai SDK.
export async function POST(req: Request) {
  try {
    const { messages, context } = await req.json();

    // Prepare the system prompt with dashboard data context
    const systemPrompt = `
      당신은 Vibe Dashboard의 AI 어시스턴트입니다. 
      사용자가 제공한 대시보드 데이터를 바탕으로 질문에 답변해 주세요.
      
      [대시보드 데이터 컨텍스트]
      ${JSON.stringify(context, null, 2)}
      
      답변 가이드라인:
      1. 데이터를 바탕으로 구체적인 수치를 언급하며 답변하세요.
      2. 한국어로 친절하고 전문적으로 답변하세요.
      3. 데이터에 없는 내용에 대해서는 추측하지 말고 모른다고 답변하세요.
      4. 시각화(차트)에 대한 설명도 필요하다면 곁들여 주세요.
    `;

    // For demonstration, we'll use a mock response or call an external LLM API
    // If you have a GEMINI_API_KEY in your .env, you can use it here.
    
    // Example using a simple fetch to Gemini API (requires API key)
    /*
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          { role: 'user', parts: [{ text: systemPrompt }] },
          ...messages.map((m: any) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
          }))
        ]
      })
    });
    const data = await response.json();
    return NextResponse.json({ content: data.candidates[0].content.parts[0].text });
    */

    // Better Mock Response based on Raw Data Summary
    const lastMessage = messages[messages.length - 1].content;
    const summary = context?.raw_data_summary;
    let mockContent = "";

    if (lastMessage.includes("최근 프로젝트") || lastMessage.includes("건명")) {
      const recent = summary?.recent_projects?.[0];
      if (recent) {
        mockContent = `최근 프로젝트 중 ${recent.project} (${recent.customer}) 건이 ${recent.date}에 완료되었으며, 결과 금액은 약 ${(recent.amount / 10000).toFixed(0)}만원입니다.`;
      } else {
        mockContent = "현재 확인할 수 있는 최근 프로젝트 정보가 부족합니다. 데이터 시트를 확인해 주세요.";
      }
    } else if (lastMessage.includes("서비스센터") || lastMessage.includes("센터별")) {
      const centers = summary?.by_service_center;
      if (centers) {
        const topCenter = Object.entries(centers).reduce((a: any, b: any) => (a[1].total_amount > b[1].total_amount ? a : b));
        mockContent = `서비스센터별 데이터를 분석해 보았습니다. 가장 활동이 활발한 곳은 ${topCenter[0]}로, 총 ${topCenter[1].count}건의 시공이 진행되었습니다.`;
      } else {
        mockContent = "센터별 요약 정보를 가져오는 중입니다.";
      }
    } else if (lastMessage.includes("전체") || lastMessage.includes("얼마나")) {
      mockContent = `전체 데이터 시트에는 총 ${summary?.total_rows || 0}개의 로우가 기록되어 있으며, 이를 바탕으로 분석 중입니다. 대시보드상의 매출 외에도 상세 시공 내역 분석이 가능합니다.`;
    } else {
      mockContent = "로우 데이터에서 특정 시공팀, 서비스센터 또는 최근 프로젝트 내역에 대해 질문해 주시면 상세히 답변해 드릴 수 있습니다.";
    }

    return NextResponse.json({ content: mockContent });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Failed to generate response" }, { status: 500 });
  }
}

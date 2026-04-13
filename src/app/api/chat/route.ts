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

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ 
        content: "현재 시스템에 GEMINI_API_KEY가 등록되지 않았습니다. 환경 변수(.env.local 또는 Vercel 설정)에 발급받은 키를 추가해 주세요." 
      });
    }

    const formattedMessages = messages.map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        },
        contents: formattedMessages
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API Error:", errorText);
      return NextResponse.json({ content: "제미나이 API 호출 중 오류가 발생했습니다. 키가 유효한지 확인해주세요." }, { status: 500 });
    }

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "답변을 생성하지 못했습니다.";
    
    return NextResponse.json({ content: reply });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Failed to generate response" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { month, reportText, insights } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({
        summary: "GEMINI_API_KEY가 없습니다. 환경 변수를 설정해 주세요."
      });
    }

    const systemPrompt = `
당신은 경영진에게 보고서를 올리는 데이터 분석가입니다.
제공된 이번 달(${month})의 데이터 분석 리포트 전문과 주요 인사이트(이상치 및 경고 내역)를 바탕으로,
경영진이나 실무자가 10초 만에 핵심 판단을 내릴 수 있도록 **'최종 요약 브리핑'**을 작성해 주세요.

규칙:
1. 글머리 기호 2~3개 이내로 아주 간결하게 요약하세요.
2. 숫자가 있다면 반드시 포함하세요.
3. 문제점(경고)이 있다면 어떤 조치가 필요한지 제언 형식으로 마무리하세요.
4. 부드럽고 전문적인 비즈니스 문체를 사용하세요. (예: "~입니다", "~것이 권장됩니다")
    `;

    const requestBody = {
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `[분석 전문]\n${reportText}\n\n[주요 인사이트]\n${JSON.stringify(insights, null, 2)}`
            }
          ]
        }
      ]
    };

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API Error in Analysis Report:", errorText);
      return NextResponse.json({ summary: "AI 요약 생성 중 오류가 발생했습니다." }, { status: 500 });
    }

    const data = await response.json();
    const summary = data.candidates?.[0]?.content?.parts?.[0]?.text || "요약을 생성하지 못했습니다.";

    return NextResponse.json({ summary: summary.trim() });
  } catch (error) {
    console.error("API Error in Analysis Report:", error);
    return NextResponse.json({ error: "Failed to generate AI executive summary" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { month, selectedMonth, reportText, insights, financialContext } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({
        summary: "GEMINI_API_KEY가 없습니다. 환경 변수를 설정해 주세요."
      });
    }

    const targetMonth = month || selectedMonth;

    const systemPrompt = `
당신은 최고재무책임자(CFO) 및 C-Level 경영진에게 직관적이고 깊이 있는 '경영 실적 및 채산성 분석 브리핑'을 제공하는 수석 비즈니스 데이터 애널리스트입니다.

단순히 수치 차이를 나열하는 요약을 넘어, 매출과 비용 변화의 근본적인 원인을 진단하고, 채산성 악화나 비효율을 유발하는 지점을 명확히 짚어내어 구체적인 비즈니스 의사결정 인사이트와 실행 방안(Action Items)을 제시해야 합니다.

제공된 이번 달(${targetMonth})의 데이터 분석 리포트 전문, 주요 인사이트(이상치 및 경고 내역), 그리고 정량적 재무 구조 데이터를 종합적으로 분석하여 아래 구조로 **'심층 비즈니스 분석 리포트'**를 작성해 주세요.

작성 구조 및 포맷:
1. **📊 경영 실적 총평 (Executive Summary)**
   - 당월 매출, 변동비, 공헌이익 및 이익률의 핵심 트렌드 요약 (전월 및 전년 평균 대비 성과 평가)
   - 채산성(공헌이익률) 변화의 가장 결정적인 드라이버(핵심 요인) 1~2가지 제시

2. **🔍 채산성 변동 요인 및 비효율 진단 (Deep-Dive Analysis)**
   - **수익성/비용 구조**: 매출 증가/감소 대비 변동비의 증가/감소 추이가 적절한지 분석.
   - **비용 블랙홀 및 누수 지점**:
     - 심야/야간 시공 비율 및 지급 상한액 초과에 따른 비용 영향 분석 (특정 고비용 프로젝트 언급)
     - 장비 사용 비효율성 (연 평균 대비 장비비 비율 급증 여부)
     - 출장비/숙식비 묶음 배송 비효율 또는 특정 팀 하자 공제(품질 문제)로 인한 손실 진단

3. **💡 실무적 개선 제언 (Action Items)**
   - 식별된 문제점들을 해결하기 위한 구체적이고 실현 가능한 조치 제언 (예: 심야 스케줄링 조정, C등급 팀 배정 제한 및 재교육, 장비 비계약 배차 축소, 지방 동선 묶음 스케줄링 최적화 등)

작성 규칙:
- 전문적이고 신뢰감을 주는 비즈니스 톤앤매너를 사용하세요. (~입니다, ~가 권장됩니다)
- 마크다운 문법(단락 구분, 글머리 기호, 굵은 글씨 등)을 활용하여 줄바꿈과 레이아웃이 깔끔하게 표현되도록 하세요.
- 숫자가 언급될 때는 백만원(M) 또는 억 원 단위로 명확하게 표기하세요.
- 원인 분석과 제언은 상호 유기적으로 연계되어 논리적 흐름이 매끄러워야 합니다.
    `;

    const requestBody = {
      system_instruction: {
        parts: [{ text: systemPrompt }]
      },
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `[분석 대상월]
${targetMonth}

[분석 전문 (대시보드 리포트)]
${reportText}

[주요 인사이트 및 탐지된 경고 사항]
${JSON.stringify(insights, null, 2)}

[정량적 재무 구조 및 운영 컨텍스트]
${JSON.stringify(financialContext, null, 2)}`
            }
          ]
        }
      ]
    };

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API Error in Analysis Report:", errorText);
      return NextResponse.json({ summary: `[에러 발생] Google 측 상세 응답:\n${errorText}` });
    }

    const data = await response.json();
    const summary = data.candidates?.[0]?.content?.parts?.[0]?.text || "요약을 생성하지 못했습니다.";

    return NextResponse.json({ summary: summary.trim() });
  } catch (error) {
    console.error("API Error in Analysis Report:", error);
    return NextResponse.json({ error: "Failed to generate AI executive summary" }, { status: 500 });
  }
}

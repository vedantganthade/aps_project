import { NextRequest, NextResponse } from "next/server";
import ollama from "ollama";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      feederId,
      feederName,
      riskScore,
      loadPercent,
      predictedPeakWindow,
      predictions,
      alertCount,
      busIds,
    } = body;

    const response = await ollama.chat({
      model: "llama3.2:1b",
      messages: [
        {
          role: "system",
          content:
            "You are a power-grid operations assistant. Return concise and practical risk guidance in valid JSON.",
        },
        {
          role: "user",
          content: `
Return valid JSON only in this format:
{
  "headline": "string",
  "whyAtRisk": "string",
  "contributingFactors": ["string"],
  "likelyNext": "string",
  "recommendedAction": "string",
  "similarCaseId": "",
  "similarCaseSummary": "",
  "confidence": 0.0
}

Feeder data:
- Feeder ID: ${feederId}
- Feeder Name: ${feederName}
- Risk Score: ${riskScore}
- Current Load %: ${loadPercent}
- Peak Window: ${predictedPeakWindow}
- Alert Count: ${alertCount}
- Bus IDs: ${JSON.stringify(busIds)}
- Predictions: ${JSON.stringify(predictions)}
          `.trim(),
        },
      ],
      options: {
        temperature: 0,
      },
    });

    const raw = response.message?.content ?? "{}";
    const parsed = JSON.parse(raw);

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("AI insight route error:", error);

    return NextResponse.json({
      headline: "AI insight unavailable",
      whyAtRisk: "The local Ollama model did not return a valid response.",
      contributingFactors: [
        "Ollama service unavailable or invalid JSON output",
      ],
      likelyNext:
        "The insight panel will continue using fallback behavior until the model responds correctly.",
      recommendedAction:
        "Check Ollama is running, then retry generating the insight.",
      similarCaseId: "",
      similarCaseSummary: "",
      confidence: 0.25,
    });
  }
}

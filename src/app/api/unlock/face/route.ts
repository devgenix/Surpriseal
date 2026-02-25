import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { referenceImageUrl, snapshotBase64 } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error("GEMINI_API_KEY is missing");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    if (!referenceImageUrl || !snapshotBase64) {
      return NextResponse.json({ error: "Missing required images" }, { status: 400 });
    }

    // 1. Fetch the reference image and convert to base64
    const refRes = await fetch(referenceImageUrl);
    if (!refRes.ok) throw new Error("Failed to fetch reference image");
    const refBuffer = await refRes.arrayBuffer();
    const refBase64 = Buffer.from(refBuffer).toString("base64");
    const refMime = refRes.headers.get("content-type") || "image/jpeg";

    // 2. Prepare the snapshot (strip prefix if exists)
    const cleanSnapshot = snapshotBase64.replace(/^data:image\/\w+;base64,/, "");

    // 3. Call Gemini Vision API directly via fetch
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const geminiPayload = {
      contents: [
        {
          parts: [
            { text: "Compare these two photos. Do they show the same person? Reply ONLY with 'YES' or 'NO'. If you are unsure or the face is not clear, reply 'NO'." },
            {
              inlineData: {
                mimeType: refMime,
                data: refBase64,
              },
            },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: cleanSnapshot,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        topK: 1,
        topP: 1,
        maxOutputTokens: 5,
      },
    };

    const visionRes = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geminiPayload),
    });

    if (!visionRes.ok) {
      const errorData = await visionRes.json();
      console.error("Gemini API Error:", errorData);
      return NextResponse.json({ error: "AI analysis failed" }, { status: 502 });
    }

    const visionData = await visionRes.json();
    const resultText = visionData.candidates?.[0]?.content?.parts?.[0]?.text?.trim()?.toUpperCase() || "";

    const isMatch = resultText.includes("YES");

    return NextResponse.json({ match: isMatch });
  } catch (error: any) {
    console.error("Face unlock API error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

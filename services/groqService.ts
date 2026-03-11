
import { TravelPreferences } from "../types";

const GROQ_API_KEY = "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";
const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

export const analyzeItineraryWithGroq = async (
  prefs: TravelPreferences,
  itineraryText: string
): Promise<string> => {
  const prompt = `
    你是一位「資深導遊總監 (Tour Director)」。
    我將提供由帶團導遊生成的初步行程，請你以總監的角度進行「體驗品質與風險管理分析」。
    
    【導覽行程】：
    ${itineraryText}
    
    【分析任務】：
    1. 行程順滑度：景點間的轉換是否符合人類心理期待？會不會太趕或太鬆？
    2. 深度點評：針對 ${prefs.destination}，這份行程是否觸及了真正的核心文化？
    3. 風險預警：根據 ${prefs.startDate} 至 ${prefs.endDate}，是否有天氣、交通或人潮風險？
    4. 總監總結：給予「導遊總監專業評分 (1-5星)」並提供一個提振行程品質的關鍵金句。
    
    使用「繁體中文」與 Markdown 格式，展現總監級別的高層次見解。
  `;

  try {
    const response = await fetch(GROQ_ENDPOINT, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "你是一位精通全球旅遊市場趨勢與高端導覽服務的導遊總監。" },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq API responded with status: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Groq API Error:", error);
    return "### ⚠️ 導遊總監審核暫時無法產生\n\n由於連線問題，總監級別的分析暫時無法載入，請先參閱導遊為您規劃的詳細行程。";
  }
};

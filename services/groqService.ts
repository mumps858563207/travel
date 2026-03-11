import { TravelPreferences } from "../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://mumpsapi.zeabur.app/v1";
const API_KEY = import.meta.env.VITE_API_KEY || "mumps2605";
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || "";

export const analyzeItineraryWithGroq = async (
  prefs: TravelPreferences,
  itineraryText: string
): Promise<string> => {
  if (!GROQ_API_KEY) {
    console.warn("GROQ_API_KEY not configured, using backend API instead");
    return await analyzeWithBackendAPI(prefs, itineraryText);
  }

  const prompt = `
    你是一位資深的旅遊領隊，擁有豐富的行程規劃經驗。
    請分析以下行程，並提供專業的改進建議和亮點分析。

    【旅遊主題】：${prefs.themes.join(', ')}
    【旅遊區域】：${prefs.region}
    【交通方式】：${prefs.transport}

    【原始行程】：
    ${itineraryText}

    請提供以下分析：
    1. 行程亮點總結（3-5 個重點）
    2. 時間安排評估
    3. 餐飲搭配評價
    4. 改進建議
  `;

  try {
    const response = await fetch(`${API_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: "gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "你是一位專業的旅遊領隊，請提供詳細的行程分析和改進建議。"
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "分析中...";
  } catch (error) {
    console.error("Groq Analysis Error:", error);
    return await analyzeWithBackendAPI(prefs, itineraryText);
  }
};

async function analyzeWithBackendAPI(
  prefs: TravelPreferences,
  itineraryText: string
): Promise<string> {
  const prompt = `
    你是一位資深的旅遊領隊，擁有豐富的行程規劃經驗。
    請分析以下行程，並提供專業的改進建議和亮點分析。

    【旅遊主題】：${prefs.themes.join(', ')}
    【旅遊區域】：${prefs.region}
    【交通方式】：${prefs.transport}

    【原始行程】：
    ${itineraryText}

    請提供以下分析：
    1. 行程亮點總結（3-5 個重點）
    2. 時間安排評估
    3. 餐飲搭配評價
    4. 改進建議
  `;

  try {
    const response = await fetch(`${API_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: "gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "你是一位專業的旅遊領隊，請提供詳細的行程分析和改進建議。"
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`Backend API Error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "分析中...";
  } catch (error) {
    console.error("Backend API Error:", error);
    throw error;
  }
}

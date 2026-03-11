
import { TravelPreferences, ItineraryResult, GroundingSource } from "../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://mumpsapi.zeabur.app/v1";
const API_KEY = import.meta.env.VITE_API_KEY || "mumps2605";

export const generateItineraryFromBackend = async (
  prefs: TravelPreferences,
  userLocation?: { latitude: number; longitude: number },
  existingItinerary?: string
): Promise<ItineraryResult> => {
  const prompt = `
    你是一位擁有 20 年全球帶團經驗的「資深專業導遊」。
    請為我規劃從 ${prefs.startPoint} 到 ${prefs.destination} 的 ${prefs.duration} 天專業導覽行程。
    
    旅遊區域：${prefs.region === 'Domestic' ? '國內深度遊' : '國際頂級遊'}
    交通模式：${prefs.transport}
    住宿偏好：${prefs.accommodations.join(', ')}
    旅遊主題：${prefs.themes.join(', ')}
    出發日期：${prefs.startDate}，回程日期：${prefs.endDate}
  `;

  try {
    const response = await fetch(`${API_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "你是一位專業的旅遊導遊，請提供詳細的行程規劃。"
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "導遊忙線中。";

    return {
      text,
      sources: [],
      preferences: prefs,
    };
  } catch (error) {
    console.error("Backend API Error:", error);
    throw error;
  }
};

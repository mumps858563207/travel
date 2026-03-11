
import { GoogleGenAI } from "@google/genai";
import { TravelPreferences, ItineraryResult, GroundingSource, TravelTheme, AccommodationType, CuisineType, TransportType, DayMealPreference } from "../types";

const getThemeDescription = (theme: TravelTheme): string => {
  switch (theme) {
    case 'Family': return '「親子導覽」：推薦設有親子友善設施與流暢動線。';
    case 'Couple': return '「情侶深度遊」：推薦浪漫氛圍與私密秘境。';
    case 'Solo': return '「獨旅探索」：著重安全性與適合單人體驗的角落。';
    case 'Onsen': return '「溫泉舒壓」：深入介紹泉質特色與泡湯禮儀。';
    case 'Shopping': return '「精品購物」 : 掌握流行商圈與退稅流程。';
    case 'Culture': return '「文史深度」：著重歷史背景與建築意義。';
    case 'Friends': return '「好友同遊」：推薦高互動性與拍照點。';
    default: return '';
  }
};

const getTransportLabel = (transport: TransportType): string => {
  switch (transport) {
    case 'Flight_Driving': return '飛機來回 + 當地自駕租車';
    case 'Flight_HSR': return '飛機來回 + 當地鐵道/快鐵';
    case 'Flight': return '僅飛機(含機場接送)';
    case 'Driving': return '全程自駕';
    case 'HSR': return '高鐵/台鐵/捷運';
    case 'PublicTransport': return '全大眾運輸(鐵路、客運、計程車組合)';
    default: return '自定義';
  }
};

export const generateItinerary = async (
  prefs: TravelPreferences,
  userLocation?: { latitude: number; longitude: number },
  existingItinerary?: string
): Promise<ItineraryResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const modelName = 'gemini-3-flash-preview';
  
  const transportContext = prefs.transport.startsWith('Flight') 
    ? `【複合交通規劃】：導遊需規劃機場往返時間、建議的航空公司、以及落地後的租車/接駁銜接流程。`
    : prefs.transport === 'PublicTransport'
    ? `【大眾運輸深度規劃】：導遊需詳細列出建議搭乘的客運、火車班次時間，以及轉乘計程車的預估車資。`
    : `【在地交通規劃】：專注於 ${getTransportLabel(prefs.transport)} 的路線優化。`;

  // 格式化每日餐飲需求給 AI
  const mealDetailedContext = prefs.dailyMeals.map(m => 
    `Day ${m.day}: 早餐偏好「${m.breakfast}」, 午餐偏好「${m.lunch}」, 晚餐偏好「${m.dinner}」`
  ).join('\n');

  const prompt = `
    你是一位擁有 20 年全球帶團經驗的「資深專業導遊」。
    請為我規劃從 ${prefs.startPoint} 到 ${prefs.destination} 的 ${prefs.duration} 天專業導覽行程。

    【客戶核心偏好設定】：
    - 旅遊區域：${prefs.region === 'Domestic' ? '國內深度遊' : '國際頂級遊'}
    - 交通模式：${getTransportLabel(prefs.transport)}
    - 住宿偏好：${prefs.accommodations.join(', ')}
    - 旅遊主題：${prefs.themes.map(t => getThemeDescription(t)).join(', ')}
    - 出發日期：${prefs.startDate}，回程日期：${prefs.endDate}

    【每日精確餐飲類型指令 - 請務必實踐】：
    ${mealDetailedContext}

    ${transportContext}

    【行程輸出核心規則】：
    1. **三餐強烈媒合**：行程表每一天「必須」明確包含早餐、午餐、晚餐。若使用者選了特定的餐飲類型（例如：韓式料理、火鍋、川菜），你「必須」搜尋目的地 ${prefs.destination} 對應類型的知名餐廳（請參考 Google 評分）。
    2. **表格形式**：每一天的行程都必須以一個「完整的 Markdown 表格」呈現。
    3. **表格欄位**：
       | 日期 | 時間 | 項目 (景點/用餐/住宿) | 景點介紹/用餐樣式/住宿詳情 | 停留時間 | 車程時間 | 車程公里 |
    4. **導航連結**：所有提及的餐廳、景點、飯店必須附帶 Google Maps 或預訂連結。
    5. **文字格式**：繁體中文。

    利用 Google Search 根據使用者的具體餐飲偏好標籤搜尋該目的地真實存在的高評價餐廳。
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: { tools: [{ googleSearch: {} }] },
    });
    const text = response.text || "導遊忙線中。";
    const sources: GroundingSource[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    chunks.forEach((chunk: any) => {
      if (chunk.web) sources.push({ title: chunk.web.title || "來源", uri: chunk.web.uri });
    });
    return { text, sources: Array.from(new Set(sources.map(s => s.uri))).map(uri => sources.find(s => s.uri === uri)!).slice(0, 10), preferences: prefs };
  } catch (error) { console.error(error); throw error; }
};

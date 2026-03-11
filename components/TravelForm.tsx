
import React, { useRef, useEffect, useState } from 'react';
import { TravelPreferences, TransportType, AccommodationType, ItineraryResult, TravelTheme, TravelRegion, CuisineType, DayMealPreference } from '../types';

interface TravelFormProps {
  preferences: TravelPreferences;
  onUpdate: (updates: Partial<TravelPreferences>) => void;
  onSubmit: (reOptimizeData?: string) => void;
  isLoading: boolean;
  onImport: (data: { preferences: TravelPreferences, itinerary: ItineraryResult }) => void;
  hasImportedData: boolean;
}

const TravelForm: React.FC<TravelFormProps> = ({ preferences, onUpdate, onSubmit, isLoading, onImport, hasImportedData }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeMealDay, setActiveMealDay] = useState<number>(1);

  const mealOptions = [
    { value: '在地人推薦/隨意', label: '🌟 在地人推薦/隨意' },
    { value: '火鍋', label: '🍲 火鍋' },
    { value: '燒烤/燒肉', label: '🔥 燒肉/燒烤' },
    { value: '西式牛排', label: '🥩 西式牛排' },
    { value: '川菜/辛辣', label: '🌶️ 川菜/辛辣' },
    { value: '在地小吃/夜市', label: '🍢 在地小吃' },
    { value: '中式料理', label: '🍱 中式料理' },
    { value: '日式料理', label: '🍣 日式料理' },
    { value: '韓式料理', label: '🥘 韓式料理' },
    { value: '米其林/高端餐飲', label: '⭐️ 米其林/高端' },
    { value: '網美咖啡廳/下午茶', label: '☕️ 下午茶/Cafe' },
    { value: '道地特色早餐', label: '🥣 特色早餐' },
  ];

  const regions: { key: TravelRegion; label: string; icon: string }[] = [
    { key: 'Domestic', label: '國內旅遊', icon: '📍' },
    { key: 'International', label: '國外旅遊', icon: '🌏' },
  ];

  const getTransports = () => {
    if (preferences.region === 'International') {
      return [
        { key: 'Flight_Driving' as TransportType, label: '飛機 + 自駕', icon: '✈️🚗' },
        { key: 'Flight_HSR' as TransportType, label: '飛機 + 鐵道', icon: '✈️🚄' },
        { key: 'Flight' as TransportType, label: '僅飛機(接送)', icon: '✈️' },
      ];
    } else {
      return [
        { key: 'Driving' as TransportType, label: '全程自駕', icon: '🚗' },
        { key: 'HSR' as TransportType, label: '高鐵/台鐵', icon: '🚄' },
        { key: 'PublicTransport' as TransportType, label: '大眾交通(鐵路/客運/計程車)', icon: '🚌' },
      ];
    }
  };

  // 修正：更精確的天數計算邏輯
  useEffect(() => {
    if (preferences.startDate && preferences.endDate) {
      const startParts = preferences.startDate.split('-').map(Number);
      const endParts = preferences.endDate.split('-').map(Number);
      
      // 使用純日期物件（不含時間與時區偏差）
      const d1 = new Date(startParts[0], startParts[1] - 1, startParts[2]);
      const d2 = new Date(endParts[0], endParts[1] - 1, endParts[2]);
      
      if (!isNaN(d1.getTime()) && !isNaN(d2.getTime())) {
        if (d2 < d1) {
          onUpdate({ endDate: preferences.startDate, duration: 1 });
          return;
        }
        
        const diffTime = d2.getTime() - d1.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
        
        if (diffDays !== preferences.duration && diffDays > 0) {
          onUpdate({ duration: diffDays });
        }
      }
    }
  }, [preferences.startDate, preferences.endDate, preferences.duration]);

  // 同步三餐設定陣列
  useEffect(() => {
    const currentMeals = preferences.dailyMeals || [];
    if (currentMeals.length !== preferences.duration) {
      const newMeals: DayMealPreference[] = Array.from({ length: preferences.duration }, (_, i) => {
        const existing = currentMeals[i];
        return existing || { day: i + 1, breakfast: '道地特色早餐', lunch: '在地人推薦/隨意', dinner: '在地人推薦/隨意' };
      });
      onUpdate({ dailyMeals: newMeals });
    }
    if (activeMealDay > preferences.duration) setActiveMealDay(1);
  }, [preferences.duration]);

  useEffect(() => {
    const available = getTransports();
    if (!available.find(t => t.key === preferences.transport)) {
      onUpdate({ transport: available[0].key });
    }
  }, [preferences.region]);

  const accommodations: { key: AccommodationType; label: string; icon: string }[] = [
    { key: 'Hotel', label: '飯店/旅店', icon: '🏨' },
    { key: 'B&B', label: '民宿', icon: '🏠' },
    { key: 'Motel', label: '汽車旅館', icon: '🏎️' },
    { key: 'Camping', label: '露營地', icon: '🏕️' },
  ];

  const themes: { key: TravelTheme; label: string; icon: string }[] = [
    { key: 'Family', label: '親子旅遊', icon: '👨‍👩‍👧‍👦' },
    { key: 'Couple', label: '夫妻情侶', icon: '💑' },
    { key: 'Solo', label: '個人獨旅', icon: '🎒' },
    { key: 'Onsen', label: '溫泉之旅', icon: '♨️' },
    { key: 'Shopping', label: '購物狂歡', icon: '🛍️' },
    { key: 'Culture', label: '深度知性', icon: '🏛️' },
    { key: 'Friends', label: '好友同遊', icon: '👭' },
  ];

  const updateDailyMeal = (day: number, field: keyof DayMealPreference, value: string) => {
    const newMeals = preferences.dailyMeals.map(m => 
      m.day === day ? { ...m, [field]: value } : m
    );
    onUpdate({ dailyMeals: newMeals });
  };

  const toggleSelection = (list: any[], item: any, key: string) => {
    const current = list || [];
    if (current.includes(item)) {
      if (current.length > 1) onUpdate({ [key]: current.filter(i => i !== item) });
    } else {
      onUpdate({ [key]: [...current, item] });
    }
  };

  const handleBookingSearch = () => {
    if (!preferences.destination) {
      alert("請先輸入目的地以進行住宿搜尋！");
      return;
    }
    const accType = preferences.accommodations[0] || 'Hotel';
    const query = `${preferences.destination} ${accType} 推薦 訂房`;
    window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.preferences && json.itinerary) onImport({ preferences: json.preferences, itinerary: json.itinerary });
      } catch (err) { alert("檔案讀取失敗。"); }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-6 space-y-6 border border-gray-100 animate-fade-in overflow-y-auto max-h-[85vh]">
      <div className="flex justify-between items-center border-b pb-3 mb-2">
        <div className="flex flex-col">
          <h2 className="text-lg font-bold text-gray-800 font-['Noto_Sans_TC']">專業導遊設定</h2>
          <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">為您規劃最優路徑</span>
        </div>
        <button onClick={() => fileInputRef.current?.click()} className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors font-bold flex items-center space-x-1">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
          <span>匯入</span>
        </button>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".json" />
      </div>

      <div className="space-y-3">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">旅遊區域</label>
        <div className="flex p-1 bg-gray-100 rounded-xl">
          {regions.map((r) => (
            <button key={r.key} onClick={() => onUpdate({ region: r.key })} className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-lg text-sm font-bold transition-all ${preferences.region === r.key ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              <span>{r.icon}</span><span>{r.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4 bg-indigo-50/30 p-4 rounded-2xl border border-indigo-50">
        <div className="flex justify-between items-center mb-1">
          <label className="text-xs font-black text-indigo-700 uppercase tracking-widest flex items-center">
            <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></span>行程日期
          </label>
          <div className="bg-indigo-600 text-white px-3 py-1 rounded-full text-[10px] font-black">共計 {preferences.duration} 天</div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <input type="date" className="w-full px-3 py-3 bg-white border border-indigo-100 rounded-xl text-sm font-bold" value={preferences.startDate || ''} onChange={(e) => onUpdate({ startDate: e.target.value })} />
          <input type="date" className="w-full px-3 py-3 bg-white border border-indigo-100 rounded-xl text-sm font-bold" value={preferences.endDate || ''} onChange={(e) => onUpdate({ endDate: e.target.value })} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input type="text" className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="出發起點 (如：台北)" value={preferences.startPoint} onChange={(e) => onUpdate({ startPoint: e.target.value })} />
        <input type="text" className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="目的地 (如：東京)" value={preferences.destination} onChange={(e) => onUpdate({ destination: e.target.value })} />
      </div>

      <div className="space-y-3">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">交通接駁方式</label>
        <div className="grid grid-cols-1 gap-2">
          {getTransports().map((t) => (
            <button key={t.key} onClick={() => onUpdate({ transport: t.key })} className={`flex items-center px-4 py-3 rounded-xl text-sm font-bold transition-all border ${preferences.transport === t.key ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-gray-600 border-gray-100 hover:bg-gray-50'}`}>
              <span className="mr-3 text-lg">{t.icon}</span><span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
        <div className="flex justify-between items-center mb-2">
          <label className="text-xs font-black text-slate-700 uppercase tracking-widest">住宿偏好</label>
          <button onClick={handleBookingSearch} className="text-[10px] bg-white border border-slate-200 text-slate-600 px-2 py-1 rounded-lg hover:bg-slate-100 flex items-center space-x-1 font-bold shadow-sm">
            <span>🌐 立即搜尋預訂</span>
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {accommodations.map((a) => (
            <button key={a.key} onClick={() => toggleSelection(preferences.accommodations, a.key, 'accommodations')} className={`flex items-center space-x-2 px-3 py-2.5 rounded-xl text-[11px] font-bold border transition-all ${preferences.accommodations.includes(a.key) ? 'bg-slate-800 text-white border-slate-800 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}>
              <span>{a.icon}</span><span>{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4 bg-rose-50/50 p-4 rounded-2xl border border-rose-100">
        <div className="flex flex-col space-y-1">
          <label className="text-xs font-black text-rose-700 uppercase tracking-widest">每日三餐美食偏好</label>
          <p className="text-[10px] text-rose-400 font-bold italic">為每一天選擇您想品嚐的料理類型。</p>
        </div>

        <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
          {Array.from({ length: preferences.duration }).map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveMealDay(i + 1)}
              className={`flex-shrink-0 w-10 h-10 rounded-full text-xs font-black border transition-all ${activeMealDay === i + 1 ? 'bg-rose-600 text-white border-rose-600 shadow-md scale-110' : 'bg-white text-rose-600 border-rose-200'}`}
            >
              D{i + 1}
            </button>
          ))}
        </div>

        {preferences.dailyMeals.map((meal) => (
          meal.day === activeMealDay && (
            <div key={meal.day} className="space-y-4 animate-fade-in">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-rose-500 ml-1 flex items-center uppercase tracking-wider">🥣 Day {meal.day} 早餐偏好</label>
                <select 
                  className="w-full px-3 py-3 bg-white border border-rose-100 rounded-xl text-xs font-bold focus:ring-2 focus:ring-rose-500 outline-none appearance-none cursor-pointer"
                  value={meal.breakfast}
                  onChange={(e) => updateDailyMeal(meal.day, 'breakfast', e.target.value)}
                >
                  {mealOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-rose-500 ml-1 flex items-center uppercase tracking-wider">🍛 Day {meal.day} 午餐偏好</label>
                <select 
                  className="w-full px-3 py-3 bg-white border border-rose-100 rounded-xl text-xs font-bold focus:ring-2 focus:ring-rose-500 outline-none appearance-none cursor-pointer"
                  value={meal.lunch}
                  onChange={(e) => updateDailyMeal(meal.day, 'lunch', e.target.value)}
                >
                  {mealOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-rose-500 ml-1 flex items-center uppercase tracking-wider">🍽️ Day {meal.day} 晚餐偏好</label>
                <select 
                  className="w-full px-3 py-3 bg-white border border-rose-100 rounded-xl text-xs font-bold focus:ring-2 focus:ring-rose-500 outline-none appearance-none cursor-pointer"
                  value={meal.dinner}
                  onChange={(e) => updateDailyMeal(meal.day, 'dinner', e.target.value)}
                >
                  {mealOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
            </div>
          )
        ))}
      </div>

      <div className="space-y-3 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
        <label className="text-xs font-black text-indigo-700 uppercase tracking-widest">旅遊主題風格</label>
        <div className="grid grid-cols-2 gap-2">
          {themes.map((t) => (
            <button key={t.key} onClick={() => toggleSelection(preferences.themes, t.key, 'themes')} className={`flex items-center space-x-2 px-3 py-2.5 rounded-xl text-[11px] font-bold border transition-all ${preferences.themes.includes(t.key) ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-white text-indigo-600 border-indigo-100 hover:border-indigo-300'}`}>
              <span>{t.icon}</span><span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => onSubmit()}
        disabled={isLoading || !preferences.startPoint || !preferences.destination || !preferences.startDate || !preferences.endDate}
        className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-lg flex items-center justify-center space-x-2 active:scale-95"
      >
        {isLoading ? <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> : <span>{hasImportedData ? "重新優化行程" : "開始規劃專屬行程"}</span>}
      </button>
    </div>
  );
};

export default TravelForm;

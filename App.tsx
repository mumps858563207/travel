import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import TravelForm from './components/TravelForm';
import ItineraryDisplay from './components/ItineraryDisplay';
import { TravelPreferences, ItineraryResult, DayMealPreference } from './types';
import { generateItineraryFromBackend } from './services/backendService';
import { analyzeItineraryWithGroq } from './services/groqService';

const App: React.FC = () => {
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const dayAfterTomorrow = new Date(Date.now() + 172800000).toISOString().split('T')[0];

  // 修正：初始日期 (明天至後天) 正確應為 2 天
  const initialDuration = 2;
  const initialDailyMeals: DayMealPreference[] = Array.from({ length: initialDuration }, (_, i) => (
    {
      day: i + 1,
      breakfast: '道地特色早餐',
      lunch: '在地人推薦/隨意',
      dinner: '在地人推薦/隨意'
    }
  ));

  const [preferences, setPreferences] = useState<TravelPreferences>({
    region: 'Domestic',
    startPoint: '',
    destination: '',
    duration: initialDuration,
    transport: 'Driving',
    accommodations: ['Hotel'],
    themes: ['Family'],
    cuisines: ['Chinese'],
    dailyMeals: initialDailyMeals,
    startDate: tomorrow,
    endDate: dayAfterTomorrow
  });

  const [userLocation, setUserLocation] = useState<{ latitude: number, longitude: number } | undefined>();
  const [itinerary, setItinerary] = useState<ItineraryResult | null>(null);
  const [loadingStep, setLoadingStep] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importedItinerary, setImportedItinerary] = useState<string | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        (err) => console.log("Geolocation blocked", err)
      );
    }
  }, []);

  const handleUpdatePrefs = (updates: Partial<TravelPreferences>) => {
    setPreferences(prev => ({ ...prev, ...updates }));
  };

  const handleImport = (data: { preferences: TravelPreferences, itinerary: ItineraryResult }) => {
    setPreferences(data.preferences);
    setImportedItinerary(data.itinerary.text);
    setItinerary(data.itinerary);
    setError(null);
  };

  const handleSubmit = async () => {
    setLoadingStep("BACKEND");
    setError(null);
    setItinerary(null);

    try {
      const backendResult = await generateItineraryFromBackend(preferences, userLocation, importedItinerary || undefined);

      setLoadingStep("GROQ");
      const groqAnalysis = await analyzeItineraryWithGroq(preferences, backendResult.text);

      setItinerary({
        ...backendResult,
        agentAnalysis: groqAnalysis
      });
      setImportedItinerary(null);
    } catch (err) {
      setError("導遊目前忙線中，請稍候再試。");
      console.error(err);
    } finally {
      setLoadingStep(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-['Noto_Sans_TC']">
      <Header />

      <main className="flex-grow container mx-auto px-4 py-8 max-w-6xl flex flex-col lg:flex-row gap-10">
        <aside className="lg:w-1/3 lg:sticky lg:top-24 h-fit space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-gray-900 leading-tight">AI 國內、外 <br /><span className="text-indigo-600 font-black">專業導遊規劃</span></h1>
            <p className="text-gray-500 text-sm italic">後端 API 專業踩點 + Groq 領隊戰略分析</p>
          </div>

          <TravelForm
            preferences={preferences}
            onUpdate={handleUpdatePrefs}
            onSubmit={handleSubmit}
            isLoading={!!loadingStep}
            onImport={handleImport}
            hasImportedData={!!importedItinerary}
          />

          {loadingStep && (
            <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm space-y-3 animate-fade-in">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest">
                <span className={loadingStep === "BACKEND" ? "text-indigo-600" : "text-gray-400"}>1. 後端 API 規劃中</span>
                <span className={loadingStep === "GROQ" ? "text-indigo-600" : "text-gray-400"}>2. 總召集人審核中</span>
              </div>
              <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-full transition-all duration-500 ease-out"
                  style={{ width: loadingStep === "BACKEND" ? '50%' : '100%' }}
                />
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-sm font-medium flex items-center space-x-2 animate-fade-in">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              <span>{error}</span>
            </div>
          )}
        </aside>

        <section className="lg:w-2/3">
          {itinerary || loadingStep ? (
            <ItineraryDisplay
              result={itinerary}
              isLoading={!!loadingStep}
              currentStep={loadingStep}
              preferences={preferences}
            />
          ) : (
            <div className="bg-white rounded-3xl border-2 border-dashed border-gray-200 h-[500px] flex flex-col items-center justify-center text-center p-10 space-y-4">
              <div className="bg-gray-50 p-6 rounded-full text-gray-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800">您的專業導遊已就位</h3>
              <p className="text-gray-500 max-w-sm mx-auto">輸入您的旅遊日期與目的地，讓資深導遊為您量身打造極致行程。</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default App;


import React, { useState } from 'react';
import { ItineraryResult, TravelPreferences } from '../types';
import { exportToDocx, exportToJson } from '../services/exportService';

interface ItineraryDisplayProps {
  result: ItineraryResult | null;
  isLoading: boolean;
  currentStep?: string | null;
  preferences: TravelPreferences;
}

const ItineraryDisplay: React.FC<ItineraryDisplayProps> = ({ result, isLoading, currentStep, preferences }) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportDocx = async () => {
    if (!result) return;
    setIsExporting(true);
    try {
      await exportToDocx(result, preferences);
    } catch (error) {
      console.error("Export failed", error);
      alert("匯出 Word 檔案失敗。");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportJson = () => {
    if (!result) return;
    exportToJson(result, preferences);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-8 animate-fade-in">
        <div className="relative">
          <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center border-4 border-indigo-50 shadow-inner">
            <svg className="animate-spin-reverse w-12 h-12 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
          </div>
          <div className="absolute -top-1 -right-1 flex h-6 w-6">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-6 w-6 bg-indigo-500"></span>
          </div>
        </div>
        <div className="text-center space-y-3">
          <p className="text-gray-900 font-black text-2xl font-['Noto_Sans_TC']">
            {currentStep === "GEMINI" ? "🔍 專業導遊正在親自踩點規劃..." : "🧠 導遊總監正在進行風險與體驗優化..."}
          </p>
          <p className="text-gray-500 text-base max-w-md mx-auto">
            我們正在為您生成包含 Google Maps 導航與預訂連結的精確行程表。
          </p>
        </div>
      </div>
    );
  }

  if (!result) return null;

  const renderTextWithLinksAndImages = (text: string) => {
    const combinedRegex = /(!\[.*?\]\(.*?\))|(\[.*?\]\(.*?\))/g;
    let parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;
    
    while ((match = combinedRegex.exec(text)) !== null) {
      parts.push(text.substring(lastIndex, match.index));
      const fullMatch = match[0];
      if (fullMatch.startsWith('!')) {
        const imgMatch = /!\[(.*?)\]\((.*?)\)/.exec(fullMatch);
        if (imgMatch) {
          parts.push(
            <div key={match.index} className="my-6 group relative rounded-2xl overflow-hidden shadow-xl border border-gray-100">
              <img 
                src={imgMatch[2]} 
                alt={imgMatch[1]} 
                className="w-full h-auto object-cover max-h-[500px] transition-transform duration-500 group-hover:scale-105" 
                onError={(e) => (e.currentTarget.parentElement!.style.display = 'none')} 
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                <p className="text-white text-sm font-bold drop-shadow-md">📸 {imgMatch[1]}</p>
              </div>
            </div>
          );
        }
      } else {
        const linkMatch = /\[(.*?)\]\((.*?)\)/.exec(fullMatch);
        if (linkMatch) {
          const url = linkMatch[2];
          const isMaps = url.includes('google.com/maps');
          const isBooking = url.includes('booking.com') || url.includes('agoda.com') || url.includes('hotels.com');
          
          parts.push(
            <a 
              key={match.index} 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className={`inline-flex items-center space-x-1 font-bold underline transition-all ${isMaps ? 'text-blue-600 hover:text-blue-800' : isBooking ? 'text-emerald-600 hover:text-emerald-800' : 'text-indigo-600 hover:text-indigo-800'}`}
            >
              {isMaps && (
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
              )}
              {isBooking && (
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
              )}
              <span>{linkMatch[1]}</span>
            </a>
          );
        }
      }
      lastIndex = combinedRegex.lastIndex;
    }
    parts.push(text.substring(lastIndex));
    return parts;
  };

  const renderMarkdown = (content: string) => {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let currentTableRows: string[][] = [];
    let inTable = false;

    lines.forEach((line, i) => {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('|')) {
        inTable = true;
        if (!trimmedLine.match(/^[|\-\s:]+$/)) {
          const cells = trimmedLine.split('|')
            .filter((c, idx, arr) => (idx > 0 && idx < arr.length - 1) || c.trim() !== '')
            .map(c => c.trim());
          if (cells.length > 0) currentTableRows.push(cells);
        }
        return;
      } else if (inTable) {
        if (currentTableRows.length > 0) {
          const rows = [...currentTableRows];
          elements.push(
            <div key={`table-${i}`} className="my-10 overflow-x-auto rounded-3xl border border-gray-100 shadow-2xl">
              <table className="min-w-[1000px] w-full divide-y divide-gray-200">
                <thead className="bg-gray-900 text-white">
                  <tr>
                    {rows[0].map((cell, idx) => (
                      <th key={idx} className="px-6 py-5 text-left text-xs font-black uppercase tracking-widest border-r border-gray-800 last:border-0">
                        {cell}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {rows.slice(1).map((row, rIdx) => {
                    const isMeal = row[2]?.includes('餐');
                    const isAcc = row[2]?.includes('住宿');
                    return (
                      <tr key={rIdx} className={`hover:bg-slate-50 transition-colors ${isMeal ? 'bg-rose-50/30' : ''} ${isAcc ? 'bg-indigo-50/30' : ''}`}>
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="px-6 py-4 text-sm text-gray-700 leading-relaxed border-r border-gray-50 last:border-0">
                            {renderTextWithLinksAndImages(cell)}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        }
        currentTableRows = [];
        inTable = false;
        if (!trimmedLine) return;
      }

      if (trimmedLine.startsWith('# ')) {
        elements.push(<h1 key={i} className="text-4xl font-black text-gray-900 mt-12 mb-8 border-l-8 border-indigo-600 pl-6 leading-tight">{trimmedLine.replace('# ', '')}</h1>);
      } else if (trimmedLine.startsWith('## ')) {
        elements.push(<h2 key={i} className="text-2xl font-bold text-gray-800 mt-10 mb-5 flex items-center"><span className="w-4 h-10 bg-indigo-500 mr-4 rounded-full"></span>{trimmedLine.replace('## ', '')}</h2>);
      } else if (trimmedLine.startsWith('### ')) {
        elements.push(<h3 key={i} className="text-xl font-bold text-indigo-700 mt-8 mb-4">{trimmedLine.replace('### ', '')}</h3>);
      } else if (trimmedLine !== '') {
        elements.push(<p key={i} className="text-gray-700 text-lg leading-relaxed mb-6">{renderTextWithLinksAndImages(trimmedLine)}</p>);
      }
    });
    return elements;
  };

  return (
    <div className="space-y-16 animate-fade-in pb-32">
      <div className="flex flex-wrap gap-4 justify-between items-center bg-white/90 p-5 rounded-3xl border border-indigo-50 shadow-xl sticky top-24 z-40 glass-morphism">
        <div className="flex items-center space-x-3 text-indigo-600 font-black text-lg">
          <div className="bg-indigo-100 p-2 rounded-xl">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <span>專業導覽行程已生成</span>
        </div>
        <div className="flex space-x-3">
          <button onClick={handleExportJson} className="text-slate-700 font-bold px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all">數據備份</button>
          <button onClick={handleExportDocx} disabled={isExporting} className="bg-indigo-600 text-white font-bold px-6 py-2 rounded-xl shadow-lg hover:bg-indigo-700 transition-all disabled:opacity-50">
            {isExporting ? "匯出中..." : "匯出 Word"}
          </button>
        </div>
      </div>

      {result.agentAnalysis && (
        <div className="bg-slate-900 rounded-[3rem] p-12 shadow-2xl border-t-8 border-indigo-500 relative overflow-hidden group">
          <div className="relative z-10">
            <div className="flex items-center space-x-4 mb-10">
              <div className="bg-indigo-500 h-12 w-2 rounded-full"></div>
              <h3 className="text-indigo-400 font-black text-2xl tracking-widest uppercase">總監專業評估</h3>
            </div>
            <div className="prose prose-invert max-w-none text-slate-300 font-['Noto_Sans_TC'] text-lg">
              {renderMarkdown(result.agentAnalysis)}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-[3rem] shadow-2xl shadow-gray-200/50 p-12 md:p-16 border border-gray-50 relative overflow-x-auto">
        <div className="prose max-w-none font-['Noto_Sans_TC']">
          {renderMarkdown(result.text)}
        </div>
      </div>

      {result.sources.length > 0 && (
        <div className="bg-white rounded-3xl p-10 border border-gray-100 shadow-xl">
          <h3 className="text-gray-900 font-black text-xl mb-8 flex items-center space-x-4 uppercase tracking-widest">
            <span className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs">AI</span>
            <span>實時導覽參考資料庫</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {result.sources.map((source, idx) => (
              <a key={idx} href={source.uri} target="_blank" rel="noopener noreferrer" className="group flex items-center p-5 rounded-2xl border border-gray-50 bg-gray-50/50 hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-white text-indigo-600 flex items-center justify-center font-black text-xs mr-4 shadow-sm group-hover:bg-indigo-500 group-hover:text-white">{idx + 1}</span>
                <span className="truncate font-bold text-sm">{source.title}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ItineraryDisplay;

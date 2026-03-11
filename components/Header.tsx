
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 glass-morphism border-b px-6 py-4 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-200">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-gray-800 tracking-tight">AI 國內、外 <span className="text-indigo-600 font-black">專業導遊規劃</span></h1>
      </div>
      <div className="hidden md:flex items-center text-sm font-medium text-gray-500 space-x-6">
        <span className="hover:text-indigo-600 transition-colors cursor-pointer">導遊踩點</span>
        <span className="hover:text-indigo-600 transition-colors cursor-pointer">數據校驗</span>
        <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs">資深導遊 AI 模型</span>
      </div>
    </header>
  );
};

export default Header;

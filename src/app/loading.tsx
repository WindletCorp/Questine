import React from 'react';

export default function GlobalLoading() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center min-h-[60vh] bg-background">
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 bg-blue-400 rounded-full animate-bounce shadow-sm" style={{ animationDelay: '-0.3s' }}></div>
        <div className="w-5 h-5 bg-pink-400 rounded-full animate-bounce shadow-sm" style={{ animationDelay: '-0.15s' }}></div>
        <div className="w-5 h-5 bg-emerald-400 rounded-full animate-bounce shadow-sm"></div>
      </div>
      <p className="mt-6 text-gray-400 font-bold text-sm tracking-widest uppercase">Loading...</p>
    </div>
  );
}

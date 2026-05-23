import React from 'react';
import { Trophy, Bell, User } from 'lucide-react';

export default function Header({ liveCount }) {
  return (
    <header className="sticky top-0 z-40 w-full bg-darkbg bg-opacity-80 backdrop-blur-md border-b border-[#121212] px-4 py-3 flex items-center justify-between">
      {/* Brand logo & title */}
      <div className="flex items-center space-x-2">
        <img src="/logo_game_time.png" alt="GameTime Logo" className="w-8 h-8 object-contain" />
        <div>
          <span className="font-extrabold text-lg tracking-wider text-white">
            GAME<span className="text-basketball">TIME</span>
          </span>
          <span className="block text-[9px] text-gray-500 font-bold uppercase tracking-widest leading-none">
            Latacunga 2026
          </span>
        </div>
      </div>

      {/* Live badge & user section */}
      <div className="flex items-center space-x-3">
        {liveCount > 0 && (
          <div className="flex items-center space-x-1.5 bg-[#f57c00] bg-opacity-10 border border-[#f57c00] border-opacity-35 px-2.5 py-1 rounded-full animate-pulse-slow">
            <span className="w-2 h-2 rounded-full bg-basketball shadow-[0_0_8px_#f57c00]" />
            <span className="text-[10px] font-bold text-basketball tracking-wider uppercase">
              {liveCount} En Vivo
            </span>
          </div>
        )}

        <button className="relative p-1.5 rounded-full bg-[#0d0d0d] border border-[#1a1a1a] hover:bg-[#161616] text-gray-400 transition-colors">
          <Bell className="w-4.5 h-4.5" />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-basketball rounded-full" />
        </button>

        <div className="w-8 h-8 rounded-full border border-basketball border-opacity-40 overflow-hidden bg-[#0d0d0d] flex items-center justify-center">
          <User className="w-4 h-4 text-basketball" />
        </div>
      </div>
    </header>
  );
}

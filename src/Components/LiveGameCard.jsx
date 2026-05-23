import React from 'react';
import { ShieldAlert, Users, Award, Clock } from 'lucide-react';

export default function LiveGameCard({ match, homeTeamData, awayTeamData, onOpenSheet }) {
  // Collective foul calculation max is usually 5.
  const homeFoulsPercent = Math.min((match.homeFouls / 5) * 100, 100);
  const awayFoulsPercent = Math.min((match.awayFouls / 5) * 100, 100);

  const getFoulBarColor = (fouls) => {
    if (fouls >= 5) return 'bg-red-500 shadow-[0_0_8px_#ef4444]';
    if (fouls >= 4) return 'bg-amber-500 shadow-[0_0_8px_#f59e0b]';
    return 'bg-electric';
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-[#1e1e1e] bg-gradient-to-br from-[#0c0c0c] to-[#121212] p-5 shadow-2xl glow-orange-border">
      {/* Basketball lines background effect */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50%" cy="50%" r="40%" fill="none" stroke="#F57C00" strokeWidth="2" />
          <path d="M 0 50 Q 50 10 100 50" fill="none" stroke="#F57C00" strokeWidth="2" />
          <path d="M 0 50 Q 50 90 100 50" fill="none" stroke="#F57C00" strokeWidth="2" />
          <line x1="50%" y1="0" x2="50%" y2="100%" stroke="#F57C00" strokeWidth="2" />
        </svg>
      </div>

      {/* Live Badge and Info Header */}
      <div className="relative flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
          </span>
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-red-500">
            EN VIVO
          </span>
          <span className="text-gray-600">•</span>
          <span className="text-[11px] font-bold text-gray-400">
            {match.quarter}
          </span>
        </div>
        <span className="text-[10px] font-mono font-bold text-gray-500 bg-[#161616] border border-[#222] px-2 py-0.5 rounded flex items-center">
          <Clock className="w-3 h-3 mr-1 text-basketball" /> {match.timeLeft}
        </span>
      </div>

      {/* Teams Matchup and Scores */}
      <div className="relative grid grid-cols-7 items-center my-2">
        {/* Home Team */}
        <div className="col-span-2 flex flex-col items-center">
          <div className={`w-14 h-14 rounded-full bg-gradient-to-tr ${homeTeamData.logoColor} flex items-center justify-center font-black text-lg text-white shadow-lg border border-[#222]`}>
            {homeTeamData.shortName}
          </div>
          <span className="text-xs font-black text-white mt-2 text-center truncate w-full">
            {homeTeamData.name}
          </span>
          <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Local</span>
        </div>

        {/* Home Score */}
        <div className="col-span-1 text-right">
          <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tighter transition-all font-sans">
            {match.homeScore}
          </span>
        </div>

        {/* Separator / VS */}
        <div className="col-span-1 flex flex-col items-center justify-center text-gray-600">
          <span className="text-xs font-black bg-[#161616] px-2 py-1 rounded-lg border border-[#222]">VS</span>
        </div>

        {/* Away Score */}
        <div className="col-span-1 text-left">
          <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tighter transition-all font-sans">
            {match.awayScore}
          </span>
        </div>

        {/* Away Team */}
        <div className="col-span-2 flex flex-col items-center">
          <div className={`w-14 h-14 rounded-full bg-gradient-to-tr ${awayTeamData.logoColor} flex items-center justify-center font-black text-lg text-white shadow-lg border border-[#222]`}>
            {awayTeamData.shortName}
          </div>
          <span className="text-xs font-black text-white mt-2 text-center truncate w-full">
            {awayTeamData.name}
          </span>
          <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Visita</span>
        </div>
      </div>

      {/* Collective Fouls Section */}
      <div className="relative mt-4 pt-3 border-t border-[#161616] space-y-3">
        <div className="flex justify-between items-center text-[10px] font-bold text-gray-500 tracking-wider">
          <span className="uppercase">Faltas Colectivas</span>
          <span className="text-gray-400">Límite: 5 faltas</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Home team fouls */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-bold">
              <span className="text-gray-400">{homeTeamData.shortName}</span>
              <span className={match.homeFouls >= 5 ? 'text-red-500 font-extrabold' : 'text-white'}>
                {match.homeFouls}/5 {match.homeFouls >= 5 && '⚠️'}
              </span>
            </div>
            <div className="h-2 w-full bg-[#161616] rounded-full overflow-hidden border border-[#222]">
              <div
                className={`h-full rounded-full transition-all duration-500 ${getFoulBarColor(match.homeFouls)}`}
                style={{ width: `${homeFoulsPercent}%` }}
              />
            </div>
          </div>

          {/* Away team fouls */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-bold">
              <span className="text-gray-400">{awayTeamData.shortName}</span>
              <span className={match.awayFouls >= 5 ? 'text-red-500 font-extrabold' : 'text-white'}>
                {match.awayFouls}/5 {match.awayFouls >= 5 && '⚠️'}
              </span>
            </div>
            <div className="h-2 w-full bg-[#161616] rounded-full overflow-hidden border border-[#222]">
              <div
                className={`h-full rounded-full transition-all duration-500 ${getFoulBarColor(match.awayFouls)}`}
                style={{ width: `${awayFoulsPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={onOpenSheet}
        className="relative w-full mt-4 bg-gradient-to-r from-basketball to-amber-600 hover:from-amber-600 hover:to-orange-700 text-black font-extrabold text-xs tracking-wider uppercase py-3 rounded-2xl transition-all duration-300 transform active:scale-95 shadow-md flex items-center justify-center space-x-2"
      >
        <Award className="w-4 h-4 text-black stroke-[2.5]" />
        <span>Ver Acta Digital en Tiempo Real</span>
      </button>
    </div>
  );
}

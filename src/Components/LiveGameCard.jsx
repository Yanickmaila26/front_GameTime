import React from 'react';
import { ShieldAlert, Users, Award, Clock } from 'lucide-react';

export default function LiveGameCard({ match, homeTeamData, awayTeamData, onOpenSheet }) {
  // Collective foul calculation max is usually 5.
  const homeFouls = match?.homeFouls ?? match?.home_fouls ?? 0;
  const awayFouls = match?.awayFouls ?? match?.away_fouls ?? 0;
  const homeFoulsPercent = Math.min((homeFouls / 5) * 100, 100);
  const awayFoulsPercent = Math.min((awayFouls / 5) * 100, 100);

  const getFoulBarColor = (fouls) => {
    if (fouls >= 5) return 'bg-red-500 shadow-[0_0_8px_#ef4444]';
    if (fouls >= 4) return 'bg-amber-500 shadow-[0_0_8px_#f59e0b]';
    return 'bg-electric';
  };

  const homeLogoColor = homeTeamData?.logo_color || homeTeamData?.logoColor || 'from-orange-500 to-amber-600';
  const homeShortName = homeTeamData?.short_name || homeTeamData?.shortName || homeTeamData?.name?.substring(0, 3).toUpperCase() || 'HOM';
  const homeName = homeTeamData?.name || 'Local';

  const awayLogoColor = awayTeamData?.logo_color || awayTeamData?.logoColor || 'from-orange-500 to-amber-600';
  const awayShortName = awayTeamData?.short_name || awayTeamData?.shortName || awayTeamData?.name?.substring(0, 3).toUpperCase() || 'AWY';
  const awayName = awayTeamData?.name || 'Visita';

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
            {match?.quarter || 'En Juego'}
          </span>
        </div>
        <span className="text-[10px] font-mono font-bold text-gray-500 bg-[#161616] border border-[#222] px-2 py-0.5 rounded flex items-center">
          <Clock className="w-3 h-3 mr-1 text-basketball" /> {match?.timeLeft || '00:00'}
        </span>
      </div>

      {/* Teams Matchup and Scores */}
      <div className="relative grid grid-cols-7 items-center my-2">
        {/* Home Team */}
        <div className="col-span-2 flex flex-col items-center">
          <div className={`w-14 h-14 rounded-full bg-gradient-to-tr ${homeLogoColor} flex items-center justify-center font-black text-lg text-white shadow-lg border border-[#222]`}>
            {homeShortName}
          </div>
          <span className="text-xs font-black text-white mt-2 text-center truncate w-full">
            {homeName}
          </span>
          <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Local</span>
        </div>

        {/* Home Score */}
        <div className="col-span-1 text-right">
          <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tighter transition-all font-sans">
            {match?.homeScore ?? match?.home_score ?? 0}
          </span>
        </div>

        {/* Separator / VS */}
        <div className="col-span-1 flex flex-col items-center justify-center text-gray-600">
          <span className="text-xs font-black bg-[#161616] px-2 py-1 rounded-lg border border-[#222]">VS</span>
        </div>

        {/* Away Score */}
        <div className="col-span-1 text-left">
          <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tighter transition-all font-sans">
            {match?.awayScore ?? match?.away_score ?? 0}
          </span>
        </div>

        {/* Away Team */}
        <div className="col-span-2 flex flex-col items-center">
          <div className={`w-14 h-14 rounded-full bg-gradient-to-tr ${awayLogoColor} flex items-center justify-center font-black text-lg text-white shadow-lg border border-[#222]`}>
            {awayShortName}
          </div>
          <span className="text-xs font-black text-white mt-2 text-center truncate w-full">
            {awayName}
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
              <span className="text-gray-400">{homeShortName}</span>
              <span className={homeFouls >= 5 ? 'text-red-500 font-extrabold' : 'text-white'}>
                {homeFouls}/5 {homeFouls >= 5 && '⚠️'}
              </span>
            </div>
            <div className="h-2 w-full bg-[#161616] rounded-full overflow-hidden border border-[#222]">
              <div
                className={`h-full rounded-full transition-all duration-500 ${getFoulBarColor(homeFouls)}`}
                style={{ width: `${homeFoulsPercent}%` }}
              />
            </div>
          </div>

          {/* Away team fouls */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-bold">
              <span className="text-gray-400">{awayShortName}</span>
              <span className={awayFouls >= 5 ? 'text-red-500 font-extrabold' : 'text-white'}>
                {awayFouls}/5 {awayFouls >= 5 && '⚠️'}
              </span>
            </div>
            <div className="h-2 w-full bg-[#161616] rounded-full overflow-hidden border border-[#222]">
              <div
                className={`h-full rounded-full transition-all duration-500 ${getFoulBarColor(awayFouls)}`}
                style={{ width: `${awayFoulsPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="glow-btn-orange rounded-full p-0.5 hover:scale-105 transition duration-300 active:scale-100 w-full mt-4">
        <button
          onClick={onOpenSheet}
          className="w-full bg-gray-800 text-white font-extrabold text-xs tracking-wider uppercase py-3 rounded-full transition-all flex items-center justify-center space-x-2"
        >
          <Award className="w-4 h-4 text-[#F57C00] stroke-[2.5]" />
          <span>Ver Acta Digital en Tiempo Real</span>
        </button>
      </div>
    </div>
  );
}

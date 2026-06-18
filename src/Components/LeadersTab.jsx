import React from 'react';
import { Flame, Target, Sparkles, Trophy } from 'lucide-react';

export default function LeadersTab({ leaders }) {
  const hasData = (leaders?.scorers?.length > 0 || leaders?.threepointers?.length > 0 || (leaders?.rebounders?.length > 0 || leaders?.foulers?.length > 0));
  if (!hasData) {
    return (
      <div className="text-center py-12 text-xs text-gray-500 font-bold bg-gray-950/40 border border-gray-900 rounded-3xl">
        Aún no hay estadísticas individuales registradas para este campeonato.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tab intro title */}
      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">
          Estadísticas Individuales
        </span>
        <span className="text-[10px] text-electric-light flex items-center font-bold">
          <Trophy className="w-3.5 h-3.5 mr-1" /> Líderes de la Liga
        </span>
      </div>

      {/* 1. Goleador Card */}
      <div className="space-y-2">
        <div className="flex items-center space-x-1.5 text-xs font-black text-gray-400">
          <Flame className="w-4 h-4 text-red-500 fill-red-500" />
          <span className="uppercase tracking-wider">Máximos Anotadores (Goleadores)</span>
        </div>
        
        <div className="grid grid-cols-1 gap-2.5">
          {leaders.scorers.map((player, idx) => (
            <div
              key={player.id}
              className={`relative overflow-hidden rounded-2xl border flex items-center justify-between transition-all duration-300 ${
                idx === 0
                  ? 'pt-6 pb-3.5 px-3.5 border-basketball/35 bg-basketball/5 backdrop-blur-md shadow-[0_0_15px_rgba(245,124,0,0.06)]'
                  : 'p-3.5 border-gray-900/60 bg-gray-950/20 backdrop-blur-md hover:border-gray-800/60'
              }`}
            >
              {idx === 0 && (
                <div className="absolute top-0 right-0 bg-basketball text-black font-extrabold text-[8px] uppercase tracking-widest px-2.5 py-0.5 rounded-bl-lg shadow">
                  Líder
                </div>
              )}
              
              <div className="flex items-center space-x-3.5">
                {/* Stylized Jersey Badge */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm border ${
                  idx === 0
                    ? 'bg-basketball/10 border-basketball/35 text-basketball'
                    : 'bg-gray-950/40 border-gray-900/60 text-gray-400'
                }`}>
                  {player.avatar}
                </div>
                
                <div>
                  <h4 className="font-extrabold text-xs text-white leading-tight">
                    {player.name}
                  </h4>
                  <div className="flex items-center space-x-1.5 mt-0.5">
                    <span className="text-[10px] text-gray-400 font-bold">
                      {player.team}
                    </span>
                    <span className="text-gray-600 text-[9px] font-bold">•</span>
                    <span className="text-[9px] bg-gray-950/40 border border-gray-900/60 px-1.5 py-0.5 rounded text-gray-300 font-bold uppercase tracking-wider">
                      {player.position}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="block text-lg font-black text-white tracking-tighter leading-none">
                  {player.total}
                </span>
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                  Puntos
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Triplistas Card */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center space-x-1.5 text-xs font-black text-gray-400">
          <Target className="w-4 h-4 text-electric fill-electric" />
          <span className="uppercase tracking-wider">Líderes en Triples</span>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {leaders.threepointers.map((player, idx) => (
            <div
              key={player.id}
              className={`relative overflow-hidden rounded-2xl border flex items-center justify-between transition-all duration-300 ${
                idx === 0
                  ? 'pt-6 pb-3.5 px-3.5 border-electric-light/35 bg-electric/5 backdrop-blur-md shadow-[0_0_15px_rgba(25,118,210,0.06)]'
                  : 'p-3.5 border-gray-900/60 bg-gray-950/20 backdrop-blur-md hover:border-gray-800/60'
              }`}
            >
              {idx === 0 && (
                <div className="absolute top-0 right-0 bg-electric text-white font-extrabold text-[8px] uppercase tracking-widest px-2.5 py-0.5 rounded-bl-lg shadow">
                  Líder
                </div>
              )}

              <div className="flex items-center space-x-3.5">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm border ${
                  idx === 0
                    ? 'bg-electric/10 border-electric/35 text-electric-light'
                    : 'bg-gray-950/40 border-gray-900/60 text-gray-400'
                }`}>
                  {player.avatar}
                </div>

                <div>
                  <h4 className="font-extrabold text-xs text-white leading-tight">
                    {player.name}
                  </h4>
                  <div className="flex items-center space-x-1.5 mt-0.5">
                    <span className="text-[10px] text-gray-400 font-bold">
                      {player.team}
                    </span>
                    <span className="text-gray-600 text-[9px] font-bold">•</span>
                    <span className="text-[9px] bg-gray-950/40 border border-gray-900/60 px-1.5 py-0.5 rounded text-gray-300 font-bold uppercase tracking-wider">
                      {player.position}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="block text-lg font-black text-white tracking-tighter leading-none">
                  {player.total}
                </span>
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                  Triples
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Faltas Card (Adición Premium) */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center space-x-1.5 text-xs font-black text-gray-400">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span className="uppercase tracking-wider">Líderes en Faltas Personales</span>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {(leaders.rebounders || leaders.foulers || []).map((player, idx) => (
            <div
              key={player.id}
              className={`relative overflow-hidden rounded-2xl border flex items-center justify-between transition-all duration-300 ${
                idx === 0
                  ? 'pt-6 pb-3.5 px-3.5 border-amber-500/35 bg-amber-500/5 backdrop-blur-md shadow-[0_0_15px_rgba(245,158,11,0.06)]'
                  : 'p-3.5 border-gray-900/60 bg-gray-950/20 backdrop-blur-md hover:border-gray-800/60'
              }`}
            >
              {idx === 0 && (
                <div className="absolute top-0 right-0 bg-amber-500 text-black font-extrabold text-[8px] uppercase tracking-widest px-2.5 py-0.5 rounded-bl-lg shadow">
                  Líder
                </div>
              )}

              <div className="flex items-center space-x-3.5">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm border ${
                  idx === 0
                    ? 'bg-amber-500/10 border-amber-500/35 text-amber-400'
                    : 'bg-gray-950/40 border-gray-900/60 text-gray-400'
                }`}>
                  {player.avatar}
                </div>

                <div>
                  <h4 className="font-extrabold text-xs text-white leading-tight">
                    {player.name}
                  </h4>
                  <div className="flex items-center space-x-1.5 mt-0.5">
                    <span className="text-[10px] text-gray-400 font-bold">
                      {player.team}
                    </span>
                    <span className="text-gray-600 text-[9px] font-bold">•</span>
                    <span className="text-[9px] bg-gray-950/40 border border-gray-900/60 px-1.5 py-0.5 rounded text-gray-300 font-bold uppercase tracking-wider">
                      {player.position}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="block text-lg font-black text-white tracking-tighter leading-none">
                  {player.total}
                </span>
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                  Faltas
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { Flame, Target, Sparkles, Trophy, CircleDot } from 'lucide-react';

/* ─── Player Card (shared) ─────────────────────────────────────────────────── */
function PlayerCard({ player, idx, accentColor, badgeBg, badgeText, statValue, statLabel }) {
  const isLeader = idx === 0;
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border transition-all duration-300 ${
        isLeader
          ? `border-${accentColor}/35 bg-${accentColor}/5 backdrop-blur-md`
          : 'border-gray-900/60 bg-gray-950/20 backdrop-blur-md hover:border-gray-800/60'
      }`}
    >
      {/* "Líder" badge — positioned at top as block, never overlapping card content */}
      {isLeader && (
        <div className={`w-full ${badgeBg} px-3 py-[3px] flex justify-end`}>
          <span className={`text-[8px] font-extrabold uppercase tracking-widest ${badgeText}`}>
            Líder
          </span>
        </div>
      )}

      {/* Card body */}
      <div className="flex items-center justify-between px-3.5 pb-3.5 pt-2">
        {/* Left: avatar + name */}
        <div className="flex items-center space-x-3.5 min-w-0">
          <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center font-black text-sm border ${
            isLeader
              ? `bg-${accentColor}/10 border-${accentColor}/35 text-${accentColor}`
              : 'bg-gray-950/40 border-gray-900/60 text-gray-400'
          }`}>
            {player.avatar}
          </div>

          <div className="min-w-0">
            <h4 className="font-extrabold text-xs text-white leading-tight truncate">{player.name}</h4>
            <div className="flex items-center flex-wrap gap-x-1.5 gap-y-0.5 mt-0.5">
              <span className="text-[10px] text-gray-400 font-bold truncate max-w-[110px]">{player.team}</span>
              <span className="text-gray-600 text-[9px] font-bold">•</span>
              <span className="text-[9px] bg-gray-950/40 border border-gray-900/60 px-1.5 py-0.5 rounded text-gray-300 font-bold uppercase tracking-wider whitespace-nowrap">
                {player.position}
              </span>
            </div>
          </div>
        </div>

        {/* Right: stat */}
        <div className="text-right flex-shrink-0 pl-2">
          <span className="block text-lg font-black text-white tracking-tighter leading-none">{statValue}</span>
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{statLabel}</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Main component ────────────────────────────────────────────────────────── */
export default function LeadersTab({ leaders }) {
  const hasData = (
    leaders?.scorers?.length > 0 ||
    leaders?.threepointers?.length > 0 ||
    leaders?.baskets?.length > 0 ||
    leaders?.rebounders?.length > 0 ||
    leaders?.foulers?.length > 0
  );

  if (!hasData) {
    return (
      <div className="text-center py-12 text-xs text-gray-500 font-bold bg-gray-950/40 border border-gray-900 rounded-3xl">
        Aún no hay estadísticas individuales registradas para este campeonato.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">
          Estadísticas Individuales
        </span>
        <span className="text-[10px] text-electric-light flex items-center font-bold">
          <Trophy className="w-3.5 h-3.5 mr-1" /> Líderes de la Liga
        </span>
      </div>

      {/* 1. Anotadores */}
      {leaders.scorers?.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center space-x-1.5 text-xs font-black text-gray-400">
            <Flame className="w-4 h-4 text-red-500 fill-red-500" />
            <span className="uppercase tracking-wider">Máximos Anotadores</span>
          </div>
          <div className="grid grid-cols-1 gap-2.5">
            {leaders.scorers.map((player, idx) => (
              <PlayerCard
                key={player.id}
                player={player}
                idx={idx}
                accentColor="basketball"
                badgeBg="bg-basketball"
                badgeText="text-black"
                statValue={player.total}
                statLabel="Puntos"
              />
            ))}
          </div>
        </div>
      )}

      {/* 2. Triplistas */}
      {leaders.threepointers?.length > 0 && (
        <div className="space-y-2 pt-1">
          <div className="flex items-center space-x-1.5 text-xs font-black text-gray-400">
            <Target className="w-4 h-4 text-electric fill-electric" />
            <span className="uppercase tracking-wider">Líderes en Triples</span>
          </div>
          <div className="grid grid-cols-1 gap-2.5">
            {leaders.threepointers.map((player, idx) => (
              <PlayerCard
                key={player.id}
                player={player}
                idx={idx}
                accentColor="electric"
                badgeBg="bg-electric"
                badgeText="text-white"
                statValue={player.total}
                statLabel="Triples"
              />
            ))}
          </div>
        </div>
      )}

      {/* 3. Aros (Field Goals / score2) */}
      {leaders.baskets?.length > 0 && (
        <div className="space-y-2 pt-1">
          <div className="flex items-center space-x-1.5 text-xs font-black text-gray-400">
            <CircleDot className="w-4 h-4 text-green-500" />
            <span className="uppercase tracking-wider">Líderes en Aros de Campo</span>
          </div>
          <div className="grid grid-cols-1 gap-2.5">
            {leaders.baskets.map((player, idx) => (
              <PlayerCard
                key={player.id}
                player={player}
                idx={idx}
                accentColor="green-500"
                badgeBg="bg-green-500"
                badgeText="text-black"
                statValue={player.total}
                statLabel="Aros"
              />
            ))}
          </div>
        </div>
      )}

      {/* 4. Faltas */}
      {leaders.foulers?.length > 0 && (
        <div className="space-y-2 pt-1">
          <div className="flex items-center space-x-1.5 text-xs font-black text-gray-400">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="uppercase tracking-wider">Líderes en Faltas Personales</span>
          </div>
          <div className="grid grid-cols-1 gap-2.5">
            {leaders.foulers.map((player, idx) => (
              <PlayerCard
                key={player.id}
                player={player}
                idx={idx}
                accentColor="amber-500"
                badgeBg="bg-amber-500"
                badgeText="text-black"
                statValue={player.total}
                statLabel="Faltas"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

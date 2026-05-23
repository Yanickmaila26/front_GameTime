import React from 'react';
import { Award, Zap, ChevronRight } from 'lucide-react';

export default function StandingsTab({ teams }) {
  // Sort teams by points (PTS) descending, then DIF descending
  const sortedTeams = [...teams].sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    return b.dif - a.dif;
  });

  return (
    <div className="space-y-4">
      {/* Playoff Info Alert */}
      <div className="flex items-center space-x-2.5 bg-electric bg-opacity-5 border border-electric border-opacity-25 rounded-2xl p-3">
        <Zap className="w-5 h-5 text-electric stroke-[2.5]" />
        <div>
          <span className="block text-[11px] font-black text-white tracking-wide uppercase">
            Clasificación a Playoffs
          </span>
          <span className="block text-[10px] text-gray-400">
            Los primeros **4 equipos** clasifican directamente a la Copa de Oro.
          </span>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-hidden rounded-2xl border border-gray-900/60 bg-gray-950/20 backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-950/40 border-b border-gray-900/60 text-[10px] uppercase font-extrabold tracking-wider text-gray-400">
                <th className="py-3 px-3 text-center w-10">Pos</th>
                <th className="py-3 px-3">Equipo</th>
                <th className="py-3 px-2 text-center w-10">PJ</th>
                <th className="py-3 px-2 text-center w-10">PG</th>
                <th className="py-3 px-2 text-center w-10">PP</th>
                <th className="py-3 px-2 text-center w-12">DIF</th>
                <th className="py-3 px-3 text-center w-12 text-basketball">PTS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-900/40">
              {sortedTeams.map((team, index) => {
                const isPlayoffZone = index < 4;
                return (
                  <tr
                    key={team.id}
                    className={`transition-colors duration-200 hover:bg-gray-900/30 ${
                      isPlayoffZone ? 'bg-gradient-to-r from-[rgba(25,118,210,0.04)] to-transparent' : ''
                    }`}
                  >
                    {/* Position */}
                    <td className="py-3.5 px-3 text-center">
                      <span
                        className={`inline-flex items-center justify-center w-5.5 h-5.5 rounded-full text-xs font-black ${
                          index === 0
                            ? 'bg-amber-500 text-black shadow-[0_0_8px_#f59e0b]'
                            : index === 1
                            ? 'bg-slate-300 text-black'
                            : index === 2
                            ? 'bg-amber-700 text-white'
                            : isPlayoffZone
                            ? 'bg-gray-900/50 text-electric-light font-black'
                            : 'text-gray-400 font-bold'
                        }`}
                      >
                        {index + 1}
                      </span>
                    </td>

                    {/* Team Name and Logo badge */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center space-x-2.5">
                        <span className={`w-3.5 h-3.5 rounded-full bg-gradient-to-tr ${team.logoColor} border border-[#222] shadow`} />
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-white leading-tight">
                            {team.name}
                          </span>
                          {isPlayoffZone && (
                            <span className="text-[8px] text-electric-light font-extrabold uppercase tracking-widest leading-none mt-0.5">
                              Zona de Playoffs
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Played */}
                    <td className="py-3.5 px-2 text-center text-xs font-semibold text-gray-300">
                      {team.pj}
                    </td>

                    {/* Won */}
                    <td className="py-3.5 px-2 text-center text-xs font-semibold text-green-500">
                      {team.pg}
                    </td>

                    {/* Lost */}
                    <td className="py-3.5 px-2 text-center text-xs font-semibold text-red-500">
                      {team.pp}
                    </td>

                    {/* Difference */}
                    <td className={`py-3.5 px-2 text-center text-xs font-mono font-bold ${
                      team.dif > 0 ? 'text-gray-300' : 'text-gray-400'
                    }`}>
                      {team.dif > 0 ? `+${team.dif}` : team.dif}
                    </td>

                    {/* Points */}
                    <td className="py-3.5 px-3 text-center">
                      <span className="text-xs font-extrabold text-[#f57c00] bg-[#f57c00] bg-opacity-10 px-2 py-0.5 rounded border border-basketball border-opacity-20">
                        {team.pts
                      }</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

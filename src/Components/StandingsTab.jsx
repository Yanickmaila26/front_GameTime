import React from 'react';
import { getAssetUrl } from '../api/client';

function TeamLogo({ team, className = "w-5.5 h-5.5" }) {
  if (!team) return null;
  if (team.logo_url) {
    return <img src={getAssetUrl(team.logo_url)} alt={team.name} className={`${className} rounded-lg object-cover flex-shrink-0`} />;
  }
  const isHex = team.logo_color?.startsWith('#');
  return (
    <div 
      style={isHex ? { backgroundColor: team.logo_color } : {}}
      className={`${className} ${!isHex ? `bg-gradient-to-br ${team.logo_color || 'from-orange-500 to-amber-600'}` : ''} rounded-lg flex items-center justify-center font-black text-black text-[9px] flex-shrink-0`}
    >
      {team.short_name || ''}
    </div>
  );
}

export default function StandingsTab({ teams }) {
  const hasGroups = teams.some(t => t.group_name);

  // Group teams by group_name
  let groupedTeams = {};
  if (hasGroups) {
    teams.forEach(t => {
      const gName = t.group_name || 'Sin Grupo';
      if (!groupedTeams[gName]) groupedTeams[gName] = [];
      groupedTeams[gName].push(t);
    });
  } else {
    groupedTeams['General'] = [...teams];
  }

  // Sort each group's teams by points (PTS) descending, then DIF descending
  Object.keys(groupedTeams).forEach(g => {
    groupedTeams[g].sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      return b.dif - a.dif;
    });
  });

  // Sort groups alphabetically (A, B, C...)
  const sortedGroups = Object.entries(groupedTeams).sort(([nameA], [nameB]) => nameA.localeCompare(nameB));

  return (
    <div className="space-y-6">
      <div className={hasGroups ? "grid grid-cols-1 lg:grid-cols-2 gap-6" : "space-y-6"}>
        {sortedGroups.map(([groupName, groupTeams]) => {
          return (
            <div key={groupName} className="space-y-3">
              {hasGroups && (
                <h3 className="text-xs font-black text-[#f57c00] uppercase tracking-wider pl-1">
                  Grupo {groupName}
                </h3>
              )}
              
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
                      {groupTeams.map((team, index) => {
                        return (
                          <tr
                            key={team.id}
                            className="transition-colors duration-200 hover:bg-gray-900/30"
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
                                    : 'text-gray-400 font-bold'
                                }`}
                              >
                                {index + 1}
                              </span>
                            </td>

                            {/* Team Name and Logo badge */}
                            <td className="py-3 px-3">
                              <div className="flex items-center space-x-2">
                                <TeamLogo team={team} className="w-5.5 h-5.5" />
                                <span className="text-xs font-black text-white leading-tight">
                                  {team.name}
                                </span>
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
                              <span className="text-xs font-extrabold text-white bg-[#f57c00]/20 px-2.5 py-0.5 rounded-lg border border-[#f57c00]/30 shadow-[0_0_8px_rgba(245,124,0,0.15)]">
                                {team.pts}
                              </span>
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
        })}
      </div>
    </div>
  );
}

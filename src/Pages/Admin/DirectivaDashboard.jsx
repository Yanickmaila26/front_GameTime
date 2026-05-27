import React, { useState, useEffect } from 'react'
import AdminLayout from '../../Components/AdminLayout'
import { Trophy, Swords, BarChart2, Users, Loader2 } from 'lucide-react'
import client, { getAssetUrl } from '../../api/client'

const STATUS_COLOR = { scheduled: 'text-gray-400', live: 'text-red-400', finished: 'text-blue-400' }
const STATUS_LABEL = { scheduled: 'Prog.', live: '🔴 Vivo', finished: 'Fin.' }

function TeamLogo({ team, className = "w-10 h-10" }) {
  if (!team) return null
  const isSmall = className.includes('w-5') || className.includes('w-6')
  if (team.logo_url) {
    return <img src={getAssetUrl(team.logo_url)} alt={team.name} className={`${className} ${isSmall ? 'rounded-lg' : 'rounded-xl'} object-cover flex-shrink-0`} />
  }
  const isHex = team.logo_color?.startsWith('#')
  return (
    <div 
      style={isHex ? { backgroundColor: team.logo_color } : {}}
      className={`${className} ${!isHex ? `bg-gradient-to-br ${team.logo_color || 'from-orange-500 to-amber-600'}` : ''} ${isSmall ? 'rounded-lg text-[9px]' : 'rounded-xl text-xs'} flex items-center justify-center font-black text-black flex-shrink-0`}
    >
      {team.short_name || ''}
    </div>
  )
}

function StandingsTable({ championship }) {
  if (!championship?.teams?.length) {
    return <p className="text-xs text-gray-500 text-center py-8">No hay equipos en el campeonato activo.</p>
  }
  const hasGroups = championship.teams?.some(t => t.pivot?.group_name);
  let groupedStandings = {};
  if (hasGroups) {
    championship.teams.forEach(t => {
      const gName = t.pivot.group_name || 'Sin Grupo';
      if (!groupedStandings[gName]) groupedStandings[gName] = [];
      groupedStandings[gName].push(t);
    });
  } else {
    groupedStandings['General'] = championship.teams || [];
  }

  return (
    <div className="space-y-6">
      {Object.entries(groupedStandings).map(([groupName, groupTeams]) => (
        <div key={groupName} className="space-y-2">
          {hasGroups && (
            <h4 className="text-xs font-black text-orange-400 uppercase tracking-wider pl-1">
              Grupo {groupName}
            </h4>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="text-gray-500 border-b border-[#222] uppercase font-bold tracking-wider text-[10px]">
                  <th className="py-2.5 text-left">#</th>
                  <th className="py-2.5 text-left">Equipo</th>
                  <th className="py-2.5 text-center">PJ</th>
                  <th className="py-2.5 text-center">PG</th>
                  <th className="py-2.5 text-center">PP</th>
                  <th className="py-2.5 text-center">Dif</th>
                  <th className="py-2.5 text-center font-black text-orange-400">Pts</th>
                </tr>
              </thead>
              <tbody>
                {groupTeams.map((team, idx) => (
                  <tr key={team.id} className={`border-b border-[#1a1a1a] last:border-b-0 transition-all ${idx === 0 ? 'bg-orange-500/5' : 'hover:bg-[#121212]/50'}`}>
                    <td className="py-3 text-gray-500 font-black pl-1">{idx + 1}</td>
                    <td className="py-3">
                      <div className="flex items-center space-x-2">
                        <TeamLogo team={team} className="w-6 h-6" />
                        <span className="font-bold text-white">{team.name}</span>
                        {idx === 0 && <span className="text-[9px] bg-orange-500/20 text-orange-400 font-black px-1.5 py-0.5 rounded-full">LÍDER</span>}
                      </div>
                    </td>
                    <td className="py-3 text-center text-gray-400">{team.pivot?.pj ?? 0}</td>
                    <td className="py-3 text-center text-emerald-400 font-semibold">{team.pivot?.pg ?? 0}</td>
                    <td className="py-3 text-center text-red-400">{team.pivot?.pp ?? 0}</td>
                    <td className="py-3 text-center text-gray-400 font-mono text-[10px]">
                      {(team.pivot?.dif ?? 0) > 0 ? `+${team.pivot.dif}` : (team.pivot?.dif ?? 0)}
                    </td>
                    <td className="py-3 text-center font-black text-orange-400 text-sm">{team.pivot?.pts ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}

function GroupMatches({ matches }) {
  const groupMatches = matches?.filter(m => m.stage === 'group') ?? []
  if (!groupMatches.length) {
    return <p className="text-xs text-gray-500 text-center py-8">No hay partidos de grupo generados aún.</p>
  }

  const byRound = groupMatches.reduce((acc, m) => {
    if (!acc[m.round]) acc[m.round] = []
    acc[m.round].push(m)
    return acc
  }, {})

  return (
    <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
      {Object.entries(byRound).map(([round, roundMatches]) => (
        <div key={round} className="space-y-2">
          <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-wider sticky top-0 bg-[#0d0d0d] py-1">
            Jornada {round}
          </h4>
          {roundMatches.map(match => (
            <div key={match.id}
              className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                match.status === 'live'
                  ? 'bg-red-500/5 border-red-500/20'
                  : 'bg-[#121212] border-[#1a1a1a]'
              }`}>
              <div className="flex items-center space-x-3 flex-1">
                <div className="flex flex-col items-center w-16">
                  <TeamLogo team={match.home_team} className="w-7 h-7" />
                  <span className="text-[10px] font-bold text-white mt-1 truncate w-full text-center">{match.home_team?.short_name}</span>
                </div>
                <div className="text-center flex-1">
                  {match.status === 'finished' ? (
                    <div className="flex items-center justify-center space-x-2">
                      <span className={`text-xl font-black ${match.home_score > match.away_score ? 'text-white' : 'text-gray-500'}`}>{match.home_score}</span>
                      <span className="text-gray-600">–</span>
                      <span className={`text-xl font-black ${match.away_score > match.home_score ? 'text-white' : 'text-gray-500'}`}>{match.away_score}</span>
                    </div>
                  ) : match.status === 'live' ? (
                    <span className="text-[10px] text-red-400 font-black animate-pulse">🔴 EN VIVO</span>
                  ) : (
                    <span className="text-[10px] text-gray-500">vs</span>
                  )}
                  <p className={`text-[9px] font-bold mt-0.5 ${STATUS_COLOR[match.status]}`}>{STATUS_LABEL[match.status]}</p>
                </div>
                <div className="flex flex-col items-center w-16">
                  <TeamLogo team={match.away_team} className="w-7 h-7" />
                  <span className="text-[10px] font-bold text-white mt-1 truncate w-full text-center">{match.away_team?.short_name}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

function PlayoffBracket({ matches }) {
  const playoffs = matches?.filter(m => m.stage === 'playoff') ?? []
  if (!playoffs.length) {
    return <p className="text-xs text-gray-500 text-center py-8">No se han generado playoffs aún.</p>
  }

  const byLabel = playoffs.reduce((acc, m) => {
    const k = m.label || `Ronda ${m.round}`
    if (!acc[k]) acc[k] = []
    acc[k].push(m)
    return acc
  }, {})

  return (
    <div className="space-y-4">
      {Object.entries(byLabel).map(([label, matches]) => (
        <div key={label} className="border border-[#222] rounded-2xl p-4 space-y-2">
          <h4 className="text-xs font-black text-orange-400 uppercase tracking-wider border-b border-[#222] pb-2">{label}</h4>
          {matches.map(match => (
            <div key={match.id} className={`flex items-center justify-between p-3 rounded-xl border ${
              match.status === 'finished' ? 'bg-blue-500/5 border-blue-500/10' :
              match.status === 'live' ? 'bg-red-500/5 border-red-500/20' : 'bg-[#121212] border-[#1a1a1a]'
            }`}>
              <div className="flex items-center space-x-3 flex-1">
                <div className="flex flex-col items-center w-14">
                  <TeamLogo team={match.home_team} className="w-7 h-7" />
                  <span className="text-[10px] font-bold text-white mt-1 text-center">{match.home_team?.short_name}</span>
                </div>
                <div className="text-center flex-1">
                  {match.status === 'finished' ? (
                    <div className="flex items-center justify-center space-x-2">
                      <span className={`text-lg font-black ${match.home_score > match.away_score ? 'text-white' : 'text-gray-500'}`}>{match.home_score}</span>
                      <span className="text-gray-600">–</span>
                      <span className={`text-lg font-black ${match.away_score > match.home_score ? 'text-white' : 'text-gray-500'}`}>{match.away_score}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-500 font-black">vs</span>
                  )}
                </div>
                <div className="flex flex-col items-center w-14">
                  <TeamLogo team={match.away_team} className="w-7 h-7" />
                  <span className="text-[10px] font-bold text-white mt-1 text-center">{match.away_team?.short_name}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

const TABS = [
  { id: 'standings', label: 'Tabla', icon: BarChart2 },
  { id: 'matches', label: 'Partidos de Grupo', icon: Swords },
  { id: 'playoffs', label: 'Playoffs', icon: Trophy },
]

export default function DirectivaDashboard({ championship: initialChampionship }) {
  const [tab, setTab] = useState('standings')
  const [championship, setChampionship] = useState(initialChampionship)
  const [loading, setLoading] = useState(!initialChampionship)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!initialChampionship) {
      client.get('/admin/dashboard')
        .then(res => {
          setChampionship(res.data.championship)
          setLoading(false)
        })
        .catch(err => {
          console.error("Error loading directiva championship details:", err)
          setError("Error al cargar la información del campeonato.")
          setLoading(false)
        })
    } else {
      setChampionship(initialChampionship)
      setLoading(false)
    }
  }, [initialChampionship])

  if (loading) {
    return (
      <AdminLayout title="Panel Directiva">
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-orange-500 animate-spin mb-2" />
          <p className="text-xs text-gray-500 font-bold uppercase tracking-widest animate-pulse">Cargando campeonato...</p>
        </div>
      </AdminLayout>
    )
  }

  if (error) {
    return (
      <AdminLayout title="Panel Directiva">
        <div className="bg-red-950/40 border border-red-500/30 rounded-2xl p-6 text-center max-w-sm mx-auto my-10">
          <span className="text-2xl mb-2 block">⚠️</span>
          <p className="text-xs font-bold text-red-400 uppercase tracking-wide">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-600 text-black font-extrabold text-xs rounded-xl shadow-md"
          >
            Reintentar
          </button>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Panel Directiva">
      <div className="space-y-6 max-w-3xl mx-auto">
        {/* Header */}
        <div>
          <span className="inline-flex items-center bg-orange-500/10 border border-orange-500/20 text-[10px] font-black text-orange-500 px-3 py-1 rounded-full uppercase tracking-wider">
            <Users className="w-3 h-3 mr-1" /> Panel Directiva
          </span>
          <h1 className="text-xl font-black text-white mt-1">
            {championship?.name ?? 'Sin campeonato activo'}
          </h1>
          {championship && (
            <p className="text-xs text-gray-500 mt-0.5 capitalize">
              {championship.gender} · {championship.has_group_stage ? `Fase de grupos (${championship.rounds} vueltas)` : 'Eliminación directa'}
            </p>
          )}
        </div>

        {!championship ? (
          <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-2xl p-12 text-center">
            <Trophy className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-sm font-bold text-gray-400">No hay campeonatos registrados aún.</p>
            <p className="text-xs text-gray-600 mt-1">Solicita al administrador que cree un campeonato.</p>
          </div>
        ) : (
          <>
            {/* Tab selector */}
            <div className="flex space-x-1 bg-[#0d0d0d] border border-[#1a1a1a] p-1 rounded-2xl">
              {TABS.map(t => {
                const Icon = t.icon
                const active = tab === t.id
                return (
                  <button key={t.id} onClick={() => setTab(t.id)}
                    className={`flex-1 flex items-center justify-center space-x-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      active ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-black shadow' : 'text-gray-500 hover:text-white'
                    }`}>
                    <Icon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{t.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Tab content */}
            <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-2xl p-5">
              {tab === 'standings' && <StandingsTable championship={championship} />}
              {tab === 'matches'   && <GroupMatches matches={championship.matches} />}
              {tab === 'playoffs'  && <PlayoffBracket matches={championship.matches} />}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  )
}

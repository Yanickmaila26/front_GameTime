import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import AdminLayout from '../../Components/AdminLayout'
import { TeamLogo } from './Teams'
import Swal, { confirmAction, toastSuccess, toastError } from '../../lib/swal'
import { Flag, ChevronRight, Clock, Minus } from 'lucide-react'
import client from '../../api/client'

// ─── Constantes ──────────────────────────────────────────────────────────────
const QUARTER_LABELS = { 1: '1er Cuarto', 2: '2do Cuarto', 3: '3er Cuarto', 4: '4to Cuarto' }
const EVENT_TYPE_COLOR = {
  score1: 'text-blue-400',
  score2: 'text-orange-400',
  score3: 'text-purple-400',
  foul: 'text-red-400',
  foul_bonus: 'text-red-600',
}
const EVENT_TYPE_LABEL = {
  score1: '+1 Libre',
  score2: '+2 Pts',
  score3: '+3 Pts',
  foul: 'Falta',
  foul_bonus: 'Falta (Bonus)',
}

// ─── Botón de acción rápida ───────────────────────────────────────────────────
function ActionBtn({ label, onClick, color = 'orange', size = 'md' }) {
  const colors = {
    orange: 'bg-orange-500 hover:bg-orange-600 text-black',
    blue:   'bg-blue-500 hover:bg-blue-600 text-white',
    purple: 'bg-purple-500 hover:bg-purple-600 text-white',
    red:    'bg-red-500/20 border border-red-500/30 hover:bg-red-500/30 text-red-400',
  }
  const sizes = { sm: 'px-2 py-1.5 text-[11px]', md: 'px-3 py-2 text-xs' }
  return (
    <button
      onClick={onClick}
      className={`rounded-xl font-black transition-all active:scale-95 ${colors[color]} ${sizes[size]}`}
    >
      {label}
    </button>
  )
}

// ─── Panel de un equipo ───────────────────────────────────────────────────────
function TeamPanel({ team, side, localScore, localFouls, localPlayerStats, serverPlayerStats, onScore, onFoul, onUndo }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className={`flex-1 bg-[#0d0d0d] border rounded-2xl overflow-hidden ${
      side === 'home' ? 'border-orange-500/20' : 'border-blue-500/20'
    }`}>
      {/* Team header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={() => setCollapsed(c => !c)}
      >
        <div className="flex items-center space-x-3">
          <TeamLogo team={team} className="w-9 h-9" />
          <div>
            <p className="text-sm font-black text-white leading-tight">{team.name}</p>
            <p className="text-[10px] text-gray-500">
              Faltas Q: <span className={localFouls >= 5 ? 'text-red-400 font-black' : 'text-gray-400'}>{localFouls}</span>
              {localFouls >= 5 && ' ⚠️ BONUS'}
            </p>
          </div>
        </div>
        <div className={`text-4xl font-black ${side === 'home' ? 'text-orange-400' : 'text-blue-400'}`}>
          {localScore}
        </div>
      </div>

      {/* Botones rápidos del equipo */}
      <div className="px-4 pb-3 flex space-x-2">
        <ActionBtn label="+1" onClick={() => onScore(side, null, 1)} color="blue" size="sm" />
        <ActionBtn label="+2" onClick={() => onScore(side, null, 2)} color="orange" size="sm" />
        <ActionBtn label="+3" onClick={() => onScore(side, null, 3)} color="purple" size="sm" />
        <ActionBtn label="F Equipo" onClick={() => onFoul(side, null)} color="red" size="sm" />
        <button onClick={() => onUndo(side)} className="ml-auto text-gray-600 hover:text-gray-400 transition-all" title="Deshacer última acción">
          <Minus className="w-4 h-4" />
        </button>
      </div>

      {/* Lista de jugadores */}
      {!collapsed && (
        <div className="border-t border-[#1a1a1a] divide-y divide-[#1a1a1a] max-h-72 overflow-y-auto">
          {team.players?.map(player => {
            const local  = localPlayerStats[player.id] ?? { pts: 0, fouls: 0 }
            const server = serverPlayerStats.find(p => p.player_id === player.id)
            const totalPts   = (server?.points ?? 0) + local.pts
            const totalFouls = (server?.fouls  ?? 0) + local.fouls
            const ejected    = server?.is_ejected || totalFouls >= 5

            return (
              <div
                key={player.id}
                className={`flex items-center justify-between px-4 py-2.5 ${ejected ? 'opacity-40' : 'hover:bg-[#121212]'}`}
              >
                <div className="flex items-center space-x-2 min-w-0">
                  <span className={`text-[10px] font-black w-5 text-center ${side === 'home' ? 'text-orange-500' : 'text-blue-500'}`}>
                    #{player.number}
                  </span>
                  <span className="text-xs font-bold text-white truncate">{player.name}</span>
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0">
                  <span className="text-[10px] text-gray-500 w-14 text-right">
                    {totalPts}pts · {totalFouls}F
                  </span>
                  {!ejected && (
                    <>
                      <ActionBtn label="+1" onClick={() => onScore(side, player.id, 1)} color="blue" size="sm" />
                      <ActionBtn label="+2" onClick={() => onScore(side, player.id, 2)} color="orange" size="sm" />
                      <ActionBtn label="+3" onClick={() => onScore(side, player.id, 3)} color="purple" size="sm" />
                      <ActionBtn label="F"  onClick={() => onFoul(side, player.id)} color="red" size="sm" />
                    </>
                  )}
                  {ejected && <span className="text-[9px] text-red-500 font-black">EXPULSADO</span>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function MatchLive() {
  const { id } = useParams()
  const [match, setMatch] = useState(null)
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState([])      // eventos pendientes de este cuarto
  const [localPlayerStats, setLPS] = useState({})      // { [playerId]: { pts, fouls } }
  const [isSaving, setIsSaving] = useState(false)

  const fetchMatch = () => {
    client.get(`/admin/partidos/${id}/live`)
      .then(res => {
        setMatch(res.data.match)
      })
      .catch(err => {
        toastError('Error al cargar datos del partido')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchMatch()
  }, [id])

  // Calcula scores y faltas locales (sumas de events del cuarto actual)
  const { homeScore, awayScore, homeFouls, awayFouls } = useMemo(() => {
    if (!match) return { homeScore: 0, awayScore: 0, homeFouls: 0, awayFouls: 0 }
    let hs = 0, as = 0, hf = 0, af = 0
    for (const e of events) {
      if (e.type === 'score') {
        e.team === 'home' ? (hs += e.value) : (as += e.value)
      } else if (e.type === 'foul') {
        e.team === 'home' ? hf++ : af++
      }
    }
    return {
      homeScore:  (match.home_score ?? 0) + hs,
      awayScore:  (match.away_score ?? 0) + as,
      homeFouls:  (match.home_fouls_q ?? 0) + hf,
      awayFouls:  (match.away_fouls_q ?? 0) + af,
    }
  }, [events, match])

  // ── Agregar evento ────────────────────────────────────────────────────────
  const addScore = useCallback((team, playerId, value) => {
    setEvents(prev => [...prev, { type: 'score', team, player_id: playerId, value, id: Date.now() }])
    if (playerId) {
      setLPS(prev => ({
        ...prev,
        [playerId]: { pts: (prev[playerId]?.pts ?? 0) + value, fouls: prev[playerId]?.fouls ?? 0 }
      }))
    }
  }, [])

  const addFoul = useCallback((team, playerId) => {
    if (!match) return;
    // 1. Team fouls notification (quarter-based)
    const serverTeamFouls = team === 'home' ? (match.home_fouls_q ?? 0) : (match.away_fouls_q ?? 0)
    const localTeamFouls = events.filter(e => e.type === 'foul' && e.team === team).length
    const totalTeamFouls = serverTeamFouls + localTeamFouls + 1

    if (totalTeamFouls === 4) {
      const teamName = team === 'home' ? match.home_team.name : match.away_team.name
      Swal.fire({
        title: 'Límite de Faltas Colectivas',
        text: `El equipo "${teamName}" ha cometido 4 faltas en este cuarto. ¡A una falta del BONUS de tiros libres!`,
        icon: 'warning',
      })
    }

    // 2. Player fouls notification (match-based)
    if (playerId) {
      const serverPlayer = (match.players ?? []).find(p => p.player_id === playerId)
      const serverPlayerFouls = serverPlayer?.fouls ?? 0
      const localPlayerFouls = localPlayerStats[playerId]?.fouls ?? 0
      const totalPlayerFouls = serverPlayerFouls + localPlayerFouls + 1

      if (totalPlayerFouls === 5) {
        const playerObj = (team === 'home' ? match.home_team.players : match.away_team.players)?.find(p => p.id === playerId)
        const playerName = playerObj ? playerObj.name : 'Jugador'
        const playerNumber = playerObj ? `#${playerObj.number}` : ''
        Swal.fire({
          title: 'Jugador Expulsado',
          text: `El jugador ${playerNumber} ${playerName} ha cometido su 5ta falta personal y debe ser expulsado.`,
          icon: 'error',
        })
      }
    }

    setEvents(prev => [...prev, { type: 'foul', team, player_id: playerId, value: 1, id: Date.now() }])
    if (playerId) {
      setLPS(prev => ({
        ...prev,
        [playerId]: { pts: prev[playerId]?.pts ?? 0, fouls: (prev[playerId]?.fouls ?? 0) + 1 }
      }))
    }
  }, [events, localPlayerStats, match])

  // Deshacer último evento de un equipo
  const undoLast = useCallback((team) => {
    setEvents(prev => {
      const lastIdx = [...prev].reverse().findIndex(e => e.team === team)
      if (lastIdx === -1) return prev
      const realIdx = prev.length - 1 - lastIdx
      const removed = prev[realIdx]
      // Revert player stats
      if (removed.player_id) {
        setLPS(ps => ({
          ...ps,
          [removed.player_id]: {
            pts:   removed.type === 'score' ? (ps[removed.player_id]?.pts ?? 0) - removed.value : ps[removed.player_id]?.pts ?? 0,
            fouls: removed.type === 'foul'  ? (ps[removed.player_id]?.fouls ?? 0) - 1 : ps[removed.player_id]?.fouls ?? 0,
          }
        }))
      }
      return prev.filter((_, i) => i !== realIdx)
    })
  }, [])

  // ── Flush al servidor ─────────────────────────────────────────────────────
  const flush = useCallback(({ advanceQuarter = false, finish = false } = {}) => {
    if (!match) return;
    setIsSaving(true)
    client.post(`/admin/partidos/${match.id}/guardar-cuarto`, {
      quarter:          match.current_quarter,
      events:           events,
      advance_quarter:  advanceQuarter,
      finish:           finish,
    })
      .then(() => {
        toastSuccess('Datos guardados con éxito')
        setEvents([])
        setLPS({})
        fetchMatch()
      })
      .catch(() => {
        toastError('Error al guardar datos del cuarto')
      })
      .finally(() => setIsSaving(false))
  }, [match, events])

  const handleNextQuarter = async () => {
    if (!match) return;
    const result = await confirmAction(
      `¿Terminar ${QUARTER_LABELS[match.current_quarter]}?`,
      events.length > 0
        ? `Se guardarán ${events.length} eventos del cuarto y se pasará al ${QUARTER_LABELS[(match.current_quarter ?? 1) + 1] ?? '4to Cuarto'}.`
        : 'No hay eventos nuevos en este cuarto.',
      'Guardar y Avanzar'
    )
    if (result.isConfirmed) flush({ advanceQuarter: true })
  }

  const handleFinish = async () => {
    const result = await confirmAction(
      '¿Finalizar el partido?',
      `Marcador: ${homeScore} – ${awayScore}. ${events.length > 0 ? `Se guardarán ${events.length} eventos pendientes.` : ''}`,
      'Finalizar Partido'
    )
    if (result.isConfirmed) flush({ finish: true })
  }

  const handleForfeit = async () => {
    if (!match) return;
    const homeName = match.home_team?.name || 'Equipo Local'
    const awayName = match.away_team?.name || 'Equipo Visitante'
    const homeId = match.home_team_id
    const awayId = match.away_team_id

    const { value: noShowTeamId } = await Swal.fire({
      title: 'Finalizar por W.O. (No Presentado)',
      text: 'Seleccione el equipo que NO se presentó al partido:',
      input: 'radio',
      inputOptions: {
        [homeId]: homeName,
        [awayId]: awayName
      },
      inputValidator: (value) => {
        if (!value) {
          return '¡Debe seleccionar un equipo!'
        }
      },
      showCancelButton: true,
      cancelButtonText: 'Cancelar',
      confirmButtonText: 'Confirmar',
      confirmButtonColor: '#ef4444',
      background: '#0d0d0d',
      color: '#fff',
    })

    if (noShowTeamId) {
      const noShowName = noShowTeamId == homeId ? homeName : awayName
      const winnerName = noShowTeamId == homeId ? awayName : homeName
      const result = await confirmAction(
        '¿Confirmar W.O.?',
        `El equipo "${noShowName}" perderá por no presentarse (0 pts). El equipo "${winnerName}" ganará el partido 20-0 y recibirá 2 pts en la tabla.`,
        'Confirmar W.O.'
      )
      if (result.isConfirmed) {
        setIsSaving(true)
        client.post(`/admin/partidos/${match.id}/guardar-cuarto`, {
          quarter: match.current_quarter || 1,
          events: [],
          finish: true,
          forfeit: true,
          no_show_team_id: noShowTeamId
        })
          .then(() => {
            toastSuccess('W.O. registrado con éxito')
            setEvents([])
            setLPS({})
            fetchMatch()
          })
          .catch(() => {
            toastError('Error al registrar W.O.')
          })
          .finally(() => setIsSaving(false))
      }
    }
  }

  const handleStart = () => {
    if (!match) return;
    client.post(`/admin/partidos/${match.id}/start`)
      .then(() => {
        toastSuccess('Partido iniciado con éxito')
        fetchMatch()
      })
      .catch(() => {
        toastError('Error al iniciar el partido')
      })
  }

  // Registro de eventos del cuarto actual (local, sin recarga)
  const recentEvents = useMemo(() => {
    return [...events].reverse().slice(0, 30)
  }, [events])

  if (loading) {
    return (
      <AdminLayout title="Partido en Vivo">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
          <span className="ml-3 text-gray-400 font-bold text-sm">Cargando partido en vivo...</span>
        </div>
      </AdminLayout>
    )
  }

  if (!match) {
    return (
      <AdminLayout title="Partido en Vivo">
        <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-2xl p-6 text-center text-gray-500 text-xs font-bold">
          No se pudo encontrar el partido especificado.
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Partido en Vivo">
      <div className="max-w-5xl mx-auto space-y-4">

        {/* ─── Header y marcador central ─── */}
        <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              {match.status === 'live' && (
                <span className="flex items-center space-x-1.5 text-[10px] font-black text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                  </span>
                  <span>EN VIVO · {QUARTER_LABELS[match.current_quarter]}</span>
                </span>
              )}
              {match.status === 'finished' && (
                <span className="text-[10px] font-black text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full">✓ FINALIZADO</span>
              )}
              {match.status === 'scheduled' && (
                <span className="text-[10px] font-black text-gray-400 bg-gray-500/10 border border-gray-500/20 px-3 py-1 rounded-full">Pendiente</span>
              )}
              {events.length > 0 && (
                <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-full">
                  {events.length} sin guardar
                </span>
              )}
            </div>

            {/* Controles */}
            <div className="flex items-center space-x-2">
              {match.status === 'scheduled' && (
                <button onClick={handleStart}
                  className="px-4 py-2 bg-emerald-500 text-black text-xs font-bold rounded-xl hover:bg-emerald-400 transition-all">
                  Iniciar Partido
                </button>
              )}
              {match.status === 'live' && match.current_quarter < 4 && (
                <button onClick={handleNextQuarter} disabled={isSaving}
                  className="px-4 py-2 bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold rounded-xl hover:bg-blue-500/20 transition-all disabled:opacity-50">
                  <ChevronRight className="w-4 h-4 inline mr-1" />
                  Sig. Cuarto
                </button>
              )}
              {match.status === 'live' && (
                <button onClick={handleFinish} disabled={isSaving}
                  className="px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold rounded-xl hover:bg-red-500/20 transition-all disabled:opacity-50">
                  <Flag className="w-4 h-4 inline mr-1" />
                  Finalizar
                </button>
              )}
              {(match.status === 'scheduled' || match.status === 'live') && (
                <button onClick={handleForfeit} disabled={isSaving}
                  className="px-4 py-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold rounded-xl hover:bg-amber-500/20 transition-all disabled:opacity-50">
                  W.O. / No Presentado
                </button>
              )}
            </div>
          </div>

          {/* Scoreboard central */}
          <div className="flex items-center justify-center space-x-6">
            <div className="text-center flex-1">
              <TeamLogo team={match.home_team} className="w-12 h-12 mx-auto mb-1" />
              <p className="text-xs font-bold text-gray-400">{match.home_team?.name}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center space-x-4">
                <span className="text-5xl font-black text-white tabular-nums">{homeScore}</span>
                <span className="text-2xl text-gray-600 font-black">–</span>
                <span className="text-5xl font-black text-white tabular-nums">{awayScore}</span>
              </div>
              {match.status === 'live' && (
                <p className="text-[10px] text-gray-500 mt-1 font-bold">
                  {QUARTER_LABELS[match.current_quarter]}
                  {match.championship?.name && ` · ${match.championship.name}`}
                </p>
              )}
            </div>
            <div className="text-center flex-1">
              <TeamLogo team={match.away_team} className="w-12 h-12 mx-auto mb-1" />
              <p className="text-xs font-bold text-gray-400">{match.away_team?.name}</p>
            </div>
          </div>
        </div>

        {/* ─── Paneles de equipos (solo si está en juego) ─── */}
        {(match.status === 'live' || match.status === 'scheduled') && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TeamPanel
              team={match.home_team}
              side="home"
              localScore={homeScore}
              localFouls={homeFouls}
              localPlayerStats={localPlayerStats}
              serverPlayerStats={match.players ?? []}
              onScore={addScore}
              onFoul={addFoul}
              onUndo={undoLast}
            />
            <TeamPanel
              team={match.away_team}
              side="away"
              localScore={awayScore}
              localFouls={awayFouls}
              localPlayerStats={localPlayerStats}
              serverPlayerStats={match.players ?? []}
              onScore={addScore}
              onFoul={addFoul}
              onUndo={undoLast}
            />
          </div>
        )}

        {/* ─── Registro de eventos del cuarto (local) ─── */}
        {match.status === 'live' && (
          <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                <Clock className="w-3 h-3 inline mr-1" />
                Eventos del Cuarto (no guardados)
              </h3>
              {events.length === 0 && <span className="text-[10px] text-gray-600">Sin eventos nuevos</span>}
            </div>
            {recentEvents.length > 0 && (
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {recentEvents.map((ev, i) => {
                  const isHome    = ev.team === 'home'
                  const team      = isHome ? match.home_team : match.away_team
                  const player    = ev.player_id
                    ? (isHome ? match.home_team?.players : match.away_team?.players)?.find(p => p.id === ev.player_id)
                    : null
                  const typeKey   = ev.type === 'score' ? `score${ev.value}` : 'foul'
                  return (
                    <div key={ev.id ?? i} className="flex items-center justify-between text-xs px-3 py-1.5 bg-[#121212] rounded-xl">
                      <div className="flex items-center space-x-2">
                        <TeamLogo team={team} className="w-4 h-4" />
                        <span className="text-gray-300 font-bold">{team?.short_name}</span>
                        {player && <span className="text-gray-500">#{player.number} {player.name}</span>}
                      </div>
                      <span className={`font-black text-xs ${EVENT_TYPE_COLOR[typeKey] ?? 'text-gray-400'}`}>
                        {EVENT_TYPE_LABEL[typeKey] ?? typeKey}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Eventos guardados en BD */}
            {match.events?.length > 0 && (
              <div className="mt-4 border-t border-[#1a1a1a] pt-3">
                <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest mb-2">Historial Guardado</p>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {[...match.events].reverse().slice(0, 20).map(event => (
                    <div key={event.id} className="flex items-center justify-between text-[10px] px-3 py-1.5 bg-[#121212]/50 rounded-xl">
                      <span className="text-gray-600">Q{event.quarter}</span>
                      <span className="text-gray-400">{EVENT_TYPE_LABEL[event.type] ?? event.type}</span>
                      {event.home_score_snapshot != null && (
                        <span className="text-gray-600 font-mono">{event.home_score_snapshot}–{event.away_score_snapshot}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Resultado final */}
        {match.status === 'finished' && (
          <div className="bg-[#0d0d0d] border border-blue-500/20 rounded-2xl p-6 text-center">
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">Partido Finalizado</p>
            <p className="text-3xl font-black text-white">{match.home_score} – {match.away_score}</p>
            <p className="text-xs text-gray-500 mt-2">
              {match.home_score > match.away_score ? match.home_team?.name : match.away_team?.name} ganó el partido
            </p>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

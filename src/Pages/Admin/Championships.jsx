import { useState, useEffect } from 'react'
import AdminLayout from '../../Components/AdminLayout'
import { Trophy, Plus, Trash2, Edit2, X, Sparkles, Users, Play, ChevronDown, ChevronUp, Swords, AlertTriangle, CalendarDays, Clock } from 'lucide-react'
import { TeamLogo } from './Teams'
import { confirmDelete, confirmAction, toastWarn, toastSuccess, toastError } from '../../lib/swal'
import client from '../../api/client'

// ─── Validación equipos eliminación directa ───────────────────────────────────
const VALID_KNOCKOUT_COUNTS = [4, 8, 16, 32]
const KNOCKOUT_LABEL_MAP = { 4: 'Semifinal', 8: 'Cuartos de Final', 16: 'Octavos de Final', 32: 'Dieciseisavos de Final' }

const DAYS_ES = [
  { value: 0, label: 'Dom' },
  { value: 1, label: 'Lun' },
  { value: 2, label: 'Mar' },
  { value: 3, label: 'Mié' },
  { value: 4, label: 'Jue' },
  { value: 5, label: 'Vie' },
  { value: 6, label: 'Sáb' },
]

// ─── Modal de activación con calendario ──────────────────────────────────────
function ActivateModal({ champ, onClose, onConfirm }) {
  const [startDate, setStartDate]         = useState('')
  const [playDays, setPlayDays]           = useState([1, 3, 5]) // Lun, Mié, Vie
  const [matchesPerDay, setMatchesPerDay] = useState(2)
  const [generateMatches, setGenerateMatches] = useState(true)

  const toggleDay = (v) =>
    setPlayDays(prev => prev.includes(v) ? prev.filter(d => d !== v) : [...prev, v].sort())

  const handleSubmit = (e) => {
    e.preventDefault()
    if (generateMatches && playDays.length === 0) {
      toastWarn('Selecciona al menos un día de juego.')
      return
    }
    onConfirm({ startDate, playDays, matchesPerDay, generateMatches })
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-[#0d0d0d] border border-[#222] rounded-3xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-emerald-500/10 rounded-xl flex items-center justify-center">
              <CalendarDays className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">Iniciar Campeonato</h3>
              <p className="text-[10px] text-gray-500 mt-0.5 truncate max-w-[220px]">{champ.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Fecha de inicio */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Fecha de inicio del torneo
            </label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full bg-[#121212] border border-[#222] text-white text-sm px-4 py-3 rounded-2xl outline-none focus:border-orange-500"
            />
            <p className="text-[10px] text-gray-600">Opcional — si no se configura, los partidos quedarán sin fecha.</p>
          </div>

          {/* Días de juego */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Días de la semana que se juega
            </label>
            <div className="flex space-x-1.5">
              {DAYS_ES.map(day => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDay(day.value)}
                  className={`flex-1 py-2.5 rounded-xl text-[11px] font-black transition-all ${
                    playDays.includes(day.value)
                      ? 'bg-orange-500 text-black'
                      : 'bg-[#1a1a1a] border border-[#222] text-gray-500 hover:border-[#444] hover:text-white'
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
            {playDays.length === 0 && (
              <p className="text-[10px] text-red-400">Selecciona al menos un día.</p>
            )}
          </div>

          {/* Partidos por día */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>Mínimo de partidos por día</span>
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="range"
                min={1}
                max={10}
                value={matchesPerDay}
                onChange={e => setMatchesPerDay(+e.target.value)}
                className="flex-1 accent-orange-500"
              />
              <span className="w-12 text-center py-2 bg-[#1a1a1a] border border-[#222] rounded-xl text-white text-sm font-black">
                {matchesPerDay}
              </span>
            </div>
            <p className="text-[10px] text-gray-600">
              {matchesPerDay === 1 ? '1 partido por jornada' : `${matchesPerDay} partidos por jornada`}
              {startDate && playDays.length > 0 && (
                <span className="ml-1 text-gray-500">· Horarios desde las 19:00 h</span>
              )}
            </p>
          </div>

          {/* Generación automática de partidos */}
          <div className="pt-2">
            <label className="flex items-center space-x-2 text-xs text-white cursor-pointer select-none">
              <input
                type="checkbox"
                checked={generateMatches}
                onChange={e => setGenerateMatches(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 accent-orange-500 text-orange-600 focus:ring-orange-500"
              />
              <span className="font-bold text-gray-300">Generar partidos automáticamente</span>
            </label>
            <p className="text-[10px] text-gray-500 mt-1 pl-6">
              Si se desactiva, el campeonato se iniciará en blanco sin fixture inicial.
            </p>
          </div>

          <div className="pt-2 flex space-x-3">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 bg-[#1a1a1a] border border-[#222] text-gray-400 text-sm font-bold rounded-2xl hover:text-white transition-all">
              Cancelar
            </button>
            <button type="submit"
              className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-black font-bold text-sm rounded-2xl hover:from-emerald-600 hover:to-green-700 transition-all">
              <Play className="w-4 h-4 inline mr-1" />
              {generateMatches ? 'Generar Fixture' : 'Activar campeonato'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ChampionshipModal({ championship, teams, onClose, onSuccess }) {
  const [data, setDataState] = useState({
    name:            championship?.name ?? '',
    gender:          championship?.gender ?? 'masculino',
    has_group_stage: championship?.has_group_stage ?? true,
    rounds:          championship?.rounds ?? 1,
    has_third_place: championship?.has_third_place ?? false,
    team_ids:        championship?.teams?.map(t => t.id) ?? [],
    divide_groups:   false,
    group_count:     2,
    team_groups:     {},
  })
  const [errors, setErrors] = useState({})
  const [processing, setProcessing] = useState(false)

  const setData = (keyOrFunc, value) => {
    if (typeof keyOrFunc === 'function') {
      setDataState(keyOrFunc);
    } else if (typeof keyOrFunc === 'object' && keyOrFunc !== null) {
      setDataState(prev => ({ ...prev, ...keyOrFunc }));
    } else {
      setDataState(prev => ({ ...prev, [keyOrFunc]: value }));
    }
  };

  const toggleTeam = (id) => {
    setData('team_ids', data.team_ids.includes(id)
      ? data.team_ids.filter(x => x !== id)
      : [...data.team_ids, id])
  }

  const submit = (e) => {
    e.preventDefault()

    if (!data.has_group_stage && !VALID_KNOCKOUT_COUNTS.includes(data.team_ids.length)) {
      toastWarn(`Para eliminación directa debes seleccionar exactamente 4, 8, 16 o 32 equipos. Seleccionados: ${data.team_ids.length}`)
      return
    }

    setProcessing(true)
    setErrors({})

    const payload = {
      name: data.name,
      gender: data.gender,
      has_group_stage: data.has_group_stage,
      rounds: data.rounds,
      has_third_place: data.has_third_place,
    }

    if (data.divide_groups && data.has_group_stage) {
      const groups = {}
      data.team_ids.forEach(id => {
        const g = data.team_groups[id] || 'A'
        if (!groups[g]) groups[g] = []
        groups[g].push(id)
      })
      payload.groups = groups
    } else {
      payload.team_ids = data.team_ids
    }

    const request = championship
      ? client.put(`/admin/campeonatos/${championship.id}`, payload)
      : client.post('/admin/campeonatos', payload)

    request
      .then(() => {
        toastSuccess(championship ? 'Campeonato actualizado con éxito' : 'Campeonato creado con éxito')
        onSuccess()
      })
      .catch(err => {
        if (err.response?.data?.errors) {
          setErrors(err.response.data.errors)
        } else {
          toastError(err.response?.data?.message || 'Error al guardar el campeonato')
        }
      })
      .finally(() => setProcessing(false))
  }

  const filteredTeams = teams.filter(team => {
    if (data.gender === 'mixto') return true
    return team.gender === data.gender || team.gender === 'mixto'
  })

  const selectedCount = data.team_ids.length
  const knockoutValid = data.has_group_stage || VALID_KNOCKOUT_COUNTS.includes(selectedCount)
  const knockoutPhase = KNOCKOUT_LABEL_MAP[selectedCount] ?? null

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-[#0d0d0d] border border-[#222] rounded-3xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-black text-white">{championship ? 'Editar Campeonato' : 'Nuevo Campeonato'}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          {/* Nombre */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">🏆 Nombre del Campeonato</label>
            <input value={data.name} onChange={e => setData('name', e.target.value)} placeholder="Ej: Torneo de Invierno Latacunga 2026" required
              className="w-full bg-[#121212] border border-[#222] text-white text-sm px-4 py-3 rounded-2xl outline-none focus:border-orange-500" />
            {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
          </div>

          {/* Género */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">⚥ Categoría del Campeonato</label>
            <select value={data.gender} onChange={e => setData(d => ({ ...d, gender: e.target.value, team_ids: [] }))}
              className="w-full bg-[#121212] border border-[#222] text-white text-sm px-4 py-3 rounded-2xl outline-none">
              <option value="masculino">Masculino</option>
              <option value="femenino">Femenino</option>
              <option value="mixto">Mixto (combinado)</option>
            </select>
          </div>

          {/* Tipo de campeonato (solo al crear) */}
          {!championship && (
            <div className="bg-[#121212]/50 border border-[#1a1a1a] rounded-2xl p-4 space-y-3">
              <span className="text-xs font-bold text-gray-300">Tipo de Campeonato</span>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                <label className="flex items-center space-x-2 text-xs text-white cursor-pointer">
                  <input type="checkbox" checked={data.has_group_stage}
                    onChange={e => setData(d => ({ ...d, has_group_stage: e.target.checked, team_ids: [] }))}
                    className="accent-orange-500" />
                  <span>Fase de Grupos (Round Robin)</span>
                </label>
                <label className="flex items-center space-x-2 text-xs text-white cursor-pointer">
                  <input type="checkbox" checked={data.has_third_place}
                    onChange={e => setData('has_third_place', e.target.checked)}
                    className="accent-orange-500" />
                  <span>Partido de 3er y 4to lugar</span>
                </label>
              </div>

              {data.has_group_stage && (
                <div className="flex items-center space-x-3 pt-1">
                  <span className="text-xs text-gray-400">Vueltas (partidos contra cada equipo):</span>
                  <input type="number" min={1} max={4} value={data.rounds}
                    onChange={e => setData('rounds', +e.target.value)}
                    className="w-16 bg-[#121212] border border-[#222] text-white text-xs px-2 py-1 rounded-xl text-center" />
                </div>
              )}

              {data.has_group_stage && (
                <div className="flex items-center space-x-6 pt-1 border-t border-[#1a1a1a] mt-2 pt-2">
                  <label className="flex items-center space-x-2 text-xs text-white cursor-pointer select-none">
                    <input type="checkbox" checked={data.divide_groups}
                      onChange={e => setData(d => ({ ...d, divide_groups: e.target.checked }))}
                      className="accent-orange-500" />
                    <span>Dividir en Grupos</span>
                  </label>
                  {data.divide_groups && (
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] text-gray-400">Grupos:</span>
                      <select value={data.group_count}
                        onChange={e => setData(d => ({ ...d, group_count: +e.target.value }))}
                        className="bg-[#121212] border border-[#222] text-white text-[11px] px-2 py-1 rounded-lg">
                        <option value={2}>2 Grupos</option>
                        <option value={4}>4 Grupos</option>
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* Indicador de equipos requeridos para eliminatoria */}
              {!data.has_group_stage && (
                <div className="flex items-center space-x-2 pt-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  <p className="text-[10px] text-amber-400">
                    La eliminación directa requiere exactamente <strong>4, 8, 16 o 32</strong> equipos.
                    {selectedCount > 0 && !knockoutValid && (
                      <span className="text-red-400 ml-1">({selectedCount} seleccionados — inválido)</span>
                    )}
                    {knockoutValid && selectedCount > 0 && (
                      <span className="text-emerald-400 ml-1">({selectedCount} → {knockoutPhase} ✓)</span>
                    )}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Selección de equipos */}
          {!championship && (
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                Seleccionar Equipos
                <span className={`ml-2 font-black ${!data.has_group_stage && !knockoutValid && selectedCount > 0 ? 'text-red-400' : 'text-orange-400'}`}>
                  {selectedCount} seleccionados
                  {!data.has_group_stage && knockoutValid && selectedCount > 0 && ` → ${knockoutPhase}`}
                </span>
              </p>
              {filteredTeams.length === 0 ? (
                <p className="text-xs text-gray-600 italic">No hay equipos activos con la categoría seleccionada.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {filteredTeams.map(team => {
                    const isSelected = data.team_ids.includes(team.id);
                    const currentGroup = data.team_groups[team.id] || 'A';
                    const groupsOptions = Array.from({ length: data.group_count }, (_, i) => String.fromCharCode(65 + i)); // ['A', 'B', ...]

                    return (
                      <div key={team.id}
                        className={`flex items-center justify-between p-2 rounded-xl text-xs border transition-all ${
                          isSelected
                            ? 'border-orange-500 bg-orange-500/5 text-white font-bold'
                            : 'border-[#222] bg-[#121212]/50 text-gray-400 hover:border-[#444]'
                        }`}>
                        <div className="flex items-center space-x-2 cursor-pointer flex-1 py-1" onClick={() => toggleTeam(team.id)}>
                          <TeamLogo team={team} className="w-5 h-5" />
                          <span className="truncate max-w-[100px]">{team.name}</span>
                        </div>
                        {isSelected && data.divide_groups && data.has_group_stage && (
                          <div className="flex items-center space-x-1 pl-2 border-l border-[#222]" onClick={e => e.stopPropagation()}>
                            {groupsOptions.map(g => (
                              <button
                                key={g}
                                type="button"
                                onClick={() => setData(d => ({
                                  ...d,
                                  team_groups: { ...d.team_groups, [team.id]: g }
                                }))}
                                className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-black transition-all ${
                                  currentGroup === g
                                    ? 'bg-orange-500 text-black'
                                    : 'bg-[#1a1a1a] text-gray-500 hover:text-white'
                                }`}
                              >
                                {g}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <button type="submit" disabled={processing}
            className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-600 text-black font-bold text-sm rounded-2xl disabled:opacity-50">
            {processing ? 'Guardando...' : championship ? 'Actualizar' : 'Crear Campeonato'}
          </button>
        </form>
      </div>
    </div>
  )
}

function ManualMatchModal({ championship, onClose, onSuccess }) {
  const [data, setDataState] = useState({
    home_team_id: '',
    away_team_id: '',
    round:        1,
    stage:        'group',
    label:        '',
    court:        'Coliseo Principal',
    scheduled_at: '',
    group_name:   '',
  })
  const [errors, setErrors] = useState({})
  const [processing, setProcessing] = useState(false)
  const [sameTeamError, setSameTeamError] = useState(false)
  const [crossGroup, setCrossGroup] = useState(false)

  const setData = (keyOrFunc, value) => {
    if (typeof keyOrFunc === 'function') {
      setDataState(keyOrFunc);
    } else if (typeof keyOrFunc === 'object' && keyOrFunc !== null) {
      setDataState(prev => ({ ...prev, ...keyOrFunc }));
    } else {
      setDataState(prev => ({ ...prev, [keyOrFunc]: value }));
    }
  };

  const championshipTeams = championship?.teams || []
  const hasGroups = championshipTeams.some(t => t.pivot?.group_name)

  const groupOptions = hasGroups
    ? Array.from(new Set(championshipTeams.map(t => t.pivot?.group_name).filter(Boolean))).sort()
    : []

  const isGroupStage = data.stage === 'group'

  const filteredTeams = (hasGroups && isGroupStage && !crossGroup)
    ? (data.group_name ? championshipTeams.filter(t => t.pivot?.group_name === data.group_name) : [])
    : championshipTeams

  const submit = (e) => {
    e.preventDefault()
    if (data.home_team_id && data.away_team_id && String(data.home_team_id) === String(data.away_team_id)) {
      setSameTeamError(true)
      return
    }
    setSameTeamError(false)
    setProcessing(true)
    setErrors({})

    const payload = {
      ...data,
      group_name: (hasGroups && isGroupStage && !crossGroup) ? data.group_name : null,
    }

    client.post(`/admin/campeonatos/${championship.id}/partido-manual`, payload)
      .then(() => {
        toastSuccess('Partido manual agregado con éxito')
        onSuccess()
      })
      .catch(err => {
        if (err.response?.data?.errors) {
          setErrors(err.response.data.errors)
        } else {
          toastError('Error al crear el partido manual')
        }
      })
      .finally(() => setProcessing(false))
  }

  const selectClass = "w-full bg-[#121212] border border-[#222] text-white text-sm px-4 py-3 rounded-2xl outline-none focus:border-orange-500"
  const inputClass  = "w-full bg-[#121212] border border-[#222] text-white text-sm px-4 py-3 rounded-2xl outline-none focus:border-orange-500"
  const labelClass = "block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5"

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-[#0d0d0d] border border-[#222] rounded-3xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-black text-white">Agregar Partido Manual</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className={labelClass}>🎭 Fase del partido</label>
              <select 
                value={data.stage} 
                onChange={e => {
                  setDataState(prev => ({
                    ...prev,
                    stage: e.target.value,
                    group_name: '',
                    home_team_id: '',
                    away_team_id: ''
                  }))
                  setSameTeamError(false)
                }} 
                className={selectClass}
              >
                <option value="group">Fase de Grupos</option>
                <option value="playoff">Playoffs (Eliminatoria)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className={labelClass}>🏷 Etiqueta <span className="normal-case text-gray-600 font-normal">(ej: Semifinal)</span></label>
              <input value={data.label} onChange={e => setData('label', e.target.value)} placeholder="Ej: Final, Semifinal" className={inputClass} />
            </div>
          </div>

          {/* Toggle entre grupos + selector de grupo */}
          {hasGroups && isGroupStage && (
            <div className="space-y-3">
              {/* Toggle cross-group */}
              <button
                type="button"
                onClick={() => {
                  setCrossGroup(prev => !prev)
                  setDataState(prev => ({ ...prev, group_name: '', home_team_id: '', away_team_id: '' }))
                  setSameTeamError(false)
                }}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-2xl border text-xs font-bold transition-all ${
                  crossGroup
                    ? 'bg-orange-500/10 border-orange-500/40 text-orange-400'
                    : 'bg-[#121212] border-[#222] text-gray-400 hover:border-[#444]'
                }`}
              >
                <span>⚡ Partido entre grupos distintos</span>
                <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-all ${crossGroup ? 'bg-orange-500 border-orange-500' : 'border-gray-600'}`} />
              </button>

              {/* Selector de grupo (solo si NO es cross-group) */}
              {!crossGroup && (
                <div className="space-y-1.5">
                  <label className={labelClass}>🗂 Grupo</label>
                  <select
                    value={data.group_name}
                    onChange={e => {
                      setDataState(prev => ({ ...prev, group_name: e.target.value, home_team_id: '', away_team_id: '' }))
                      setSameTeamError(false)
                    }}
                    required
                    className={selectClass}
                  >
                    <option value="">Seleccionar grupo</option>
                    {groupOptions.map(g => <option key={g} value={g}>Grupo {g}</option>)}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Equipos */}
          {(!hasGroups || !isGroupStage || crossGroup || data.group_name) ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className={labelClass}>🏠 Equipo Local</label>
                <select value={data.home_team_id} onChange={e => { setData('home_team_id', e.target.value); setSameTeamError(false) }} required className={selectClass}>
                  <option value="">Seleccionar equipo local...</option>
                  {filteredTeams.map(t => (
                    <option key={t.id} value={t.id} disabled={String(t.id) === String(data.away_team_id)}>
                      {crossGroup && t.pivot?.group_name ? `[Grp ${t.pivot.group_name}] ` : ''}{t.name}{String(t.id) === String(data.away_team_id) ? ' (ya seleccionado)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>✈ Equipo Visitante</label>
                <select value={data.away_team_id} onChange={e => { setData('away_team_id', e.target.value); setSameTeamError(false) }} required className={selectClass}>
                  <option value="">Seleccionar equipo visitante...</option>
                  {filteredTeams.map(t => (
                    <option key={t.id} value={t.id} disabled={String(t.id) === String(data.home_team_id)}>
                      {crossGroup && t.pivot?.group_name ? `[Grp ${t.pivot.group_name}] ` : ''}{t.name}{String(t.id) === String(data.home_team_id) ? ' (ya seleccionado)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="bg-orange-500/5 border border-orange-500/10 rounded-2xl p-3 text-center text-xs text-orange-400 font-bold">
              Selecciona un grupo o activa "Partido entre grupos distintos".
            </div>
          )}

          {sameTeamError && (
            <p className="text-red-400 text-xs font-semibold px-1">⚠ El equipo local y visitante no pueden ser el mismo.</p>
          )}

          <div className="space-y-1.5">
            <label className={labelClass}>📍 Cancha / Lugar del partido</label>
            <input value={data.court} onChange={e => setData('court', e.target.value)} placeholder="Ej: Coliseo Municipal" className={inputClass} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className={labelClass}>📅 Fecha y hora programada</label>
              <input value={data.scheduled_at} onChange={e => setData('scheduled_at', e.target.value)} type="datetime-local" className={inputClass} />
            </div>
            <div className="space-y-1.5">
              <label className={labelClass}>🔢 Número de Jornada / Ronda</label>
              <input value={data.round} onChange={e => setData('round', +e.target.value)} type="number" min={1} placeholder="Ej: 1" className={inputClass} />
            </div>
          </div>

          <button type="submit" disabled={processing}
            className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-600 text-black font-bold text-sm rounded-2xl disabled:opacity-50">
            {processing ? 'Creando Partido...' : 'Crear Partido'}
          </button>
        </form>
      </div>
    </div>
  )
}

const STATUS_LABEL = { draft: 'Borrador', active: 'Activo', finished: 'Finalizado' }
const STATUS_COLOR = { draft: 'bg-gray-500/10 text-gray-400', active: 'bg-emerald-500/10 text-emerald-400', finished: 'bg-blue-500/10 text-blue-400' }

export default function Championships() {
  const [championships, setChampionships] = useState([])
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [manualMatchModal, setManualMatchModal] = useState(null)
  const [activateModal, setActivateModal] = useState(null)
  const [expandedChamp, setExpandedChamp] = useState(null)
  const [activeTabs, setActiveTabs] = useState({})

  const getTab = (champId, hasGroupStage) => activeTabs[champId] ?? (hasGroupStage ? 'standings' : 'playoffs')
  const setTab  = (champId, tab) => setActiveTabs(prev => ({ ...prev, [champId]: tab }))

  const fetchData = () => {
    Promise.all([
      client.get('/admin/campeonatos'),
      client.get('/admin/equipos')
    ])
    .then(([resChamps, resTeams]) => {
      setChampionships(resChamps.data.championships || [])
      setTeams(resTeams.data.teams || [])
    })
    .catch(err => {
      toastError('Error al cargar campeonatos')
    })
    .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchData()
  }, [])

  const deleteChampionship = async (id) => {
    const result = await confirmDelete('¿Eliminar campeonato?', 'Se eliminarán todos los partidos asociados.')
    if (result.isConfirmed) {
      client.delete(`/admin/campeonatos/${id}`)
        .then(() => {
          toastSuccess('Campeonato eliminado con éxito')
          fetchData()
        })
        .catch(() => {
          toastError('Error al eliminar el campeonato')
        })
    }
  }

  const activate = (champ) => setActivateModal(champ)

  const doActivate = (champ, { startDate, playDays, matchesPerDay, generateMatches }) => {
    setActivateModal(null)
    setLoading(true)
    client.put(`/admin/campeonatos/${champ.id}`, {
      name:            champ.name,
      status:          'active',
      start_date:      startDate || null,
      play_days:       playDays,
      matches_per_day: matchesPerDay,
      generate_matches: generateMatches,
    })
      .then(() => {
        toastSuccess('Campeonato iniciado con éxito')
        fetchData()
      })
      .catch(err => {
        const errorMsg = err.response?.data?.errors?.status?.[0] || err.response?.data?.message || 'Error al iniciar el campeonato';
        toastError(errorMsg)
        setLoading(false)
      })
  }

  const generatePlayoffs = async (champ, limit) => {
    const result = await confirmAction(
      `¿Generar Playoffs — Top ${limit}?`,
      `Se crearán los cruces eliminatorios con los ${limit} mejores equipos de la tabla general.`,
      'Generar'
    )
    if (result.isConfirmed) {
      setLoading(true)
      client.post(`/admin/campeonatos/${champ.id}/generar-playoffs`, { limit })
        .then(() => {
          toastSuccess('Playoffs generados con éxito')
          fetchData()
        })
        .catch(() => {
          toastError('Error al generar los playoffs')
          setLoading(false)
        })
    }
  }

  const advancePlayoffs = async (champ) => {
    const result = await confirmAction(
      '¿Avanzar de ronda?',
      'Se generarán los partidos de la siguiente fase eliminatoria con los ganadores actuales.',
      'Avanzar'
    )
    if (result.isConfirmed) {
      setLoading(true)
      client.post(`/admin/campeonatos/${champ.id}/avanzar-ronda`)
        .then(() => {
          toastSuccess('Ronda avanzada con éxito')
          fetchData()
        })
        .catch(() => {
          toastError('Error al avanzar la ronda')
          setLoading(false)
        })
    }
  }

  const toggleExpand = (id) => setExpandedChamp(expandedChamp === id ? null : id)

  const handleModalSuccess = () => {
    setModal(null)
    setManualMatchModal(null)
    fetchData()
  }

  if (loading) {
    return (
      <AdminLayout title="Campeonatos">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
          <span className="ml-3 text-gray-400 font-bold text-sm">Cargando campeonatos...</span>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Campeonatos">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <span className="inline-flex items-center bg-orange-500/10 border border-orange-500/20 text-[10px] font-black text-orange-500 px-3 py-1 rounded-full uppercase tracking-wider">
              <Sparkles className="w-3 h-3 mr-1" /> Gestión de Torneos
            </span>
            <h1 className="text-xl font-black text-white mt-1">Campeonatos</h1>
          </div>
          <button onClick={() => setModal({})}
            className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 text-black text-xs font-bold rounded-2xl">
            <Plus className="w-4 h-4" />
            <span>Nuevo Campeonato</span>
          </button>
        </div>

        <div className="space-y-4">
          {championships.length === 0 ? (
            <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-2xl p-6 text-center text-gray-500 text-xs font-bold">
              No hay campeonatos registrados.
            </div>
          ) : (
            championships.map(champ => {
              const isExpanded     = expandedChamp === champ.id
              const groupMatches   = champ.matches?.filter(m => m.stage === 'group')   ?? []
              const playoffMatches = champ.matches?.filter(m => m.stage === 'playoff') ?? []
              const hasPlayoffs    = playoffMatches.length > 0

              const playoffRounds = playoffMatches.reduce((acc, match) => {
                const label = match.label || `Ronda ${match.round}`
                if (!acc[label]) acc[label] = []
                acc[label].push(match)
                return acc
              }, {})

              return (
                <div key={champ.id} className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-2xl overflow-hidden hover:border-[#333] transition-all">
                  <div className="p-5 flex items-start justify-between cursor-pointer" onClick={() => toggleExpand(champ.id)}>
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
                        <Trophy className="w-5 h-5 text-amber-400" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">{champ.name}</h3>
                        <div className="flex items-center flex-wrap gap-1.5 mt-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLOR[champ.status]}`}>
                            {STATUS_LABEL[champ.status]}
                          </span>
                          <span className="text-[10px] text-gray-500 capitalize">{champ.gender}</span>
                          {champ.has_group_stage && (
                            <span className="text-[10px] bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded-full font-bold">
                              Grupos ({champ.rounds}v)
                            </span>
                          )}
                          {champ.has_third_place && (
                            <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full font-bold">
                              Con 3er Lugar
                          </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3" onClick={e => e.stopPropagation()}>
                      {champ.status === 'draft' && (
                        <button onClick={() => activate(champ)}
                          className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-xl hover:bg-emerald-500/25 transition-all">
                          <Play className="w-3 h-3" />
                          <span>Iniciar</span>
                        </button>
                      )}
                      <button onClick={() => setModal({ championship: champ })}
                        className="p-2 text-gray-500 hover:text-white rounded-lg hover:bg-[#222]">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => deleteChampionship(champ.id)}
                        className="p-2 text-gray-500 hover:text-red-400 rounded-lg hover:bg-red-950/20">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => toggleExpand(champ.id)} className="text-gray-400 hover:text-white p-2">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="px-5 pb-3 flex items-center space-x-2 text-[10px] text-gray-500">
                    <Users className="w-3 h-3" />
                    <span>{champ.teams?.length ?? 0} equipos participantes</span>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-[#1a1a1a] bg-[#121212]/30 p-5 space-y-4">
                      {/* Tabs navigation */}
                      <div className="flex space-x-2 border-b border-[#222] pb-2">
                        {champ.has_group_stage && (
                          <button onClick={() => setTab(champ.id, 'standings')}
                            className={`px-4 py-2 text-xs font-black rounded-lg transition-all ${getTab(champ.id, champ.has_group_stage) === 'standings' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/25' : 'text-gray-500 hover:text-white'}`}>
                            Tabla General
                          </button>
                        )}
                        {champ.has_group_stage && (
                          <button onClick={() => setTab(champ.id, 'matches')}
                            className={`px-4 py-2 text-xs font-black rounded-lg transition-all ${getTab(champ.id, champ.has_group_stage) === 'matches' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/25' : 'text-gray-500 hover:text-white'}`}>
                            Partidos de Grupo
                          </button>
                        )}
                        <button onClick={() => setTab(champ.id, 'playoffs')}
                          className={`px-4 py-2 text-xs font-black rounded-lg transition-all ${getTab(champ.id, champ.has_group_stage) === 'playoffs' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/25' : 'text-gray-500 hover:text-white'}`}>
                          Llave Playoffs
                        </button>
                      </div>

                      {/* Tabla general */}
                      {getTab(champ.id, champ.has_group_stage) === 'standings' && champ.has_group_stage && (() => {
                        const hasGroups = champ.teams?.some(t => t.pivot?.group_name);
                        let groupedStandings = {};
                        if (hasGroups) {
                          champ.teams.forEach(t => {
                            const gName = t.pivot.group_name || 'Sin Grupo';
                            if (!groupedStandings[gName]) groupedStandings[gName] = [];
                            groupedStandings[gName].push(t);
                          });
                        } else {
                          groupedStandings['General'] = champ.teams || [];
                        }

                        return (
                          <div className="space-y-6">
                            {Object.entries(groupedStandings).map(([groupName, groupTeams]) => (
                              <div key={groupName} className="space-y-2">
                                {hasGroups && (
                                  <h4 className="text-xs font-black text-orange-500 uppercase tracking-wider pl-1">
                                    Grupo {groupName}
                                  </h4>
                                )}
                                <div className="overflow-x-auto bg-[#121212]/30 border border-[#222]/30 rounded-2xl p-4">
                                  <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                      <tr className="text-gray-500 border-b border-[#222]/50 uppercase font-bold tracking-wider">
                                        <th className="py-2.5">Equipo</th>
                                        <th className="py-2.5 text-center">PJ</th>
                                        <th className="py-2.5 text-center">PG</th>
                                        <th className="py-2.5 text-center">PP</th>
                                        <th className="py-2.5 text-center">Dif</th>
                                        <th className="py-2.5 text-center">Pts</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {groupTeams.length === 0 ? (
                                        <tr>
                                          <td colSpan="6" className="py-4 text-center text-gray-500 italic">No hay equipos en este grupo.</td>
                                        </tr>
                                      ) : (
                                        groupTeams.map((team, idx) => (
                                          <tr key={team.id} className="border-b border-[#1a1a1a]/30 last:border-b-0 hover:bg-[#121212]/50">
                                            <td className="py-3 flex items-center space-x-2 font-bold text-white">
                                              <span className="w-4 text-gray-600 text-center">{idx + 1}</span>
                                              <TeamLogo team={team} className="w-6 h-6" />
                                              <span>{team.name}</span>
                                            </td>
                                            <td className="py-3 text-center text-gray-300">{team.pivot?.pj ?? 0}</td>
                                            <td className="py-3 text-center text-emerald-400 font-semibold">{team.pivot?.pg ?? 0}</td>
                                            <td className="py-3 text-center text-red-400">{team.pivot?.pp ?? 0}</td>
                                            <td className="py-3 text-center text-gray-400 font-mono">{team.pivot?.dif > 0 ? `+${team.pivot.dif}` : team.pivot?.dif ?? 0}</td>
                                            <td className="py-3 text-center text-orange-500 font-bold">{team.pivot?.pts ?? 0}</td>
                                          </tr>
                                        ))
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })()}

                      {/* Partidos de grupo */}
                      {getTab(champ.id, champ.has_group_stage) === 'matches' && champ.has_group_stage && (
                        <div className="space-y-4 max-h-[400px] overflow-y-auto">
                          {groupMatches.length === 0 ? (
                            <p className="text-xs text-gray-500 text-center py-4">No se han generado partidos aún.</p>
                          ) : (
                            Object.entries(groupMatches.reduce((acc, match) => {
                              if (!acc[match.round]) acc[match.round] = []
                              acc[match.round].push(match)
                              return acc
                            }, {})).map(([roundNum, matches]) => (
                              <div key={roundNum} className="space-y-2">
                                <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Jornada {roundNum}</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {matches.map(match => (
                                    <div key={match.id} className="bg-[#121212] border border-[#222] rounded-xl p-3 flex items-center justify-between">
                                      <div className="flex items-center space-x-3">
                                        <div className="flex flex-col items-center">
                                          <TeamLogo team={match.home_team} className="w-6 h-6" />
                                          <span className="text-[10px] text-white mt-1 font-bold">{match.home_team?.short_name}</span>
                                        </div>
                                        <div className="text-center font-bold px-2">
                                          <span className="text-xs text-gray-400">
                                            {match.status === 'finished' ? `${match.home_score} - ${match.away_score}` : 'vs'}
                                          </span>
                                          {match.status === 'live' && (
                                            <span className="block text-[8px] bg-red-600 text-white rounded px-1 animate-pulse uppercase">En Vivo</span>
                                          )}
                                        </div>
                                        <div className="flex flex-col items-center">
                                          <TeamLogo team={match.away_team} className="w-6 h-6" />
                                          <span className="text-[10px] text-white mt-1 font-bold">{match.away_team?.short_name}</span>
                                        </div>
                                      </div>
                                      <div className="text-[10px] text-right text-gray-500">
                                        {match.group_name && (
                                          <span className="inline-block bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[8px] px-1.5 py-0.5 rounded-full uppercase tracking-wider mb-1">
                                            Grupo {match.group_name}
                                          </span>
                                        )}
                                        <p>{match.court}</p>
                                        {match.scheduled_at && <p className="mt-0.5">{new Date(match.scheduled_at).toLocaleDateString('es')}</p>}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}

                      {/* Llave playoffs */}
                      {getTab(champ.id, champ.has_group_stage) === 'playoffs' && (
                        <div className="space-y-6">
                          {/* Herramientas de playoffs */}
                          {champ.status === 'active' && !hasPlayoffs && (
                            <div className="bg-[#121212]/50 border border-[#222] rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                              <div className="flex items-center space-x-3">
                                <AlertTriangle className="w-5 h-5 text-amber-500" />
                                <div>
                                  <h4 className="text-xs font-bold text-white">Generar Fase Eliminatoria (Playoffs)</h4>
                                  <p className="text-[10px] text-gray-500 mt-0.5">Clasifica los mejores equipos de la tabla para playoffs.</p>
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <button onClick={() => generatePlayoffs(champ, 4)}
                                  className="px-3 py-1.5 bg-orange-500 text-black text-xs font-bold rounded-xl hover:bg-orange-600">
                                  Semifinales (Top 4)
                                </button>
                                <button onClick={() => generatePlayoffs(champ, 8)}
                                  className="px-3 py-1.5 bg-[#222] border border-[#333] text-white text-xs font-bold rounded-xl hover:bg-[#333]">
                                  Cuartos (Top 8)
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Bracket */}
                          {!hasPlayoffs ? (
                            <p className="text-xs text-gray-500 text-center py-4">No se han generado llaves eliminatorias aún.</p>
                          ) : (
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Cruces Eliminatorios</h4>
                                {champ.status === 'active' && (
                                  <button onClick={() => advancePlayoffs(champ)}
                                    className="px-3 py-1.5 bg-emerald-500 text-black text-xs font-bold rounded-xl hover:bg-emerald-600">
                                    Avanzar Siguiente Ronda / Finales
                                  </button>
                                )}
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {Object.entries(playoffRounds).map(([label, matches]) => (
                                  <div key={label} className="space-y-2 border border-[#222] bg-[#121212]/20 rounded-2xl p-4">
                                    <div className="border-b border-[#222] pb-1.5 mb-3 flex items-center justify-between">
                                      <span className="text-xs font-black text-orange-400 uppercase tracking-wider">{label}</span>
                                      <Swords className="w-3.5 h-3.5 text-gray-600" />
                                    </div>
                                    <div className="space-y-2">
                                      {matches.map(match => (
                                        <div key={match.id} className="bg-[#121212] border border-[#222] rounded-xl p-3 flex items-center justify-between">
                                          <div className="flex items-center space-x-3">
                                            <div className="flex flex-col items-center">
                                              <TeamLogo team={match.home_team} className="w-6 h-6" />
                                              <span className="text-[10px] text-white mt-1 font-bold">{match.home_team?.short_name}</span>
                                            </div>
                                            <div className="text-center font-bold px-2">
                                              <span className="text-xs text-gray-300">
                                                {match.status === 'finished' ? `${match.home_score} - ${match.away_score}` : 'vs'}
                                              </span>
                                              {match.status === 'live' && (
                                                <span className="block text-[8px] bg-red-600 text-white rounded px-1 animate-pulse uppercase">Vivo</span>
                                              )}
                                            </div>
                                            <div className="flex flex-col items-center">
                                              <TeamLogo team={match.away_team} className="w-6 h-6" />
                                              <span className="text-[10px] text-white mt-1 font-bold">{match.away_team?.short_name}</span>
                                            </div>
                                          </div>
                                          <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${
                                            match.status === 'finished' ? 'bg-blue-500/10 text-blue-400' : 'bg-gray-500/10 text-gray-400'
                                          }`}>
                                            {match.status === 'finished' ? 'Fin' : 'Prog'}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Botón partido manual */}
                      {champ.status === 'active' && (
                        <div className="pt-4 border-t border-[#222] flex justify-end">
                          <button onClick={() => setManualMatchModal(champ)}
                            className="flex items-center space-x-1.5 px-3 py-2 bg-[#1a1a1a] hover:bg-[#222] border border-[#222] text-white text-xs font-bold rounded-xl transition-all">
                            <Plus className="w-3.5 h-3.5" />
                            <span>Agregar Partido Manual</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      {modal !== null && (
        <ChampionshipModal championship={modal.championship} teams={teams} onClose={() => setModal(null)} onSuccess={handleModalSuccess} />
      )}
      {manualMatchModal !== null && (
        <ManualMatchModal championship={manualMatchModal} onClose={() => setManualMatchModal(null)} onSuccess={handleModalSuccess} />
      )}
      {activateModal !== null && (
        <ActivateModal
          champ={activateModal}
          onClose={() => setActivateModal(null)}
          onConfirm={(schedule) => doActivate(activateModal, schedule)}
        />
      )}
    </AdminLayout>
  )
}

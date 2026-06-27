import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import AdminLayout from '../../Components/AdminLayout'
import { Users, Plus, Trash2, Edit2, X, ChevronRight, Shirt, Sparkles } from 'lucide-react'
import { confirmDelete, toastWarn, toastSuccess, toastError } from '../../lib/swal'
import client, { getAssetUrl } from '../../api/client'
import { getTeamLogo } from '../../utils/teamLogos'

export function TeamLogo({ team, className = "w-10 h-10" }) {
  if (!team) return null;
  const isSmall = className.includes('w-5') || className.includes('w-6');
  const localLogo = getTeamLogo(team.name);
  if (localLogo) {
    return <img src={localLogo} alt={team.name} className={`${className} ${isSmall ? 'rounded-lg' : 'rounded-xl'} object-cover flex-shrink-0`} />;
  }
  if (team.logo_url) {
    return <img src={getAssetUrl(team.logo_url)} alt={team.name} className={`${className} ${isSmall ? 'rounded-lg' : 'rounded-xl'} object-cover flex-shrink-0`} />
  }
  const isHex = team.logo_color?.startsWith('#');
  return (
    <div
      style={isHex ? { backgroundColor: team.logo_color } : {}}
      className={`${className} ${!isHex ? `bg-gradient-to-br ${team.logo_color || 'from-orange-500 to-amber-600'}` : ''} ${isSmall ? 'rounded-lg text-[9px]' : 'rounded-xl text-xs'} flex items-center justify-center font-black text-black flex-shrink-0`}>
      {team.short_name || ''}
    </div>
  )
}

function TeamModal({ team, onClose, onSuccess }) {
  const [data, setDataState] = useState({
    name: team?.name ?? '',
    gender: team?.gender ?? 'masculino',
    short_name: team?.short_name ?? '',
    logo_color: team?.logo_color ?? '#F57C00',
    logo_url: team?.logo_url ?? '',
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

  const submit = (e) => {
    e.preventDefault()
    setProcessing(true)
    setErrors({})
    const request = team
      ? client.put(`/admin/equipos/${team.id}`, data)
      : client.post('/admin/equipos', data)

    request
      .then(() => {
        toastSuccess(team ? 'Equipo actualizado con éxito' : 'Equipo creado con éxito')
        onSuccess()
      })
      .catch(err => {
        if (err.response?.data?.errors) {
          setErrors(err.response.data.errors)
        } else {
          toastError('Error al guardar el equipo')
        }
      })
      .finally(() => setProcessing(false))
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-[#0d0d0d] border border-[#222] rounded-3xl p-6 w-full max-w-md max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-black text-white">{team ? 'Editar Equipo' : 'Nuevo Equipo'}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">🏀 Nombre del Equipo</label>
            <input value={data.name} onChange={e => setData('name', e.target.value)} placeholder="Ej: Los Cóndores BC" required
              className="w-full bg-[#121212] border border-[#222] text-white text-sm px-4 py-3 rounded-2xl outline-none focus:border-orange-500" />
            {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">⚥ Categoría del Equipo</label>
            <select value={data.gender} onChange={e => setData('gender', e.target.value)}
              className="w-full bg-[#121212] border border-[#222] text-white text-sm px-4 py-3 rounded-2xl outline-none focus:border-orange-500">
              <option value="masculino">Masculino</option>
              <option value="femenino">Femenino</option>
              <option value="mixto">Mixto</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">🔤 Abreviatura <span className="normal-case text-gray-600 font-normal">(máx. 5 caracteres, aparece en marcadores)</span></label>
            <input value={data.short_name} onChange={e => setData('short_name', e.target.value)} placeholder="Ej: CBI, TNT, OM" maxLength={5} required
              className="w-full bg-[#121212] border border-[#222] text-white text-sm px-4 py-3 rounded-2xl outline-none focus:border-orange-500" />
            {errors.short_name && <p className="text-xs text-red-400 mt-1">{errors.short_name}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Color del Equipo</label>
            <div className="flex items-center space-x-3">
              <input type="color" value={data.logo_color.startsWith('#') ? data.logo_color : '#F57C00'} 
                onChange={e => setData('logo_color', e.target.value)}
                className="w-12 h-12 bg-transparent border-0 cursor-pointer rounded-xl overflow-hidden" />
              <input value={data.logo_color} onChange={e => setData('logo_color', e.target.value)} placeholder="#HEX" required
                className="flex-1 bg-[#121212] border border-[#222] text-white text-sm px-4 py-3 rounded-2xl outline-none focus:border-orange-500" />
            </div>
            {errors.logo_color && <p className="text-xs text-red-400 mt-1">{errors.logo_color}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Logo del Equipo</label>
            <div className="flex items-center space-x-4">
              {data.logo_url ? (
                <div className="relative">
                  <img src={getAssetUrl(data.logo_url)} alt="Vista previa" className="w-12 h-12 rounded-xl object-cover" />
                  <button type="button" onClick={() => setData('logo_url', '')} 
                    className="absolute -top-1.5 -right-1.5 bg-red-600 text-white rounded-full p-0.5 hover:bg-red-700">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="w-12 h-12 bg-[#121212] border border-[#222] border-dashed rounded-xl flex items-center justify-center text-gray-500 text-xs">
                  Logo
                </div>
              )}
              <input type="file" accept="image/*" onChange={e => {
                const file = e.target.files[0]
                if (file) {
                  if (file.size > 2 * 1024 * 1024) {
                    toastWarn('La imagen no debe superar los 2 MB.')
                    e.target.value = ''
                    return
                  }
                  const reader = new FileReader()
                  reader.onloadend = () => setData('logo_url', reader.result)
                  reader.readAsDataURL(file)
                }
              }} className="text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-orange-500/10 file:text-orange-400 hover:file:bg-orange-500/20 cursor-pointer" />
            </div>
            {errors.logo_url && <p className="text-xs text-red-400 mt-1">{errors.logo_url}</p>}
          </div>

          <button type="submit" disabled={processing}
            className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-600 text-black font-bold text-sm rounded-2xl disabled:opacity-50 mt-4">
            {processing ? 'Guardando...' : team ? 'Actualizar' : 'Crear Equipo'}
          </button>
        </form>
      </div>
    </div>
  )
}

function PlayerModal({ team, player, onClose, onSuccess }) {
  const [data, setDataState] = useState({
    name: player?.name ?? '',
    number: player?.number ?? '',
    position: player?.position ?? 'Base',
    gender: player?.gender ?? (team.gender === 'femenino' ? 'femenino' : 'masculino'),
    status: player?.status ?? 'activo',
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

  const submit = (e) => {
    e.preventDefault()
    setProcessing(true)
    setErrors({})
    const request = player
      ? client.put(`/admin/equipos/${team.id}/jugadores/${player.id}`, data)
      : client.post(`/admin/equipos/${team.id}/jugadores`, data)

    request
      .then(() => {
        toastSuccess(player ? 'Jugador actualizado con éxito' : 'Jugador agregado con éxito')
        onSuccess()
      })
      .catch(err => {
        if (err.response?.data?.errors) {
          setErrors(err.response.data.errors)
        } else {
          toastError('Error al guardar el jugador')
        }
      })
      .finally(() => setProcessing(false))
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-[#0d0d0d] border border-[#222] rounded-3xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-black text-white">{player ? 'Editar Jugador' : 'Nuevo Jugador'}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">👤 Nombre completo del jugador</label>
            <input value={data.name} onChange={e => setData('name', e.target.value)} placeholder="Ej: Carlos Andrés Pérez" required
              className="w-full bg-[#121212] border border-[#222] text-white text-sm px-4 py-3 rounded-2xl outline-none focus:border-orange-500" />
            {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider"># Dorsal <span className="normal-case text-gray-600 font-normal">(0–99)</span></label>
              <input value={data.number} onChange={e => setData('number', e.target.value)} placeholder="Ej: 23" type="number" min={0} max={99} required
                className="w-full bg-[#121212] border border-[#222] text-white text-sm px-4 py-3 rounded-2xl outline-none focus:border-orange-500" />
              {errors.number && <p className="text-xs text-red-400 mt-1">{errors.number}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">🏟 Posición</label>
              <select value={data.position} onChange={e => setData('position', e.target.value)}
                className="w-full bg-[#121212] border border-[#222] text-white text-sm px-4 py-3 rounded-2xl outline-none focus:border-orange-500">
                {['Base', 'Escolta', 'Alero', 'Ala-Pivot', 'Pivot'].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">⚥ Género</label>
              <select value={data.gender} onChange={e => setData('gender', e.target.value)}
                className="w-full bg-[#121212] border border-[#222] text-white text-sm px-4 py-3 rounded-2xl outline-none focus:border-orange-500">
                <option value="masculino">Masculino</option>
                <option value="femenino">Femenino</option>
              </select>
              {errors.gender && <p className="text-xs text-red-400 mt-1">{errors.gender}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">📋 Estado del jugador</label>
              <select value={data.status} onChange={e => setData('status', e.target.value)}
                className="w-full bg-[#121212] border border-[#222] text-white text-sm px-4 py-3 rounded-2xl outline-none focus:border-orange-500">
                <option value="activo">✅ Activo</option>
                <option value="lesionado">🤕 Lesionado</option>
                <option value="suspendido">⛔ Suspendido</option>
              </select>
            </div>
          </div>

          <button type="submit" disabled={processing}
            className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-600 text-black font-bold text-sm rounded-2xl disabled:opacity-50 mt-2">
            {processing ? 'Guardando...' : player ? 'Actualizar' : 'Agregar Jugador'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function Teams() {
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [selectedTeam, setSelectedTeam] = useState(null)

  const fetchTeams = () => {
    client.get('/admin/equipos')
      .then(res => {
        setTeams(res.data.teams || [])
      })
      .catch(err => {
        toastError('Error al cargar la lista de equipos')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchTeams()
  }, [])

  const deleteTeam = async (id) => {
    const result = await confirmDelete('¿Eliminar equipo?', 'Se eliminarán todos los jugadores y datos del equipo.')
    if (result.isConfirmed) {
      client.delete(`/admin/equipos/${id}`)
        .then(() => {
          toastSuccess('Equipo eliminado con éxito')
          fetchTeams()
          if (selectedTeam?.id === id) {
            setSelectedTeam(null)
          }
        })
        .catch(() => {
          toastError('Error al eliminar el equipo')
        })
    }
  }

  const deletePlayer = async (team, playerId) => {
    const result = await confirmDelete('¿Eliminar jugador?')
    if (result.isConfirmed) {
      client.delete(`/admin/equipos/${team.id}/jugadores/${playerId}`)
        .then(() => {
          toastSuccess('Jugador eliminado con éxito')
          fetchTeams()
        })
        .catch(() => {
          toastError('Error al eliminar el jugador')
        })
    }
  }

  const activeTeam = selectedTeam ? teams.find(t => t.id === selectedTeam.id) : null

  const handleModalSuccess = () => {
    setModal(null)
    fetchTeams()
  }

  if (loading) {
    return (
      <AdminLayout title="Equipos">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
          <span className="ml-3 text-gray-400 font-bold text-sm">Cargando equipos...</span>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Equipos">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <span className="inline-flex items-center bg-orange-500/10 border border-orange-500/20 text-[10px] font-black text-orange-500 px-3 py-1 rounded-full uppercase tracking-wider">
              <Sparkles className="w-3 h-3 mr-1" /> Gestión de Equipos
            </span>
            <h1 className="text-xl font-black text-white mt-1">Equipos y Jugadores</h1>
          </div>
          <button onClick={() => setModal({ type: 'team' })}
            className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 text-black text-xs font-bold rounded-2xl">
            <Plus className="w-4 h-4" />
            <span>Nuevo Equipo</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Team list */}
          <div className="space-y-3">
            {teams.length === 0 ? (
              <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-2xl p-6 text-center text-gray-500 text-xs font-bold">
                No hay equipos registrados.
              </div>
            ) : (
              teams.map(team => (
                <div key={team.id}
                  className={`bg-[#0d0d0d] border rounded-2xl p-4 cursor-pointer transition-all ${selectedTeam?.id === team.id ? 'border-orange-500/50' : 'border-[#1a1a1a] hover:border-[#333]'}`}
                  onClick={() => setSelectedTeam(team)}>
                  <div className="flex items-center space-x-3">
                    <TeamLogo team={team} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{team.name}</p>
                      <p className="text-[10px] text-gray-500 capitalize">{team.gender} · {team.players?.length ?? 0} jugadores</p>
                    </div>
                    <div className="flex space-x-1" onClick={e => e.stopPropagation()}>
                      <button onClick={() => setModal({ type: 'team', team })}
                        className="p-2 text-gray-500 hover:text-white rounded-lg hover:bg-[#222]">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => deleteTeam(team.id)}
                        className="p-2 text-gray-500 hover:text-red-400 rounded-lg hover:bg-red-950/20">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <ChevronRight className="w-4 h-4 text-gray-600 self-center" />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Players panel */}
          {activeTeam && (
            <div className="lg:col-span-2 bg-[#0d0d0d] border border-[#1a1a1a] rounded-3xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <TeamLogo team={activeTeam} />
                  <div>
                    <h3 className="text-sm font-black text-white">{activeTeam.name}</h3>
                    <p className="text-[10px] text-gray-500">{activeTeam.players?.length} jugadores</p>
                  </div>
                </div>
                <button onClick={() => setModal({ type: 'player', team: activeTeam })}
                  className="flex items-center space-x-1 px-3 py-2 bg-[#1a1a1a] hover:bg-[#222] border border-[#222] text-white text-xs font-bold rounded-xl">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Jugador</span>
                </button>
              </div>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {activeTeam.players?.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-4">No hay jugadores registrados en este equipo.</p>
                ) : (
                  activeTeam.players?.map(player => (
                    <div key={player.id} className="flex items-center justify-between bg-[#121212] border border-[#1a1a1a] rounded-xl p-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-[#1a1a1a] rounded-lg flex items-center justify-center">
                          <Shirt className="w-4 h-4 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">#{player.number} {player.name}</p>
                          <p className="text-[10px] text-gray-500">{player.position} · {player.status}</p>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <button onClick={() => setModal({ type: 'player', team: activeTeam, player })}
                          className="p-1.5 text-gray-500 hover:text-white rounded-lg hover:bg-[#222]">
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button onClick={() => deletePlayer(activeTeam, player.id)}
                          className="p-1.5 text-gray-500 hover:text-red-400 rounded-lg hover:bg-red-950/20">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {modal?.type === 'team' && (
        <TeamModal team={modal.team} onClose={() => setModal(null)} onSuccess={handleModalSuccess} />
      )}
      {modal?.type === 'player' && (
        <PlayerModal team={modal.team} player={modal.player} onClose={() => setModal(null)} onSuccess={handleModalSuccess} />
      )}
    </AdminLayout>
  )
}

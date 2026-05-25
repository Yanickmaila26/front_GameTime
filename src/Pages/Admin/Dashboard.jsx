import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AdminLayout from '../../Components/AdminLayout'
import DirectivaDashboard from './DirectivaDashboard'
import client from '../../api/client'
import { Users, UserCheck, Trophy, Swords, Sparkles, ShieldCheck, Loader2 } from 'lucide-react'

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const userString = localStorage.getItem('user')
  let user = null
  if (userString) {
    try {
      user = JSON.parse(userString)
    } catch (e) {
      console.error("Invalid user JSON in Dashboard", e)
      localStorage.removeItem('user')
      localStorage.removeItem('auth_token')
    }
  }

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    client.get('/admin/dashboard')
      .then(res => {
        setData(res.data)
        setLoading(false)
      })
      .catch(err => {
        console.error("Error loading dashboard data:", err)
        setError("Error al cargar la información del panel.")
        setLoading(false)
      })
  }, [navigate])

  if (loading) {
    return (
      <AdminLayout title="Dashboard">
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-orange-500 animate-spin mb-2" />
          <p className="text-xs text-gray-500 font-bold uppercase tracking-widest animate-pulse">Cargando panel...</p>
        </div>
      </AdminLayout>
    )
  }

  if (error) {
    return (
      <AdminLayout title="Dashboard">
        <div className="bg-red-950/40 border border-red-500/30 rounded-2xl p-6 text-center max-w-sm mx-auto my-10">
          <span className="text-2xl mb-2 block">⚠️</span>
          <p className="text-xs font-bold text-red-400 uppercase tracking-wide">{error}</p>
          <div className="glow-btn-orange rounded-full p-0.5 hover:scale-105 transition duration-300 active:scale-100 mt-4 mx-auto w-fit">
            <button 
              onClick={() => window.location.reload()} 
              className="px-6 py-2 bg-gray-800 text-white font-extrabold text-xs rounded-full transition-all"
            >
              Reintentar
            </button>
          </div>
        </div>
      </AdminLayout>
    )
  }

  // Delegate dashboard to Directiva Dashboard if role is directiva
  if (data.role === 'directiva') {
    return <DirectivaDashboard championship={data.championship} />
  }

  const stats = data.stats || { teams: 0, championships: 0, liveMatches: 0, players: 0 }

  const statCards = [
    { name: 'Equipos Registrados', value: stats.teams, icon: Users, color: 'from-blue-500 to-indigo-600' },
    { name: 'Campeonatos', value: stats.championships, icon: Trophy, color: 'from-amber-500 to-orange-600' },
    { name: 'Partidos en Vivo', value: stats.liveMatches, icon: Swords, color: 'from-rose-500 to-pink-600' },
    { name: 'Jugadores', value: stats.players, icon: UserCheck, color: 'from-emerald-500 to-teal-600' },
  ]

  return (
    <AdminLayout title="Dashboard">
      <div className="space-y-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#121212] to-[#0a0a0a] border border-[#1e1e1e] p-6 md:p-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#F57C00] opacity-5 blur-[80px] rounded-full" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#1976D2] opacity-5 blur-[80px] rounded-full" />
          <div className="relative z-10 space-y-4">
            <span className="inline-flex items-center bg-orange-500/10 border border-orange-500/20 text-[10px] font-black text-[#F57C00] px-3 py-1 rounded-full uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 mr-1" /> Panel de Control Directivo
            </span>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              ¡Hola, {user?.name || 'Administrador'}!
            </h1>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center space-x-2 bg-[#121212] border border-[#222] rounded-2xl px-4 py-2 text-xs font-bold text-gray-300">
                <ShieldCheck className="w-4 h-4 text-orange-500" />
                <span>Rol: {user?.role === 'admin' ? 'Administrador Principal' : 'Miembro Directiva'}</span>
              </div>
              {stats.liveMatches > 0 && (
                <div className="flex items-center space-x-2 bg-red-950/20 border border-red-500/30 rounded-2xl px-4 py-2 text-xs font-bold text-red-400">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                  </span>
                  <span>{stats.liveMatches} Partidos en vivo</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((card, i) => {
            const Icon = card.icon
            return (
              <div key={i} className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-3xl p-6 flex items-center justify-between hover:border-orange-500/30 transition-all duration-300 group">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{card.name}</p>
                  <p className="text-3xl font-black text-white tracking-tight">{card.value}</p>
                </div>
                <div className={`w-12 h-12 bg-gradient-to-tr ${card.color} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-5 h-5 text-black" />
                </div>
              </div>
            )
          })}
        </div>

        <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-3xl p-6 space-y-4">
          <h2 className="text-sm font-black text-gray-500 uppercase tracking-widest">Acciones Rápidas</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link to="/admin/equipos" className="p-4 bg-[#121212] hover:bg-[#161616] border border-[#222] rounded-2xl flex flex-col items-center space-y-2 group transition-all">
              <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center group-hover:bg-orange-500/20">
                <Users className="w-5 h-5 text-[#F57C00]" />
              </div>
              <span className="text-xs font-bold text-white">Gestionar Equipos</span>
            </Link>
            <Link to="/admin/campeonatos" className="p-4 bg-[#121212] hover:bg-[#161616] border border-[#222] rounded-2xl flex flex-col items-center space-y-2 group transition-all">
              <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center group-hover:bg-orange-500/20">
                <Trophy className="w-5 h-5 text-[#F57C00]" />
              </div>
              <span className="text-xs font-bold text-white">Campeonatos</span>
            </Link>
            <Link to="/admin/partidos" className="p-4 bg-[#121212] hover:bg-[#161616] border border-[#222] rounded-2xl flex flex-col items-center space-y-2 group transition-all">
              <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center group-hover:bg-orange-500/20">
                <Swords className="w-5 h-5 text-[#F57C00]" />
              </div>
              <span className="text-xs font-bold text-white">Marcador en Vivo</span>
            </Link>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

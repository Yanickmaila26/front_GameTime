import React, { useState, useEffect, useRef, useMemo } from 'react'
import { Link } from 'react-router-dom'
import ThreeBasketball from '../../Components/ThreeBasketball'
import Lightning from '../../Components/Lightning'
import BottomNav from '../../Components/BottomNav'
import LiveGameCard from '../../Components/LiveGameCard'
import GameSheetModal from '../../Components/GameSheetModal'
import StandingsTab from '../../Components/StandingsTab'
import LeadersTab from '../../Components/LeadersTab'
import MyTeamTab from '../../Components/MyTeamTab'
import Sponsors from '../../Components/Sponsors'
import client, { getAssetUrl } from '../../api/client'
import { 
  Sparkles, Calendar, MapPin, Lock, ArrowRight, Trophy, 
  Instagram, Facebook, Youtube, Bell, User, Loader2
} from 'lucide-react'

// Dynamic leaders mock data mapping
const mockLeaders = {
  scorers: [
    { id: 1, name: 'Juan Pérez', team: 'Los Halcones', ppg: 24.5, matches: 5, avatar: 'JP', position: 'Alero' },
    { id: 2, name: 'Carlos Mendoza', team: 'Spartans Latacunga', ppg: 21.2, matches: 5, avatar: 'CM', position: 'Base' },
    { id: 3, name: 'M. Gómez', team: 'Avanzaré', ppg: 19.8, matches: 5, avatar: 'MG', position: 'Escolta' }
  ],
  threepointers: [
    { id: 1, name: 'M. Gómez', team: 'Avanzaré', tpg: 4.2, total: 21, avatar: 'MG', position: 'Escolta' },
    { id: 2, name: 'Roberto Díaz', team: 'Huracanes de Latacunga', tpg: 3.6, total: 18, avatar: 'RD', position: 'Base' },
    { id: 3, name: 'Juan Pérez', team: 'Los Halcones', tpg: 3.0, total: 15, avatar: 'JP', position: 'Alero' }
  ],
  rebounders: [
    { id: 1, name: 'Santiago Castro', team: 'Huracanes de Latacunga', rpg: 11.3, total: 56, avatar: 'SC', position: 'Pívot' },
    { id: 2, name: 'Esteban Ortiz', team: 'Bulls Latacunga', rpg: 9.8, total: 49, avatar: 'EO', position: 'Pívot' },
    { id: 3, name: 'D. Andrade', team: 'Club 24 de Mayo', rpg: 9.2, total: 46, avatar: 'DA', position: 'Ala-Pívot' }
  ]
};

function TeamLogo({ team, className = "w-10 h-10", showText = true }) {
  if (!team) return null
  if (team.logo_url) {
    return <img src={getAssetUrl(team.logo_url)} alt={team.name} className={`${className} rounded-xl object-cover flex-shrink-0`} />
  }
  const isHex = team.logo_color?.startsWith('#')
  return (
    <div 
      style={isHex ? { backgroundColor: team.logo_color } : {}}
      className={`${className} ${!isHex ? `bg-gradient-to-br ${team.logo_color || 'from-orange-500 to-amber-600'}` : ''} rounded-xl flex items-center justify-center font-black text-black text-xs flex-shrink-0`}
    >
      {showText ? team.short_name : ''}
    </div>
  )
}

export default function Home() {
  const [data, setData] = useState({
    championship: null,
    liveMatches: [],
    recentMatches: [],
    teams: [],
    leaders: null,
    generalMedia: []
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [activeTab, setActiveTab] = useState('inicio')
  const [statsTab, setStatsTab] = useState('clasificacion')
  const [stopScroll, setStopScroll] = useState(false)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [sheetMatch, setSheetMatch] = useState(null)

  // Lightbox visualizer state
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxImg, setLightboxImg] = useState('')
  const [lightboxTitle, setLightboxTitle] = useState('')

  // Load auth context from localStorage
  const userString = localStorage.getItem('user')
  let parsedUser = null
  if (userString) {
    try {
      parsedUser = JSON.parse(userString)
    } catch (e) {
      console.warn("Invalid user object in localStorage", e)
      localStorage.removeItem('user')
    }
  }
  const auth = {
    user: parsedUser
  }

  useEffect(() => {
    client.get('/home')
      .then(res => {
        setData({
          championship: res.data.championship || null,
          liveMatches: Array.isArray(res.data.liveMatches) ? res.data.liveMatches : [],
          recentMatches: Array.isArray(res.data.recentMatches) ? res.data.recentMatches : [],
          teams: Array.isArray(res.data.teams) ? res.data.teams : [],
          leaders: res.data.leaders || null,
          generalMedia: Array.isArray(res.data.generalMedia) ? res.data.generalMedia : []
        })
        setLoading(false)
      })
      .catch(err => {
        console.error("Error loading home page data:", err)
        setError("Error al cargar la información. Por favor, intente de nuevo más tarde.")
        setLoading(false)
      })
  }, [])

  const { championship, liveMatches, teams, leaders, generalMedia } = data

  const handleOpenLightbox = (imgUrl, titleText = '') => {
    setLightboxImg(imgUrl)
    setLightboxTitle(titleText)
    setLightboxOpen(true)
  }

  const standingsTeams = useMemo(() => {
    return (championship?.teams || []).map(team => ({
      ...team,
      pj: team.pivot?.pj ?? 0,
      pg: team.pivot?.pg ?? 0,
      pp: team.pivot?.pp ?? 0,
      pts: team.pivot?.pts ?? 0,
      dif: team.pivot?.dif ?? 0,
      logoColor: team.logo_color || 'from-orange-500 to-amber-600',
    }))
  }, [championship])

  const inicioRef = useRef(null)
  const marcadoresRef = useRef(null)
  const equiposRef = useRef(null)
  const tablasRef = useRef(null)
  const miequipoRef = useRef(null)
  const adminRef = useRef(null)

  // Smooth scroll handler
  const scrollToSection = (id) => {
    const refs = {
      inicio: inicioRef,
      marcadores: marcadoresRef,
      equipos: equiposRef,
      tablas: tablasRef,
      miequipo: miequipoRef,
      admin: adminRef
    }
    const targetRef = refs[id]
    if (targetRef && targetRef.current) {
      targetRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setActiveTab(id)
    }
  }

  // Intersection Observer to highlight active section on scroll
  useEffect(() => {
    if (loading || error) return

    const sections = [
      { id: 'inicio', ref: inicioRef },
      { id: 'marcadores', ref: marcadoresRef },
      { id: 'equipos', ref: equiposRef },
      { id: 'tablas', ref: tablasRef },
      { id: 'miequipo', ref: miequipoRef },
      { id: 'admin', ref: adminRef }
    ]

    const observerOptions = {
      root: null,
      rootMargin: '-30% 0px -40% 0px',
      threshold: 0.1
    }

    const observerCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveTab(entry.target.id)
        }
      })
    }

    const observer = new IntersectionObserver(observerCallback, observerOptions)
    sections.forEach((sec) => {
      if (sec.ref.current) observer.observe(sec.ref.current)
    })

    return () => {
      sections.forEach((sec) => {
        if (sec.ref.current) observer.unobserve(sec.ref.current)
      })
    }
  }, [loading, error])

  // Filter dynamic matches by selected round
  const allMatches = useMemo(() => (championship?.matches || []).filter(m => m), [championship])
  const rounds = useMemo(() => {
    const roundList = allMatches.map(m => m.round).filter(r => r !== undefined && r !== null)
    return [...new Set(roundList)].sort((a, b) => a - b)
  }, [allMatches])
  
  const currentOrLastRound = useMemo(() => {
    if (rounds.length === 0) return 1;
    // Find the latest round with live or scheduled matches, or just the last round
    const pendingRound = allMatches.find(m => m && (m.status === 'live' || m.status === 'scheduled'))?.round;
    return pendingRound || rounds[rounds.length - 1];
  }, [rounds, allMatches])

  const [selectedRound, setSelectedRound] = useState(1)

  useEffect(() => {
    if (currentOrLastRound) {
      setSelectedRound(currentOrLastRound)
    }
  }, [currentOrLastRound])

  const filteredMatches = useMemo(() => {
    return allMatches.filter(m => m && m.round === selectedRound)
  }, [allMatches, selectedRound])

  const liveCount = liveMatches.length
  const featuredLiveMatch = liveMatches[0] || null

  // Mapper to transform database match structure to LiveGameCard expected fields
  const mapMatchForCard = (m) => {
    if (!m) return null;
    return {
      id: m.id,
      quarter: m.status === 'live' ? `Q${m.current_quarter}` : m.status === 'finished' ? 'Finalizado' : 'Programado',
      timeLeft: m.status === 'live' ? 'En Juego' : '00:00',
      homeScore: m.home_score,
      awayScore: m.away_score,
      homeFouls: m.home_fouls_q,
      awayFouls: m.away_fouls_q,
      referee: m.referee?.name || 'Mesa Oficial',
      events: (m.events || []).filter(e => e).map(e => ({
        id: e.id,
        time: `Q${e.quarter}`,
        player: e.player ? e.player.name : (e.team_id === m.home_team_id ? m.home_team?.name : m.away_team?.name),
        description: e.description,
        score: e.home_score_snapshot !== null && e.home_score_snapshot !== undefined ? `${e.home_score_snapshot} - ${e.away_score_snapshot}` : null,
        team: e.team_id === m.home_team_id ? 'home' : 'away',
      })),
      players: m.players || []
    };
  }

  const handleOpenSheet = (matchObj) => {
    setSheetMatch(matchObj)
    setIsSheetOpen(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070707] text-gray-100 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center justify-center space-y-8 select-none">
          <div className="relative flex items-center justify-center h-20 w-20">
            <div className="ball">
              <div className="inner">
                <div className="line"></div>
                <div className="line line--two"></div>
                <div className="oval"></div>
                <div className="oval oval--two"></div>
              </div>
            </div>
            <div className="shadow-ball"></div>
          </div>
          <div className="text-center space-y-2 mt-4">
            <h1 className="text-3xl md:text-4xl font-black tracking-widest text-white uppercase">
              GAME<span className="text-[#F57C00]">TIME</span>
            </h1>
            <p className="text-[10px] text-[#FFB74D] font-bold uppercase tracking-widest leading-none animate-pulse">
              Cargando...
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#070707] text-gray-100 flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 bg-gradient-to-tr from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-[0_8px_20px_rgba(245,124,0,0.3)] border border-orange-400 mb-4">
          <span className="text-white font-black text-2xl tracking-tighter">GT</span>
        </div>
        <div className="bg-red-950/40 border border-red-500/30 rounded-2xl p-6 text-center max-w-sm">
          <span className="text-2xl mb-2 block">⚠️</span>
          <p className="text-xs font-bold text-red-400 uppercase tracking-wide">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-600 text-black font-extrabold text-xs rounded-xl shadow-md hover:from-orange-600 hover:to-amber-700 transition-all"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-darkbg text-gray-100 overflow-x-hidden">
      
      {/* 3D WebGL rotating basketball */}
      <ThreeBasketball />

      {/* Dynamic Electric Lightning WebGL Background */}
      <div className="fixed inset-0 w-full h-full z-0 pointer-events-none opacity-30">
        <Lightning
          hue={219}
          xOffset={0}
          speed={0.4}
          intensity={2.2}
          size={1}
        />
      </div>

      {/* Floating Neon Sunset Glow Background elements */}
      <div className="fixed top-0 right-0 w-[45vw] h-[60vh] bg-gradient-to-br from-basketball-dark/20 to-transparent opacity-15 blur-3xl pointer-events-none z-0" />
      <div className="fixed top-[85vh] left-0 w-[35vw] h-[55vh] bg-gradient-to-tr from-electric-dark/15 to-transparent opacity-10 blur-3xl pointer-events-none z-0" />

      {/* Main content wrapper */}
      <div className="relative z-10 w-full min-h-screen flex flex-col">

        {/* 1. Desktop Header Navigation */}
        <header className="hidden md:flex fixed top-0 left-0 right-0 z-50 bg-darkbg/85 backdrop-blur-xl border-b border-gray-900/60 px-8 py-4 justify-between items-center transition-all duration-300">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => scrollToSection('inicio')}>
            <img src="/logo_game_time.png" alt="GameTime Logo" className="w-10 h-10 object-contain" />
            <div>
              <span className="font-extrabold text-xl tracking-wider text-white">
                GAME<span className="text-basketball">TIME</span>
              </span>
              <span className="block text-[8px] text-[#FFB74D] font-bold uppercase tracking-widest leading-none">
                Latacunga / Torneo 2026
              </span>
            </div>
          </div>

          <nav className="flex space-x-1.5">
            {[
              { id: 'inicio', label: 'Inicio' },
              { id: 'marcadores', label: 'Torneo' },
              { id: 'equipos', label: 'Equipos' },
              { id: 'tablas', label: 'Tablas' },
              { id: 'miequipo', label: 'Mi Club' }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === item.id
                    ? 'bg-basketball text-black font-extrabold shadow-[0_0_15px_rgba(245,124,0,0.3)]'
                    : 'text-gray-400 hover:text-white hover:bg-gray-900/40'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center space-x-4">
            {liveCount > 0 && (
              <div className="flex items-center space-x-1.5 bg-[#f57c00]/10 border border-[#f57c00]/30 px-3 py-1 rounded-full animate-pulse-slow">
                <span className="w-2.5 h-2.5 rounded-full bg-basketball shadow-[0_0_8px_#f57c00]" />
                <span className="text-[10px] font-bold text-basketball tracking-wider uppercase">
                  {liveCount} En Vivo
                </span>
              </div>
            )}
            
            <div className="glow-btn-orange rounded-full p-0.5 hover:scale-105 transition duration-300 active:scale-100">
              <Link
                to={auth.user ? "/admin" : "/login"}
                className="flex items-center space-x-1.5 px-4 py-2 bg-gray-800 rounded-full text-xs font-bold text-white transition-all"
              >
                <Lock className="w-3.5 h-3.5 text-[#F57C00]" />
                <span>{auth.user ? "Panel Admin" : "Iniciar Sesión"}</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Mobile Header */}
        <header className="md:hidden sticky top-0 z-40 w-full bg-darkbg bg-opacity-80 backdrop-blur-md border-b border-[#121212] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <img src="/logo_game_time.png" alt="GameTime Logo" className="w-8 h-8 object-contain" />
            <div>
              <span className="font-extrabold text-base tracking-wider text-white">
                GAME<span className="text-basketball">TIME</span>
              </span>
              <span className="block text-[8px] text-gray-500 font-bold uppercase tracking-widest leading-none">
                Latacunga 2026
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {liveCount > 0 && (
              <div className="flex items-center space-x-1 bg-[#f57c00]/10 border border-[#f57c00]/30 px-2 py-0.5 rounded-full animate-pulse-slow">
                <span className="w-1.5 h-1.5 rounded-full bg-basketball shadow-[0_0_6px_#f57c00]" />
                <span className="text-[9px] font-bold text-basketball uppercase">
                  {liveCount} En Vivo
                </span>
              </div>
            )}
            <div className="glow-btn-orange rounded-full p-0.5 hover:scale-105 transition duration-300 active:scale-100">
              <Link
                to={auth.user ? "/admin" : "/login"}
                className="flex items-center justify-center w-8 h-8 bg-gray-800 rounded-full text-xs font-bold text-white transition-all"
              >
                <User className="w-4 h-4 text-[#F57C00]" />
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content Sections */}
        <main className="w-full min-h-screen flex flex-col md:pt-20">

          {/* SECTION 1: INICIO (HERO) */}
          <section 
            id="inicio" 
            ref={inicioRef}
            className="min-h-[calc(100vh-80px)] w-full flex flex-col justify-center items-center px-6 py-12 md:py-24 relative overflow-hidden"
          >
            {/* Mountain / Volcano SVG Backdrop */}
            <div className="absolute bottom-0 left-0 right-0 h-[45vh] pointer-events-none -z-10 select-none">
              <svg viewBox="0 0 1440 320" className="absolute bottom-0 w-full h-full text-[#030612]/75 fill-currentColor" preserveAspectRatio="none">
                <path d="M0,320 L150,220 L320,290 L500,160 L680,270 L850,140 L1050,260 L1200,210 L1440,320 Z" />
                <path d="M220,320 L220,180 L235,180 L235,130 L242,130 L242,100 L245,100 L245,80 L248,100 L251,100 L251,130 L258,130 L258,180 L273,180 L273,320 Z" opacity="0.8" />
                <path d="M800,320 L800,150 L812,150 L812,110 L818,110 L818,80 L822,50 L826,80 L826,110 L832,110 L832,150 L844,150 L844,320 Z" opacity="0.5" />
              </svg>

              {/* Glowing Hoop Background Silhouette */}
              <svg viewBox="0 0 100 100" className="absolute right-4 md:right-32 bottom-20 w-44 h-44 text-orange-500/20 opacity-30 animate-pulse-slow">
                <circle cx="50" cy="30" r="18" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <line x1="50" y1="48" x2="50" y2="90" stroke="currentColor" strokeWidth="2.5" />
                <rect x="32" y="10" width="36" height="24" fill="none" stroke="currentColor" strokeWidth="2" />
                <circle cx="50" cy="22" r="5" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <path d="M42,30 Q50,45 58,30" fill="none" stroke="currentColor" strokeWidth="1" />
              </svg>
            </div>

            <div className="max-w-7xl w-full grid grid-cols-1 md:grid-cols-12 gap-8 items-center z-10">
              <div className="md:col-span-7 flex flex-col items-center md:items-start text-center md:text-left space-y-6">
                
                <div className="inline-flex items-center space-x-1 bg-orange-500/10 border border-orange-500/20 text-[10px] font-extrabold text-[#f57c00] px-3.5 py-1 rounded-full uppercase tracking-widest">
                  <Sparkles className="w-3.5 h-3.5 mr-1" /> Oficial PWA 2026
                </div>

                <div className="space-y-2">
                  <span className="block text-xs md:text-sm font-extrabold text-[#FFB74D] uppercase tracking-widest">
                    Torneo de Invierno Latacunga
                  </span>
                  <h1 className="text-4xl md:text-7xl font-extrabold text-white tracking-tighter leading-none">
                    PASIÓN, EQUIPO <br />
                    Y <span className="text-transparent bg-clip-text bg-gradient-to-r from-basketball to-amber-500">VICTORIA</span>
                  </h1>
                </div>

                <p className="text-xs md:text-sm text-gray-400 max-w-lg leading-relaxed font-medium">
                  Sigue el Campeonato Latacunga 2026 en tiempo real. Marcadores oficiales, actas en vivo de la mesa técnica y estadísticas individuales detalladas. El mejor baloncesto de la provincia se vive aquí.
                </p>

                <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
                  <div className="glow-btn-orange rounded-full p-0.5 hover:scale-105 transition duration-300 active:scale-100 w-full sm:w-auto">
                    <button 
                      onClick={() => scrollToSection('marcadores')}
                      className="w-full sm:w-auto px-8 py-3 bg-gray-800 text-white font-extrabold text-xs rounded-full transition-all flex items-center justify-center space-x-2"
                    >
                      <Calendar className="w-4 h-4 stroke-[2.5] text-[#F57C00]" />
                      <span>VER CALENDARIO</span>
                    </button>
                  </div>
                  <div className="glow-btn-gray rounded-full p-0.5 hover:scale-105 transition duration-300 active:scale-100 w-full sm:w-auto">
                    <button
                      onClick={() => scrollToSection('equipos')}
                      className="w-full sm:w-auto px-8 py-3 bg-gray-800 text-white font-extrabold text-xs rounded-full transition-all flex items-center justify-center space-x-2"
                    >
                      <span>CONOCE MÁS</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Info Badges Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 w-full border-t border-gray-900/40">
                  {[
                    { title: 'Competencia', desc: 'Niveles élite y amateur', val: '★ ÉLITE' },
                    { title: 'Equipos', desc: 'Registrados en el sistema', val: `${teams.length} CLUBES` },
                    { title: 'Fechas', desc: 'Calendario Oficial', val: 'JORNADAS 1-12' },
                    { title: 'Sede', desc: 'Latacunga, Cotopaxi', val: 'COLISEO LATACUNGA' }
                  ].map((badge, idx) => (
                    <div key={idx} className="flex flex-col p-3 bg-gray-900/25 border border-gray-900/50 rounded-2xl text-left backdrop-blur-md">
                      <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">{badge.title}</span>
                      <span className="text-[10px] font-black text-white mt-0.5">{badge.val}</span>
                      <span className="text-[8px] text-gray-400 leading-none mt-0.5">{badge.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right column placeholder on desktop for 3D ball */}
              <div className="hidden md:block md:col-span-5 h-[500px]" />
            </div>
          </section>

          {/* SECTION 2: TORNEO & PARTIDOS */}
          <section 
            id="marcadores" 
            ref={marcadoresRef}
            className="min-h-screen w-full flex flex-col justify-center py-16 px-6 relative"
          >
            <div className="max-w-3xl w-full mx-auto space-y-6 z-10">
              <div className="text-center">
                <span className="text-[10px] uppercase font-bold text-[#FFB74D] tracking-widest">
                  Live Game Center
                </span>
                <h2 className="text-2xl md:text-4xl font-extrabold text-white">
                  PARTIDOS EN VIVO Y CALENDARIO
                </h2>
                <div className="w-16 h-1 bg-basketball mx-auto mt-2 rounded-full" />
              </div>

              {/* Featured Live Match Card */}
              {featuredLiveMatch && (
                <div className="space-y-3">
                  <span className="text-[9px] text-[#f57c00] font-black uppercase tracking-widest flex items-center px-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse mr-1.5" /> Partido Destacado
                  </span>
                  
                  <LiveGameCard
                    match={mapMatchForCard(featuredLiveMatch)}
                    homeTeamData={featuredLiveMatch.home_team}
                    awayTeamData={featuredLiveMatch.away_team}
                    onOpenSheet={() => handleOpenSheet(featuredLiveMatch)}
                  />
                </div>
              )}

              {/* Rounds Filter list */}
              <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between border-b border-gray-900 pb-2">
                  <span className="text-[10px] uppercase font-bold text-gray-500 tracking-widest px-1">
                    Selecciona la Jornada
                  </span>
                  
                  <div className="flex space-x-1.5 overflow-x-auto scrollbar-hide">
                     {rounds.map((round) => {
                       const isActive = selectedRound === round;
                       return (
                         <div 
                           key={round}
                           className={`${isActive ? 'glow-btn-orange' : 'glow-btn-gray'} rounded-full p-0.5 hover:scale-105 transition duration-300 active:scale-100 flex-shrink-0`}
                         >
                           <button
                             onClick={() => setSelectedRound(round)}
                             className="px-3.5 py-1.5 bg-gray-800 text-[10px] font-extrabold text-white rounded-full transition-all"
                           >
                             Jor. {round} {round === currentOrLastRound && ' (Act.)'}
                           </button>
                         </div>
                       );
                     })}
                  </div>
                </div>

                {/* Match Lists Grid */}
                <div className="grid grid-cols-1 gap-3">
                  {filteredMatches.length === 0 ? (
                    <div className="text-center py-10 bg-gray-950/40 border border-gray-900 rounded-2xl text-xs text-gray-500 font-bold">
                      No hay partidos programados en esta jornada.
                    </div>
                  ) : (
                    filteredMatches.map((m) => {
                      const isLive = m.status === 'live'
                      return (
                        <div
                          key={m.id}
                          onClick={() => {
                            if (isLive || m.status === 'finished') {
                              handleOpenSheet(m)
                            }
                          }}
                          className={`bg-gray-950/50 border rounded-2xl p-4 flex flex-col justify-between transition-all duration-300 backdrop-blur-md ${
                            isLive
                              ? 'border-basketball/30 hover:border-orange-500 cursor-pointer shadow-[0_0_12px_rgba(245,124,0,0.05)]'
                              : m.status === 'finished'
                              ? 'border-gray-900 hover:border-gray-700 cursor-pointer'
                              : 'border-gray-900'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-1.5">
                              {isLive ? (
                                <>
                                  <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                                  <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">
                                    EN VIVO - Q{m.current_quarter}
                                  </span>
                                </>
                              ) : m.status === 'finished' ? (
                                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                                  FINALIZADO
                                </span>
                              ) : (
                                <span className="text-[9px] font-bold text-[#1976D2] uppercase tracking-widest bg-blue-500/10 px-1.5 py-0.2 rounded border border-blue-500/25">
                                  PROGRAMADO
                                </span>
                              )}
                            </div>
                            <span className="text-[9px] text-gray-500 font-mono">
                              {m.scheduled_at ? new Date(m.scheduled_at).toLocaleDateString('es-EC', { day: '2-digit', month: 'short' }) : 'Por definir'}
                            </span>
                          </div>

                          <div className="grid grid-cols-5 items-center py-1">
                            <div className="col-span-2 flex items-center space-x-2">
                              <TeamLogo team={m.home_team} className="w-7 h-7" showText={true} />
                              <span className="text-xs font-black text-white truncate">{m.home_team?.name}</span>
                            </div>

                            <div className="col-span-1 flex items-center justify-center text-center">
                              {m.status === 'scheduled' ? (
                                <span className="text-[10px] font-extrabold text-gray-500 uppercase">VS</span>
                              ) : (
                                <div className="flex items-center space-x-1">
                                  <span className={`text-sm font-black ${m.home_score >= m.away_score ? 'text-white' : 'text-gray-500'}`}>
                                    {m.home_score}
                                  </span>
                                  <span className="text-xs text-gray-600 font-bold">-</span>
                                  <span className={`text-sm font-black ${m.away_score >= m.home_score ? 'text-white' : 'text-gray-500'}`}>
                                    {m.away_score}
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="col-span-2 flex items-center justify-end space-x-2">
                              <span className="text-xs font-black text-white truncate text-right">{m.away_team?.name}</span>
                              <TeamLogo team={m.away_team} className="w-7 h-7" showText={true} />
                            </div>
                          </div>

                          <div className="mt-2.5 pt-2 border-t border-gray-900/60 flex items-center justify-between text-[9px] text-gray-500 font-bold">
                            <span className="flex items-center">
                              <MapPin className="w-3 h-3 mr-1" /> {m.court || 'Coliseo Latacunga'}
                            </span>
                            <span>Árbitro: {m.referee?.name || 'Mesa Oficial'}</span>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 3: EQUIPOS PARTICIPANTES */}
          <section 
            id="equipos" 
            ref={equiposRef}
            className="py-20 px-6 relative w-full overflow-hidden"
          >
            <div className="max-w-3xl w-full mx-auto text-center z-10 mb-12 space-y-4">
              <span className="text-[10px] uppercase font-bold text-[#FFB74D] tracking-widest">
                Clubes Registrados
              </span>
              <h2 className="text-2xl md:text-5xl font-extrabold text-white tracking-tight">
                EQUIPOS PARTICIPANTES
              </h2>
              <div className="w-16 h-1 bg-basketball mx-auto mt-2 rounded-full" />
              <p className="text-xs md:text-sm text-gray-400 mt-2 max-w-xl mx-auto leading-relaxed">
                Conoce a las escuadras oficiales que compiten en el Torneo de Invierno Latacunga 2026.
              </p>
            </div>

            {/* Slider Marquee */}
            {teams.length > 0 && (
              <div className="relative w-full z-10 mt-8">
                <div 
                  className="overflow-hidden w-full relative max-w-7xl mx-auto" 
                  onMouseEnter={() => setStopScroll(true)} 
                  onMouseLeave={() => setStopScroll(false)}
                >
                  <div className="absolute left-0 top-0 h-full w-28 z-10 pointer-events-none bg-gradient-to-r from-darkbg to-transparent" />
                  <div 
                    className="marquee-inner flex w-fit" 
                    style={{ 
                      animationPlayState: stopScroll ? "paused" : "running", 
                      animationDuration: Math.max(teams.length * 3000, 15000) + "ms" 
                    }}
                  >
                    <div className="flex">
                      {[...teams, ...teams].map((team, index) => (
                        <div key={index} className="w-80 mx-5 h-80 bg-gray-950/40 border border-gray-900/80 rounded-[2.5rem] flex items-center justify-center relative group hover:scale-95 transition-all duration-300 overflow-hidden backdrop-blur-md">
                          <TeamLogo team={team} className="w-48 h-48 rounded-full border border-gray-800/60 p-3 bg-gray-900/80 group-hover:scale-105 transition-transform duration-300" showText={true} />
                          <div className="flex flex-col items-center justify-center px-6 opacity-0 group-hover:opacity-100 transition-all duration-300 absolute inset-0 backdrop-blur-md bg-black/75">
                            <p className="text-white text-lg font-black text-center tracking-widest uppercase leading-snug">{team.name}</p>
                            <span className="text-[10px] text-[#FFB74D] font-bold uppercase tracking-widest mt-2">Club Oficial</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="absolute right-0 top-0 h-full w-28 z-10 pointer-events-none bg-gradient-to-l from-darkbg to-transparent" />
                </div>
              </div>
            )}
          </section>

          {/* SECTION 4: TABLAS Y ESTADÍSTICAS */}
          <section 
            id="tablas" 
            ref={tablasRef}
            className="min-h-screen w-full flex flex-col justify-center py-16 px-6 relative"
          >
            <div className="max-w-5xl w-full mx-auto space-y-6 z-10">
              <div className="text-center">
                <span className="text-[10px] uppercase font-bold text-[#FFB74D] tracking-widest">
                  Estadísticas del Torneo
                </span>
                <h2 className="text-2xl md:text-4xl font-extrabold text-white">
                  TABLA DE CLASIFICACIÓN Y LÍDERES
                </h2>
                <div className="w-16 h-1 bg-basketball mx-auto mt-2 rounded-full" />
              </div>

              {/* Tab selectors */}
              <div className="flex justify-center space-x-4 max-w-sm mx-auto">
                <div className={`${statsTab === 'clasificacion' ? 'glow-btn-orange' : 'glow-btn-gray'} rounded-full p-0.5 hover:scale-105 transition duration-300 active:scale-100 flex-1`}>
                  <button
                    onClick={() => setStatsTab('clasificacion')}
                    className="w-full text-center py-2.5 bg-gray-800 text-white rounded-full text-xs font-extrabold transition-all"
                  >
                    Clasificación
                  </button>
                </div>
                <div className={`${statsTab === 'lideres' ? 'glow-btn-orange' : 'glow-btn-gray'} rounded-full p-0.5 hover:scale-105 transition duration-300 active:scale-100 flex-1`}>
                  <button
                    onClick={() => setStatsTab('lideres')}
                    className="w-full text-center py-2.5 bg-gray-800 text-white rounded-full text-xs font-extrabold transition-all"
                  >
                    Líderes Individuales
                  </button>
                </div>
              </div>

              {/* Rendering Tab Components */}
              <div className="bg-gray-950/30 rounded-3xl border border-gray-900/60 p-5 backdrop-blur-md">
                {statsTab === 'clasificacion' ? (
                  <StandingsTab teams={standingsTeams} />
                ) : (
                  <LeadersTab leaders={leaders || mockLeaders} />
                )}
              </div>
            </div>
          </section>

          {/* SECTION 5: MI EQUIPO */}
          <section 
            id="miequipo" 
            ref={miequipoRef}
            className="min-h-screen w-full flex flex-col justify-center py-16 px-6 relative"
          >
            <div className="max-w-5xl w-full mx-auto space-y-6 z-10">
              <div className="text-center">
                <span className="text-[10px] uppercase font-bold text-[#FFB74D] tracking-widest">
                  Área del Jugador
                </span>
                <h2 className="text-2xl md:text-4xl font-extrabold text-white">
                  MI CLUB & PORTAL INTERNO
                </h2>
                <div className="w-16 h-1 bg-basketball mx-auto mt-2 rounded-full" />
                <p className="text-xs text-gray-400 mt-2 max-w-xl mx-auto leading-relaxed">
                  Revisa entrenamientos, asiste a convocatorias e infórmate de las últimas novedades.
                </p>
              </div>

              <div className="backdrop-blur-md rounded-3xl">
                <MyTeamTab teams={standingsTeams} />
              </div>
            </div>
          </section>

          {/* SECTION: GALERÍA GENERAL DEL TORNEO */}
          <section
            id="galeria"
            className="py-16 px-6 relative w-full"
          >
            <div className="max-w-5xl w-full mx-auto space-y-6 z-10">
              <div className="text-center">
                <span className="text-[10px] uppercase font-bold text-[#FFB74D] tracking-widest">
                  Momentos del Campeonato
                </span>
                <h2 className="text-2xl md:text-4xl font-extrabold text-white uppercase tracking-tight">
                  Galería de Fotos Oficial
                </h2>
                <div className="w-16 h-1 bg-basketball mx-auto mt-2 rounded-full" />
                <p className="text-xs text-gray-400 mt-2 max-w-xl mx-auto leading-relaxed">
                  Revive la emoción del torneo a través de las mejores capturas de la jornada y de las barras organizadoras.
                </p>
              </div>

              {generalMedia.length === 0 ? (
                <div className="text-center py-12 text-xs text-gray-500 font-bold bg-gray-950/20 border border-gray-900/60 backdrop-blur-md rounded-3xl max-w-3xl mx-auto">
                  Aún no se han subido fotos generales para este campeonato. ¡Vuelve pronto!
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
                  {generalMedia.map((m) => (
                    <div
                      key={m.id}
                      onClick={() => handleOpenLightbox(getAssetUrl(m.file_path), m.title)}
                      className="group relative rounded-2xl overflow-hidden border border-gray-900/60 bg-gray-950/20 hover:border-basketball/40 backdrop-blur-md aspect-square cursor-pointer transition-all"
                    >
                      <img
                        src={getAssetUrl(m.file_path)}
                        alt={m.title || 'Torneo'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3.5">
                        <p className="text-[11px] font-black text-white leading-tight truncate">{m.title || 'Galería General'}</p>
                        <span className="text-[8px] text-[#FFB74D] font-bold uppercase tracking-wider block mt-0.5">Ver en Grande</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* SECTION 6: PANEL ADMIN BANNER */}
          <section 
            id="admin" 
            ref={adminRef}
            className="py-20 px-6 relative"
          >
            <div className="max-w-3xl w-full mx-auto text-center z-10">
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-950/80 to-[#030614]/80 border border-gray-900/60 p-8 flex flex-col items-center space-y-4 backdrop-blur-xl">
                <div className="w-14 h-14 bg-orange-500/10 rounded-2xl flex items-center justify-center border border-orange-500/20 text-[#F57C00]">
                  <Lock className="w-7 h-7" />
                </div>
                <h3 className="text-lg md:text-2xl font-black text-white">Panel Administrativo Protegido</h3>
                <p className="text-xs text-gray-400 max-w-sm leading-relaxed">
                  Mesa técnica y árbitros registrados: Autentícate para administrar el ciclo de vida de los partidos en vivo, inscribir equipos y generar actas.
                </p>
                
                {auth.user ? (
                  <Link
                    to="/admin"
                    className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-600 text-black font-extrabold text-xs rounded-xl shadow-md transition-all hover:scale-105"
                  >
                    <span>Ir al Panel de Control</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <Link
                    to="/login"
                    className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-600 text-black font-extrabold text-xs rounded-xl shadow-md transition-all hover:scale-105"
                  >
                    <span>Iniciar Sesión de Mesa</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-900/60 bg-[#02040a]/90 py-10 px-6 text-center space-y-4 z-10 backdrop-blur-md">
          <div className="flex justify-center space-x-6 text-gray-500 pb-2">
            <a href="#" className="hover:text-basketball transition-colors"><Instagram className="w-5 h-5" /></a>
            <a href="#" className="hover:text-basketball transition-colors"><Facebook className="w-5 h-5" /></a>
            <a href="#" className="hover:text-basketball transition-colors"><Youtube className="w-5 h-5" /></a>
          </div>
          <div className="space-y-1">
            <span className="block text-[10px] text-orange-500 font-bold uppercase tracking-widest">GameTime PWA v2.0 - 3D Experience</span>
            <span className="block text-[9px] text-gray-600 font-semibold max-w-md mx-auto leading-relaxed">
              Plataforma oficial desarrollada para la Directiva del Torneo de Invierno Latacunga 2026. Todos los derechos reservados.
            </span>
          </div>
        </footer>

        {/* Mobile Navigation bar */}
        <div className="md:hidden">
          <BottomNav activeTab={activeTab} setActiveTab={scrollToSection} />
        </div>

        {/* Game Sheet Details Modal */}
        {sheetMatch && (
          <GameSheetModal
            isOpen={isSheetOpen}
            onClose={() => setIsSheetOpen(false)}
            match={mapMatchForCard(sheetMatch)}
            homeTeamData={sheetMatch.home_team}
            awayTeamData={sheetMatch.away_team}
          />
        )}

        {/* Lightbox Modal */}
        {lightboxOpen && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md cursor-pointer"
            onClick={() => setLightboxOpen(false)}
          >
            <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
              <button 
                onClick={() => setLightboxOpen(false)}
                className="absolute -top-10 right-0 text-white hover:text-orange-500 font-extrabold text-xs flex items-center space-x-1"
              >
                <span>✕</span> <span>Cerrar</span>
              </button>
              <img 
                src={lightboxImg} 
                alt="Visualización" 
                className="max-w-full max-h-[80vh] rounded-2xl object-contain border border-gray-900 shadow-2xl" 
              />
              {lightboxTitle && (
                <p className="text-white text-xs font-black mt-3 bg-gray-950/80 px-4 py-2 rounded-xl border border-gray-900/60 backdrop-blur-sm">
                  {lightboxTitle}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

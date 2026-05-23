import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, Users, UserCheck, Trophy, Swords, LogOut, Menu, X, ArrowLeft, User, Image } from 'lucide-react'
import { toastSuccess, toastError } from '../lib/swal'
import client from '../api/client'

const allMenuItems = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard, roles: ['admin', 'directiva'] },
  { name: 'Equipos', href: '/admin/equipos', icon: Users, roles: ['admin', 'directiva'] },
  { name: 'Árbitros', href: '/admin/arbitros', icon: UserCheck, roles: ['admin'] },
  { name: 'Campeonatos', href: '/admin/campeonatos', icon: Trophy, roles: ['admin'] },
  { name: 'Partidos', href: '/admin/partidos', icon: Swords, roles: ['admin', 'directiva'] },
  { name: 'Multimedia', href: '/admin/multimedia', icon: Image, roles: ['admin', 'directiva'] },
]

function NavLink({ item, onClick }) {
  const location = useLocation()
  const pageUrl = location.pathname
  const active = pageUrl === item.href || pageUrl.startsWith(item.href + '/')
  const Icon = item.icon
  return (
    <Link
      to={item.href}
      onClick={onClick}
      className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
        active
          ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-black shadow-[0_4px_15px_rgba(245,124,0,0.15)]'
          : 'text-gray-400 hover:bg-[#121212] hover:text-white'
      }`}
    >
      <Icon className="w-4 h-4" />
      <span>{item.name}</span>
    </Link>
  )
}

function UserCard({ user }) {
  return (
    <div className="p-4 border-b border-[#1a1a1a] bg-orange-500/5">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center">
          <User className="w-5 h-5 text-[#F57C00]" />
        </div>
        <div className="truncate">
          <p className="text-xs font-bold text-white truncate">{user?.name}</p>
          <p className="text-[10px] text-[#F57C00] font-black uppercase tracking-wider">
            {user?.role === 'admin' ? 'Administrador' : 'Directiva'}
          </p>
        </div>
      </div>
    </div>
  )
}

export default function AdminLayout({ title, children }) {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user'))
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (!user) {
      navigate('/login')
    }
  }, [user, navigate])

  const menuItems = allMenuItems.filter(item => item.roles.includes(user?.role))

  const handleLogout = () => {
    client.post('/logout')
      .then(() => {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user')
        toastSuccess('Sesión cerrada con éxito')
        navigate('/login')
      })
      .catch((err) => {
        // Clear local storage anyway so user is logged out locally
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user')
        navigate('/login')
      })
  }

  return (
    <div className="min-h-screen bg-[#070707] text-gray-100 flex flex-col md:flex-row">
      {/* Sidebar – Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-[#0d0d0d] border-r border-[#1a1a1a]">
        <div className="p-6 border-b border-[#1a1a1a]">
          <Link to="/" className="flex items-center space-x-2">
            <img src="/logo_game_time.png" alt="GameTime" className="w-10 h-10 object-contain drop-shadow-[0_0_8px_rgba(245,124,0,0.4)]" />
            <span className="font-black text-lg tracking-tight text-white">Game<span className="text-[#F57C00]">Time</span></span>
          </Link>
        </div>
        <UserCard user={user} />
        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map(item => <NavLink key={item.href} item={item} />)}
        </nav>
        <div className="p-4 border-t border-[#1a1a1a]">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold text-red-400 hover:bg-red-950/20 hover:text-red-300 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Header – Mobile */}
      <header className="md:hidden bg-[#0d0d0d] border-b border-[#1a1a1a] p-4 flex items-center justify-between sticky top-0 z-40">
        <Link to="/" className="flex items-center space-x-2">
          <img src="/logo_game_time.png" alt="GameTime" className="w-8 h-8 object-contain drop-shadow-[0_0_6px_rgba(245,124,0,0.4)]" />
          <span className="font-black text-base tracking-tight text-white">Game<span className="text-[#F57C00]">Time</span></span>
        </Link>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-gray-400 hover:text-white">
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-[57px] bg-[#070707] z-30 flex flex-col border-t border-[#1a1a1a]">
          <UserCard user={user} />
          <nav className="flex-1 p-4 space-y-1">
            {menuItems.map(item => <NavLink key={item.href} item={item} onClick={() => setMobileMenuOpen(false)} />)}
          </nav>
          <div className="p-4 border-t border-[#1a1a1a]">
            <button onClick={handleLogout} className="w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl text-xs font-bold text-red-400 hover:bg-red-950/20 transition-all">
              <LogOut className="w-4 h-4" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto mb-6 flex justify-between items-center">
          <Link
            to="/"
            className="inline-flex items-center space-x-2 text-xs font-bold text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Vista pública</span>
          </Link>
          {title && <span className="text-xs font-mono text-gray-500">{title}</span>}
        </div>
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  )
}

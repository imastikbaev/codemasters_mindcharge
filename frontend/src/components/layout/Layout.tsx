import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../store/authStore'
import {
  LayoutDashboard, ClipboardList, BookOpen, BarChart2,
  MessageSquare, LogOut, Settings, Users, ChevronRight, Menu, X
} from 'lucide-react'
import { useState } from 'react'
import LanguageSwitcher from '../ui/LanguageSwitcher'
import Guide from '../ui/Guide'
import { clsx } from 'clsx'

const LOGO_ICON = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
    <rect width="28" height="28" rx="8" fill="#6366f1"/>
    <path d="M7 14a7 7 0 0014 0" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="10" cy="11" r="1.5" fill="white"/>
    <circle cx="18" cy="11" r="1.5" fill="white"/>
  </svg>
)

export default function Layout() {
  const { t } = useTranslation()
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/login') }

  const navLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: t('nav.dashboard') },
    { to: '/tests', icon: ClipboardList, label: t('nav.tests') },
    { to: '/courses', icon: BookOpen, label: t('nav.courses') },
    { to: '/results', icon: BarChart2, label: t('nav.results') },
    { to: '/assistant', icon: MessageSquare, label: t('nav.assistant') },
  ]
  if (user?.role === 'psychologist' || user?.role === 'director' || user?.role === 'admin') {
    navLinks.push({ to: '/psychologist', icon: Users, label: t('nav.psychologist') })
  }
  if (user?.role === 'director' || user?.role === 'admin') {
    navLinks.push({ to: '/admin', icon: Settings, label: t('nav.admin') })
  }

  const initials = user?.name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() || '?'

  const pageTitle = navLinks.find(l => location.pathname.startsWith(l.to))?.label || 'MindCharge'

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100">
        <LOGO_ICON />
        <span className="font-bold text-gray-900 text-base tracking-tight">MindCharge</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto scrollbar-thin">
        {navLinks.map((link) => {
          const active = location.pathname.startsWith(link.to)
          return (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className={active ? 'sidebar-link-active' : 'sidebar-link'}
            >
              <link.icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{link.label}</span>
              {active && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
            </NavLink>
          )
        })}
      </nav>

      <div className="px-3 pb-4 space-y-1 border-t border-gray-100 pt-3">
        <NavLink
          to="/profile"
          onClick={() => setMobileOpen(false)}
          className={location.pathname === '/profile' ? 'sidebar-link-active' : 'sidebar-link'}
        >
          <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-gray-900 truncate">{user?.name}</div>
            <div className="text-xs text-gray-400 truncate">{user?.email}</div>
          </div>
        </NavLink>
        <button
          onClick={handleLogout}
          className="sidebar-link w-full text-red-500 hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span>{t('nav.logout')}</span>
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-[#F8F9FB] overflow-hidden">
      <aside className="hidden md:flex w-56 flex-shrink-0 bg-white border-r border-gray-100 flex-col">
        <SidebarContent />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-white shadow-modal">
            <SidebarContent />
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-gray-100 px-4 md:px-6 h-14 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-base font-semibold text-gray-900">{pageTitle}</h1>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto scrollbar-thin px-4 md:px-8 py-6">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      <Guide />
    </div>
  )
}

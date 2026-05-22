import { useEffect, useRef, useState } from 'react'
import { Menu, Maximize, Settings, User, LogOut, Pencil, ShieldCheck } from 'lucide-react'
import type { SidebarSize } from '../../pages/AdminPage'
import { authService } from '../../services/auth.service'

interface HeaderProps {
  onToggleSidebar: () => void
  isSidebarOpen: boolean
  isDarkMode: boolean
  onToggleDarkMode: () => void
  onToggleSettings: () => void
  sidebarSize: SidebarSize
  isMobile: boolean
  onNavigate?: (pageId: string) => void
}

export default function Header({ onToggleSidebar, isSidebarOpen, isDarkMode, onToggleDarkMode, onToggleSettings, sidebarSize, isMobile, onNavigate }: HeaderProps) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement | null>(null)
  const usuario = authService.getUsuario()

  const handleEditProfile = () => {
    setIsUserMenuOpen(false)
    if (onNavigate) {
      onNavigate('editar-perfil')
    }
  }

  const handleLogout = () => {
    void authService.logout()
    window.location.href = '/'
  }

  useEffect(() => {
    if (!isUserMenuOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsUserMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isUserMenuOpen])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    }
  }

  return (
    <header className={`bg-white border-b border-slate-200 h-16 fixed top-0 right-0 left-0 z-10 flex items-center justify-between px-4 sm:px-5 lg:px-6 shadow-sm ${
      !isMobile && sidebarSize === 'default' && isSidebarOpen ? 'lg:pl-72' :
      !isMobile && sidebarSize !== 'hidden' ? 'lg:pl-20' :
      ''
    } transition-all duration-300`}>
      {/* Left Section */}
      <div className="flex items-center gap-6 flex-1">
        <button 
          onClick={onToggleSidebar}
          className="p-2 hover:bg-[#f5c518]/10 rounded-lg transition-colors cursor-pointer"
        >
          <Menu size={20} className="text-slate-500" />
        </button>
        

      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3">
        <button 
          onClick={toggleFullscreen}
          className="p-2 hover:bg-[#f5c518]/10 rounded-lg transition-colors cursor-pointer" 
          title="Fullscreen"
        >
          <Maximize size={20} className="text-slate-500" />
        </button>
        <button 
          onClick={onToggleSettings}
          className="p-2 hover:bg-[#f5c518]/10 rounded-lg transition-colors cursor-pointer" 
          title="Settings"
        >
          <Settings size={20} className="text-slate-500" />
        </button>
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setIsUserMenuOpen((prev) => !prev)}
            aria-haspopup="menu"
            aria-expanded={isUserMenuOpen}
            className="ml-2 w-8 h-8 bg-[#f5c518]/20 border border-[#f5c518]/30 rounded-full flex items-center justify-center hover:bg-[#f5c518]/30 transition-colors cursor-pointer"
          >
            <User size={18} className="text-[#f5c518]" />
          </button>

          {isUserMenuOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-3 w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/15 z-50"
            >
              <div className="bg-slate-50 px-4 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f5c518] text-sm font-bold text-slate-950">
                    {(usuario?.nome ?? 'U').slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-950">{usuario?.nome ?? 'Usuario'}</p>
                    <p className="truncate text-xs text-slate-500">{usuario?.email ?? 'admin@tinpavi.com.br'}</p>
                  </div>
                </div>
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                  <ShieldCheck size={13} />
                  Acesso administrativo
                </div>
              </div>

              <div className="p-2">
                <button
                  role="menuitem"
                  onClick={handleEditProfile}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold text-slate-700 transition hover:bg-[#f5c518]/12 hover:text-slate-950 cursor-pointer"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f5c518]/15 text-[#8a6a00]">
                    <Pencil size={16} />
                  </span>
                  <span>
                    <span className="block">Editar usuario</span>
                    <span className="mt-0.5 block text-xs font-medium text-slate-500">Atualizar nome, e-mail e senha</span>
                  </span>
                </button>
                <button
                  role="menuitem"
                  onClick={handleLogout}
                  className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold text-red-600 transition hover:bg-red-50 cursor-pointer"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-600">
                    <LogOut size={16} />
                  </span>
                  <span>
                    <span className="block">Sair da conta</span>
                    <span className="mt-0.5 block text-xs font-medium text-red-400">Encerrar sessao administrativa</span>
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

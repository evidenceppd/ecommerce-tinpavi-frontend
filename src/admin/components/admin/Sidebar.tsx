import { useState } from 'react'
import {
  LayoutDashboard, 
  FileStack,
  Users,
  ShoppingBag,
  ChevronDown,
  ChevronRight,
  X,
  PenLine
} from 'lucide-react'
import { authService } from '../../services/auth.service'
const logo = '/logo-tinpavi.webp'

interface SubMenuItem {
  id: string
  label: string
}

interface MenuItem {
  id: string
  label: string
  icon: React.ReactNode
  isActive?: boolean
  hasSubmenu?: boolean
  submenu?: SubMenuItem[]
}

const menuItems: MenuItem[] = [
  { 
    id: 'dashboard', 
    label: 'Visão geral', 
    icon: <LayoutDashboard size={20} />, 
    isActive: true 
  },
  {
    id: 'ecommerce',
    label: 'E-commerce',
    icon: <ShoppingBag size={20} />,
    hasSubmenu: true,
    submenu: [
      { id: 'ecommerce-products', label: 'Produtos' },
      { id: 'ecommerce-categories', label: 'Categorias' },
      { id: 'ecommerce-orders', label: 'Pedidos' },
      { id: 'ecommerce-coupons', label: 'Cupons' },
      { id: 'ecommerce-customers', label: 'Clientes' },
      { id: 'ecommerce-reviews', label: 'Avaliações' },
      { id: 'ecommerce-payments', label: 'Pagamentos' },
    ],
  },
  {
    id: 'content',
    label: 'Conteúdo',
    icon: <FileStack size={20} />,
    hasSubmenu: true,
    submenu: [
      { id: 'content-blog', label: 'Blog' },
      { id: 'content-fale-conosco', label: 'Contato' },
    ],
  },
  {
    id: 'customization',
    label: 'Personalização',
    icon: <PenLine size={20} />,
    hasSubmenu: true,
    submenu: [
      { id: 'customization-hero-main', label: 'Hero Principal' },
      { id: 'customization-blog-banner', label: 'Banner do Blog' },
    ],
  },
  { 
    id: 'usuarios', 
    label: 'Usuários', 
    icon: <Users size={20} />
  },
]

interface SidebarProps {
  isOpen: boolean
  hoverMode?: boolean
  isMobile?: boolean
  isMobileOpen?: boolean
  onClose?: () => void
  onNavigate?: (pageId: string) => void
  onPreload?: (pageId: string) => void
  activePage?: string
}

export default function Sidebar({ isOpen, hoverMode = false, isMobile = false, isMobileOpen = false, onClose, onNavigate, onPreload, activePage }: SidebarProps) {
  const [openMenus, setOpenMenus] = useState<string[]>(['ecommerce'])
  const [hoveredMenu, setHoveredMenu] = useState<string | null>(null)
  const [isHovered, setIsHovered] = useState(false)

  const effectiveIsOpen = isMobile ? true : (hoverMode ? isHovered : isOpen)
  const isSidebarVisible = isMobile ? isMobileOpen : true

  const currentRole = authService.getUsuario()?.role?.toLowerCase()
  const filteredMenuItems = menuItems.filter((item) => item.id !== 'usuarios' || currentRole !== 'editor')

  const toggleMenu = (menuId: string) => {
    if (!effectiveIsOpen) {
      // Quando condensado, usa hover em vez de click
      return
    }
    setOpenMenus(prev => 
      prev.includes(menuId) 
        ? []
        : [menuId]
    )
  }

  const handleMouseEnter = (menuId: string, hasSubmenu: boolean) => {
    if (!isOpen && hasSubmenu) {
      setHoveredMenu(menuId)
    }
  }

  const handleMouseLeave = () => {
    if (!isOpen) {
      setHoveredMenu(null)
    }
  }

  return (
    <aside 
      className={`bg-white text-slate-900 h-screen fixed left-0 top-0 transition-all duration-300 ${isMobile ? 'z-[2147483647]' : 'z-20'} border-r border-slate-200 shadow-sm ${
        effectiveIsOpen ? 'w-64 overflow-y-auto' : 'w-16 overflow-visible'
      } ${isMobile ? `w-64 ${isSidebarVisible ? 'translate-x-0' : '-translate-x-full'}` : 'translate-x-0'}`}
      onMouseEnter={() => hoverMode && setIsHovered(true)}
      onMouseLeave={() => hoverMode && setIsHovered(false)}
    >
      {/* Mobile Close */}
      {isMobile && (
        <div className="flex items-center justify-end px-4 pt-4">
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Fechar menu"
          >
            <X size={18} />
          </button>
        </div>
      )}
      {/* Logo */}
      <div className={`h-16 flex items-center border-b border-slate-200 ${effectiveIsOpen ? 'px-5' : 'px-3 justify-center'}`}>
        {effectiveIsOpen ? (
          <div className="flex items-center gap-3">
            <img src={logo} alt="Tinpavi" className="h-9 w-auto" />
          </div>
        ) : (
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#f5c518]/15 border border-[#f5c518]/30">
            <img src={logo} alt="Logo" className="w-7 h-7 object-contain" />
          </div>
        )}
      </div>

      {/* Menu */}
      <nav className="py-4">
        {effectiveIsOpen && (
          <div className="px-4 mb-2">
            <span className="text-xs uppercase tracking-wider text-slate-400">MENU</span>
          </div>
        )}
        {filteredMenuItems.map((item) => (
          <div 
            key={item.id} 
            className="relative"
            onMouseEnter={() => handleMouseEnter(item.id, item.hasSubmenu || false)}
            onMouseLeave={handleMouseLeave}
          >
            <button
              onClick={() => {
                if (item.hasSubmenu) {
                  toggleMenu(item.id)
                } else {
                  onNavigate?.(item.id)
                }
              }}
              onMouseEnter={() => onPreload?.(item.id)}
              onFocus={() => onPreload?.(item.id)}
              className={`
                w-full flex items-center ${effectiveIsOpen ? 'justify-between px-6' : 'justify-center px-0'} py-3 transition-colors cursor-pointer
                ${activePage === item.id || (!activePage && item.isActive)
                  ? 'bg-[#f5c518]/20 border-l-4 border-[#f5c518] text-slate-950' 
                  : 'hover:bg-slate-50 border-l-4 border-transparent text-slate-600 hover:text-slate-950'
                }
              `}
              title={!effectiveIsOpen ? item.label : undefined}
            >
              <div className={`flex items-center ${effectiveIsOpen ? 'gap-3' : ''}`}>
                {item.icon}
                {effectiveIsOpen && <span className="text-sm font-medium">{item.label}</span>}
              </div>
              {effectiveIsOpen && item.hasSubmenu && (
                openMenus.includes(item.id) 
                  ? <ChevronDown size={16} />
                  : <ChevronRight size={16} />
              )}
            </button>
            
            {/* Submenu quando expandido */}
            {effectiveIsOpen && item.hasSubmenu && (
              <div className={`overflow-hidden transition-all duration-300 ${openMenus.includes(item.id) ? 'max-h-96' : 'max-h-0'}`}>
                <div className="bg-slate-50">
                  {item.submenu?.map((subItem) => (
                    <button
                      key={subItem.id}
                      onClick={() => onNavigate?.(subItem.id)}
                      onMouseEnter={() => onPreload?.(subItem.id)}
                      onFocus={() => onPreload?.(subItem.id)}
                      className={`w-full text-left px-6 pl-14 py-2 text-sm transition-colors cursor-pointer ${
                        activePage === subItem.id
                          ? 'text-slate-950 bg-[#f5c518]/25 font-bold'
                          : 'text-slate-500 hover:text-slate-950 hover:bg-white'
                      }`}
                    >
                      {subItem.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Submenu flutuante quando condensado */}
            {!effectiveIsOpen && item.hasSubmenu && hoveredMenu === item.id && (
              <div 
                className="absolute left-full top-0 bg-white border border-slate-200 rounded-lg shadow-xl py-2 min-w-50 z-50"
                onMouseEnter={() => setHoveredMenu(item.id)}
                onMouseLeave={handleMouseLeave}
              >
                <div className="px-4 py-2 border-b border-slate-200">
                  <span className="text-sm font-semibold text-slate-950">{item.label}</span>
                </div>
                {item.submenu?.map((subItem) => (
                  <button
                    key={subItem.id}
                    onClick={() => onNavigate?.(subItem.id)}
                    onMouseEnter={() => onPreload?.(subItem.id)}
                    onFocus={() => onPreload?.(subItem.id)}
                    className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:text-slate-950 hover:bg-[#f5c518]/15 transition-colors cursor-pointer"
                  >
                    {subItem.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </aside>
  )
}

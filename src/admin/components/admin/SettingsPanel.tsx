import { Check, PanelLeft, PanelLeftClose, PanelLeftDashed, RotateCcw, X } from 'lucide-react'
import type { SidebarSize } from '../../pages/AdminPage'

interface SettingsPanelProps {
  isOpen: boolean
  onClose: () => void
  isDarkMode: boolean
  onToggleDarkMode: () => void
  sidebarSize: SidebarSize
  onSidebarSizeChange: (size: SidebarSize) => void
}

const sidebarOptions: Array<{
  value: SidebarSize
  label: string
  description: string
  icon: typeof PanelLeft
}> = [
  { value: 'default', label: 'Padrao', description: 'Menu completo sempre visivel.', icon: PanelLeft },
  { value: 'condensed', label: 'Compacta', description: 'Mostra apenas os icones.', icon: PanelLeftDashed },
  { value: 'hidden', label: 'Oculta', description: 'Remove a lateral da area principal.', icon: PanelLeftClose },
  { value: 'small-hover', label: 'Hover', description: 'Expande quando passar o mouse.', icon: PanelLeftDashed },
]

export default function SettingsPanel({
  isOpen,
  onClose,
  sidebarSize,
  onSidebarSizeChange,
}: SettingsPanelProps) {
  const handleReset = () => {
    localStorage.removeItem('theme')
    localStorage.removeItem('sidebarSize')
    window.location.reload()
  }

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-[2px] transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
      />

      <aside
        className={`fixed right-4 top-4 z-50 flex h-[calc(100vh-2rem)] w-[min(420px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/20 transition-all duration-300 ${
          isOpen ? 'translate-x-0 opacity-100' : 'translate-x-[calc(100%+2rem)] opacity-0'
        }`}
        aria-hidden={!isOpen}
      >
        <header className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[#f5c518]">Aparencia</p>
            <h2 className="mt-1 text-xl font-bold text-slate-950">Configuracoes do tema</h2>
            <p className="mt-1 text-sm text-slate-500">Ajuste a visualizacao do painel administrativo.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
            aria-label="Fechar configuracoes"
          >
            <X size={20} />
          </button>
        </header>

        <div className="flex-1 space-y-7 overflow-y-auto px-6 py-6">
          <section>
            <h3 className="text-sm font-bold text-slate-950">Barra lateral</h3>
            <div className="mt-3 grid gap-3">
              {sidebarOptions.map((option) => (
                <SidebarOption
                  key={option.value}
                  label={option.label}
                  description={option.description}
                  icon={option.icon}
                  selected={sidebarSize === option.value}
                  onClick={() => onSidebarSizeChange(option.value)}
                />
              ))}
            </div>
          </section>
        </div>

        <footer className="border-t border-slate-100 bg-slate-50 px-6 py-5">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#f5c518]/40 bg-[#f5c518] px-4 text-sm font-bold text-slate-950 transition hover:bg-[#e4b80f] cursor-pointer"
          >
            <RotateCcw size={16} />
            Restaurar padrao
          </button>
        </footer>
      </aside>
    </>
  )
}

function SidebarOption({
  label,
  description,
  icon: Icon,
  selected,
  onClick,
}: {
  label: string
  description: string
  icon: typeof PanelLeft
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-4 rounded-2xl border p-4 text-left transition cursor-pointer ${
        selected
          ? 'border-[#f5c518] bg-[#f5c518]/10 shadow-sm'
          : 'border-slate-200 bg-white hover:border-[#f5c518]/60 hover:bg-slate-50'
      }`}
    >
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
        selected ? 'bg-[#f5c518] text-slate-950' : 'bg-slate-100 text-slate-600'
      }`}>
        <Icon size={19} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-slate-950">{label}</span>
        <span className="mt-0.5 block text-xs text-slate-500">{description}</span>
      </span>
      {selected && (
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#f5c518] text-slate-950">
          <Check size={14} />
        </span>
      )}
    </button>
  )
}

import { useState, useEffect, lazy, Suspense } from 'react'
import '../styles/admin.css'
import Sidebar from '../components/admin/Sidebar'
import AdminHeader from '../components/admin/Header'
import SettingsPanel from '../components/admin/SettingsPanel'
import AdminSectionSkeleton from '../components/admin/AdminSectionSkeleton'
import StatCard from '../components/admin/StatCard'
import { Users, Smartphone, TrendingUp, Eye, EyeOff, LogIn, Newspaper, ShoppingCart, DollarSign, Star, AlertTriangle, CreditCard, Truck, UserPlus, ClipboardList, ArrowRight, Boxes, Mail, LockKeyhole, ShieldCheck, BarChart3, MousePointerClick, PackageSearch } from 'lucide-react'
import { authService } from '../services/auth.service'
import { analyticsService, type AnalyticsDeviceMonth, type AnalyticsLast7Day, type AnalyticsTopPage, type AnalyticsViewsMonth } from '../services/analytics.service'
import { noticiasService } from '../services/noticias.service'
import { adminEcommerceService, type DashboardOverview, type LowStockItem, type SalesReportItem } from '../services/adminEcommerce.service'
import { toast } from 'sonner'
import RedefinirSenha from './admin/RedefinirSenha'
import { Toaster } from 'sonner'
import { getAdminModuleLoader, preloadAdminModule } from '../utils/adminPreload'
const siteLogoUrl = '/logo-tinpavi.webp'

// Lazy-load all admin pages for code splitting
const ChartCard = lazy(() => import('../components/admin/ChartCard'))
const HeroEditor = lazy(getAdminModuleLoader('content-hero'))
const BannersHome = lazy(getAdminModuleLoader('content-banners-home'))
const SobreNos = lazy(getAdminModuleLoader('content-receitas'))
const Noticias = lazy(getAdminModuleLoader('content-blog'))
const Projetos = lazy(getAdminModuleLoader('content-projetos'))
const Procedimentos = lazy(getAdminModuleLoader('content-projetos'))
const Equipe = lazy(getAdminModuleLoader('content-equipe'))
const FaleConosco = lazy(getAdminModuleLoader('content-fale-conosco'))
const Usuarios = lazy(getAdminModuleLoader('usuarios'))
const EditarPerfil = lazy(getAdminModuleLoader('editar-perfil'))
const DashboardEcommerce = lazy(getAdminModuleLoader('ecommerce-dashboard'))
const Produtos = lazy(getAdminModuleLoader('ecommerce-products'))
const CategoriasProdutos = lazy(getAdminModuleLoader('ecommerce-categories'))
const Pedidos = lazy(getAdminModuleLoader('ecommerce-orders'))
const Cupons = lazy(getAdminModuleLoader('ecommerce-coupons'))
const Clientes = lazy(getAdminModuleLoader('ecommerce-customers'))
const Avaliacoes = lazy(getAdminModuleLoader('ecommerce-reviews'))
const Pagamentos = lazy(getAdminModuleLoader('ecommerce-payments'))
const SeoRedirects = lazy(getAdminModuleLoader('ecommerce-redirects'))
const IS_ADMIN_LOGIN_DISABLED = false
type AuthStatus = 'checking' | 'authenticated' | 'unauthenticated'

export type SidebarSize = 'default' | 'condensed' | 'hidden' | 'small-hover-active' | 'small-hover'

interface DashboardBlogItem {
  id: string
  categoria: string
  titulo: string
  createdAt: string
}

function formatDashboardDate(dateIso: string) {
  if (!dateIso || dateIso.length < 10) return '--/--/----'
  const [y, m, d] = dateIso.slice(0, 10).split('-')
  return `${d}/${m}/${y}`
}

const ORDER_STATUS_LABEL: Record<string, string> = {
  PENDING_PAYMENT: 'Aguardando pagamento',
  PAID: 'Pago',
  SHIPPED: 'Enviado',
  DELIVERED: 'Entregue',
  CANCELLED: 'Cancelado',
  REFUNDED: 'Reembolsado',
}

function translateOrderStatus(status: string): string {
  return ORDER_STATUS_LABEL[status?.toUpperCase()] ?? status
}

function mapLatestBlogs(items: Awaited<ReturnType<typeof noticiasService.getAll>>): DashboardBlogItem[] {
  return items
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3)
    .map((post) => ({
      id: post.id,
      categoria: post.categoria || 'Blog',
      titulo: post.titulo || 'Sem titulo',
      createdAt: post.createdAt || new Date().toISOString(),
    }))
}

function normalizeDeviceName(device: string) {
  switch (device.toLowerCase()) {
    case 'desktop': return 'Desktop'
    case 'mobile': return 'Mobile'
    case 'tablet': return 'Tablet'
    default: return device || 'Outro'
  }
}

function formatDeviceDetails(devices: AnalyticsDeviceMonth[]): string[] {
  if (devices.length === 0) return ['Sem dados de dispositivo no periodo.']

  return devices
    .slice()
    .sort((a, b) => b.count - a.count)
    .map((item) => `${normalizeDeviceName(item.device)}: ${item.count} acessos`)
}

function toDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatLast7DaysChart(last7Days: AnalyticsLast7Day[]) {
  const countsByDate = new Map(last7Days.map((item) => [item.date.slice(0, 10), item.count]))
  const labels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']
  const result: Array<{ name: string; value: number }> = []

  for (let i = 6; i >= 0; i -= 1) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const key = toDateKey(date)
    result.push({
      name: labels[date.getDay()],
      value: countsByDate.get(key) ?? 0,
    })
  }

  return result
}

function formatTopPageLabel(path: string): string {
  if (!path) return 'Pagina nao identificada'

  const safePath = path.split('?')[0].split('#')[0]
  const normalized = safePath === '/' ? '/' : safePath.replace(/\/+$/, '')

  if (normalized === '/') return 'Inicio'
  if (normalized === '/blog') return 'Blog'
  if (normalized === '/projetos') return 'Projetos'
  if (normalized.startsWith('/blog/')) return 'Detalhe do Blog'
  if (normalized.startsWith('/projetos/')) return 'Detalhe de Projeto'
  if (normalized === '/admin') return 'Painel Administrativo'

  const clean = normalized.replace(/^\//, '')
  if (!clean) return 'Pagina nao identificada'

  return clean
    .split('/')
    .map((segment) => decodeURIComponent(segment).replace(/[-_]/g, ' '))
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' / ')
}

// Login Form
function LoginForm({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [mfaChallenge, setMfaChallenge] = useState<{ id: string; emailMasked: string } | null>(null)
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (mfaChallenge) {
        // MFA desativada no fluxo de login administrativo.
        setMfaChallenge(null)
        setVerificationCode('')
      }

      await authService.login(email, senha)
      onLogin()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      toast.error(e.response?.data?.error ?? 'Credenciais invalidas')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f4f6f8] text-slate-950">
      <Toaster position="top-right" richColors />
      <div className="grid min-h-screen lg:grid-cols-[minmax(420px,0.9fr)_1.1fr]">
        <div className="relative hidden overflow-hidden bg-slate-950 lg:block">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(245,197,24,0.18),transparent_42%),radial-gradient(circle_at_20%_20%,rgba(245,197,24,0.22),transparent_28%)]" />
          <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-slate-950 to-transparent" />
          <div className="relative flex min-h-screen flex-col justify-between p-10 xl:p-12">
            <img src={siteLogoUrl} alt="Tinpavi" className="h-12 w-fit brightness-0 invert" />
            <div className="max-w-md">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#f5c518]">Painel administrativo</p>
              <h1 className="mt-4 text-4xl font-black leading-tight text-white">
                Controle a operacao da loja Tinpavi.
              </h1>
              <p className="mt-4 text-sm leading-6 text-slate-300">
                Acesse produtos, pedidos, clientes, pagamentos e conteudos com seguranca.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-white">
              {[
                ['Produtos', 'Catalogo'],
                ['Pedidos', 'Operacao'],
                ['Conteudo', 'Site'],
              ].map(([title, label]) => (
                <div key={title} className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                  <p className="text-sm font-bold">{title}</p>
                  <p className="mt-1 text-xs text-slate-400">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:px-10">
          <div className="w-full max-w-[460px]">
            <div className="mb-8 flex justify-center lg:hidden">
              <img src={siteLogoUrl} alt="Tinpavi" className="h-12 w-auto" />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-950/8">
              <div className="border-b border-slate-100 px-7 py-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f5c518]/15 text-[#9a7600]">
                    <ShieldCheck size={22} />
                  </span>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-[#c59700]">Acesso seguro</p>
                    <h2 className="text-2xl font-black text-slate-950">Entrar no painel</h2>
                  </div>
                </div>
                <p className="mt-3 text-sm text-slate-500">
                  {mfaChallenge ? `Digite o codigo enviado para ${mfaChallenge.emailMasked}.` : 'Use sua conta administrativa para gerenciar o e-commerce.'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5 px-7 py-6">
                {mfaChallenge ? (
                  <div>
                    <label className="mb-1.5 block text-sm font-bold text-slate-700">Codigo de verificação</label>
                    <input
                      inputMode="numeric"
                      maxLength={6}
                      required
                      value={verificationCode}
                      onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-center font-mono text-xl tracking-[0.35em] text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[#f5c518] focus:ring-4 focus:ring-[#f5c518]/20"
                      placeholder="000000"
                    />
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="mb-1.5 block text-sm font-bold text-slate-700">E-mail</label>
                      <div className="relative">
                        <Mail size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          className="h-12 w-full rounded-xl border border-slate-300 bg-white px-10 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[#f5c518] focus:ring-4 focus:ring-[#f5c518]/20"
                          placeholder="master@tinpavi.local"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-bold text-slate-700">Senha</label>
                      <div className="relative">
                        <LockKeyhole size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type={show ? 'text' : 'password'}
                          required
                          value={senha}
                          onChange={e => setSenha(e.target.value)}
                          className="h-12 w-full rounded-xl border border-slate-300 bg-white px-10 pr-12 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[#f5c518] focus:ring-4 focus:ring-[#f5c518]/20"
                          placeholder="Digite sua senha"
                        />
                        <button
                          type="button"
                          onClick={() => setShow(v => !v)}
                          className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
                          aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
                        >
                          {show ? <EyeOff size={17} /> : <Eye size={17} />}
                        </button>
                      </div>
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  disabled={loading || Boolean(mfaChallenge && verificationCode.length !== 6)}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#f5c518] text-sm font-black text-slate-950 transition hover:bg-[#e0b614] focus:outline-none focus:ring-4 focus:ring-[#f5c518]/30 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                >
                  <LogIn size={18} />
                  {loading ? 'Verificando...' : mfaChallenge ? 'Verificar e entrar' : 'Entrar'}
                </button>
                {mfaChallenge && (
                  <button
                    type="button"
                    onClick={() => {
                      setMfaChallenge(null)
                      setVerificationCode('')
                    }}
                    className="w-full text-center text-sm font-semibold text-slate-500 transition hover:text-slate-900 cursor-pointer"
                  >
                    Voltar para login
                  </button>
                )}
              </form>

              <div className="border-t border-slate-100 bg-slate-50 px-7 py-4">
                <p className="text-xs leading-5 text-slate-500">
                  Ambiente restrito. Acoes realizadas no painel podem alterar dados exibidos no site.
                </p>
              </div>
            </div>

            <p className="mt-5 text-center text-xs text-slate-400">
              2026 (c) Tinpavi. Painel administrativo.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

type DashboardPeriod = '1d' | '7d' | '30d'
const DASHBOARD_PERIODS: { value: DashboardPeriod; label: string; days: number }[] = [
  { value: '1d', label: 'Último dia', days: 1 },
  { value: '7d', label: 'Últimos 7 dias', days: 7 },
  { value: '30d', label: 'Últimos 30 dias', days: 30 },
]

// Dashboard Home
function DashboardHome({ onNavigate }: { onNavigate: (pageId: string) => void }) {
  const [period, setPeriod] = useState<DashboardPeriod>('1d')
  const [dashboard, setDashboard] = useState<DashboardOverview | null>(null)
  const [revenueData, setRevenueData] = useState<SalesReportItem[]>([])
  const [lowStock, setLowStock] = useState<LowStockItem[]>([])
  const [viewsMonth, setViewsMonth] = useState<AnalyticsViewsMonth | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)

    const timer = setTimeout(() => {
      const selectedPeriod = DASHBOARD_PERIODS.find((p) => p.value === period)!
      const dateTo = new Date()
      const dateFrom = new Date()
      dateFrom.setDate(dateTo.getDate() - (selectedPeriod.days - 1))
      dateFrom.setHours(0, 0, 0, 0)

      Promise.all([
        adminEcommerceService.getDashboard({
          dateFrom: dateFrom.toISOString(),
          dateTo: dateTo.toISOString(),
        }),
        adminEcommerceService.getSalesReport({
          dateFrom: dateFrom.toISOString(),
          dateTo: dateTo.toISOString(),
        }),
        adminEcommerceService.getLowStock({ threshold: 4, page: 1, limit: 20 }),
        analyticsService.getViewsMonth(dateFrom.toISOString(), dateTo.toISOString()),
      ])
        .then(([dashboardData, salesReport, lowStockReport, viewsMonthData]) => {
          if (!active) return
          setDashboard(dashboardData)
          setRevenueData(salesReport.items)
          setLowStock(lowStockReport.items)
          setViewsMonth(viewsMonthData)
        })
        .catch(() => {
          if (!active) return
          toast.error('Nao foi possivel carregar o dashboard.')
        })
        .finally(() => {
          if (active) setLoading(false)
        })
    }, 350)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [period])

  const formatMoney = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const formatDateTime = (value: string) => {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '--/--/---- --:--'
    return date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
  }
  const formatOrderItems = (items: DashboardOverview['recentOrders'][number]['items']) => {
    if (items.length === 0) return 'Sem itens'
    const [firstItem, ...remainingItems] = items
    const firstLabel = `${firstItem.quantity}x ${firstItem.productName}`
    return remainingItems.length > 0 ? `${firstLabel} +${remainingItems.length}` : firstLabel
  }
  const maxRevenue = Math.max(...revenueData.map((item) => item.revenue), 0)
  const visitedProducts = dashboard?.analytics.mostVisitedProducts || []
  const bestSellingProducts = dashboard?.analytics.bestSellingProducts || []
  const maxVisitedCount = Math.max(...visitedProducts.map((item) => item.count), 0)
  const maxSoldCount = Math.max(...bestSellingProducts.map((item) => item.count), 0)

  const operationalQueue = [
    { label: 'Pedidos', value: dashboard?.totalOrders ?? 0, icon: ClipboardList, tone: 'bg-amber-50 text-amber-700' },
    { label: 'Pagamentos pendentes', value: dashboard?.pendingPayments ?? 0, icon: CreditCard, tone: 'bg-sky-50 text-sky-700' },
    { label: 'Estoque baixo', value: dashboard?.lowStockProducts ?? 0, icon: Truck, tone: 'bg-emerald-50 text-emerald-700' },
    { label: 'Clientes', value: dashboard?.totalCustomers ?? 0, icon: UserPlus, tone: 'bg-violet-50 text-violet-700' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#f5c518]">Visao geral</p>
          <h2 className="text-xl font-bold text-slate-950">Dashboard e-commerce</h2>
          <p className="text-sm text-slate-500">Resumo operacional da loja em tempo real.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
            {DASHBOARD_PERIODS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setPeriod(option.value)}
                className={`rounded-md px-3 py-1.5 text-xs font-bold transition-all duration-150 cursor-pointer ${
                  period === option.value
                    ? 'bg-[#f5c518] text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => onNavigate('ecommerce-orders')}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#f5c518] px-4 text-sm font-bold text-slate-950 hover:bg-[#e0b614] cursor-pointer"
          >
            Ver pedidos
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Faturamento total', value: dashboard ? formatMoney(dashboard.totalRevenue) : '--', meta: loading ? 'Carregando...' : 'Pedidos pagos e entregues', icon: DollarSign },
          { label: 'Pedidos totais', value: dashboard ? String(dashboard.totalOrders) : '--', meta: loading ? 'Carregando...' : `${dashboard?.pendingPayments ?? 0} pagamentos pendentes`, icon: ShoppingCart },
          { label: 'Ticket medio', value: dashboard && dashboard.totalOrders > 0 ? formatMoney(dashboard.totalRevenue / dashboard.totalOrders) : '--', meta: loading ? 'Carregando...' : 'Calculado com dados reais', icon: TrendingUp },
          { label: 'Avaliacoes', value: dashboard ? String(dashboard.totalReviews) : '--', meta: loading ? 'Carregando...' : 'Total de avaliacoes recebidas', icon: Star },
        ].map((metric) => {
          const Icon = metric.icon
          return (
            <div key={metric.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-slate-500">{metric.label}</p>
                  <p className="mt-1 text-2xl font-bold leading-none text-slate-950">{metric.value}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f5c518]/15 text-[#c99b00]">
                  <Icon size={20} />
                </div>
              </div>
              <p className="mt-3 text-xs font-medium text-slate-500">{metric.meta}</p>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.9fr)]">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-950">
                Receita — {DASHBOARD_PERIODS.find((p) => p.value === period)?.label}
              </h3>
              <p className="text-xs text-slate-500">Pedidos pagos por dia.</p>
            </div>
          </div>
          <div className="space-y-3">
            {revenueData.length === 0 && (
              <p className="rounded-lg bg-slate-50 px-3 py-8 text-center text-sm text-slate-500">Sem vendas pagas em {DASHBOARD_PERIODS.find((p) => p.value === period)?.label.toLowerCase()}.</p>
            )}
            {revenueData.map((item) => {
              const width = `${Math.max(12, maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 12)}%`
              return (
                <div key={item.date} className="grid grid-cols-[76px_1fr_110px] items-center gap-3 text-sm">
                  <span className="font-semibold text-slate-500">{formatDashboardDate(item.date)}</span>
                  <div className="h-8 overflow-hidden rounded-md bg-slate-100">
                    <div className="flex h-full items-center justify-end rounded-md bg-[#f5c518] px-2 text-xs font-bold text-slate-950" style={{ width }}>
                      {item.orders}
                    </div>
                  </div>
                  <span className="text-right font-bold text-slate-900">{formatMoney(item.revenue)}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f5c518]/15 text-[#c99b00]">
              <AlertTriangle size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-950">Estoque critico</h3>
              <p className="text-xs text-slate-500">Itens para reposicao.</p>
            </div>
          </div>
          <div className="space-y-3">
            {lowStock.length === 0 && (
              <p className="rounded-lg bg-slate-50 px-3 py-8 text-center text-sm text-slate-500">Nenhum item com estoque critico.</p>
            )}
            {lowStock.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-900">{item.name}</p>
                  <p className="text-xs text-slate-400">{item.sku || 'Sem SKU'}</p>
                </div>
                <span className="shrink-0 rounded-full bg-red-50 px-2 py-1 text-xs font-bold text-red-700">{item.stock} un.</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.9fr)]">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-950">Pedidos recentes</h3>
              <p className="text-xs text-slate-500">Ultimas compras recebidas.</p>
            </div>
            <ShoppingCart size={20} className="text-[#f5c518]" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                  <th className="py-2.5 pr-4 font-bold">Itens</th>
                  <th className="py-2.5 pr-4 font-bold">Cliente</th>
                  <th className="py-2.5 pr-4 font-bold">Status</th>
                  <th className="py-2.5 text-right font-bold">Total</th>
                </tr>
              </thead>
              <tbody>
                {(dashboard?.recentOrders || []).length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-sm text-slate-500">Nenhum pedido recebido ainda.</td>
                  </tr>
                )}
                {(dashboard?.recentOrders || []).map((order) => (
                  <tr key={order.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-2.5 pr-4">
                      <p className="max-w-[360px] truncate font-bold text-slate-950">{formatOrderItems(order.items)}</p>
                      <p className="text-xs text-slate-400">{formatDateTime(order.createdAt)}</p>
                    </td>
                    <td className="py-2.5 pr-4 text-slate-700">{order.customerName}</td>
                    <td className="py-2.5 pr-4">
                      <span className="rounded-full bg-[#f5c518]/15 px-2.5 py-1 text-xs font-bold text-[#8a6a00]">{translateOrderStatus(order.status)}</span>
                    </td>
                    <td className="py-2.5 text-right font-bold text-slate-950">{formatMoney(order.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f5c518]/15 text-[#c99b00]">
                <Boxes size={18} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-950">Operacao</h3>
                <p className="text-xs text-slate-500">Pendencias para hoje.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {operationalQueue.map((task) => {
                const Icon = task.icon
                return (
                  <div key={task.label} className="rounded-lg bg-slate-50 p-3">
                    <div className={`mb-2 flex h-7 w-7 items-center justify-center rounded-md ${task.tone}`}>
                      <Icon size={15} />
                    </div>
                    <p className="text-xl font-bold leading-none text-slate-950">{task.value}</p>
                    <p className="mt-1 text-xs font-medium text-slate-500">{task.label}</p>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="rounded-xl border border-[#f5c518]/35 bg-[#fff9db] p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-[#b08900]">Resumo geral</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <p className="text-xl font-bold text-slate-950">{dashboard?.totalOrders ?? 0}</p>
                <p className="text-xs text-slate-600">pedidos</p>
              </div>
              <div>
                <p className="text-xl font-bold text-slate-950">{dashboard ? formatMoney(dashboard.totalRevenue) : '--'}</p>
                <p className="text-xs text-slate-600">faturamento</p>
              </div>
              <div>
                <p className="text-xl font-bold text-slate-950">{dashboard?.totalReviews ?? 0}</p>
                <p className="text-xs text-slate-600">avaliacoes</p>
              </div>
              <div>
                <p className="text-xl font-bold text-slate-950">{dashboard?.totalCustomers ?? 0}</p>
                <p className="text-xs text-slate-600">clientes</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
        <div className="mb-4 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f5c518]/15 text-[#c99b00]">
                <BarChart3 size={17} />
              </div>
              <h3 className="text-base font-bold text-slate-950">Analytics</h3>
            </div>
            <p className="mt-1 text-xs text-slate-500">Sinais de demanda e comportamento para priorizar acao comercial.</p>
          </div>
          <div className="grid w-full grid-cols-1 gap-2 sm:w-auto sm:grid-cols-2">
            <div className="rounded-lg border border-[#f5c518]/40 bg-[#fff9db] px-3 py-3 text-left sm:min-w-48 sm:px-4 sm:text-right">
              <p className="text-[11px] font-bold uppercase tracking-wide text-[#9a7600]">Visualizacoes do site</p>
              <p className="mt-1 text-2xl font-bold leading-none text-slate-950">{viewsMonth?.count ?? 0}</p>
              <p className="mt-1 text-[11px] text-slate-600">acessos registrados no mes</p>
            </div>
            <div className="rounded-lg border border-[#f5c518]/40 bg-[#fff9db] px-3 py-3 text-left sm:min-w-48 sm:px-4 sm:text-right">
              <p className="text-[11px] font-bold uppercase tracking-wide text-[#9a7600]">Carrinhos abandonados</p>
              <p className="mt-1 text-2xl font-bold leading-none text-slate-950">{dashboard?.analytics.abandonedCartsCount ?? 0}</p>
              <p className="mt-1 text-[11px] text-slate-600">com itens parados ha mais de 1h</p>
            </div>
          </div>
        </div>

        <div className="grid min-w-0 gap-3 lg:grid-cols-2 lg:gap-4">
          <div className="min-w-0 rounded-lg border border-slate-100 bg-slate-50 p-2.5 sm:p-3">
            <div className="mb-3 flex min-w-0 items-start justify-between gap-2 sm:items-center sm:gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <MousePointerClick size={16} className="shrink-0 text-[#c99b00]" />
                <h4 className="min-w-0 text-sm font-bold leading-5 text-slate-950">Produtos mais visitados</h4>
              </div>
              <span className="shrink-0 text-[10px] font-bold uppercase text-slate-400 sm:text-[11px]">visitas</span>
            </div>
            <div className="space-y-2">
              {visitedProducts.length === 0 && (
                <p className="rounded-md bg-white px-3 py-8 text-center text-sm text-slate-500">Sem visitas registradas em produtos.</p>
              )}
              {visitedProducts.map((item, index) => {
                const width = `${Math.max(8, maxVisitedCount > 0 ? (item.count / maxVisitedCount) * 100 : 8)}%`
                return (
                  <div key={item.id} className="min-w-0 rounded-md bg-white px-3 py-2.5">
                    <div className="flex min-w-0 items-start justify-between gap-2 sm:items-center sm:gap-3">
                      <div className="min-w-0">
                        <p className="break-words text-sm font-bold leading-5 text-slate-900 sm:truncate">{index + 1}. {item.title}</p>
                        <p className="text-xs text-slate-400">{item.code || 'Sem codigo'}</p>
                      </div>
                      <span className="shrink-0 font-mono text-sm font-bold text-slate-950">{item.count}</span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-[#f5c518]" style={{ width }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="min-w-0 rounded-lg border border-slate-100 bg-slate-50 p-2.5 sm:p-3">
            <div className="mb-3 flex min-w-0 items-start justify-between gap-2 sm:items-center sm:gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <PackageSearch size={16} className="shrink-0 text-[#c99b00]" />
                <h4 className="min-w-0 text-sm font-bold leading-5 text-slate-950">Produtos mais vendidos</h4>
              </div>
              <span className="shrink-0 text-[10px] font-bold uppercase text-slate-400 sm:text-[11px]">unidades</span>
            </div>
            <div className="space-y-2">
              {bestSellingProducts.length === 0 && (
                <p className="rounded-md bg-white px-3 py-8 text-center text-sm text-slate-500">Sem vendas pagas registradas.</p>
              )}
              {bestSellingProducts.map((item, index) => {
                const width = `${Math.max(8, maxSoldCount > 0 ? (item.count / maxSoldCount) * 100 : 8)}%`
                return (
                  <div key={item.id} className="min-w-0 rounded-md bg-white px-3 py-2.5">
                    <div className="flex min-w-0 items-start justify-between gap-2 sm:items-center sm:gap-3">
                      <div className="min-w-0">
                        <p className="break-words text-sm font-bold leading-5 text-slate-900 sm:truncate">{index + 1}. {item.title}</p>
                        <p className="text-xs text-slate-400">{item.code || 'Sem codigo'}</p>
                      </div>
                      <span className="shrink-0 font-mono text-sm font-bold text-slate-950">{item.count}</span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-[#f5c518]" style={{ width }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Admin Dashboard
export default function AdminPage() {
  const [authStatus, setAuthStatus] = useState<AuthStatus>(
    IS_ADMIN_LOGIN_DISABLED ? 'authenticated' : 'checking',
  )
  useEffect(() => {
    if (IS_ADMIN_LOGIN_DISABLED) return
    let isMounted = true
    void authService.isAuthenticated().then((authenticated) => {
      if (!isMounted) return
      setAuthStatus(authenticated ? 'authenticated' : 'unauthenticated')
    })
    return () => {
      isMounted = false
    }
  }, [])
  const [isFirstLogin, setIsFirstLogin] = useState(() => !!authService.getUsuario()?.first_login)
  const [activePage, setActivePage] = useState('dashboard')
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [sidebarSize, setSidebarSize] = useState<SidebarSize>('default')
  const [isMobile, setIsMobile] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  useEffect(() => {
    if (IS_ADMIN_LOGIN_DISABLED) return
    const onAuthExpired = (event: Event) => {
      const scope = (event as CustomEvent<{ scope?: 'admin' | 'customer' | 'all' }>).detail?.scope
      if (scope === 'customer') return
      setAuthStatus('unauthenticated')
    }
    window.addEventListener('auth:expired', onAuthExpired)
    return () => window.removeEventListener('auth:expired', onAuthExpired)
  }, [])

  useEffect(() => {
    // Always start in light mode - remove any previously saved dark preference
    localStorage.removeItem('theme')
    const html = document.querySelector('html')
    if (html) html.classList.remove('dark')
  }, [])

  useEffect(() => {
    const handleResize = () => {
      const mobileView = window.innerWidth < 1024
      setIsMobile(mobileView)
      if (!mobileView) setIsMobileSidebarOpen(false)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  if (!IS_ADMIN_LOGIN_DISABLED && authStatus === 'checking') {
    return (
      <div className="min-h-screen bg-[#F6F7F9] p-4 sm:p-6">
        <AdminSectionSkeleton label="Carregando painel administrativo" />
      </div>
    )
  }

  if (!IS_ADMIN_LOGIN_DISABLED && authStatus === 'unauthenticated') {
    return <LoginForm onLogin={() => {
      setAuthStatus('authenticated')
      setIsFirstLogin(!!authService.getUsuario()?.first_login)
    }} />
  }

  if (isFirstLogin) {
    return <RedefinirSenha onComplete={() => setIsFirstLogin(false)} />
  }

  const toggleDarkMode = () => {
    const newDark = !isDarkMode
    setIsDarkMode(newDark)
    const html = document.querySelector('html')
    if (html) {
      newDark ? html.classList.add('dark') : html.classList.remove('dark')
      localStorage.setItem('theme', newDark ? 'dark' : 'light')
    }
  }

  const handleToggleSidebar = () => {
    if (isMobile) { setIsMobileSidebarOpen(v => !v); return }
    setIsSidebarOpen(v => !v)
  }

  const handleNavigate = (pageId: string) => {
    preloadAdminModule(pageId)
    setActivePage(pageId)
    if (isMobile) setIsMobileSidebarOpen(false)
  }

  const renderPage = () => {
    const role = authService.getUsuario()?.role?.toLowerCase()

    switch (activePage) {
      case 'content-hero': return <HeroEditor />
      case 'customization-hero-main': return <HeroEditor section="hero" />
      case 'customization-blog-banner': return <HeroEditor section="blog" />
      case 'content-banners-home': return <BannersHome />
      case 'content-receitas': return <SobreNos />
      case 'content-blog': return <Noticias />
      case 'content-projetos': return <Procedimentos />
      case 'content-equipe': return <Equipe />
      case 'content-fale-conosco': return <FaleConosco />
      case 'usuarios': {
        return role === 'editor' ? <DashboardHome onNavigate={handleNavigate} /> : <Usuarios />
      }
      case 'editar-perfil': return <EditarPerfil onBack={() => setActivePage('dashboard')} />
      case 'ecommerce-dashboard': return <DashboardHome onNavigate={handleNavigate} />
      case 'ecommerce-products': return <Produtos />
      case 'ecommerce-categories': return <CategoriasProdutos />
      case 'ecommerce-orders': return <Pedidos />
      case 'ecommerce-coupons': return <Cupons />
      case 'ecommerce-customers': return <Clientes />
      case 'ecommerce-reviews': return <Avaliacoes />
      case 'ecommerce-payments': return <Pagamentos />
      case 'ecommerce-redirects': return <SeoRedirects />
      default: return <DashboardHome onNavigate={handleNavigate} />
    }
  }

  const isDesktopVisible = !isMobile && isSidebarOpen && sidebarSize !== 'hidden'
  const mainOffsetClass = isMobile || !isDesktopVisible ? 'ml-0' : sidebarSize === 'default' ? 'lg:ml-64' : 'ml-0'
  const mainPaddingLeftClass = !isMobile && sidebarSize !== 'hidden' ? (sidebarSize === 'default' && isSidebarOpen ? '' : 'lg:pl-20') : ''

  return (
    <div className="admin-panel min-h-screen bg-[#F6F7F9] overflow-x-hidden text-slate-950">
      <Toaster position="top-right" richColors />

      {(sidebarSize !== 'hidden' || isMobile) && (
        <Sidebar
          isOpen={isDesktopVisible && sidebarSize === 'default'}
          hoverMode={!isMobile && sidebarSize === 'small-hover'}
          isMobile={isMobile}
          isMobileOpen={isMobileSidebarOpen}
          onClose={() => setIsMobileSidebarOpen(false)}
          onNavigate={handleNavigate}
          onPreload={preloadAdminModule}
          activePage={activePage}
        />
      )}

      {isMobile && isMobileSidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-10" onClick={() => setIsMobileSidebarOpen(false)} />
      )}

      <div className={`${mainOffsetClass} ${mainPaddingLeftClass} min-h-screen flex flex-col transition-all duration-300`}>
        <AdminHeader
          onToggleSidebar={handleToggleSidebar}
          isSidebarOpen={isSidebarOpen}
          isDarkMode={isDarkMode}
          onToggleDarkMode={toggleDarkMode}
          onToggleSettings={() => setIsSettingsOpen(v => !v)}
          sidebarSize={sidebarSize}
          isMobile={isMobile}
          onNavigate={handleNavigate}
        />

        <main className="flex-1 px-4 pb-4 pt-24 sm:px-5 sm:pb-5 lg:px-6 lg:pb-6">
          <Suspense fallback={<AdminSectionSkeleton label="Carregando modulo administrativo" />}>
            <div className="pt-2 sm:pt-4">
              {renderPage()}
            </div>
          </Suspense>
        </main>

        <footer className="border-t border-slate-200 bg-white py-3 text-center text-xs text-slate-400">
          2026 (c) Criado por{' '}
          <a
            href="https://agenciaevidence.com.br/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#f5c518] hover:text-[#D4AA52] underline underline-offset-2"
          >
            Agencia Evidence
          </a>
        </footer>
      </div>

      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
        sidebarSize={sidebarSize}
        onSidebarSizeChange={setSidebarSize}
      />
    </div>
  )
}

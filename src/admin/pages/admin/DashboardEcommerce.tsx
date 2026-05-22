import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import StatCard from '../../components/admin/StatCard'
import ChartCard from '../../components/admin/ChartCard'
import { adminEcommerceService, type DashboardOverview, type SalesReportItem } from '../../services/adminEcommerce.service'
import { ShoppingCart, DollarSign, AlertCircle, Star } from 'lucide-react'

type Period = '1d' | '7d' | '30d'

const PERIOD_OPTIONS: { value: Period; label: string; days: number }[] = [
  { value: '1d', label: 'Último dia', days: 1 },
  { value: '7d', label: 'Últimos 7 dias', days: 7 },
  { value: '30d', label: 'Últimos 30 dias', days: 30 },
]

const initialOverview: DashboardOverview = {
  totalOrders: 0,
  totalRevenue: 0,
  pendingPayments: 0,
  pendingReviews: 0,
  totalReviews: 0,
  lowStockProducts: 0,
  totalCustomers: 0,
  recentOrders: [],
  pendingReviewQueue: [],
  analytics: {
    mostVisitedProducts: [],
    bestSellingProducts: [],
    abandonedCartsCount: 0,
  },
}

function buildDateRange(days: number): { dateFrom: Date; dateTo: Date } {
  const dateTo = new Date()
  const dateFrom = new Date()
  dateFrom.setDate(dateTo.getDate() - (days - 1))
  dateFrom.setHours(0, 0, 0, 0)
  return { dateFrom, dateTo }
}

export default function DashboardEcommerce() {
  const [period, setPeriod] = useState<Period>('1d')
  const [overview, setOverview] = useState<DashboardOverview>(initialOverview)
  const [sales, setSales] = useState<SalesReportItem[]>([])
  const [loading, setLoading] = useState(true)

  const chartData = useMemo(() => {
    return sales.map((item) => ({
      name: item.date.slice(8, 10) + '/' + item.date.slice(5, 7),
      value: item.revenue,
    }))
  }, [sales])

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      const selectedPeriod = PERIOD_OPTIONS.find((p) => p.value === period)!
      const { dateFrom, dateTo } = buildDateRange(selectedPeriod.days)

      try {
        const [dashboard, salesReport] = await Promise.all([
          adminEcommerceService.getDashboard({
            dateFrom: dateFrom.toISOString(),
            dateTo: dateTo.toISOString(),
          }),
          adminEcommerceService.getSalesReport({
            dateFrom: dateFrom.toISOString(),
            dateTo: dateTo.toISOString(),
          }),
        ])

        setOverview(dashboard)
        setSales(salesReport.items)
      } catch {
        toast.error('Falha ao carregar dashboard de e-commerce')
      } finally {
        setLoading(false)
      }
    }

    void loadData()
  }, [period])

  const selectedPeriodLabel = PERIOD_OPTIONS.find((p) => p.value === period)?.label ?? ''

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">Dashboard E-commerce</h2>

        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          {PERIOD_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setPeriod(option.value)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150 ${
                period === option.value
                  ? 'bg-[#f5c518] text-gray-900 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <StatCard title="Pedidos" value={loading ? '...' : overview.totalOrders} icon={ShoppingCart} iconBgColor="bg-[#f7f3ea]" iconColorClass="text-[#f5c518]" />
        <StatCard title="Receita" value={loading ? '...' : `R$ ${overview.totalRevenue.toFixed(2)}`} icon={DollarSign} iconBgColor="bg-[#f7f3ea]" iconColorClass="text-[#f5c518]" />
        <StatCard title="Pagamentos Pendentes" value={loading ? '...' : overview.pendingPayments} icon={AlertCircle} iconBgColor="bg-[#f7f3ea]" iconColorClass="text-[#f5c518]" />
        <StatCard title="Avaliacoes Pendentes" value={loading ? '...' : overview.pendingReviews} icon={Star} iconBgColor="bg-[#f7f3ea]" iconColorClass="text-[#f5c518]" subtitle={`Baixo estoque: ${overview.lowStockProducts}`} />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sm:p-6">
        <ChartCard title={`Receita — ${selectedPeriodLabel}`} data={chartData} />
      </div>
    </div>
  )
}

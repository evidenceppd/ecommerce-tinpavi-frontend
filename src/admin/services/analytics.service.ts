import { api } from './api'

export interface AnalyticsTrackPayload {
  page?: string
  referrer?: string
  sessionId?: string
  title?: string
}

export interface AnalyticsTrackResponse {
  id: number | null
  counted: boolean
}

export interface AnalyticsStats {
  totalViews: number
  viewsThisMonth: number
  devices: AnalyticsDeviceMonth[]
  dailyAverage: AnalyticsDailyAverage
  last7Days: AnalyticsLast7Day[]
  topPages: AnalyticsTopPage[]
  generatedAt: string
}

export interface AnalyticsViewsMonth {
  count: number
  month: number
}

export interface AnalyticsDeviceMonth {
  device: string
  count: number
}

export interface AnalyticsDailyAverage {
  total: number
  average: number
  period: string
}

export interface AnalyticsLast7Day {
  date: string
  count: number
}

export interface AnalyticsTopPage {
  page: string
  title?: string | null
  views: number
}

export interface AnalyticsCleanupResponse {
  message: string
  deletedCount: number
  olderThan: string
}

export const analyticsService = {
  track: (payload: AnalyticsTrackPayload = {}) => api.post<AnalyticsTrackResponse>('/analytics/track', payload),
  getStats: () => api.get<AnalyticsStats>('/analytics/stats'),
  getViewsMonth: (dateFrom?: string, dateTo?: string) => {
    const query = new URLSearchParams()
    if (dateFrom) query.set('dateFrom', dateFrom)
    if (dateTo) query.set('dateTo', dateTo)
    const qs = query.toString()
    return api.get<AnalyticsViewsMonth>(`/analytics/views-month${qs ? `?${qs}` : ''}`)
  },
  getDevicesMonth: () => api.get<AnalyticsDeviceMonth[]>('/analytics/devices-month'),
  getDailyAverage: () => api.get<AnalyticsDailyAverage>('/analytics/daily-average'),
  getLast7Days: () => api.get<AnalyticsLast7Day[]>('/analytics/last-7-days'),
  getTopPages: (limit = 10) => api.get<AnalyticsTopPage[]>(`/analytics/top-pages?limit=${limit}`),
  cleanup: (days = 90) => api.delete<AnalyticsCleanupResponse>(`/analytics/cleanup?days=${days}`),
}
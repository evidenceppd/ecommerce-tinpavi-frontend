import { describe, expect, it, vi } from 'vitest'

vi.mock('../api', () => ({
  api: {
    getEnvelope: vi.fn(),
    post: vi.fn(),
  },
}))

import { api } from '../api'
import { seoRedirectService } from '../seoRedirect.service'

describe('seoRedirectService', () => {
  it('list requests redirects endpoint with pagination', async () => {
    vi.mocked(api.getEnvelope).mockResolvedValueOnce({
      data: [{ id: 'rd1', fromPath: '/old', toPath: '/new', isActive: true }],
      meta: { total: 1 },
    } as never)

    const result = await seoRedirectService.list({ page: 2, limit: 5 })

    expect(api.getEnvelope).toHaveBeenCalledWith('/admin/redirects?page=2&limit=5')
    expect(result.total).toBe(1)
  })

  it('create posts redirect payload to backend', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ id: 'rd2', fromPath: '/x', toPath: '/y', isActive: true } as never)

    const result = await seoRedirectService.create({ fromPath: '/x', toPath: '/y', isActive: true })

    expect(api.post).toHaveBeenCalledWith('/admin/redirects', { fromPath: '/x', toPath: '/y', isActive: true })
    expect(result.id).toBe('rd2')
  })
})

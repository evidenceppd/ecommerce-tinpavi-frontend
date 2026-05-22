import { describe, expect, it, vi } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

vi.mock('../../services/auth.service', () => ({
  authService: {
    getUsuario: vi.fn(),
  },
}))

import Sidebar from '../../components/admin/Sidebar'
import { authService } from '../../services/auth.service'

describe('Sidebar access control', () => {
  it('hides users menu for editor role', () => {
    vi.mocked(authService.getUsuario).mockReturnValue({ role: 'EDITOR' } as never)

    const html = renderToStaticMarkup(
      createElement(Sidebar, {
        isOpen: true,
        isMobile: false,
        activePage: 'dashboard',
      }),
    )

    expect(html).not.toContain('Usuários')
  })

  it('shows users menu for admin roles', () => {
    vi.mocked(authService.getUsuario).mockReturnValue({ role: 'ADMIN' } as never)

    const html = renderToStaticMarkup(
      createElement(Sidebar, {
        isOpen: true,
        isMobile: false,
        activePage: 'dashboard',
      }),
    )

    expect(html).toContain('Usuários')
  })
})

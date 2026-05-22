import type { ComponentType } from 'react'

type AdminModuleLoader = () => Promise<{ default: ComponentType<any> }>

export const adminModuleLoaders = {
  'content-hero': () => import('../pages/admin/HeroEditor'),
  'customization-hero-main': () => import('../pages/admin/HeroEditor'),
  'customization-blog-banner': () => import('../pages/admin/HeroEditor'),
  'content-banners-home': () => import('../pages/admin/BannersHome'),
  'content-receitas': () => import('../pages/admin/SobreNos'),
  'content-blog': () => import('../pages/admin/Noticias'),
  'content-projetos': () => import('../pages/admin/Procedimentos'),
  'content-equipe': () => import('../pages/admin/Equipe'),
  'content-fale-conosco': () => import('../pages/admin/FaleConosco'),
  usuarios: () => import('../pages/admin/Usuarios'),
  'editar-perfil': () => import('../pages/admin/EditarPerfil'),
  'ecommerce-dashboard': () => import('../pages/admin/DashboardEcommerce'),
  'ecommerce-products': () => import('../pages/admin/Produtos'),
  'ecommerce-categories': () => import('../pages/admin/CategoriasProdutos'),
  'ecommerce-orders': () => import('../pages/admin/Pedidos'),
  'ecommerce-coupons': () => import('../pages/admin/Cupons'),
  'ecommerce-customers': () => import('../pages/admin/Clientes'),
  'ecommerce-reviews': () => import('../pages/admin/Avaliacoes'),
  'ecommerce-payments': () => import('../pages/admin/Pagamentos'),
  'ecommerce-redirects': () => import('../pages/admin/SeoRedirects'),
} as const satisfies Record<string, AdminModuleLoader>

export type AdminModuleId = keyof typeof adminModuleLoaders

const preloadedModules = new Set<AdminModuleId>()

function hasModuleId(value: string): value is AdminModuleId {
  return Object.prototype.hasOwnProperty.call(adminModuleLoaders, value)
}

export function getAdminModuleLoader(moduleId: AdminModuleId): AdminModuleLoader {
  return adminModuleLoaders[moduleId]
}

export function preloadAdminModule(moduleId: string): void {
  if (!hasModuleId(moduleId)) {
    return
  }

  if (preloadedModules.has(moduleId)) {
    return
  }

  preloadedModules.add(moduleId)
  void adminModuleLoaders[moduleId]().catch(() => {
    preloadedModules.delete(moduleId)
  })
}

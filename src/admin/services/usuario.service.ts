import { api } from './api'

export interface Usuario {
  id: string
  nome: string
  email: string
  role: 'admin' | 'master' | 'editor'
  ativo?: boolean
  first_login?: boolean
  emailPendente?: boolean
  emailMasked?: string
}

type BackendRole = 'EDITOR' | 'ADMIN' | 'MASTER'

interface BackendCustomer {
  id: string
  name: string
  email: string
  role: BackendRole
  isActive?: boolean
  firstLogin?: boolean
  phone?: string | null
}

function mapRoleFromBackend(role: BackendRole): Usuario['role'] {
  if (role === 'MASTER') return 'master'
  if (role === 'ADMIN') return 'admin'
  return 'editor'
}

function mapRoleToBackend(role: Usuario['role']): BackendRole {
  if (role === 'master') return 'MASTER'
  if (role === 'admin') return 'ADMIN'
  return 'EDITOR'
}

function mapBackendCustomer(customer: BackendCustomer): Usuario {
  return {
    id: customer.id,
    nome: customer.name,
    email: customer.email,
    role: mapRoleFromBackend(customer.role),
    ativo: Boolean(customer.isActive ?? true),
    first_login: customer.firstLogin ?? false,
    emailPendente: false,
  }
}

export const usuarioService = {
  getAll: async () => {
    const response = await api.get<BackendCustomer[]>('/users')
    return response.map(mapBackendCustomer)
  },
  getMe: async () => {
    const response = await api.get<BackendCustomer>('/users/me')
    return mapBackendCustomer(response)
  },
  create: async (data: Omit<Usuario, 'id'> & { senha: string }) => {
    const response = await api.post<BackendCustomer>('/users', {
      name: data.nome,
      email: data.email,
      password: data.senha,
      role: mapRoleToBackend(data.role),
      isActive: data.ativo ?? true,
      firstLogin: data.first_login ?? false,
    })
    return mapBackendCustomer(response)
  },
  update: async (id: string, data: Partial<Usuario> & { senha?: string; novaSenha?: string }) => {
    const response = await api.patch<BackendCustomer>(`/users/${id}`, {
      name: data.nome,
      email: data.email,
      role: data.role ? mapRoleToBackend(data.role) : undefined,
      password: data.novaSenha || data.senha,
      isActive: data.ativo,
      firstLogin: data.first_login,
    })
    return mapBackendCustomer(response)
  },
  updateMe: async (data: { nome?: string; email?: string; senha?: string }) => {
    const response = await api.put<BackendCustomer>('/users/me', {
      name: data.nome,
      email: data.email,
      password: data.senha,
    })
    return mapBackendCustomer(response)
  },
  delete: (id: string) => api.delete(`/users/${id}`),
  sendConfirmation: async (id: string) => api.post<{ emailMasked: string }>(`/users/${id}/send-confirmation`, {}),
  confirmEmail: async (id: string, code: string) => {
    const response = await api.post<BackendCustomer>(`/users/${id}/confirm-email`, { code })
    return mapBackendCustomer(response)
  },
}

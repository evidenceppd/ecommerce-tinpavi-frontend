import { api } from './api'

export interface Contato {
  id: string
  nome: string
  email: string
  telefone: string
  tipo_assunto: string
  mensagem: string
  createdAt: string
}

export function labelTipoAssunto(tipo: string): string {
  const labels: Record<string, string> = {
    duvida: 'Duvida',
    sugestao: 'Sugestao',
    reclamacao: 'Reclamacao',
    elogio: 'Elogio',
    outros: 'Outros',
  }
  return labels[tipo] ?? tipo
}

export const contatoService = {
  getAll: () => api.get<Contato[]>('/contatos'),
  delete: (id: string) => api.delete(`/contatos/${id}`),
}

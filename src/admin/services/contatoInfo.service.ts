import { useState, useEffect } from 'react'
import { api } from './api'

export interface ContatoInfo {
  id: number
  email: string
  endereco: string
  link_maps: string
  horario_funcionamento: string
  telefone_1: string
  telefone_2: string
  whatsapp: string
  link_instagram: string
  link_facebook: string
  link_linkedin: string
  link_youtube: string
}

export type ContatoInfoPayload = Omit<ContatoInfo, 'id'>

export const CONTATO_INFO_DEFAULTS: ContatoInfoPayload = {
  email: 'atacadaodastripas@gmail.com',
  endereco: 'Rua xxx, 00, xxxx/XX',
  link_maps: '',
  horario_funcionamento: 'Segunda a sexta, das 8h as 18h',
  telefone_1: '(99) 99999-9999',
  telefone_2: '(00) 0000-0000',
  whatsapp: '',
  link_instagram: '#',
  link_facebook: '#',
  link_linkedin: '#',
  link_youtube: '#',
}

const CONTACT_STORAGE_KEY = 'tinpavi_contact_info'

function isHttpError(error: unknown): error is { response?: { status?: number } } {
  return Boolean(error && typeof error === 'object' && 'response' in error)
}

export const contatoInfoService = {
  async getPublic(): Promise<ContatoInfo | null> {
    try {
      return await api.get<ContatoInfo>('/contato')
    } catch (error) {
      if (isHttpError(error) && error.response?.status === 404) {
        const stored = localStorage.getItem(CONTACT_STORAGE_KEY)
        if (!stored) return { id: 1, ...CONTATO_INFO_DEFAULTS }
        try {
          return { id: 1, ...CONTATO_INFO_DEFAULTS, ...JSON.parse(stored) }
        } catch {
          return { id: 1, ...CONTATO_INFO_DEFAULTS }
        }
      }
      throw error
    }
  },

  async update(payload: ContatoInfoPayload): Promise<ContatoInfo> {
    try {
      const saved = await api.put<ContatoInfo>('/contato', payload)
      _cache = saved
      _promise = Promise.resolve(saved)
      return saved
    } catch (error) {
      if (isHttpError(error) && error.response?.status === 404) {
        localStorage.setItem(CONTACT_STORAGE_KEY, JSON.stringify(payload))
        const saved = { id: 1, ...payload }
        _cache = saved
        _promise = Promise.resolve(saved)
        return saved
      }
      throw error
    }
  },
}

// ── Helpers ──────────────────────────────────────────────────────────────────

export function toWhatsAppHref(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (!digits) return '#'
  const withCC = digits.startsWith('55') ? digits : `55${digits}`
  return `https://wa.me/${withCC}`
}

// ── Shared hook (module-level cache, single API call) ─────────────────────────

let _cache: ContatoInfo | null = null
let _promise: Promise<ContatoInfo | null> | null = null

export function useContatoInfo(): ContatoInfo | null {
  const [data, setData] = useState<ContatoInfo | null>(_cache)

  useEffect(() => {
    if (_cache) { setData(_cache); return }
    if (!_promise) _promise = contatoInfoService.getPublic()
    _promise
      .then((d) => { _cache = d; setData(d) })
      .catch(() => {})
  }, [])

  return data
}

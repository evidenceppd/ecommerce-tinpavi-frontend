import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  Save,
  Share2,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  CONTATO_INFO_DEFAULTS,
  contatoInfoService,
  type ContatoInfoPayload,
} from '../../services/contatoInfo.service'

type ContatoForm = ContatoInfoPayload
type ContatoErrors = Partial<Record<keyof ContatoForm, string>>

const contactDefaults: ContatoForm = {
  ...CONTATO_INFO_DEFAULTS,
}

function formatPhone(value: string): string {
  const numbers = value.replace(/\D/g, '').slice(0, 11)
  if (numbers.length <= 2) return numbers
  if (numbers.length <= 6) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`
  if (numbers.length <= 10) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`
}

function isValidUrl(value: string): boolean {
  if (!value.trim() || value.trim() === '#') return true
  return /^https?:\/\/.+/i.test(value.trim())
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="mt-1 text-xs font-medium text-red-600">{message}</p>
}

export default function FaleConosco() {
  const [form, setForm] = useState<ContatoForm>(contactDefaults)
  const [errors, setErrors] = useState<ContatoErrors>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let mounted = true

    async function loadContact() {
      try {
        setLoading(true)
        const data = await contatoInfoService.getPublic()
        if (!mounted) return
        if (data && !Array.isArray(data)) {
          const { id: _id, ...payload } = data
          void _id
          setForm({ ...contactDefaults, ...payload })
        }
      } catch (error) {
        console.error('Erro ao carregar contato:', error)
        toast.error('Nao foi possivel carregar os dados de contato.')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadContact()
    return () => {
      mounted = false
    }
  }, [])

  const socialLinks = useMemo(
    () => [
      { key: 'link_instagram' as const, label: 'Instagram', icon: Share2, value: form.link_instagram },
      { key: 'link_facebook' as const, label: 'Facebook', icon: Share2, value: form.link_facebook },
      { key: 'link_linkedin' as const, label: 'LinkedIn', icon: Share2, value: form.link_linkedin },
      { key: 'link_youtube' as const, label: 'YouTube', icon: Share2, value: form.link_youtube },
    ],
    [form.link_facebook, form.link_instagram, form.link_linkedin, form.link_youtube],
  )

  const updateField = (field: keyof ContatoForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
    setErrors(prev => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  const validate = () => {
    const nextErrors: ContatoErrors = {}

    if (!form.whatsapp.trim()) nextErrors.whatsapp = 'Informe o numero do WhatsApp.'
    if (!form.horario_funcionamento.trim()) nextErrors.horario_funcionamento = 'Informe o horario de funcionamento.'
    if (!form.email.trim()) {
      nextErrors.email = 'Informe o e-mail.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = 'Informe um e-mail valido.'
    }
    if (!form.endereco.trim()) nextErrors.endereco = 'Informe o endereco.'
    if (!isValidUrl(form.link_maps)) nextErrors.link_maps = 'Use uma URL iniciada por http:// ou https://.'
    if (!isValidUrl(form.link_instagram)) nextErrors.link_instagram = 'Use uma URL valida ou deixe #.'
    if (!isValidUrl(form.link_facebook)) nextErrors.link_facebook = 'Use uma URL valida ou deixe #.'
    if (!isValidUrl(form.link_linkedin)) nextErrors.link_linkedin = 'Use uma URL valida ou deixe #.'
    if (!isValidUrl(form.link_youtube)) nextErrors.link_youtube = 'Use uma URL valida ou deixe #.'

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!validate()) {
      toast.error('Revise os campos destacados.')
      return
    }

    try {
      setSaving(true)
      const saved = await contatoInfoService.update(form)
      const { id: _id, ...payload } = saved
      void _id
      setForm({ ...contactDefaults, ...payload })
      toast.success('Contato salvo com sucesso.')
    } catch (error) {
      console.error('Erro ao salvar contato:', error)
      toast.error('Erro ao salvar os dados de contato.')
    } finally {
      setSaving(false)
    }
  }

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#f5c518] focus:ring-4 focus:ring-[#f5c518]/20'
  const labelClass = 'mb-1.5 block text-sm font-bold text-slate-700'
  const errorClass = 'border-red-300 focus:border-red-400 focus:ring-red-100'

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[#f5c518]">Conteudo do site</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-950">Contato</h1>
          <p className="mt-1 text-sm text-slate-500">
            Edite WhatsApp, horario de atendimento, e-mail, endereco e links sociais exibidos no site.
          </p>
        </div>

      </div>

      <div>
        <form onSubmit={handleSave} className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-6">
            <h2 className="text-xl font-bold text-slate-950">Informacoes de atendimento</h2>
            <p className="mt-1 text-sm text-slate-500">Dados principais usados em botoes, rodape e area de contato.</p>
          </div>

          <div className="grid gap-5 p-6 md:grid-cols-2">
            <div>
              <label className={labelClass}>WhatsApp</label>
              <input
                value={form.whatsapp}
                onChange={(event) => updateField('whatsapp', formatPhone(event.target.value))}
                className={`${inputClass} ${errors.whatsapp ? errorClass : ''}`}
                placeholder="(11) 99999-9999"
              />
              <FieldError message={errors.whatsapp} />
            </div>

            <div>
              <label className={labelClass}>Horario de funcionamento</label>
              <input
                value={form.horario_funcionamento}
                onChange={(event) => updateField('horario_funcionamento', event.target.value)}
                className={`${inputClass} ${errors.horario_funcionamento ? errorClass : ''}`}
                placeholder="Segunda a sexta, das 8h as 18h"
              />
              <FieldError message={errors.horario_funcionamento} />
            </div>

            <div>
              <label className={labelClass}>E-mail</label>
              <input
                type="email"
                value={form.email}
                onChange={(event) => updateField('email', event.target.value)}
                className={`${inputClass} ${errors.email ? errorClass : ''}`}
                placeholder="contato@tinpavi.com.br"
              />
              <FieldError message={errors.email} />
            </div>

            <div>
              <label className={labelClass}>Telefone comercial</label>
              <input
                value={form.telefone_1}
                onChange={(event) => updateField('telefone_1', formatPhone(event.target.value))}
                className={inputClass}
                placeholder="(11) 3333-3333"
              />
            </div>

           

            <div>
              <label className={labelClass}>Link do Google Maps</label>
              <input
                value={form.link_maps}
                onChange={(event) => updateField('link_maps', event.target.value)}
                className={`${inputClass} ${errors.link_maps ? errorClass : ''}`}
                placeholder="https://maps.google.com/..."
              />
              <FieldError message={errors.link_maps} />
            </div>

            <div className="md:col-span-2">
              <label className={labelClass}>Endereco</label>
              <textarea
                value={form.endereco}
                onChange={(event) => updateField('endereco', event.target.value)}
                className={`${inputClass} min-h-24 resize-y ${errors.endereco ? errorClass : ''}`}
                placeholder="Rua, numero, bairro, cidade - UF"
              />
              <FieldError message={errors.endereco} />
            </div>
          </div>

          <div className="border-t border-slate-100 p-6">
            <h3 className="text-lg font-bold text-slate-950">Redes sociais</h3>
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {socialLinks.map(({ key, label, icon: Icon }) => (
                <div key={key}>
                  <label className={labelClass}>
                    <span className="inline-flex items-center gap-2">
                      <Icon size={16} className="text-[#f5c518]" />
                      {label}
                    </span>
                  </label>
                  <input
                    value={form[key]}
                    onChange={(event) => updateField(key, event.target.value)}
                    className={`${inputClass} ${errors[key] ? errorClass : ''}`}
                    placeholder={`https://${label.toLowerCase()}.com/tinpavi`}
                  />
                  <FieldError message={errors[key]} />
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-100 p-6 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setForm(contactDefaults)}
              className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Restaurar padrao
            </button>
            <button
              type="submit"
              disabled={saving || loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#f5c518] px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-[#e4b80f] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save size={16} />
              {saving ? 'Salvando...' : 'Salvar contato'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

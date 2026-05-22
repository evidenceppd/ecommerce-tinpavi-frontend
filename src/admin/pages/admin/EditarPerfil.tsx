import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, CheckCircle2, Eye, EyeOff, KeyRound, Mail, Save, Shield, User } from 'lucide-react'
import { toast } from 'sonner'
import { usuarioService } from '../../services/usuario.service'
import { authService, type LoginResponse } from '../../services/auth.service'

interface EditarPerfilProps {
  onBack?: () => void
}

export default function EditarPerfil({ onBack }: EditarPerfilProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [showNovaSenha, setShowNovaSenha] = useState(false)
  const [showConfirmarSenha, setShowConfirmarSenha] = useState(false)

  const currentUser = authService.getUsuario()
  const roleLabel = currentUser?.role === 'ADMIN' ? 'Administrador' : 'Editor'
  const initials = useMemo(() => {
    const source = nome || currentUser?.nome || 'U'
    return source
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0])
      .join('')
      .toUpperCase()
  }, [currentUser?.nome, nome])

  useEffect(() => {
    void loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      setLoading(true)
      const userData = await usuarioService.getMe()
      setNome(userData.nome)
      setEmail(userData.email)
    } catch (error) {
      console.error('Erro ao carregar dados do usuario:', error)
      toast.error('Erro ao carregar seus dados.')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!nome.trim()) {
      toast.error('Nome e obrigatorio.')
      return
    }

    if (!email.trim()) {
      toast.error('E-mail e obrigatorio.')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error('Informe um e-mail valido.')
      return
    }

    if (novaSenha || confirmarSenha) {
      if (novaSenha !== confirmarSenha) {
        toast.error('As senhas nao coincidem.')
        return
      }
      if (novaSenha.length < 8) {
        toast.error('A nova senha deve ter pelo menos 8 caracteres.')
        return
      }
    }

    setSaving(true)
    try {
      const updateData: { nome: string; email: string; senha?: string } = {
        nome: nome.trim(),
        email: email.trim(),
      }
      if (novaSenha) updateData.senha = novaSenha

      const updatedUser = await usuarioService.updateMe(updateData)
      const storedData = authService.getUsuario()

      if (storedData) {
        const newUserData: LoginResponse['usuario'] = {
          ...storedData,
          nome: updatedUser.nome,
          email: updatedUser.email,
        }
        localStorage.setItem('usuario', JSON.stringify(newUserData))
      }

      setNovaSenha('')
      setConfirmarSenha('')
      toast.success('Perfil atualizado com sucesso.')
    } catch (error: any) {
      console.error('Erro ao atualizar perfil:', error)
      toast.error(error?.response?.data?.error || 'Erro ao atualizar perfil.')
    } finally {
      setSaving(false)
    }
  }

  const inputClass =
    'h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950 outline-none transition focus:border-[#f5c518] focus:ring-4 focus:ring-[#f5c518]/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400'
  const labelClass = 'mb-1.5 block text-sm font-bold text-slate-700'

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 text-sm font-semibold text-slate-500 shadow-sm">
          Carregando seus dados...
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-[#f5c518] hover:text-slate-950 cursor-pointer"
              aria-label="Voltar"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[#f5c518]">Minha conta</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-950">Editar perfil</h1>
            <p className="mt-1 text-sm text-slate-500">Atualize dados de acesso e seguranca da sua conta administrativa.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#f5c518] text-xl font-bold text-slate-950">
                {initials}
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-xl font-bold text-slate-950">{nome || 'Usuario'}</h2>
                <p className="truncate text-sm text-slate-500">{email}</p>
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Perfil</p>
                <div className="mt-2 flex items-center gap-2 text-sm font-bold text-slate-800">
                  <Shield size={16} className="text-[#f5c518]" />
                  {roleLabel}
                </div>
              </div>
              <div className="rounded-xl bg-emerald-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-600">Status</p>
                <div className="mt-2 flex items-center gap-2 text-sm font-bold text-emerald-700">
                  <CheckCircle2 size={16} />
                  Conta ativa
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#f5c518]/30 bg-[#f5c518]/10 p-5">
            <div className="flex items-start gap-3">
              <Shield size={18} className="mt-0.5 shrink-0 text-[#8a6a00]" />
              <div>
                <p className="text-sm font-bold text-slate-950">Autenticacao em duas etapas</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Um codigo e enviado ao e-mail em cada acesso administrativo.
                </p>
              </div>
            </div>
          </div>
        </aside>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-6">
            <h2 className="text-xl font-bold text-slate-950">Dados do perfil</h2>
            <p className="mt-1 text-sm text-slate-500">Altere as informacoes usadas para acessar o painel.</p>
          </div>

          <div className="grid gap-6 p-6 lg:grid-cols-2">
            <div>
              <label className={labelClass}>Nome</label>
              <div className="relative">
                <User size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={nome}
                  onChange={(event) => setNome(event.target.value)}
                  placeholder="Digite seu nome"
                  disabled={saving}
                  className={`${inputClass} pl-11`}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>E-mail</label>
              <div className="relative">
                <Mail size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Digite seu e-mail"
                  disabled={saving}
                  className={`${inputClass} pl-11`}
                />
              </div>
            </div>

            <div className="lg:col-span-2">
              <label className={labelClass}>Perfil de acesso</label>
              <div className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700">
                <Shield size={17} className="text-[#f5c518]" />
                {roleLabel}
              </div>
              <p className="mt-2 text-xs text-slate-500">Seu perfil de permissao so pode ser alterado por outro administrador.</p>
            </div>
          </div>

          <div className="border-t border-slate-100 p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f5c518]/15 text-[#8a6a00]">
                <KeyRound size={18} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-950">Alterar senha</h3>
                <p className="text-sm text-slate-500">Preencha apenas se quiser trocar sua senha atual.</p>
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <PasswordField
                label="Nova senha"
                value={novaSenha}
                placeholder="Minimo 8 caracteres"
                show={showNovaSenha}
                disabled={saving}
                onToggle={() => setShowNovaSenha(prev => !prev)}
                onChange={setNovaSenha}
                inputClass={inputClass}
              />
              <PasswordField
                label="Confirmar nova senha"
                value={confirmarSenha}
                placeholder="Repita a nova senha"
                show={showConfirmarSenha}
                disabled={saving}
                onToggle={() => setShowConfirmarSenha(prev => !prev)}
                onChange={setConfirmarSenha}
                inputClass={inputClass}
              />
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50 p-6 sm:flex-row sm:justify-end">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                disabled={saving}
                className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
              >
                Cancelar
              </button>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#f5c518] px-5 text-sm font-bold text-slate-950 transition hover:bg-[#e4b80f] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
            >
              <Save size={16} />
              {saving ? 'Salvando...' : 'Salvar alteracoes'}
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}

function PasswordField({
  label,
  value,
  placeholder,
  show,
  disabled,
  onToggle,
  onChange,
  inputClass,
}: {
  label: string
  value: string
  placeholder: string
  show: boolean
  disabled: boolean
  onToggle: () => void
  onChange: (value: string) => void
  inputClass: string
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-bold text-slate-700">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={`${inputClass} pr-11`}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-[#8a6a00] cursor-pointer"
          aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  )
}

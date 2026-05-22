import { useState, type FormEvent } from 'react'
import { Eye, EyeOff, Lock, KeyRound, AlertCircle, CheckCircle } from 'lucide-react'
import { usuarioService } from '../../services/usuario.service'
import { authService } from '../../services/auth.service'
import { toast } from 'sonner'

const siteLogoUrl = '/logo-tinpavi.webp'

export default function RedefinirSenha({ onComplete }: { onComplete?: () => void } = {}) {
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [showNovaSenha, setShowNovaSenha] = useState(false)
  const [showConfirmarSenha, setShowConfirmarSenha] = useState(false)
  const [loading, setLoading] = useState(false)

  const usuario = authService.getUsuario()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    if (novaSenha.length < 8) {
      toast.error('A senha deve ter pelo menos 8 caracteres')
      return
    }

    if (novaSenha !== confirmarSenha) {
      toast.error('As senhas não coincidem')
      return
    }

    setLoading(true)
    try {
      await usuarioService.updateMe({ senha: novaSenha })

      const stored = authService.getUsuario()
      if (stored) {
        sessionStorage.setItem('admin_usuario', JSON.stringify({ ...stored, first_login: false }))
      }

      toast.success('Senha definida com sucesso! Bem-vindo(a)!')
      if (onComplete) {
        onComplete()
      } else {
        window.location.href = '/admin'
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      toast.error(e.response?.data?.error ?? 'Erro ao salvar a nova senha. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const inputCls =
    'h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-10 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[#f5c518] focus:ring-2 focus:ring-[#f5c518]/20'

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F6F7F9] p-4 text-slate-950">
      <div className="w-full max-w-[460px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-950/8">
        <div className="border-b border-slate-100 px-7 py-6 flex flex-col items-center gap-2">
          <img src={siteLogoUrl} alt="Tinpavi" className="h-11 w-auto" />
          <p className="mt-5 text-xs font-bold uppercase tracking-wide text-[#f5c518]">Painel administrativo</p>
          <h1 className="mt-1 text-2xl font-black text-slate-950">Redefinir senha</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {usuario?.nome ? `Ola, ${usuario.nome}. ` : ''}
            Crie uma nova senha para continuar no painel.
          </p>
        </div>

        <div className="flex items-start gap-3 border-b border-[#f5c518]/30 bg-[#fff9db] px-7 py-4">
          <AlertCircle size={18} className="mt-0.5 shrink-0 text-[#b08900]" />
          <div>
            <p className="text-sm font-bold text-slate-950">
              Redefinição de senha obrigatória
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-600">
              Por segurança, defina uma nova senha antes de acessar os recursos administrativos.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-7 py-6">
          <div className="mb-1 flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f5c518]/15 text-[#c99b00]">
              <KeyRound size={20} />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-950">Criar nova senha</h2>
              <p className="text-xs text-slate-500">Mínimo de 8 caracteres</p>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-bold text-slate-700">
              Nova senha
            </label>
            <div className="relative">
              <Lock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showNovaSenha ? 'text' : 'password'}
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                required
                autoFocus
                autoComplete="new-password"
                placeholder="Digite sua nova senha"
                className={inputCls}
              />
              <button
                type="button"
                onClick={() => setShowNovaSenha((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700 cursor-pointer"
                tabIndex={-1}
              >
                {showNovaSenha ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {novaSenha.length > 0 && novaSenha.length < 8 && (
              <p className="flex items-center gap-1 text-xs font-medium text-red-600">
                <AlertCircle size={11} /> Mínimo de 8 caracteres
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-bold text-slate-700">
              Confirmar nova senha
            </label>
            <div className="relative">
              <Lock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showConfirmarSenha ? 'text' : 'password'}
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="Confirme sua nova senha"
                className={inputCls}
              />
              <button
                type="button"
                onClick={() => setShowConfirmarSenha((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700 cursor-pointer"
                tabIndex={-1}
              >
                {showConfirmarSenha ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {confirmarSenha.length > 0 && novaSenha !== confirmarSenha && (
              <p className="flex items-center gap-1 text-xs font-medium text-red-600">
                <AlertCircle size={11} /> As senhas não coincidem
              </p>
            )}
            {confirmarSenha.length > 0 && novaSenha === confirmarSenha && novaSenha.length >= 8 && (
              <p className="flex items-center gap-1 text-xs font-medium text-emerald-700">
                <CheckCircle size={11} /> Senhas coincidem
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || novaSenha.length < 8 || novaSenha !== confirmarSenha}
            className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#f5c518] text-sm font-black text-slate-950 transition hover:bg-[#e0b614] focus:outline-none focus:ring-4 focus:ring-[#f5c518]/30 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Salvando...
              </>
            ) : (
              'Salvar nova senha e entrar'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

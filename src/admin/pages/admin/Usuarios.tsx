import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { usuarioService, type Usuario } from '../../services/usuario.service'
import { authService } from '../../services/auth.service'
import { Select } from '../../components/shared/Select'
import { CheckCircle, Edit, Eye, EyeOff, Key, Mail, Search, Trash2, Users, X } from 'lucide-react'

type Role = Usuario['role']

function roleLabel(role: string) {
  const normalized = role?.toLowerCase()
  if (normalized === 'master') return 'Master'
  if (normalized === 'admin') return 'Administrador'
  return 'Editor'
}

function roleClass(role: string) {
  const normalized = role?.toLowerCase()
  if (normalized === 'master') return 'bg-violet-50 text-violet-700'
  if (normalized === 'admin') return 'bg-red-50 text-red-700'
  return 'bg-blue-50 text-blue-700'
}

function statusLabel(user: Usuario) {
  if (user.emailPendente) return 'Aguardando confirmação'
  if (user.ativo) return 'Ativo'
  return 'Inativo'
}

function statusClass(user: Usuario) {
  if (user.emailPendente) return 'bg-amber-50 text-amber-700'
  if (user.ativo) return 'bg-emerald-50 text-emerald-700'
  return 'bg-red-50 text-red-700'
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<{ id: string; role: string } | null>(() => authService.getUsuario())

  const currentRole = currentUser?.role?.toLowerCase()
  const canCreateUsers = currentRole === 'admin' || currentRole === 'master'

  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [role, setRole] = useState<Role>('editor')
  const [ativo, setAtivo] = useState(true)
  const [firstLogin, setFirstLogin] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [savingUsuario, setSavingUsuario] = useState(false)

  const [confirmModalOpen, setConfirmModalOpen] = useState(false)
  const [confirmingUsuario, setConfirmingUsuario] = useState<{ id: string; emailMasked: string } | null>(null)
  const [confirmCode, setConfirmCode] = useState('')
  const [confirmingCode, setConfirmingCode] = useState(false)
  const [resendingCode, setResendingCode] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Usuario | null>(null)
  const [deletingUsuario, setDeletingUsuario] = useState(false)

  const loadUsuarios = async () => {
    try {
      setLoading(true)
      const data = await usuarioService.getAll()
      setUsuarios(data)
      setSelectedUserId((current) => current ?? data[0]?.id ?? null)
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
      toast.error('Erro ao carregar usuários')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadUsuarios()
  }, [])

  useEffect(() => {
    if (currentUser) return

    usuarioService.getMe()
      .then((user) => setCurrentUser({ id: user.id, role: user.role }))
      .catch(() => {})
  }, [currentUser])

  const usuariosFiltrados = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    if (!query) return usuarios

    return usuarios.filter((usuario) => (
      [usuario.nome, usuario.email, usuario.role, statusLabel(usuario)]
        .join(' ')
        .toLowerCase()
        .includes(query)
    ))
  }, [usuarios, searchTerm])

  const selectedUser = useMemo(() => (
    usuarios.find((usuario) => usuario.id === selectedUserId) ?? usuariosFiltrados[0] ?? null
  ), [usuarios, usuariosFiltrados, selectedUserId])

  const stats = useMemo(() => ({
    total: usuarios.length,
    active: usuarios.filter((usuario) => usuario.ativo).length,
    admins: usuarios.filter((usuario) => usuario.role?.toLowerCase() === 'admin').length,
    editors: usuarios.filter((usuario) => usuario.role?.toLowerCase() === 'editor').length,
  }), [usuarios])

  const canManage = (usuario: Usuario) => (
    String(usuario.id) !== String(currentUser?.id) && usuario.role?.toLowerCase() !== 'master'
  )

  const needsEmailValidation = (usuario: Usuario) => !usuario.ativo || Boolean(usuario.emailPendente)

  const resetForm = () => {
    setEditingUsuario(null)
    setNome('')
    setEmail('')
    setSenha('')
    setConfirmarSenha('')
    setRole('editor')
    setAtivo(true)
    setFirstLogin(false)
    setShowPassword(false)
    setShowConfirmPassword(false)
  }

  const handleOpenCreate = () => {
    resetForm()
    setModalOpen(true)
    requestAnimationFrame(() => requestAnimationFrame(() => setModalVisible(true)))
  }

  const handleEdit = (usuario: Usuario) => {
    setEditingUsuario(usuario)
    setNome(usuario.nome)
    setEmail(usuario.email)
    setSenha('')
    setConfirmarSenha('')
    setRole(usuario.role)
    setAtivo(Boolean(usuario.ativo))
    setFirstLogin(false)
    setModalOpen(true)
    requestAnimationFrame(() => requestAnimationFrame(() => setModalVisible(true)))
  }

  const handleCloseModal = () => {
    setModalVisible(false)
    setTimeout(() => {
      setModalOpen(false)
      resetForm()
    }, 220)
  }

  const handleSave = async () => {
    if (!nome.trim()) {
      toast.error('Nome é obrigatório')
      return
    }

    if (!email.trim()) {
      toast.error('Email é obrigatório')
      return
    }

    if (!editingUsuario && !senha) {
      toast.error('Senha é obrigatória para novos usuários')
      return
    }

    if (senha && senha.length < 8) {
      toast.error('Senha deve ter pelo menos 8 caracteres')
      return
    }

    if (senha && senha !== confirmarSenha) {
      toast.error('As senhas não coincidem')
      return
    }

    setSavingUsuario(true)

    try {
      const data: Partial<Usuario> & { senha?: string; first_login?: boolean } = {
        nome,
        email,
        role,
        ativo,
        first_login: firstLogin,
      }

      if (senha) data.senha = senha

      if (editingUsuario) {
        await usuarioService.update(editingUsuario.id, data)
        toast.success('Usuário atualizado com sucesso')
        await loadUsuarios()
        handleCloseModal()
      } else {
        const created = await usuarioService.create({ ...data, ativo: false } as Omit<Usuario, 'id'> & { senha: string })
        const result = await usuarioService.sendConfirmation(created.id)
        setConfirmingUsuario({ id: created.id, emailMasked: result.emailMasked })
        setConfirmCode('')
        setConfirmModalOpen(true)
        toast.success('Usuário criado. Código enviado ao e-mail.')
        await loadUsuarios()
        handleCloseModal()
      }
    } catch (error: any) {
      console.error('Erro ao salvar usuário:', error)
      toast.error(error?.response?.data?.error || 'Erro ao salvar usuário')
    } finally {
      setSavingUsuario(false)
    }
  }

  const handleSendConfirmation = async (userId: string) => {
    setResendingCode(true)
    try {
      const result = await usuarioService.sendConfirmation(userId)
      setConfirmingUsuario({ id: userId, emailMasked: result.emailMasked })
      setConfirmCode('')
      setConfirmModalOpen(true)
      toast.info('Código enviado ao e-mail do usuário')
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Erro ao enviar código de confirmação')
    } finally {
      setResendingCode(false)
    }
  }

  const handleConfirmEmail = async () => {
    if (!confirmingUsuario) return
    if (confirmCode.trim().length !== 6) {
      toast.error('Digite o código de 6 dígitos')
      return
    }

    setConfirmingCode(true)
    try {
      await usuarioService.confirmEmail(confirmingUsuario.id, confirmCode.trim())
      toast.success('E-mail confirmado')
      setConfirmModalOpen(false)
      setConfirmingUsuario(null)
      setConfirmCode('')
      await loadUsuarios()
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Código inválido ou expirado')
    } finally {
      setConfirmingCode(false)
    }
  }

  const handleResendCode = async () => {
    if (!confirmingUsuario) return
    setResendingCode(true)
    try {
      const result = await usuarioService.sendConfirmation(confirmingUsuario.id)
      setConfirmingUsuario((prev) => prev ? { ...prev, emailMasked: result.emailMasked } : null)
      setConfirmCode('')
      toast.info('Novo código enviado')
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Erro ao reenviar código')
    } finally {
      setResendingCode(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return

    const id = deleteTarget.id
    if (String(id) === String(currentUser?.id)) {
      toast.error('Você não pode excluir seu próprio usuário')
      return
    }

    setDeletingUsuario(true)
    try {
      await usuarioService.delete(id)
      setUsuarios((current) => current.filter((usuario) => usuario.id !== id))
      if (selectedUserId === id) setSelectedUserId(null)
      setDeleteTarget(null)
      toast.success('Usuário removido com sucesso')
    } catch (error) {
      console.error('Erro ao remover usuário:', error)
      toast.error('Erro ao remover usuário')
    } finally {
      setDeletingUsuario(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[#f5c518]">Administração</p>
          <h2 className="text-2xl font-bold text-slate-950">Usuários</h2>
          <p className="text-sm text-slate-500">Gerencie acessos, perfis e status dos usuários administrativos.</p>
        </div>
        {canCreateUsers && (
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#f5c518] px-5 text-sm font-bold text-slate-950 transition hover:bg-[#e0b20f] cursor-pointer"
          >
            <Users size={17} />
            Novo usuário
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">Total</p>
          <p className="mt-1 text-2xl font-black text-slate-950">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">Ativos</p>
          <p className="mt-1 text-2xl font-black text-emerald-700">{stats.active}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">Administradores</p>
          <p className="mt-1 text-2xl font-black text-slate-950">{stats.admins}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">Editores</p>
          <p className="mt-1 text-2xl font-black text-slate-950">{stats.editors}</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative">
          <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar por nome, email, perfil ou status"
            className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-[#f5c518] focus:ring-2 focus:ring-[#f5c518]/20"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section className="space-y-3">
          {loading ? (
            <div className="rounded-xl border border-slate-200 bg-white py-16 text-center text-sm text-slate-400">
              Carregando usuários...
            </div>
          ) : usuariosFiltrados.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center text-sm text-slate-400">
              {searchTerm ? 'Nenhum usuário encontrado com este filtro' : 'Nenhum usuário cadastrado'}
            </div>
          ) : (
            usuariosFiltrados.map((usuario) => (
              <article
                key={usuario.id}
                className={`rounded-xl border bg-white p-4 shadow-sm transition ${
                  selectedUser?.id === usuario.id ? 'border-[#f5c518] ring-2 ring-[#f5c518]/20' : 'border-slate-200 hover:border-[#f5c518]/60'
                }`}
              >
                <button type="button" onClick={() => setSelectedUserId(usuario.id)} className="block w-full text-left cursor-pointer">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#f5c518]/15 text-sm font-black text-[#8a6a00]">
                        {initials(usuario.nome)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-950">{usuario.nome}</p>
                        <p className="truncate text-sm text-slate-500">{usuario.email}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${roleClass(usuario.role)}`}>
                        {roleLabel(usuario.role)}
                      </span>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusClass(usuario)}`}>
                        {statusLabel(usuario)}
                      </span>
                    </div>
                  </div>
                </button>

                <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                  {needsEmailValidation(usuario) && (
                    <button
                      type="button"
                      onClick={() => void handleSendConfirmation(usuario.id)}
                      disabled={resendingCode}
                      className="inline-flex h-9 items-center gap-2 rounded-lg bg-amber-50 px-3 text-xs font-bold text-amber-700 transition hover:bg-amber-100 disabled:opacity-50 cursor-pointer"
                    >
                      <Mail size={14} />
                      Validar e-mail
                    </button>
                  )}

                  {canManage(usuario) && (
                    <button
                      type="button"
                      onClick={() => handleEdit(usuario)}
                      className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#f5c518]/15 px-3 text-xs font-bold text-[#8a6a00] transition hover:bg-[#f5c518]/25 cursor-pointer"
                    >
                      <Edit size={14} />
                      Editar
                    </button>
                  )}

                  {canManage(usuario) && (
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(usuario)}
                      className="inline-flex h-9 items-center gap-2 rounded-lg bg-red-50 px-3 text-xs font-bold text-red-700 transition hover:bg-red-100 cursor-pointer"
                    >
                      <Trash2 size={14} />
                      Remover
                    </button>
                  )}
                </div>
              </article>
            ))
          )}
        </section>

        <aside className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm xl:sticky xl:top-24 xl:self-start">
          {!selectedUser ? (
            <div className="flex min-h-72 flex-col items-center justify-center gap-3 text-center text-slate-400">
              <Users size={36} strokeWidth={1.5} />
              <div>
                <p className="font-semibold text-slate-600">Selecione um usuário</p>
                <p className="mt-1 text-sm">Os detalhes de acesso aparecem aqui.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex items-start gap-3">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#f5c518] text-base font-black text-slate-950">
                  {initials(selectedUser.nome)}
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-black text-slate-950">{selectedUser.nome}</h3>
                  <p className="break-all text-sm text-slate-500">{selectedUser.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs font-semibold text-slate-400">Perfil</p>
                  <p className="mt-1 font-black text-slate-950">{roleLabel(selectedUser.role)}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs font-semibold text-slate-400">Status</p>
                  <p className="mt-1 font-black text-slate-950">{statusLabel(selectedUser)}</p>
                </div>
              </div>

              {needsEmailValidation(selectedUser) && (
                <button
                  type="button"
                  onClick={() => void handleSendConfirmation(selectedUser.id)}
                  disabled={resendingCode}
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-amber-50 text-sm font-bold text-amber-700 transition hover:bg-amber-100 disabled:opacity-50 cursor-pointer"
                >
                  <Mail size={16} />
                  Validar e-mail
                </button>
              )}

              {canManage(selectedUser) && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(selectedUser)}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#f5c518] text-sm font-bold text-slate-950 transition hover:bg-[#e0b20f] cursor-pointer"
                  >
                    <Edit size={15} />
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(selectedUser)}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-red-50 text-sm font-bold text-red-700 transition hover:bg-red-100 cursor-pointer"
                  >
                    <Trash2 size={15} />
                    Remover
                  </button>
                </div>
              )}
            </div>
          )}
        </aside>
      </div>

      {modalOpen && (
        <div
          className={`fixed inset-0 z-[9999] flex items-center justify-center px-4 transition-all duration-200 ease-out ${
            modalVisible ? 'bg-slate-950/45 backdrop-blur-sm' : 'bg-slate-950/0 backdrop-blur-0'
          }`}
          onClick={handleCloseModal}
        >
          <div
            className={`max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl transition-all duration-200 ease-out ${
              modalVisible ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-3 scale-95 opacity-0'
            }`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-slate-100 p-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-[#f5c518]">Acesso administrativo</p>
                <h2 className="text-xl font-black text-slate-950">{editingUsuario ? 'Editar usuário' : 'Novo usuário'}</h2>
              </div>
              <button type="button" onClick={handleCloseModal} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 p-5">
              {editingUsuario?.emailPendente && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  Esta conta aguarda confirmação de e-mail. Para ativar a conta, use o botão Confirmar e-mail.
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="space-y-1.5">
                  <span className="text-sm font-bold text-slate-700">Nome</span>
                  <input value={nome} onChange={(event) => setNome(event.target.value)} disabled={savingUsuario} className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#f5c518] focus:ring-2 focus:ring-[#f5c518]/20 disabled:opacity-50" />
                </label>

                <label className="space-y-1.5">
                  <span className="text-sm font-bold text-slate-700">E-mail</span>
                  <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} disabled={savingUsuario} className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#f5c518] focus:ring-2 focus:ring-[#f5c518]/20 disabled:opacity-50" />
                </label>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="space-y-1.5">
                  <span className="text-sm font-bold text-slate-700">Senha {editingUsuario ? <span className="font-normal text-slate-400">(opcional)</span> : null}</span>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} value={senha} onChange={(event) => setSenha(event.target.value)} disabled={savingUsuario} className="h-11 w-full rounded-lg border border-slate-200 px-3 pr-10 text-sm outline-none focus:border-[#f5c518] focus:ring-2 focus:ring-[#f5c518]/20 disabled:opacity-50" />
                    <button type="button" onClick={() => setShowPassword((current) => !current)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer">
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </label>

                <label className="space-y-1.5">
                  <span className="text-sm font-bold text-slate-700">Confirmar senha</span>
                  <div className="relative">
                    <input type={showConfirmPassword ? 'text' : 'password'} value={confirmarSenha} onChange={(event) => setConfirmarSenha(event.target.value)} disabled={savingUsuario} className="h-11 w-full rounded-lg border border-slate-200 px-3 pr-10 text-sm outline-none focus:border-[#f5c518] focus:ring-2 focus:ring-[#f5c518]/20 disabled:opacity-50" />
                    <button type="button" onClick={() => setShowConfirmPassword((current) => !current)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer">
                      {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </label>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <label className="space-y-1.5">
                    <span className="text-sm font-bold text-slate-700">Perfil</span>
                    <Select
                      value={role}
                      onChange={(val) => setRole(val as Role)}
                      options={[
                        { value: 'editor', label: 'Editor' },
                        { value: 'admin', label: 'Administrador' },
                      ]}
                    />
                  </label>

                  <label className="mt-[26px] flex h-11 items-center gap-3 rounded-lg border border-slate-200 px-3">
                    <input type="checkbox" checked={ativo} onChange={(event) => setAtivo(event.target.checked)} disabled={savingUsuario} className="h-4 w-4 rounded border-slate-300 text-[#f5c518] focus:ring-[#f5c518]" />
                    <span className="text-sm font-bold text-slate-700">Usuário ativo</span>
                  </label>
              </div>

              <label className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
                <input type="checkbox" checked={firstLogin} onChange={(event) => setFirstLogin(event.target.checked)} disabled={savingUsuario} className="h-4 w-4 rounded border-slate-300 text-[#f5c518] focus:ring-[#f5c518]" />
                <span className="inline-flex items-center gap-2 text-sm font-bold text-amber-800">
                  <Key size={16} />
                  Forçar redefinição de senha no próximo login
                </span>
              </label>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 p-5">
              <button type="button" onClick={handleCloseModal} disabled={savingUsuario} className="h-10 rounded-lg border border-slate-200 px-5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 cursor-pointer">
                Cancelar
              </button>
              <button type="button" onClick={() => void handleSave()} disabled={savingUsuario} className="h-10 rounded-lg bg-[#f5c518] px-5 text-sm font-bold text-slate-950 hover:bg-[#e0b20f] disabled:opacity-50 cursor-pointer">
                {savingUsuario ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmModalOpen && confirmingUsuario && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-5 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f5c518]/15 text-[#8a6a00]">
                <Mail size={26} />
              </div>
              <h2 className="text-xl font-black text-slate-950">Confirmar e-mail</h2>
              <p className="mt-1 text-sm text-slate-500">
                Código enviado para <strong className="text-slate-700">{confirmingUsuario.emailMasked}</strong>
              </p>
            </div>

            <input
              inputMode="numeric"
              maxLength={6}
              value={confirmCode}
              onChange={(event) => setConfirmCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              disabled={confirmingCode}
              className="h-12 w-full rounded-lg border border-slate-200 text-center font-mono text-xl tracking-[0.4em] outline-none focus:border-[#f5c518] focus:ring-2 focus:ring-[#f5c518]/20 disabled:opacity-50"
            />

            <button type="button" onClick={() => void handleConfirmEmail()} disabled={confirmingCode || confirmCode.length !== 6} className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#f5c518] text-sm font-bold text-slate-950 hover:bg-[#e0b20f] disabled:opacity-50 cursor-pointer">
              <CheckCircle size={17} />
              {confirmingCode ? 'Verificando...' : 'Confirmar e-mail'}
            </button>

            <div className="mt-4 flex items-center justify-between gap-3">
              <button type="button" onClick={() => void handleResendCode()} disabled={resendingCode || confirmingCode} className="text-sm font-semibold text-slate-500 hover:text-[#8a6a00] disabled:opacity-50 cursor-pointer">
                {resendingCode ? 'Enviando...' : 'Reenviar código'}
              </button>
              <button type="button" onClick={() => { setConfirmModalOpen(false); void loadUsuarios() }} className="text-sm font-semibold text-slate-500 hover:text-slate-900 cursor-pointer">
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="border-b border-slate-100 px-6 py-5">
              <p className="text-xs font-bold uppercase tracking-wide text-red-600">Remover usuário</p>
              <h2 className="mt-1 text-xl font-black text-slate-950">Confirmar remoção</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Esta ação remove o acesso administrativo deste usuário.
              </p>
            </div>

            <div className="px-6 py-5">
              <div className="flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 p-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-sm font-black text-red-700">
                  {initials(deleteTarget.nome)}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-950">{deleteTarget.nome}</p>
                  <p className="truncate text-sm text-slate-500">{deleteTarget.email}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-5">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deletingUsuario}
                className="h-10 rounded-lg border border-slate-200 px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={deletingUsuario}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-red-600 px-5 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-50 cursor-pointer"
              >
                <Trash2 size={16} />
                {deletingUsuario ? 'Removendo...' : 'Remover'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

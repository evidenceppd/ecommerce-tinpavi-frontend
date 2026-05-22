import { ArrowLeft, Mail, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { api } from "../admin/services/api";

export function ForgotPasswordPage() {
  const token = useMemo(() => new URLSearchParams(window.location.search).get("token") || "", []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");
    setError("");
    setIsSubmitting(true);

    try {
      if (token) {
        if (password.length < 8) throw new Error("A senha deve ter pelo menos 8 caracteres.");
        if (password !== confirmPassword) throw new Error("As senhas não conferem.");
        await api.post("/auth/reset-password", { token, password });
        setStatus("Senha redefinida com sucesso. Você já pode fazer login.");
      } else {
        await api.post("/auth/forgot-password", { email });
        setStatus("Se o e-mail estiver cadastrado, enviaremos as instruções em instantes.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível concluir a solicitação.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="bg-gray-50">
      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-8xl px-4 py-8">
          <a
            href="/signin"
            className="mb-5 inline-flex cursor-pointer items-center gap-2 text-xs text-gray-950 hover:underline"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Voltar para login
          </a>
          <p className="text-xs font-black uppercase text-[#ffa201]" style={{ fontWeight: "bold", color: "#ffa201" }}>
            Recuperação de acesso
          </p>
          <h1 className="mt-2 text-3xl font-bold text-gray-950">Esqueci minha senha</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-gray-600">
            {token ? "Crie uma nova senha para recuperar o acesso." : "Informe o e-mail cadastrado para receber as instruções de redefinição de senha."}
          </p>
        </div>
      </section>

      <div className="mx-auto grid max-w-8xl gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:py-8">
        <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <form className="max-w-xl space-y-5" onSubmit={handleSubmit}>
            <div>
              <h2 className="text-xl font-bold text-gray-950">{token ? "Nova senha" : "Redefinir senha"}</h2>
              <p className="mt-1 text-sm text-gray-500">
                {token ? "Digite e confirme sua nova senha." : "Enviaremos um link seguro para criar uma nova senha."}
              </p>
            </div>

            {token ? (
              <>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-bold text-gray-800">Nova senha</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="h-11 w-full rounded-md border border-gray-300 px-3 text-sm outline-none focus:border-[#F5C518]"
                    placeholder="Digite sua nova senha"
                    autoComplete="new-password"
                    required
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-bold text-gray-800">Confirmar senha</span>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="h-11 w-full rounded-md border border-gray-300 px-3 text-sm outline-none focus:border-[#F5C518]"
                    placeholder="Repita a nova senha"
                    autoComplete="new-password"
                    required
                  />
                </label>
              </>
            ) : (
              <label className="block">
                <span className="mb-1.5 block text-sm font-bold text-gray-800">E-mail</span>
                <span className="flex h-11 items-center rounded-md border border-gray-300 bg-white px-3 focus-within:border-[#F5C518]">
                  <Mail size={18} className="mr-2 shrink-0 text-gray-500" aria-hidden="true" />
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="min-w-0 flex-1 border-0 bg-transparent text-sm outline-none"
                    placeholder="seuemail@empresa.com.br"
                    autoComplete="email"
                    required
                  />
                </span>
              </label>
            )}

            {status && <p className="rounded-md border border-green-200 bg-green-50 p-3 text-sm font-semibold text-green-700">{status}</p>}
            {error && <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="h-12 w-full cursor-pointer rounded-md bg-[#F5C518] text-sm font-bold text-black transition hover:bg-[#e6b800] sm:w-auto sm:px-8"
            >
              {isSubmitting ? "Enviando..." : token ? "Salvar nova senha" : "Enviar instruções"}
            </button>
          </form>
        </section>

        <aside className="h-fit rounded-lg border border-gray-200 bg-white p-5 shadow-sm lg:sticky lg:top-32">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#fff4c2] text-black">
            <ShieldCheck size={24} aria-hidden="true" />
          </div>
          <h2 className="mt-4 text-lg font-bold text-gray-950">Ambiente seguro</h2>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            Por segurança, o link de redefinição expira após um período curto. Caso não receba o e-mail, confira a caixa de spam.
          </p>
        </aside>
      </div>
    </div>
  );
}

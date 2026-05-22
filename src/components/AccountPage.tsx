import { useState } from "react";
import { Building2, Check, ClipboardCheck, KeyRound, Lock, Mail, Phone, ShieldCheck, User, UserPlus } from "lucide-react";
import { customerAuthService } from "../admin/services/customer-auth.service";
import { api } from "../admin/services/api";

type AccountMode = "login" | "register";
type AccountStep = "mode" | "credentials" | "details";

const steps = [
  { id: "mode", label: "Acesso", icon: User },
  { id: "credentials", label: "Credenciais", icon: Mail },
  { id: "details", label: "Dados", icon: ClipboardCheck },
] as const;

const accountBenefits = [
  "Acompanhe seus pedidos e orçamentos",
  "Salve endereços de entrega",
  "Finalize compras com mais rapidez",
];

function extractError(err: unknown): string {
  if (err && typeof err === "object") {
    const e = err as { response?: { status?: number; data?: { error?: string } } };
    const status = e.response?.status;
    const msg = e.response?.data?.error;

    if (status === 401) {
      if (msg && /authentication required|nao autorizado|não autorizado/i.test(msg)) {
        return "Não foi possível validar sua sessão de cliente. Tente entrar novamente.";
      }
      return "Email ou senha incorretos. Verifique suas credenciais e tente novamente.";
    }

    if (msg) return msg;
  }
  return "Ocorreu um erro. Tente novamente.";
}

export function AccountPage() {
  const returnTo = new URLSearchParams(window.location.search).get("returnTo") || "/profile";
  const [mode, setMode] = useState<AccountMode>("login");
  const [activeStep, setActiveStep] = useState<AccountStep>("mode");
  const activeIndex = steps.findIndex((step) => step.id === activeStep);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [mfaChallengeId, setMfaChallengeId] = useState<string | null>(null);
  const [mfaEmailMasked, setMfaEmailMasked] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function goBack() {
    setError(null);
    const previousStep = steps[Math.max(activeIndex - 1, 0)];
    setActiveStep(previousStep.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function chooseMode(nextMode: AccountMode) {
    setMode(nextMode);
    setError(null);
    setActiveStep("credentials");
  }

  function validateCredentials(): string | null {
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) return "Informe um e-mail válido.";
    if (password.length < 8) return "A senha deve ter pelo menos 8 caracteres.";
    if (mode === "register" && password !== confirmPassword) return "As senhas não conferem.";
    return null;
  }

  function validateDetails(): string | null {
    if (name.trim().length < 2) return "Informe seu nome completo (mínimo 2 caracteres).";
    return null;
  }

  async function handleLogin() {
    const err = validateCredentials();
    if (err) { setError(err); return; }
    setLoading(true);
    setError(null);
    try {
      const result = await customerAuthService.login(email, password);
      if ("mfaRequired" in result && result.mfaRequired) {
        setMfaChallengeId(result.challengeId);
        setMfaEmailMasked(result.emailMasked);
        setMfaCode("");
        setLoading(false);
        return;
      }
      window.location.href = returnTo;
    } catch (e) {
      setError(extractError(e));
      setLoading(false);
    }
  }

  async function handleVerifyLoginCode() {
    if (!mfaChallengeId) return;
    if (!/^\d{6}$/.test(mfaCode)) {
      setError("Informe o código de 6 dígitos enviado por e-mail.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await customerAuthService.verifyLoginCode(mfaChallengeId, mfaCode);
      window.location.href = returnTo;
    } catch (e) {
      setError(extractError(e));
      setLoading(false);
    }
  }

  async function handleRegister() {
    const err = validateDetails();
    if (err) { setError(err); return; }
    setLoading(true);
    setError(null);
    try {
      await customerAuthService.register(name, email, password);
      const digits = phone.replace(/\D/g, "");
      if (digits.length >= 10) {
        try { await api.put("/me/profile", { phone: digits }); } catch { /* ignore */ }
      }
      window.location.href = returnTo;
    } catch (e) {
      setError(extractError(e));
      setLoading(false);
    }
  }

  function handleNext() {
    if (mode === "login" && activeStep === "credentials") {
      void handleLogin();
      return;
    }
    if (activeStep === "credentials") {
      const err = validateCredentials();
      if (err) { setError(err); return; }
    }
    setError(null);
    const nextStep = steps[Math.min(activeIndex + 1, steps.length - 1)];
    setActiveStep(nextStep.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="bg-gray-50">
      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-8xl px-4 py-8">
          <p className="text-xs font-bold uppercase text-[#ffa201]" style={{ color: "#ffa201" }}>
            Minha conta
          </p>
          <h1 className="mt-2 text-3xl font-bold text-gray-950">Entrar ou cadastrar</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-gray-600">
            Acesse sua conta para consultar pedidos, salvar endereços e finalizar compras com mais agilidade.
          </p>
        </div>
      </section>

      <div className="mx-auto grid max-w-8xl gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:py-8">
        <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-6 grid grid-cols-3 rounded-lg border border-gray-200 bg-white p-2">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = step.id === activeStep;
              const isDone = index < activeIndex;
              const isDisabled = mode === "login" && step.id === "details";

              return (
                <button
                  key={step.id}
                  type="button"
                  disabled={isDisabled}
                  className={`flex min-h-14 cursor-pointer items-center justify-center gap-2 rounded-md px-2 text-xs font-bold transition disabled:pointer-events-none disabled:opacity-40 sm:text-sm ${
                    isActive ? "bg-[#F5C518] text-black" : "text-gray-600 hover:bg-gray-50"
                  }`}
                  onClick={() => { setError(null); setActiveStep(step.id); }}
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/70">
                    {isDone ? <Check size={16} aria-hidden="true" /> : <Icon size={16} aria-hidden="true" />}
                  </span>
                  <span className="hidden sm:inline">{step.label}</span>
                </button>
              );
            })}
          </div>

          <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
            {activeStep === "mode" && (
              <div>
                <h2 className="text-xl font-bold text-gray-950">Como deseja continuar?</h2>
                <p className="mt-1 text-sm text-gray-500">Entre com uma conta existente ou crie um novo cadastro.</p>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    className={`cursor-pointer rounded-lg border p-5 text-left transition ${
                      mode === "login" ? "border-[#F5C518] bg-[#fff9df]" : "border-gray-200 bg-white hover:border-[#F5C518]"
                    }`}
                    onClick={() => chooseMode("login")}
                  >
                    <User size={24} className="text-gray-900" aria-hidden="true" />
                    <strong className="mt-3 block text-base text-gray-950">Entrar</strong>
                    <span className="mt-1 block text-sm leading-6 text-gray-600">Já tenho cadastro na Tinpavi.</span>
                  </button>

                  <button
                    type="button"
                    className={`cursor-pointer rounded-lg border p-5 text-left transition ${
                      mode === "register" ? "border-[#F5C518] bg-[#fff9df]" : "border-gray-200 bg-white hover:border-[#F5C518]"
                    }`}
                    onClick={() => chooseMode("register")}
                  >
                    <UserPlus size={24} className="text-gray-900" aria-hidden="true" />
                    <strong className="mt-3 block text-base text-gray-950">Cadastrar</strong>
                    <span className="mt-1 block text-sm leading-6 text-gray-600">Quero criar uma nova conta.</span>
                  </button>
                </div>
              </div>
            )}

            {activeStep === "credentials" && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-950">
                    {mode === "login" ? "Acesse sua conta" : "Dados de acesso"}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {mode === "login" ? "Use seu e-mail e senha cadastrados." : "Defina o e-mail e a senha da nova conta."}
                  </p>
                </div>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-bold text-gray-800">E-mail</span>
                  <span className="flex h-11 items-center rounded-md border border-gray-300 bg-white px-3 focus-within:border-[#F5C518]">
                    <Mail size={18} className="mr-2 shrink-0 text-gray-500" aria-hidden="true" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="min-w-0 flex-1 border-0 bg-transparent text-sm outline-none"
                      placeholder="seuemail@empresa.com.br"
                      autoComplete="email"
                    />
                  </span>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-bold text-gray-800">Senha</span>
                  <span className="flex h-11 items-center rounded-md border border-gray-300 bg-white px-3 focus-within:border-[#F5C518]">
                    <Lock size={18} className="mr-2 shrink-0 text-gray-500" aria-hidden="true" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="min-w-0 flex-1 border-0 bg-transparent text-sm outline-none"
                      placeholder="Digite sua senha"
                      autoComplete={mode === "login" ? "current-password" : "new-password"}
                    />
                  </span>
                </label>

                {mode === "register" && (
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-bold text-gray-800">Confirmar senha</span>
                    <span className="flex h-11 items-center rounded-md border border-gray-300 bg-white px-3 focus-within:border-[#F5C518]">
                      <Lock size={18} className="mr-2 shrink-0 text-gray-500" aria-hidden="true" />
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="min-w-0 flex-1 border-0 bg-transparent text-sm outline-none"
                        placeholder="Repita a senha"
                        autoComplete="new-password"
                      />
                    </span>
                  </label>
                )}

                {mode === "login" && (
                  <div className="space-y-4">
                    {mfaChallengeId && (
                      <label className="block">
                        <span className="mb-1.5 block text-sm font-bold text-gray-800">Código de verificação</span>
                        <span className="flex h-11 items-center rounded-md border border-gray-300 bg-white px-3 focus-within:border-[#F5C518]">
                          <KeyRound size={18} className="mr-2 shrink-0 text-gray-500" aria-hidden="true" />
                          <input
                            value={mfaCode}
                            onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                            className="min-w-0 flex-1 border-0 bg-transparent text-sm outline-none"
                            placeholder={`Enviado para ${mfaEmailMasked}`}
                            inputMode="numeric"
                            autoComplete="one-time-code"
                          />
                        </span>
                      </label>
                    )}

                    <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                      <a href="/forgot-password" className="cursor-pointer font-bold text-gray-950 hover:underline">
                        Esqueci minha senha
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeStep === "details" && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-950">Informações de cadastro</h2>
                  <p className="mt-1 text-sm text-gray-500">Preencha seus dados para criar uma conta.</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-bold text-gray-800">Nome</span>
                    <span className="flex h-11 items-center rounded-md border border-gray-300 bg-white px-3 focus-within:border-[#F5C518]">
                      <User size={18} className="mr-2 shrink-0 text-gray-500" aria-hidden="true" />
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="min-w-0 flex-1 border-0 bg-transparent text-sm outline-none"
                        placeholder="Seu nome completo"
                        autoComplete="name"
                      />
                    </span>
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-sm font-bold text-gray-800">Telefone</span>
                    <span className="flex h-11 items-center rounded-md border border-gray-300 bg-white px-3 focus-within:border-[#F5C518]">
                      <Phone size={18} className="mr-2 shrink-0 text-gray-500" aria-hidden="true" />
                      <input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="min-w-0 flex-1 border-0 bg-transparent text-sm outline-none"
                        placeholder="(00) 00000-0000"
                        autoComplete="tel"
                      />
                    </span>
                  </label>
                </div>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-bold text-gray-800">Empresa</span>
                  <span className="flex h-11 items-center rounded-md border border-gray-300 bg-white px-3 focus-within:border-[#F5C518]">
                    <Building2 size={18} className="mr-2 shrink-0 text-gray-500" aria-hidden="true" />
                    <input className="min-w-0 flex-1 border-0 bg-transparent text-sm outline-none" placeholder="Nome da empresa (opcional)" />
                  </span>
                </label>

                <label className="flex cursor-pointer items-start gap-2 text-sm text-gray-600">
                  <input type="checkbox" className="mt-0.5 h-4 w-4 cursor-pointer accent-[#F5C518]" />
                  Aceito receber comunicações sobre pedidos, ofertas e novidades da Tinpavi.
                </label>
              </div>
            )}

            {error && (
              <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
            )}

            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-between">
              <button
                type="button"
                className="h-11 cursor-pointer rounded-md border border-gray-300 px-5 text-sm font-bold text-gray-800 transition hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-40"
                disabled={activeIndex === 0 || loading}
                onClick={goBack}
              >
                Voltar
              </button>

              {activeStep === "details" ? (
                <button
                  type="button"
                  disabled={loading}
                  className="h-11 cursor-pointer rounded-md bg-[#F5C518] px-6 text-sm font-bold text-black transition hover:bg-[#e6b800] disabled:pointer-events-none disabled:opacity-60"
                  onClick={() => { void handleRegister(); }}
                >
                  {loading ? "Criando conta..." : "Criar conta"}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={loading}
                  className="h-11 cursor-pointer rounded-md bg-[#F5C518] px-6 text-sm font-bold text-black transition hover:bg-[#e6b800] disabled:pointer-events-none disabled:opacity-60"
                  onClick={mfaChallengeId ? () => { void handleVerifyLoginCode(); } : handleNext}
                >
                  {loading ? "Entrando..." : mfaChallengeId ? "Verificar e entrar" : mode === "login" && activeStep === "credentials" ? "Entrar" : "Continuar"}
                </button>
              )}
            </div>
          </form>
        </section>

        <aside className="h-fit rounded-lg border border-gray-200 bg-white p-5 shadow-sm lg:sticky lg:top-48">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#fff4c2] text-black">
            <ShieldCheck size={24} aria-hidden="true" />
          </div>
          <h2 className="mt-4 text-lg font-bold text-gray-950">Por que criar uma conta?</h2>
          <div className="mt-4 space-y-3">
            {accountBenefits.map((benefit) => (
              <div key={benefit} className="flex gap-3 text-sm text-gray-700">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#F5C518]">
                  <Check size={13} aria-hidden="true" />
                </span>
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

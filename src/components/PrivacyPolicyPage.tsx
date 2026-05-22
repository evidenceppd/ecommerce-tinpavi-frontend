import { Lock, Mail, ShieldCheck } from "lucide-react";

const sections = [
  {
    title: "1. Dados que coletamos",
    text: "Podemos coletar informações fornecidas por você, como nome, e-mail, telefone, empresa, endereço de entrega, dados de faturamento e informações necessárias para processar pedidos e orçamentos.",
  },
  {
    title: "2. Uso das informações",
    text: "Utilizamos os dados para atender solicitações, processar compras, emitir notas fiscais, organizar entregas, prestar suporte, melhorar nossos serviços e enviar comunicações relacionadas à Tinpavi quando autorizado.",
  },
  {
    title: "3. Compartilhamento",
    text: "As informações podem ser compartilhadas com parceiros essenciais para operação, como meios de pagamento, transportadoras, sistemas fiscais e fornecedores de tecnologia, sempre conforme a necessidade do serviço.",
  },
  {
    title: "4. Segurança",
    text: "Adotamos medidas técnicas e administrativas para proteger os dados contra acessos não autorizados, perda, alteração ou uso indevido.",
  },
  {
    title: "5. Seus direitos",
    text: "Você pode solicitar acesso, correção, exclusão, portabilidade ou revisão do tratamento dos seus dados pessoais, conforme previsto na legislação aplicável.",
  },
  {
    title: "6. Cookies",
    text: "Podemos usar cookies e tecnologias semelhantes para melhorar a navegação, lembrar preferências, analisar desempenho e personalizar conteúdos.",
  },
  {
    title: "7. Atualizações desta política",
    text: "Esta política pode ser atualizada periodicamente. A versão vigente estará sempre disponível nesta página.",
  },
];

export function PrivacyPolicyPage() {
  return (
    <div className="bg-gray-50">
      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-8xl px-4 py-8">
          <p className="text-xs font-bold uppercase text-[#ffa201]" style={{ color: "#ffa201" }}>
            Privacidade
          </p>
          <h1 className="mt-2 text-3xl font-bold text-gray-950">Política de Privacidade</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
            Entenda como a Tinpavi coleta, utiliza e protege as informações fornecidas em nosso site.
          </p>
        </div>
      </section>

      <div className="mx-auto grid max-w-8xl gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:py-8">
        <article className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#fff4c2] text-black">
              <ShieldCheck size={22} aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-gray-950">Compromisso com seus dados</h2>
              <p className="text-sm text-gray-500">Última atualização: 08/05/2026</p>
            </div>
          </div>

          <div className="mt-6 space-y-6">
            {sections.map((section) => (
              <section key={section.title}>
                <h3 className="text-lg font-bold text-gray-950">{section.title}</h3>
                <p className="mt-2 text-sm leading-7 text-gray-600">{section.text}</p>
              </section>
            ))}
          </div>
        </article>

        <aside className="h-fit rounded-lg border border-gray-200 bg-white p-5 shadow-sm lg:sticky lg:top-48">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#fff4c2] text-black">
            <Lock size={24} aria-hidden="true" />
          </div>
          <h2 className="mt-4 text-lg font-bold text-gray-950">Fale sobre privacidade</h2>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            Para dúvidas ou solicitações relacionadas aos seus dados pessoais, entre em contato com nosso atendimento.
          </p>
          <a
            href="mailto:vendas@tinpavi.com.br?subject=Privacidade%20e%20dados"
            className="mt-5 flex h-11 cursor-pointer items-center justify-center gap-2 rounded-md bg-[#F5C518] px-4 text-sm font-bold text-black transition hover:bg-[#e6b800]"
          >
            <Mail size={17} aria-hidden="true" />
            Enviar e-mail
          </a>
        </aside>
      </div>
    </div>
  );
}

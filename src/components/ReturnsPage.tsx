import { Mail, PackageCheck, RotateCcw, Truck } from "lucide-react";

const sections = [
  {
    title: "1. Prazo para solicitação",
    text: "Solicitações de troca ou devolução devem ser feitas dentro do prazo informado no atendimento, considerando o tipo de produto, condição de entrega e legislação aplicável.",
  },
  {
    title: "2. Condições do produto",
    text: "O produto deve estar sem sinais de uso indevido, com acessórios, manuais e embalagem quando aplicável. Produtos personalizados ou sob encomenda podem ter regras específicas.",
  },
  {
    title: "3. Avaria no transporte",
    text: "Caso identifique embalagem violada, produto danificado ou divergência na entrega, comunique nosso atendimento com fotos e informações do pedido para análise.",
  },
  {
    title: "4. Produto incorreto",
    text: "Se o item entregue for diferente do pedido, entre em contato informando o número do pedido e detalhes do produto recebido para orientarmos a correção.",
  },
  {
    title: "5. Análise e autorização",
    text: "Toda troca ou devolução passa por análise. Após aprovação, nossa equipe informará os próximos passos para coleta, envio ou substituição.",
  },
  {
    title: "6. Reembolso",
    text: "Quando aplicável, o reembolso será realizado conforme o método de pagamento utilizado e após o recebimento e conferência do produto.",
  },
];

const steps = [
  "Entre em contato com o atendimento",
  "Informe pedido, motivo e fotos quando necessário",
  "Aguarde a autorização e instruções de envio",
  "Receba a troca, crédito ou reembolso após análise",
];

export function ReturnsPage() {
  return (
    <div className="bg-gray-50">
      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-8xl px-4 py-8">
          <p className="text-xs font-bold uppercase text-[#ffa201]" style={{ color: "#ffa201" }}>
            Atendimento
          </p>
          <h1 className="mt-2 text-3xl font-bold text-gray-950">Trocas e Devoluções</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
            Veja as orientações para solicitar troca, devolução, reembolso ou atendimento em caso de avaria.
          </p>
        </div>
      </section>

      <div className="mx-auto grid max-w-8xl gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:py-8">
        <article className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#fff4c2] text-black">
              <RotateCcw size={22} aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-gray-950">Política de troca e devolução</h2>
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

        <aside className="space-y-6 lg:sticky lg:top-48 lg:h-fit">
          <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#fff4c2] text-black">
              <PackageCheck size={24} aria-hidden="true" />
            </div>
            <h2 className="mt-4 text-lg font-bold text-gray-950">Como solicitar</h2>
            <div className="mt-4 space-y-3">
              {steps.map((step, index) => (
                <div key={step} className="flex gap-3 text-sm text-gray-700">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#F5C518] text-xs font-bold text-black">
                    {index + 1}
                  </span>
                  <span className="leading-6">{step}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <Truck className="mt-0.5 shrink-0 text-gray-900" size={20} aria-hidden="true" />
              <div>
                <h2 className="text-lg font-bold text-gray-950">Atendimento</h2>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  Tenha em mãos o número do pedido e fotos do produto ou embalagem, se houver avaria.
                </p>
              </div>
            </div>
            <a
              href="mailto:vendas@tinpavi.com.br?subject=Trocas%20e%20Devolu%C3%A7%C3%B5es"
              className="mt-5 flex h-11 cursor-pointer items-center justify-center gap-2 rounded-md bg-[#F5C518] px-4 text-sm font-bold text-black transition hover:bg-[#e6b800]"
            >
              <Mail size={17} aria-hidden="true" />
              Solicitar atendimento
            </a>
          </section>
        </aside>
      </div>
    </div>
  );
}

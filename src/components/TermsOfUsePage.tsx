import { FileText, Mail, ShieldCheck } from "lucide-react";

const sections = [
  {
    title: "1. Aceitação dos termos",
    text: "Ao acessar ou utilizar o site da Tinpavi, você concorda com estes Termos de Uso e com as demais políticas aplicáveis.",
  },
  {
    title: "2. Uso do site",
    text: "O site deve ser utilizado para consulta de produtos, solicitação de informações, compras, orçamentos e contato com a Tinpavi. É proibido qualquer uso indevido, fraudulento ou que comprometa a segurança da plataforma.",
  },
  {
    title: "3. Informações de produtos",
    text: "Nos esforçamos para manter descrições, imagens, preços e condições atualizados. Ainda assim, informações podem ser ajustadas sem aviso prévio em razão de disponibilidade, correções ou mudanças comerciais.",
  },
  {
    title: "4. Pedidos e pagamentos",
    text: "Pedidos estão sujeitos à confirmação de pagamento, disponibilidade de estoque, validação cadastral e regras de entrega. A Tinpavi poderá entrar em contato para confirmar informações quando necessário.",
  },
  {
    title: "5. Entregas",
    text: "Prazos e valores de entrega podem variar conforme endereço, transportadora, volume dos produtos e condições logísticas. Eventuais prazos informados são estimativas.",
  },
  {
    title: "6. Propriedade intelectual",
    text: "Textos, imagens, marcas, layouts e demais conteúdos do site pertencem à Tinpavi ou a seus licenciadores, sendo proibida a reprodução não autorizada.",
  },
  {
    title: "7. Limitação de responsabilidade",
    text: "A Tinpavi não se responsabiliza por indisponibilidades temporárias, falhas de conexão, uso inadequado do site ou danos decorrentes de informações fornecidas incorretamente pelo usuário.",
  },
  {
    title: "8. Alterações dos termos",
    text: "Estes termos podem ser atualizados periodicamente. A versão vigente estará sempre disponível nesta página.",
  },
];

export function TermsOfUsePage() {
  return (
    <div className="bg-gray-50">
      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-8xl px-4 py-8">
          <p className="text-xs font-bold uppercase text-[#ffa201]" style={{ color: "#ffa201" }}>
            Legal
          </p>
          <h1 className="mt-2 text-3xl font-bold text-gray-950">Termos de Uso</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
            Consulte as condições gerais para navegação, compras e uso dos serviços disponíveis no site da Tinpavi.
          </p>
        </div>
      </section>

      <div className="mx-auto grid max-w-8xl gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:py-8">
        <article className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#fff4c2] text-black">
              <FileText size={22} aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-gray-950">Condições gerais</h2>
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
            <ShieldCheck size={24} aria-hidden="true" />
          </div>
          <h2 className="mt-4 text-lg font-bold text-gray-950">Dúvidas sobre os termos?</h2>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            Entre em contato com nosso atendimento para esclarecer condições de uso, pedidos ou serviços.
          </p>
          <a
            href="mailto:vendas@tinpavi.com.br?subject=Termos%20de%20Uso"
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

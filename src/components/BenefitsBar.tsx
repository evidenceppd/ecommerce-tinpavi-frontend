import { Truck, CreditCard, Tag, FileText, Headphones } from "lucide-react";

const benefits = [
  { icon: Truck, text: "Entrega para todo o Brasil", maxWidthClass: "md:max-w-45" },
  { icon: CreditCard, text: "Pagamento facilitado em até 6x sem juros", maxWidthClass: "md:max-w-53.75" },
  { icon: Tag, text: "Descontos exclusivos para empresas", maxWidthClass: "md:max-w-56.25" },
  { icon: FileText, text: "Nota fiscal em todas as compras", maxWidthClass: "md:max-w-46.25" },
  { icon: Headphones, text: "Suporte técnico especializado", maxWidthClass: "md:max-w-38.75" },
];

export function BenefitsBar() {
  return (
    <section className="px-4 my-8 lg:my-11.25">
      <div className="bg-[#0e0f10] max-w-8xl mx-auto rounded-xl py-6 px-5 lg:py-7.5 lg:px-7.5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5 lg:items-center lg:justify-between">
          {benefits.map((b) => (
            <div key={b.text} className={`flex items-center gap-3 text-white ${b.maxWidthClass}`}>
              <div className="shrink-0 flex items-center justify-center">
                <b.icon size={18} className="w-auto h-8.75 text-white" />
              </div>
              <p className="text-sm font-normal leading-tight">{b.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

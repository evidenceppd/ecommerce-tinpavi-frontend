import { Award, Headphones, Truck, ShieldCheck } from "lucide-react";

const badges = [
  {
    icon: Award,
    title: "Qualidade garantida",
    desc: "Produtos testados e aprovados",
  },
  {
    icon: Headphones,
    title: "Atendimento técnico",
    desc: "Suporte especializado para sua compra",
  },
  {
    icon: Truck,
    title: "Entrega rápida",
    desc: "Para todo o Brasil",
  },
  {
    icon: ShieldCheck,
    title: "Compra segura",
    desc: "Ambiente 100% seguro e protegido",
  },
];

type TrustBadgesProps = {
  inHero?: boolean;
};

export function TrustBadges({ inHero = false }: TrustBadgesProps) {
  const sectionClass = inHero
    ? "bg-transparent border-0 max-w-8xl mx-auto"
    : "bg-white border-b border-gray-100";

  const titleClass = inHero ? "text-sm font-semibold text-white" : "text-sm font-semibold text-gray-900";
  const descClass = inHero ? "text-xs text-gray-200" : "text-xs text-gray-500";

  const listClass = inHero ? "grid grid-cols-2 gap-6 sm:flex sm:gap-11.75" : "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6";

  const heroItemClass = "flex flex-col items-center text-center gap-2 sm:flex-row sm:text-left";

  return (
    <section className={sectionClass}>
      <div className="max-w-8xl mx-auto px-4 py-6">
        <div className={listClass}>
          {badges.map((b) => (
            <div key={b.title} className={inHero ? heroItemClass : "flex items-center gap-3"}>
              <div className="shrink-0 w-10 h-10 rounded-full bg-[#F5C518]/10 flex items-center justify-center">
                <b.icon size={20} className="text-[#F5C518]" />
              </div>
              <div>
                <p className={titleClass}>{b.title}</p>
                <p className={descClass}>{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

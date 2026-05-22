import { toWhatsAppHref, useContatoInfo } from "../admin/services/contatoInfo.service";

type AnnouncementItem = {
  text: string;
  icon: "check" | "whatsapp" | "truck" | "brazil";
  href?: string;
};

const items: AnnouncementItem[] = [
  { icon: "check", text: "Atendimento especializado" },
  { icon: "whatsapp", text: "(11) 99999-9999" },
  { icon: "truck", text: "Entrega para todo o Brasil" },
  { icon: "brazil", text: "Empresa 100% brasileira" },
];

function AnnouncementIcon({ icon }: { icon: AnnouncementItem["icon"] }) {
  if (icon === "check") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-auto shrink-0 text-[#F5C518]">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    );
  }

  if (icon === "whatsapp") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-auto shrink-0 text-[#F5C518]">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.558 4.118 1.532 5.845L0 24l6.321-1.504A11.954 11.954 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.805 9.805 0 0 1-5.027-1.381l-.36-.214-3.733.979.996-3.648-.235-.374A9.786 9.786 0 0 1 2.182 12C2.182 6.58 6.58 2.182 12 2.182S21.818 6.58 21.818 12 17.42 21.818 12 21.818z" />
      </svg>
    );
  }

  if (icon === "brazil") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28444 28444" className="shrink-0" aria-label="Bandeira do Brasil" fillRule="evenodd" style={{ width: 'auto', height: '24px' }}>
        <clipPath id="br-a"><path d="M17526 14222c0-1824-1480-3304-3304-3304s-3304 1480-3304 3304 1480 3304 3304 3304 3304-1480 3304-3304z"/></clipPath>
        <clipPath id="br-b"><path d="M17526 14222c0-1824-1480-3304-3304-3304s-3304 1480-3304 3304 1480 3304 3304 3304 3304-1480 3304-3304z"/></clipPath>
        <path fill="#009b3a" d="M3806 21167h20833V7278H3806z"/>
        <path fill="#fedf00" d="m6387 14222 7835 5003 7835-5003-7835-5003z"/>
        <path fill="#002776" d="M17526 14222c0-1825-1479-3304-3304-3304s-3304 1479-3304 3304 1479 3304 3304 3304 3304-1479 3304-3304z"/>
        <g clipPath="url(#br-b)"><path fill="#ffffff" d="M4311 20830c0-4431 3593-8024 8024-8024s8024 3593 8024 8024h-472c0-4170-3382-7552-7552-7552s-7552 3382-7552 7552z"/></g>
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-auto shrink-0 text-[#F5C518]">
      <rect x="1" y="3" width="15" height="13" />
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  );
}

function AnnouncementItems({ items, duplicate = false }: { items: AnnouncementItem[]; duplicate?: boolean }) {
  return (
    <div className={`flex shrink-0 items-center gap-8 sm:w-full sm:gap-10 ${duplicate ? "sm:hidden" : ""}`} aria-hidden={duplicate}>
      {items.map((item, index) => (
        item.href ? (
          <a key={`${item.icon}-${item.text}`} href={item.href} target="_blank" rel="noopener noreferrer" className={`flex shrink-0 items-center gap-2.5 transition-colors hover:text-[#F5C518]${index === items.length - 1 ? " sm:ml-auto" : ""}`}>
            <AnnouncementIcon icon={item.icon} />
            <span className="whitespace-nowrap text-sm font-semibold">{item.text}</span>
          </a>
        ) : (
          <div key={`${item.icon}-${item.text}`} className={`flex shrink-0 items-center gap-2.5${index === items.length - 1 ? " sm:ml-auto" : ""}`}>
            <AnnouncementIcon icon={item.icon} />
            <span className="whitespace-nowrap text-sm font-semibold">{item.text}</span>
          </div>
        )
      ))}
    </div>
  );
}

export function AnnouncementBar() {
  const contato = useContatoInfo();
  const whatsapp = contato?.whatsapp || contato?.telefone_1 || "";
  const dynamicItems = items
    .map((item) => (item.icon === "whatsapp" ? { ...item, text: whatsapp, href: whatsapp ? toWhatsAppHref(whatsapp) : undefined } : item))
    .filter((item) => item.icon !== "whatsapp" || Boolean(item.text));

  return (
    <div className="w-full max-w-full overflow-hidden bg-[#111111] text-white text-xs">
      <div className="max-w-8xl mx-auto overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] sm:overflow-visible [&::-webkit-scrollbar]:hidden">
        <div className="announcement-marquee flex w-max items-center gap-8 px-4 py-3 sm:w-full sm:gap-0 sm:py-[17px]">
          <AnnouncementItems items={dynamicItems} />
          <AnnouncementItems items={dynamicItems} duplicate />
        </div>
      </div>
    </div>
  );
}

import { ArrowRight, Clock, Mail, Phone } from "lucide-react";

import { toWhatsAppHref, useContatoInfo } from "../admin/services/contatoInfo.service";

const institutionalLinks = ["Sobre a Tinpavi", "Política de qualidade", "Trabalhe conosco", "Contato"];
const categoryLinks = [
  "Placas de sinalização",
  "Tachas e tachões",
  "Dispositivos refletivos",
  "Tintas para sinalização",
  "Equipamentos",
  "Kits de sinalização",
];
const legalLinks = ["Política de Privacidade", "Termos de Uso", "Trocas e Devoluções"];

function footerHref(item: string) {
  if (item.toLowerCase().includes("contato")) return "#contato";
  if (item.toLowerCase().includes("trabalhe")) return "mailto:vendas@tinpavi.com.br?subject=Trabalhe conosco";
  if (item === "Política de Privacidade") return "/politica-de-privacidade";
  if (item === "Termos de Uso") return "/termos-de-uso";
  if (item === "Trocas e Devoluções") return "/trocas-e-devolucoes";
  if (categoryLinks.includes(item)) return `/busca?categoria=${encodeURIComponent(item)}`;
  return `/?pagina=${encodeURIComponent(item)}`;
}

const socialIcons = [
  {
    label: "Facebook",
    href: "https://www.facebook.com/",
    viewBox: "0 0 155.139 155.139",
    path: "M89.584 155.139V84.378h23.742l3.562-27.585H89.584V39.184c0-7.984 2.208-13.425 13.67-13.425l14.595-.006V1.08C115.325.752 106.661 0 96.577 0 75.52 0 61.104 12.853 61.104 36.452v20.341H37.29v27.585h23.814v70.761h28.48z",
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/",
    viewBox: "0 0 511 511.9",
    path: "M510.95 150.5c-1.2-27.2-5.598-45.898-11.9-62.102-6.5-17.199-16.5-32.597-29.6-45.398-12.802-13-28.302-23.102-45.302-29.5-16.296-6.3-34.898-10.7-62.097-11.898C334.648.3 325.949 0 256.449 0s-78.199.3-105.5 1.5c-27.199 1.2-45.898 5.602-62.097 11.898-17.204 6.5-32.602 16.5-45.403 29.602-13 12.8-23.097 28.3-29.5 45.3-6.3 16.302-10.699 34.9-11.898 62.098C.75 177.801.449 186.5.449 256s.301 78.2 1.5 105.5c1.2 27.2 5.602 45.898 11.903 62.102 6.5 17.199 16.597 32.597 29.597 45.398 12.801 13 28.301 23.102 45.301 29.5 16.3 6.3 34.898 10.7 62.102 11.898 27.296 1.204 36 1.5 105.5 1.5s78.199-.296 105.5-1.5c27.199-1.199 45.898-5.597 62.097-11.898a130.934 130.934 0 0 0 74.903-74.898c6.296-16.301 10.699-34.903 11.898-62.102 1.2-27.3 1.5-36 1.5-105.5s-.102-78.2-1.3-105.5zm-46.098 209c-1.102 25-5.301 38.5-8.801 47.5-8.602 22.3-26.301 40-48.602 48.602-9 3.5-22.597 7.699-47.5 8.796-27 1.204-35.097 1.5-103.398 1.5s-76.5-.296-103.403-1.5c-25-1.097-38.5-5.296-47.5-8.796C94.551 451.5 84.45 445 76.25 436.5c-8.5-8.3-15-18.3-19.102-29.398-3.5-9-7.699-22.602-8.796-47.5-1.204-27-1.5-35.102-1.5-103.403s.296-76.5 1.5-103.398c1.097-25 5.296-38.5 8.796-47.5C61.25 94.199 67.75 84.1 76.352 75.898c8.296-8.5 18.296-15 29.398-19.097 9-3.5 22.602-7.7 47.5-8.801 27-1.2 35.102-1.5 103.398-1.5 68.403 0 76.5.3 103.403 1.5 25 1.102 38.5 5.3 47.5 8.8 11.097 4.098 21.199 10.598 29.398 19.098 8.5 8.301 15 18.301 19.102 29.403 3.5 9 7.699 22.597 8.8 47.5 1.2 27 1.5 35.097 1.5 103.398s-.3 76.301-1.5 103.301zm0 0M256.45 124.5c-72.598 0-131.5 58.898-131.5 131.5s58.902 131.5 131.5 131.5c72.6 0 131.5-58.898 131.5-131.5s-58.9-131.5-131.5-131.5zm0 216.8c-47.098 0-85.302-38.198-85.302-85.3s38.204-85.3 85.301-85.3c47.102 0 85.301 38.198 85.301 85.3s-38.2 85.3-85.3 85.3zM423.852 119.3c0 16.954-13.747 30.7-30.704 30.7-16.953 0-30.699-13.746-30.699-30.7 0-16.956 13.746-30.698 30.7-30.698 16.956 0 30.703 13.742 30.703 30.699zm0 0",
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/",
    viewBox: "0 0 100 100",
    path: "M90 90V60.7c0-14.4-3.1-25.4-19.9-25.4-8.1 0-13.5 4.4-15.7 8.6h-.2v-7.3H38.3V90h16.6V63.5c0-7 1.3-13.7 9.9-13.7 8.5 0 8.6 7.9 8.6 14.1v26H90zM11.3 36.6h16.6V90H11.3zM19.6 10c-5.3 0-9.6 4.3-9.6 9.6s4.3 9.7 9.6 9.7 9.6-4.4 9.6-9.7-4.3-9.6-9.6-9.6z",
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com/",
    viewBox: "0 0 100 100",
    path: "M74.9 21.4H25.1c-8.4 0-15.1 6.8-15.1 15.1v26.9c0 8.4 6.8 15.1 15.1 15.1h49.8c8.4 0 15.1-6.8 15.1-15.1V36.5c0-8.3-6.8-15.1-15.1-15.1zM39.5 62.3V37.7l21 12.3z",
  },
];

function FooterLogo() {
  return (
    <div className="leading-none">
      <img src="/logoFooter-tinpavi.webp" alt="Tinpavi Sinalização Viária" className="max-w-[140px] w-full" />
    </div>
  );
}

function FooterList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-[13px]">
      {items.map((item) => (
        <li key={item} className="leading-none">
          <a href={footerHref(item)} className="text-[13px] font-medium text-[#b4bac0] transition-colors hover:text-[#f5b400]">
            {item}
          </a>
        </li>
      ))}
    </ul>
  );
}

function SocialLinks() {
  const contato = useContatoInfo();
  const links = socialIcons.map((icon) => {
    const dynamicHref: Record<string, string | undefined> = {
      Facebook: contato?.link_facebook,
      Instagram: contato?.link_instagram,
      LinkedIn: contato?.link_linkedin,
      YouTube: contato?.link_youtube,
    };
    return { ...icon, href: dynamicHref[icon.label] || icon.href };
  });

  return (
    <div className="mt-[20px] flex items-center gap-[14px]">
      {links.map((icon) => (
        <a
          key={icon.label}
          href={icon.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={icon.label}
          className="flex h-[31px] w-[31px] items-center justify-center rounded-full bg-[#d6d9dc] text-[#11171c] transition-colors hover:bg-[#f5b400]"
        >
          <svg viewBox={icon.viewBox} aria-hidden="true" className="h-4 w-auto fill-current">
            <path d={icon.path} />
          </svg>
        </a>
      ))}
    </div>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 682 682.667" aria-hidden="true" className="h-[17px] w-auto fill-current shrink-0">
      <path d="M544.387 93.008C484.512 33.063 404.883.035 320.05 0 145.246 0 2.98 142.262 2.91 317.113c-.024 55.895 14.577 110.457 42.331 158.551L.25 640l168.121-44.102c46.324 25.27 98.477 38.586 151.55 38.602h.134c174.785 0 317.066-142.273 317.132-317.133.036-84.742-32.921-164.418-92.8-224.36zM320.05 580.94h-.11c-47.296-.02-93.683-12.73-134.16-36.742l-9.62-5.715-99.766 26.172 26.628-97.27-6.27-9.972c-26.386-41.969-40.32-90.476-40.296-140.281.055-145.332 118.305-263.57 263.7-263.57 70.406.023 136.59 27.476 186.355 77.3s77.156 116.051 77.133 186.485C583.582 462.69 465.34 580.94 320.05 580.94zm144.586-197.418c-7.922-3.968-46.883-23.132-54.149-25.78-7.258-2.645-12.547-3.962-17.824 3.968-5.285 7.93-20.469 25.781-25.094 31.066-4.625 5.29-9.242 5.953-17.168 1.985-7.925-3.965-33.457-12.336-63.726-39.332-23.555-21.012-39.457-46.961-44.082-54.89-4.617-7.938-.04-11.813 3.476-16.173 8.578-10.652 17.168-21.82 19.809-27.105 2.644-5.29 1.32-9.918-.664-13.883-1.977-3.965-17.824-42.969-24.426-58.84-6.437-15.445-12.965-13.36-17.832-13.601-4.617-.231-9.902-.278-15.187-.278-5.282 0-13.868 1.98-21.133 9.918-7.262 7.934-27.73 27.102-27.73 66.106s28.394 76.683 32.355 81.972c3.96 5.29 55.879 85.328 135.367 119.649 18.906 8.172 33.664 13.043 45.176 16.695 18.984 6.031 36.254 5.18 49.91 3.14 15.226-2.277 46.879-19.171 53.488-37.68 6.602-18.51 6.602-34.374 4.617-37.683-1.976-3.304-7.261-5.285-15.183-9.254zm0 0" />
    </svg>
  );
}

function BoletoLogo() {
  return (
    <svg viewBox="0 0 58 34" aria-label="Boleto" className="h-[29px] w-auto" style={{ width: 'auto', height: '35px' }}>
      <g fill="#fff">
        <rect x="1" y="1" width="2" height="16" rx="0.35" />
        <rect x="5" y="1" width="1.4" height="16" rx="0.3" />
        <rect x="8.5" y="1" width="3" height="16" rx="0.35" />
        <rect x="13" y="1" width="1.3" height="16" rx="0.3" />
        <rect x="16" y="1" width="2.2" height="16" rx="0.35" />
        <rect x="20" y="1" width="1.3" height="16" rx="0.3" />
        <rect x="23" y="1" width="2.7" height="16" rx="0.35" />
        <rect x="27.3" y="1" width="1.2" height="16" rx="0.3" />
        <rect x="30.8" y="1" width="2.2" height="16" rx="0.35" />
        <rect x="35" y="1" width="1.4" height="16" rx="0.3" />
        <rect x="38.4" y="1" width="2.9" height="16" rx="0.35" />
        <rect x="43" y="1" width="1.4" height="16" rx="0.3" />
        <rect x="46.3" y="1" width="2.2" height="16" rx="0.35" />
        <rect x="51" y="1" width="2.8" height="16" rx="0.35" />
        <path d="M1.6 32V20.1h5.1c2.5 0 3.9 1.1 3.9 3 0 1.1-.5 1.9-1.6 2.5 1.3.4 2 1.3 2 2.8 0 2.3-1.6 3.6-4.3 3.6H1.6Zm2.8-7h1.8c1 0 1.5-.4 1.5-1.2s-.5-1.2-1.5-1.2H4.4V25Zm0 4.5h2c1.1 0 1.7-.4 1.7-1.3s-.6-1.3-1.7-1.3h-2v2.6ZM11.9 27.6c0-2.7 1.9-4.6 4.6-4.6s4.6 1.9 4.6 4.6-1.9 4.6-4.6 4.6-4.6-1.9-4.6-4.6Zm6.4 0c0-1.4-.7-2.2-1.8-2.2s-1.8.8-1.8 2.2.7 2.2 1.8 2.2 1.8-.8 1.8-2.2ZM22.4 20.1h2.8V32h-2.8V20.1ZM35.4 28.4h-6.3c.2 1 1 1.5 2.2 1.5.9 0 1.5-.2 2.1-.8l1.5 1.6c-.9 1-2.1 1.5-3.7 1.5-3 0-4.9-1.9-4.9-4.6 0-2.6 1.9-4.6 4.6-4.6 2.6 0 4.5 1.8 4.5 4.7v.7Zm-6.3-1.7h3.8c-.2-1-.9-1.6-1.9-1.6s-1.7.6-1.9 1.6ZM42.9 31.6c-.6.4-1.4.6-2.3.6-2.1 0-3.3-1.1-3.3-3.2v-3.4H36v-2.1h1.3v-2.3h2.8v2.3h2.1v2.1h-2.1V29c0 .7.4 1.1 1 1.1.4 0 .7-.1 1-.3l.8 1.8ZM43.6 27.6c0-2.7 1.9-4.6 4.6-4.6s4.6 1.9 4.6 4.6-1.9 4.6-4.6 4.6-4.6-1.9-4.6-4.6Zm6.4 0c0-1.4-.7-2.2-1.8-2.2s-1.8.8-1.8 2.2.7 2.2 1.8 2.2 1.8-.8 1.8-2.2Z" />
      </g>
    </svg>
  );
}

function PaymentLogos() {
  return (
    <div className="mt-[27px] grid w-[146px] grid-cols-2 gap-x-[18px] gap-y-[21px] text-white">
      <div>
        <svg viewBox="0 0 32 32" aria-hidden="true" className="h-6 w-auto fill-current text-white" style={{ width: 'auto', height: '60px' }}>
          <path d="M15.854 11.329l-2.003 9.367h-2.424l2.006-9.367zM26.051 17.377l1.275-3.518 0.735 3.518zM28.754 20.696h2.242l-1.956-9.367h-2.069c-0.003-0-0.007-0-0.010-0-0.459 0-0.853 0.281-1.019 0.68l-0.003 0.007-3.635 8.68h2.544l0.506-1.4h3.109zM22.429 17.638c0.010-2.473-3.419-2.609-3.395-3.714 0.008-0.336 0.327-0.694 1.027-0.785 0.13-0.013 0.28-0.021 0.432-0.021 0.711 0 1.385 0.162 1.985 0.452l-0.027-0.012 0.425-1.987c-0.673-0.261-1.452-0.413-2.266-0.416h-0.001c-2.396 0-4.081 1.275-4.096 3.098-0.015 1.348 1.203 2.099 2.122 2.549 0.945 0.459 1.262 0.754 1.257 1.163-0.006 0.63-0.752 0.906-1.45 0.917-0.032 0.001-0.071 0.001-0.109 0.001-0.871 0-1.691-0.219-2.407-0.606l0.027 0.013-0.439 2.052c0.786 0.315 1.697 0.497 2.651 0.497 0.015 0 0.030-0 0.045-0h-0.002c2.546 0 4.211-1.257 4.22-3.204zM12.391 11.329l-3.926 9.367h-2.562l-1.932-7.477c-0.037-0.364-0.26-0.668-0.57-0.82l-0.006-0.003c-0.688-0.338-1.488-0.613-2.325-0.786l-0.066-0.011 0.058-0.271h4.124c0 0 0.001 0 0.001 0 0.562 0 1.028 0.411 1.115 0.948l0.001 0.006 1.021 5.421 2.522-6.376z" />
        </svg>
      </div>
      <div>
        <svg viewBox="0 0 32 32" aria-hidden="true" className="h-6 w-auto fill-current text-white" style={{ width: 'auto', height: '60px' }}>
          <path d="M16 8.73c-0.12 0.094-0.236 0.187-0.349 0.288-1.955 1.705-3.184 4.2-3.184 6.982s1.228 5.277 3.172 6.973l0.011 0.009c0.112 0.1 0.231 0.197 0.349 0.29 0.12-0.092 0.236-0.19 0.349-0.29 1.955-1.705 3.183-4.2 3.183-6.982s-1.228-5.277-3.172-6.973l-0.011-0.009c-0.112-0.1-0.23-0.195-0.349-0.288zM21.721 6.745c-0.005 0-0.011-0-0.018-0-1.903 0-3.67 0.577-5.138 1.566l0.033-0.021c0.075 0.059 0.143 0.121 0.205 0.186l0.001 0.001c2.116 1.836 3.446 4.528 3.446 7.531 0 2.996-1.323 5.682-3.417 7.507l-0.012 0.010c-0.072 0.061-0.15 0.122-0.226 0.182 1.441 0.97 3.216 1.549 5.125 1.549 5.112 0 9.256-4.144 9.256-9.256s-4.143-9.255-9.255-9.256h-0zM15.18 23.526c0.072 0.061 0.15 0.122 0.226 0.182-1.44 0.969-3.214 1.547-5.123 1.547-5.112 0-9.255-4.144-9.255-9.255s4.144-9.255 9.255-9.255c1.907 0 3.68 0.577 5.153 1.566l-0.033-0.021c-0.075 0.059-0.143 0.121-0.205 0.186l-0.001 0.001c-2.116 1.836-3.446 4.528-3.446 7.531 0 2.996 1.323 5.682 3.417 7.507l0.012 0.010z" />
        </svg>
      </div>
      <div className="flex items-center" style={{ justifyContent: 'center' }}>
        <svg viewBox="0 0 16 16" aria-hidden="true" className="h-6 w-6 fill-current text-white" style={{ width: 'auto', height: '35px' }}>
          <path d="M11.917 11.71a2.046 2.046 0 0 1-1.454-.602l-2.1-2.1a.4.4 0 0 0-.551 0l-2.108 2.108a2.044 2.044 0 0 1-1.454.602h-.414l2.66 2.66c.83.83 2.177.83 3.007 0l2.667-2.668h-.253zM4.25 4.282c.55 0 1.066.214 1.454.602l2.108 2.108a.39.39 0 0 0 .552 0l2.1-2.1a2.044 2.044 0 0 1 1.453-.602h.253L9.503 1.623a2.127 2.127 0 0 0-3.007 0l-2.66 2.66h.414z" />
          <path d="m14.377 6.496-1.612-1.612a.307.307 0 0 1-.114.023h-.733c-.379 0-.75.154-1.017.422l-2.1 2.1a1.005 1.005 0 0 1-1.425 0L5.268 5.32a1.448 1.448 0 0 0-1.018-.422h-.9a.306.306 0 0 1-.109-.021L1.623 6.496c-.83.83-.83 2.177 0 3.008l1.618 1.618a.305.305 0 0 1 .108-.022h.901c.38 0 .75-.153 1.018-.421L7.375 8.57a1.034 1.034 0 0 1 1.426 0l2.1 2.1c.267.268.638.421 1.017.421h.733c.04 0 .079.01.114.024l1.612-1.612c.83-.83.83-2.178 0-3.008z" />
        </svg>
      </div>
      <div>
        <BoletoLogo />
      </div>
    </div>
  );
}

function LocationMap({ mapUrl }: { mapUrl: string }) {
  const embedUrl = mapUrl.includes('/embed?')
    ? mapUrl
    : "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3700.405134482371!2d-50.484928100000005!3d-21.957408899999997!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x9495b7252347755f%3A0x998378cc07ffc5bf!2sTinpavi%20Ind%C3%BAstria%20e%20Com%C3%A9rcio%20de%20Tintas%20Ltda.!5e0!3m2!1spt-BR!2sbr!4v1778153537703!5m2!1spt-BR!2sbr";

  return (
    <div className="mt-[19px] h-[94px] w-[184px] overflow-hidden rounded-[6px]">
      <iframe
        src={embedUrl}
        width="184"
        height="94"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title="Localização Tinpavi"
      />
    </div>
  );
}

export function Footer() {
  const contato = useContatoInfo();
  const phone = contato?.telefone_1 || contato?.whatsapp || "(11) 99999-9999";
  const email = contato?.email || "vendas@tinpavi.com.br";
  const schedule = contato?.horario_funcionamento || "Seg a Sex, das 8h as 18h\nSabados, das 8h as 12h";
  const whatsapp = contato?.whatsapp || phone;
  const address = contato?.endereco || "Rua das Indústrias, 123\nSão Paulo - SP, 03000-000";
  const mapUrl = contato?.link_maps || "https://maps.app.goo.gl/6Z4Rfoz3uG1h8SLi8";

  return (
    <footer id="contato" className="border-t border-[#2c3338] bg-[#080d11] text-[#b4bac0]">
      {/* Desktop */}
      <div className="mx-auto hidden max-w-[1300px] flex-row justify-between gap-8 px-4 py-10 xl:flex">
        <section>
          <FooterLogo />
          <p className="mt-[17px] max-w-[173px] text-[13px] font-medium leading-[21px] text-[#b4bac0]">
            Especialistas em soluções de sinalização viária com qualidade, segurança e durabilidade para todo o Brasil.
          </p>
          <SocialLinks />
        </section>

        <section>
          <h3 className="mb-[23px] text-[15px] font-normal text-white">Institucional</h3>
          <FooterList items={institutionalLinks} />
        </section>

        <section>
          <h3 className="mb-[23px] text-[15px] font-normal text-white">Categorias</h3>
          <FooterList items={categoryLinks} />
        </section>

        <section>
          <h3 className="mb-[21px] text-[15px] font-normal text-white">Atendimento</h3>
          <ul className="space-y-[18px] text-[13px] font-semibold text-[#b4bac0]">
            <li className="flex items-center gap-[11px] leading-none">
              <Phone size={17} strokeWidth={2.2} />
              <span>{phone}</span>
            </li>
            <li className="flex items-center gap-[11px] leading-none">
              <Mail size={17} strokeWidth={2.2} />
              <span>{email}</span>
            </li>
            <li className="flex items-start gap-[11px] leading-[20px]">
              <Clock size={17} strokeWidth={2.2} className="mt-[1px] shrink-0" />
              <span>
                {schedule.split(/\r?\n/).map((line, index) => (
                  <span key={`${line}-${index}`}>
                    {index > 0 && <br />}
                    {line}
                  </span>
                ))}
              </span>
            </li>
            <li className="flex items-center gap-[11px] leading-none">
              <WhatsAppIcon />
              <a href={toWhatsAppHref(whatsapp)} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-[#f5b400]">
                {whatsapp}
              </a>
            </li>
          </ul>
        </section>

        <section>
          <h3 className="text-[15px] font-normal text-white">Formas de pagamento</h3>
          <PaymentLogos />
        </section>

        <section>
          <h3 className="text-[13px] font-black text-white" style={{ fontSize: '15px', fontWeight: 'normal' }}>Onde estamos</h3>
          <LocationMap mapUrl={mapUrl} />
          <address className="mt-[17px] not-italic text-[13px] font-bold leading-[19px] text-[#b4bac0]">
            {address.split(/\r?\n/).map((line, index) => (
              <span key={`${line}-${index}`}>
                {index > 0 && <br />}
                {line}
              </span>
            ))}
          </address>
          <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="mt-[12px] flex items-center gap-[10px] text-[13px] font-black text-white transition-colors hover:text-[#f5b400]" style={{ fontWeight: 'normal' }}>
            Ver no mapa
            <ArrowRight size={17} strokeWidth={3} className="text-[#f5b400]" />
          </a>
        </section>
      </div>

      {/* Mobile */}
      <div className="mx-auto max-w-[1162px] px-5 py-9 text-center xl:hidden">
        <div className="grid justify-items-center gap-8 sm:grid-cols-2">
          <section className="flex flex-col items-center">
            <FooterLogo />
            <p className="mt-4 max-w-[240px] text-[13px] font-medium leading-[21px] text-[#b4bac0]">
              Especialistas em soluções de sinalização viária com qualidade, segurança e durabilidade para todo o Brasil.
            </p>
            <div className="flex justify-center">
              <SocialLinks />
            </div>
          </section>
          <section>
            <h3 className="mb-5 text-[13px] font-black text-white">Institucional</h3>
            <FooterList items={institutionalLinks} />
          </section>
          <section>
            <h3 className="mb-5 text-[13px] font-black text-white">Categorias</h3>
            <FooterList items={categoryLinks} />
          </section>
          <section>
            <h3 className="mb-5 text-[13px] font-black text-white">Atendimento</h3>
            <ul className="space-y-4 text-[13px] font-semibold text-[#b4bac0]">
              <li className="flex items-center justify-center gap-3">
                <Phone size={17} /> {phone}
              </li>
              <li className="flex items-center justify-center gap-3">
                <Mail size={17} /> {email}
              </li>
              <li className="flex items-start justify-center gap-3">
                <Clock size={17} className="mt-0.5 shrink-0" />
                <span>
                  {schedule.split(/\r?\n/).map((line, index) => (
                    <span key={`${line}-${index}`}>
                      {index > 0 && <br />}
                      {line}
                    </span>
                  ))}
                </span>
              </li>
              <li className="flex items-center justify-center gap-3">
                <WhatsAppIcon />
                <a href={toWhatsAppHref(whatsapp)} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-[#f5b400]">
                  WhatsApp
                </a>
              </li>
            </ul>
          </section>
          <section className="flex flex-col items-center">
            <h3 className="text-[13px] font-black text-white">Formas de pagamento</h3>
            <PaymentLogos />
          </section>
          <section className="flex flex-col items-center">
            <h3 className="text-[13px] font-black text-white">Onde estamos</h3>
            <LocationMap mapUrl={mapUrl} />
            <address className="mt-4 not-italic text-[13px] font-bold leading-[19px] text-[#b4bac0]">
              {address.split(/\r?\n/).map((line, index) => (
                <span key={`${line}-${index}`}>
                  {index > 0 && <br />}
                  {line}
                </span>
              ))}
            </address>
            <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="mt-3 flex items-center justify-center gap-2 text-[13px] font-black text-white">
              Ver no mapa <ArrowRight size={17} className="text-[#f5b400]" />
            </a>
          </section>
        </div>
      </div>

      <div className="border-t border-[#20272d]">
        <div className="mx-auto flex min-h-[52px] max-w-[1300px] flex-col items-center justify-between gap-3 px-5 py-4 text-center lg:h-[52px] lg:flex-row lg:text-left xl:px-0 xl:py-0">
          <p className="text-[12px] font-semibold text-[#8a9096]">© 2024 Tinpavi Sinalização Viária. Todos os direitos reservados.</p>
          <nav className="flex flex-wrap items-center justify-center gap-x-[20px] gap-y-2">
            {legalLinks.map((item, index) => (
              <a
                key={item}
                href={footerHref(item)}
                className="border-[#4a5055] pr-[20px] text-[13px] font-semibold leading-none text-[#b4bac0] transition-colors last:border-r-0 last:pr-0 hover:text-[#f5b400] lg:border-r"
              >
                {item}
                {index < legalLinks.length - 1 && <span className="sr-only">, </span>}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}

import { ShoppingCart } from "lucide-react";
import { toWhatsAppHref, useContatoInfo } from "../admin/services/contatoInfo.service";
import { useHeroBanner } from "../admin/services/hero.service";
import { resolveImageUrl } from "../admin/services/api";
import { TrustBadges } from "./TrustBadges";

export function HeroBanner() {
  const contato = useContatoInfo();
  const hero = useHeroBanner();
  const whatsapp = contato?.whatsapp || contato?.telefone_1 || "(11) 99999-9999";
  const whatsappHref = `${toWhatsAppHref(whatsapp)}?text=${encodeURIComponent("Olá, preciso de ajuda para escolher produtos de sinalização viária.")}`;
  const bgImage = hero.imagem ? resolveImageUrl(hero.imagem) : '/assets/banner-hometp.png';

  return (
    <section className="relative min-h-[520px] w-full max-w-full overflow-hidden bg-gray-900 text-white sm:min-h-105">
      <img
        src={bgImage}
        alt="Banner Tinpavi"
        className="absolute inset-0 w-full h-full object-cover object-center opacity-100"
      />

      <div className="relative max-w-8xl mx-auto px-4 pt-14 pb-10 flex flex-col items-center text-center justify-center min-h-[440px] sm:items-start sm:text-left sm:pt-20 sm:pb-15 sm:min-h-105">
        <h1 className="text-[32px] font-bold uppercase leading-none text-white mb-2 sm:text-[50px] sm:leading-[0.95] sm:mb-3">{hero.titulo_1}</h1>
        <h1 className="text-[36px] font-bold uppercase leading-none mb-2 text-[#F5C518] sm:text-[55px] sm:leading-[0.95] sm:mb-3">
          {hero.titulo_2}
        </h1>
        <h2 className="text-[34px] font-bold uppercase leading-none text-white mb-5 sm:text-[55px] sm:leading-[0.95]">{hero.titulo_3}</h2>
        <p className="whitespace-pre-line text-gray-200 text-[15px] max-w-md mb-7 sm:text-[17px] sm:text-gray-300 sm:mb-8">
          {hero.subtitulo}
        </p>
        <div className="flex flex-col gap-3 w-full sm:flex-row sm:flex-wrap sm:w-auto">
          <a href="#mais-vendidos" className="flex items-center justify-center gap-2 bg-[#F5C518] hover:bg-[#e6b800] text-black font-bold px-6 py-3 rounded-[7px] transition-colors text-[15px]">
            <ShoppingCart size={16} />
            {hero.cta_1}
          </a>
          <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 border-2 border-white text-white hover:bg-white hover:text-black font-bold px-6 py-3 rounded-[7px] transition-colors text-[15px]">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="h-4 w-4 fill-current" aria-hidden="true"><path d="M435.922 74.352C387.824 26.434 323.84.027 255.742 0 187.797 0 123.711 26.383 75.297 74.29 26.797 122.276.063 186.05 0 253.628v.125c.008 40.902 10.754 82.164 31.152 119.828L.7 512l140.012-31.848c35.46 17.871 75.027 27.293 114.934 27.309h.101c67.934 0 132.02-26.387 180.441-74.297 48.543-48.027 75.29-111.719 75.32-179.34.02-67.144-26.82-130.883-75.585-179.472zM255.742 467.5h-.09c-35.832-.016-71.336-9.012-102.668-26.023l-6.62-3.594-93.102 21.176 20.222-91.907-3.898-6.722C50.203 327.004 39.96 290.105 39.96 253.71c.074-117.8 96.863-213.75 215.773-213.75 57.446.024 111.422 22.294 151.985 62.7 41.176 41.031 63.844 94.711 63.824 151.153-.047 117.828-96.856 213.687-215.8 213.687zm0 0"/><path d="M186.152 141.863h-11.21c-3.903 0-10.239 1.461-15.598 7.293-5.364 5.836-20.477 19.942-20.477 48.63s20.965 56.405 23.887 60.3c2.926 3.89 40.469 64.64 99.93 88.012 49.418 19.422 59.476 15.558 70.199 14.586 10.726-.97 34.613-14.102 39.488-27.715s4.875-25.285 3.414-27.723c-1.465-2.43-5.367-3.887-11.215-6.8-5.851-2.919-34.523-17.262-39.886-19.212-5.364-1.941-9.262-2.914-13.164 2.926-3.903 5.828-15.391 19.313-18.805 23.203-3.41 3.895-6.824 4.383-12.676 1.465-5.852-2.926-24.5-9.191-46.848-29.05-17.394-15.458-29.464-35.169-32.879-41.005-3.41-5.832-.363-8.988 2.57-11.898 2.63-2.61 6.18-6.18 9.106-9.582 2.922-3.406 3.754-5.836 5.707-9.727 1.95-3.89.973-7.296-.488-10.21-1.465-2.919-12.691-31.75-17.895-43.282h.004c-4.382-9.71-8.996-10.039-13.164-10.21zm0 0"/></svg>
            {hero.cta_2}
          </a>
        </div>
      </div>

      <div className="relative z-10">
        <TrustBadges inHero />
      </div>
    </section>
  );
}

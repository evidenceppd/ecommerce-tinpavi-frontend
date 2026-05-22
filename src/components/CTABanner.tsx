import { Headphones } from "lucide-react";

import { toWhatsAppHref, useContatoInfo } from "../admin/services/contatoInfo.service";

export function CTABanner() {
  const contato = useContatoInfo();
  const whatsapp = contato?.whatsapp || contato?.telefone_1 || "(11) 99999-9999";
  const whatsappHref = `${toWhatsAppHref(whatsapp)}?text=${encodeURIComponent("Olá, preciso de ajuda para escolher o produto ideal.")}`;

  return (
    <section className="px-4 my-8 lg:my-11.25">
      <div className="bg-[#F5C518] max-w-8xl mx-auto rounded-[10px] py-7 px-5 lg:py-8 lg:px-12.5">
      <div className="flex flex-col items-stretch justify-between gap-5 md:flex-row md:items-center">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-8.75 md:items-center">
          <Headphones size={40} className="w-auto h-10 text-black shrink-0 sm:h-13.75" />
          <div className="w-full text-center sm:text-left">
            <p className="text-[20px] leading-tight font-bold text-black sm:text-[23px]">Precisa de ajuda para escolher o produto ideal?</p>
            <p className="text-base text-gray-800">Fale com um especialista e receba a orientação certa para sua necessidade.</p>
          </div>
        </div>
        <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="flex w-full items-center justify-center gap-2 bg-gray-900 hover:bg-black text-white font-normal px-7.5 py-3.75 rounded-lg transition-colors shrink-0 text-base whitespace-nowrap md:w-auto">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 512 512"
            className="w-auto h-5 fill-current"
            aria-hidden="true"
          >
            <g>
              <path d="M435.922 74.352C387.824 26.434 323.84.027 255.742 0 187.797 0 123.711 26.383 75.297 74.29 26.797 122.276.063 186.05 0 253.628v.125c.008 40.902 10.754 82.164 31.152 119.828L.7 512l140.012-31.848c35.46 17.871 75.027 27.293 114.934 27.309h.101c67.934 0 132.02-26.387 180.441-74.297 48.543-48.027 75.29-111.719 75.32-179.34.02-67.144-26.82-130.883-75.585-179.472zM255.742 467.5h-.09c-35.832-.016-71.336-9.012-102.668-26.023l-6.62-3.594-93.102 21.176 20.222-91.907-3.898-6.722C50.203 327.004 39.96 290.105 39.96 253.71c.074-117.8 96.863-213.75 215.773-213.75 57.446.024 111.422 22.294 151.985 62.7 41.176 41.031 63.844 94.711 63.824 151.153-.047 117.828-96.856 213.687-215.8 213.687zm0 0" />
              <path d="M186.152 141.863h-11.21c-3.903 0-10.239 1.461-15.598 7.293-5.364 5.836-20.477 19.942-20.477 48.63s20.965 56.405 23.887 60.3c2.926 3.89 40.469 64.64 99.93 88.012 49.418 19.422 59.476 15.558 70.199 14.586 10.726-.97 34.613-14.102 39.488-27.715s4.875-25.285 3.414-27.723c-1.465-2.43-5.367-3.887-11.215-6.8-5.851-2.919-34.523-17.262-39.886-19.212-5.364-1.941-9.262-2.914-13.164 2.926-3.903 5.828-15.391 19.313-18.805 23.203-3.41 3.895-6.824 4.383-12.676 1.465-5.852-2.926-24.5-9.191-46.848-29.05-17.394-15.458-29.464-35.169-32.879-41.005-3.41-5.832-.363-8.988 2.57-11.898 2.63-2.61 6.18-6.18 9.106-9.582 2.922-3.406 3.754-5.836 5.707-9.727 1.95-3.89.973-7.296-.488-10.21-1.465-2.919-12.691-31.75-17.895-43.282h.004c-4.382-9.71-8.996-10.039-13.164-10.21zm0 0" />
            </g>
          </svg>
          Falar com especialista
        </a>
      </div>
      </div>
    </section>
  );
}

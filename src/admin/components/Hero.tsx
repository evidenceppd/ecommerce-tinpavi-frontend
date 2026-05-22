import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { homeService } from '../services/home.service'
import { useContatoInfo, toWhatsAppHref } from '../services/contatoInfo.service'

const defaults = {
  pretitle: 'A sua melhor versão',
  headline: 'COMEÇA AQUI!',
  subtitle: 'Realço sua beleza única através da cirurgia plástica, utilizando tecnologias modernas e um cuidado especial no pós-operatório.',
  buttonText: 'Entre em contato',
  backgroundImage: '/bannerHome.png',
}

export default function Hero() {
  const [data, setData] = useState(defaults)
  const contato = useContatoInfo()
  const waHref = contato?.whatsapp
    ? toWhatsAppHref(contato.whatsapp)
    : contato?.telefone_1
    ? toWhatsAppHref(contato.telefone_1)
    : '#contato'

  useEffect(() => {
    homeService.getPublic().then(content => {
      if (!content) return
      setData({
        pretitle: content.titulo_1 || defaults.pretitle,
        headline: content.titulo_2 || defaults.headline,
        subtitle: content.subtitulo || defaults.subtitle,
        buttonText: content.texto_botao || defaults.buttonText,
        backgroundImage: content.imagem || defaults.backgroundImage,
      })
    }).catch(() => {/* keep defaults on error */})
  }, [])

  // Preserve original whitespace/newlines — match everything up to the last non-space word
  const pretitleMatch = data.pretitle.match(/^([\s\S]*?)(\S+)\s*$/)
  const pretitleNormal = pretitleMatch?.[1] ?? ''
  const pretitleBold   = pretitleMatch?.[2] ?? data.pretitle

  return (
    <section
      id="home"
      className="relative mt-[97px] sm:mt-[108px] min-h-[calc(100vh-97px)] sm:min-h-[calc(100vh-108px)] overflow-hidden flex flex-col"
    >
      {/* Background image — using <img> for full browser decode quality */}
      <style>{`#hero-bg { object-position: left 20% } @media (min-width: 1190px) { #hero-bg { object-position: right 20% } }`}</style>
      <img
        id="hero-bg"
        src={data.backgroundImage}
        alt=""
        aria-hidden="true"
        fetchPriority="high"
        decoding="sync"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ zIndex: 0 }}
      />

      {/* Dark gradient overlay so left-side text stays readable */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-r from-black/80 via-black/40 to-transparent 2xl:from-black/60 2xl:via-black/30" />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 w-full relative z-20 pt-12 pb-16 flex-1 flex items-center">
        {/* Text */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col justify-center items-center text-center sm:items-start sm:text-left"
        >
          <p className="text-white text-[1.5rem] sm:text-[2.5rem] font-light mb-1 leading-snug whitespace-pre-line">
            {pretitleNormal && <>{pretitleNormal} </>}
            <strong className="font-bold">{pretitleBold}</strong>
          </p>
          <h1 className="text-[3.5rem] sm:text-[6rem] font-bold leading-none uppercase tracking-tight mb-6 bg-gradient-to-b from-[#E8C96A] via-[#C49B3C] to-[#8B6914] bg-clip-text text-transparent whitespace-pre-line">
            {data.headline}
          </h1>
          <p className="text-white/80 text-base sm:text-[1.5rem] leading-relaxed max-w-[37rem] mb-8 whitespace-pre-line">
            {data.subtitle}
          </p>
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <a
              href={waHref}
              target={waHref.startsWith('https') ? '_blank' : undefined}
              rel={waHref.startsWith('https') ? 'noopener noreferrer' : undefined}
              className="border-[2px] border-gold/80 text-white text-base sm:text-[1.5rem] px-[8px] py-[5px] rounded-[11px] hover:border-gold hover:shadow-[0_0_10px_rgba(196,155,60,0.25)] transition-all duration-300"
            >
              {data.buttonText}
            </a>
            <a
              href={waHref}
              target={waHref.startsWith('https') ? '_blank' : undefined}
              rel={waHref.startsWith('https') ? 'noopener noreferrer' : undefined}
              className="border-[2px] border-gold/80 text-white p-[7px] rounded-[12px] hover:border-gold hover:shadow-[0_0_10px_rgba(196,155,60,0.25)] transition-all duration-300 flex items-center justify-center"
            >
              <ArrowRight size={20} />
            </a>
          </div>
        </motion.div>
      </div>

      {/* Bottom gold line */}
      <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent" />
    </section>
  )
}
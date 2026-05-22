import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react'
import { aboutUsService } from '../services/aboutUs.service'
import { resolveImageUrl } from '../services/api'
import { useContatoInfo, toWhatsAppHref } from '../services/contatoInfo.service'
import OptimizedImage from './shared/OptimizedImage'

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
}

const defaultImages = [
  { src: '/sobrenos/IMG_0008.png', alt: 'Cirurgia' },
  { src: '/sobrenos/WhatsApp%20Image%202023-05-05%20at%2014.20.37%20(4).png', alt: 'Consulta' },
  { src: '/sobrenos/IMG_0780.png', alt: 'Equipe' },
  { src: '/procedimentos/Camara-Hiperbarica_Hospital-Ortopedico-AACD_1-scaled.png', alt: 'Clínica' },
]

const defaultButtonText = 'Entre em contato'

const defaultSubtitle = 'Qualidade e segurança\nem um único lugar!'

const defaultParagraphs = [
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Quis ipsum suspendisse ultrices gravida. Risus commodo viverra maecenas accumsan lacus vel facilisis.',
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Quis ipsum suspendisse ultrices gravida.',
]

function Lightbox({ index, images, onClose }: { index: number; images: { src: string; alt: string }[]; onClose: () => void }) {
  const [current, setCurrent] = useState(index)

  const prev = useCallback(() => setCurrent((c) => (c - 1 + images.length) % images.length), [images.length])
  const next = useCallback(() => setCurrent((c) => (c + 1) % images.length), [images.length])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [onClose, prev, next])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90"
      onClick={onClose}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 text-white/60 hover:text-white transition-colors duration-200 p-2"
        aria-label="Fechar"
      >
        <X size={28} />
      </button>

      {/* Prev */}
      <button
        onClick={(e) => { e.stopPropagation(); prev() }}
        className="absolute left-3 sm:left-6 z-10 text-white/60 hover:text-white transition-colors duration-200 p-2"
        aria-label="Anterior"
      >
        <ChevronLeft size={36} />
      </button>

      {/* Image */}
      <motion.div
        key={current}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="relative max-w-[90vw] max-h-[85vh] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <OptimizedImage
          src={images[current].src}
          alt={images[current].alt}
          loading="eager"
          sizes="90vw"
          className="max-w-full max-h-[85vh] rounded-xl object-contain shadow-2xl"
        />
        {/* Counter */}
        <span className="absolute bottom-[-2rem] left-1/2 -translate-x-1/2 text-white/40 text-xs tracking-widest">
          {current + 1} / {images.length}
        </span>
      </motion.div>

      {/* Next */}
      <button
        onClick={(e) => { e.stopPropagation(); next() }}
        className="absolute right-3 sm:right-6 z-10 text-white/60 hover:text-white transition-colors duration-200 p-2"
        aria-label="Próximo"
      >
        <ChevronRight size={36} />
      </button>

      {/* Thumbnails */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {images.map((img, i) => (
          <button
            key={i}
            onClick={(e) => { e.stopPropagation(); setCurrent(i) }}
            className={`w-12 h-8 rounded overflow-hidden transition-all duration-200 border-2 ${i === current ? 'border-[#C49B3C] opacity-100' : 'border-transparent opacity-40 hover:opacity-70'}`}
          >
            <OptimizedImage src={img.src} alt={img.alt} sizes="96px" className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
    </motion.div>
  )
}

export default function About() {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [subtitle, setSubtitle] = useState(defaultSubtitle)
  const [buttonText, setButtonText] = useState(defaultButtonText)
  const [paragraphs, setParagraphs] = useState<string[]>(defaultParagraphs)
  const [images, setImages] = useState<{ src: string; alt: string }[]>(defaultImages)
  const contato = useContatoInfo()
  const waHref = contato?.whatsapp
    ? toWhatsAppHref(contato.whatsapp)
    : contato?.telefone_1
    ? toWhatsAppHref(contato.telefone_1)
    : '#contato'

  useEffect(() => {
    aboutUsService.getPublic()
      .then(data => {
        if (!data) return
        const paras = data.descricao.split(/\n{2,}/).map((p: string) => p.trim()).filter(Boolean)
        let sub = defaultSubtitle
        let imgs = [...defaultImages]
        try {
          const parsed = JSON.parse(data.imagem_capa)
          if (typeof parsed.subtitle === 'string') sub = parsed.subtitle
          if (typeof parsed.buttonText === 'string') setButtonText(parsed.buttonText)
          if (Array.isArray(parsed.images) && parsed.images.length === 4) {
            imgs = parsed.images.map((src: string, i: number) => ({
              src: resolveImageUrl(src),
              alt: defaultImages[i]?.alt ?? `Imagem ${i + 1}`,
            }))
          }
        } catch {
          if (data.imagem_capa) {
            imgs = [
              { src: resolveImageUrl(data.imagem_capa), alt: 'Cirurgia' },
              ...defaultImages.slice(1),
            ]
          }
        }
        if (paras.length > 0) setParagraphs(paras)
        setSubtitle(sub)
        setImages(imgs)
      })
      .catch(() => {})
  }, [])

  return (
    <section id="sobre" className="bg-cream py-24 overflow-hidden">
      <AnimatePresence>
        {lightboxIndex !== null && (
          <Lightbox index={lightboxIndex} images={images} onClose={() => setLightboxIndex(null)} />
        )}
      </AnimatePresence>
      <div className="max-w-7xl mx-auto px-4 sm:px-8 grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-16 items-center">
        {/* Text */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="order-2 lg:order-1 text-center lg:text-left"
        >
          <h2 className="leading-none mb-[10px] text-[1.6rem] sm:text-[2.2rem] font-[600] bg-gradient-to-r from-[#C49B3C] via-[#F0D882] to-[#C49B3C] bg-clip-text text-transparent">
            Sobre nós
          </h2>
          <h2 className="text-[2rem] sm:text-[2.9rem] leading-none mb-6 text-[#514228] whitespace-pre-line">
            {subtitle}
          </h2>
          {paragraphs.map((p, i) => (
            <p
              key={i}
              className={`text-[#555] text-base sm:text-[1.5rem] leading-relaxed text-center lg:text-justify whitespace-pre-line ${i < paragraphs.length - 1 ? 'mb-3' : 'mb-[15px] lg:mb-10'}`}
            >
              {p}
            </p>
          ))}
          <div className="flex items-center justify-center lg:justify-start gap-2">
            <a
              href={waHref}
              target={waHref.startsWith('https') ? '_blank' : undefined}
              rel={waHref.startsWith('https') ? 'noopener noreferrer' : undefined}
              className="border-[2px] bg-gold border-gold/80 text-white text-base sm:text-[1.5rem] px-[8px] py-[5px] rounded-[11px] transition-all duration-300"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.45'/%3E%3C/svg%3E")`,
                backgroundSize: '200px 200px',
              }}
            >
              {buttonText}
            </a>
            <a
              href={waHref}
              target={waHref.startsWith('https') ? '_blank' : undefined}
              rel={waHref.startsWith('https') ? 'noopener noreferrer' : undefined}
              className="border-[2px] border-[#514228] text-[#514228] p-[7px] rounded-[12px] transition-all duration-300 flex items-center justify-center"
            >
              <ArrowRight size={20} />
            </a>
          </div>
        </motion.div>

        {/* Image grid */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-50px' }}
          className="order-1 lg:order-2"
        >
          <div className="rounded-[2rem] p-4">
            <div
              className="grid gap-3"
              style={{
                gridTemplateColumns: '3fr 2fr',
                gridTemplateRows: '3fr 2fr',
                height: 'clamp(320px, 50vw, 580px)',
              }}
            >
              {images.map((img, i) => (
                <button key={i} onClick={() => setLightboxIndex(i)} className="relative group overflow-hidden rounded-2xl cursor-zoom-in">
                  <OptimizedImage
                    src={img.src}
                    alt={img.alt}
                    sizes="(max-width: 1024px) 90vw, 45vw"
                    className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500${i === 1 ? ' object-top' : ''}`}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/35 transition-colors duration-300 flex items-center justify-center">
                    <ZoomIn size={32} className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 drop-shadow-lg" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
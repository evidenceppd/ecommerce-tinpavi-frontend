import { useRef, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
// @ts-ignore — types path mismatch in package.json, runtime works correctly
import { Splide, SplideSlide } from '@splidejs/react-splide'
import '@splidejs/splide/dist/css/splide-core.min.css'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { procedimentosService, mapProcedimento } from '../services/procedimentos.service'
import { resolveImageUrl } from '../services/api'
import OptimizedImage from './shared/OptimizedImage'

interface ProcSlide {
  name: string
  image: string
  href: string
}

const staticProcedures: ProcSlide[] = [
  {
    name: 'Lipo HD',
    image: '/procedimentos/Lipo-HD-LAD-5-Dicas-Para-Uma-Boa-Recuperacao.2.png',
    href: '/procedimentos',
  },
  {
    name: 'Mastopexia',
    image: '/procedimentos/mastopexia.png',
    href: '/procedimentos',
  },
  {
    name: 'Câmara Hiperbárica',
    image: '/procedimentos/Camara-Hiperbarica_Hospital-Ortopedico-AACD_1-scaled.png',
    href: '/procedimentos',
  },
]

export default function Procedures() {
  const splideRef = useRef<Splide>(null)
  const [procedures, setProcedures] = useState<ProcSlide[]>(staticProcedures)

  useEffect(() => {
    procedimentosService.getAll()
      .then(items => {
        if (!Array.isArray(items)) return
        if (items.length === 0) { setProcedures([]); return }
        const mapped: ProcSlide[] = items
          .map(mapProcedimento)
          .sort((a, b) => a.ordem - b.ordem)
          .map(b => ({
            name: b.titulo,
            image: b.imagem ? resolveImageUrl(b.imagem) : '',
            href: '/procedimentos',
          }))
          .filter(p => p.image)
        if (mapped.length > 0) setProcedures(mapped)
      })
      .catch(() => {})
  }, [])

  return (
    <section
      id="procedimentos"
      className="relative py-12 sm:py-24 overflow-hidden"
    >

      <div className="relative max-w-7xl mx-auto px-4 sm:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="text-center mb-8 sm:mb-14"
        >
          <h2 className="text-[1.5rem] sm:text-[2rem] font-[700] bg-[linear-gradient(to_right,#C49B3C_0%,#C49B3C_30%,#F0D882_50%,#C49B3C_70%,#C49B3C_100%)] bg-clip-text text-transparent">
            Procedimentos
          </h2>
          <h2 className="text-[2rem] sm:text-[2.6rem] md:text-[3rem] font-bold text-white leading-none">
            Aliados da sua beleza e saúde!
          </h2>
        </motion.div>

        {/* Carousel wrapper — arrows centered relative to slides only */}
        <div className="relative">
          {/* Desktop-only side arrows */}
          <button
            onClick={() => splideRef.current?.splide?.go('<')}
            className="hidden sm:flex absolute left-0 sm:left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-lg border border-gold/60 items-center justify-center text-gold hover:bg-gold/10 transition-all duration-300"
            aria-label="Anterior"
          >
            <ArrowLeft size={16} />
          </button>

          <button
            onClick={() => splideRef.current?.splide?.go('>')}
            className="hidden sm:flex absolute right-0 sm:right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-lg border border-gold/60 items-center justify-center text-gold hover:bg-gold/10 transition-all duration-300"
            aria-label="Próximo"
          >
            <ArrowRight size={16} />
          </button>

        {/* Carousel — narrower inner container */}
        <div className="max-w-4xl mx-auto">
        <Splide
          ref={splideRef}
          aria-label="Procedimentos"
          options={{
            type: procedures.length >= 3 ? 'loop' : 'slide',
            perPage: 3,
            perMove: 1,
            gap: '5rem',
            arrows: false,
            pagination: false,
            autoplay: false,
            clones: procedures.length >= 3 ? undefined : 0,
            focus: procedures.length < 3 ? 'center' : undefined,
            breakpoints: {
              768: { perPage: 1, clones: procedures.length >= 1 ? undefined : 0 },
            },
          }}
        >
          {procedures.map((proc, i) => (
            <SplideSlide key={i}>
              <div className="relative" style={{ paddingBottom: '20px' }}>
                <Link
                  to="/procedimentos"
                  className="group relative block rounded-2xl overflow-hidden cursor-pointer"
                  style={{ height: 'clamp(280px, 55vw, 420px)' }}
                >
                  <OptimizedImage
                    src={proc.image}
                    alt={proc.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 90vw, 33vw"
                  />
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-gold/0 group-hover:bg-gold/10 transition-colors duration-400" />
                 
                  {/* Gold border on hover */}
                  <div className="absolute inset-0 rounded-2xl ring-0 group-hover:ring-2 group-hover:ring-gold/60 transition-all duration-300" />
                </Link>
                {/* Label — outside the overflow-hidden a */}
                <div className="absolute bottom-[4px] inset-x-0 text-center">
                  <span
                    className="inline-block text-white text-sm font-semibold tracking-wide bg-gradient-to-b from-[#C49B3C] to-[#7A5A10] py-2 px-5 rounded-lg"
                    style={{
                      backgroundColor: '#c49c3e',
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.45'/%3E%3C/svg%3E")`,
                      backgroundSize: '200px 200px',
                    }}
                  >
                    {proc.name}
                  </span>
                </div>
              </div>
            </SplideSlide>
          ))}
        </Splide>
        </div>

        {/* Mobile-only inline nav below carousel */}
        <div className="flex sm:hidden items-center justify-center gap-6 mt-6">
          <button
            onClick={() => splideRef.current?.splide?.go('<')}
            className="w-11 h-11 rounded-lg border border-gold/60 flex items-center justify-center text-gold hover:bg-gold/10 active:scale-95 transition-all duration-200"
            aria-label="Anterior"
          >
            <ArrowLeft size={18} />
          </button>
          <button
            onClick={() => splideRef.current?.splide?.go('>')}
            className="w-11 h-11 rounded-lg border border-gold/60 flex items-center justify-center text-gold hover:bg-gold/10 active:scale-95 transition-all duration-200"
            aria-label="Próximo"
          >
            <ArrowRight size={18} />
          </button>
        </div>

        <div className="flex justify-center mt-[45px]">
          <Link
            to="/procedimentos"
            className="bg-gold text-white text-[1.4rem] pb-[0] px-[25px] py-[3px] rounded-[8px] hover:bg-gold-dark transition-colors duration-300"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.45'/%3E%3C/svg%3E")`,
              backgroundSize: '200px 200px',
            }}
          >
            Ver mais
          </Link>
        </div>

        </div>{/* end carousel wrapper */}
      </div>
    </section>
  )
}
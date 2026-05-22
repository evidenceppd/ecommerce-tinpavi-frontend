import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { nossaEquipeService, type NossaEquipe } from '../services/nossaEquipe.service'
import { resolveImageUrl } from '../services/api'

export default function Team() {
  const [members, setMembers] = useState<NossaEquipe[]>([])
  const [current, setCurrent] = useState(0)
  const [direction, setDirection] = useState(1)
  const touchStartX = useRef<number | null>(null)

  useEffect(() => {
    nossaEquipeService.getAll()
      .then(items => {
        if (Array.isArray(items) && items.length > 0) {
          setMembers([...items].sort((a, b) => a.ordem - b.ordem))
        }
      })
      .catch(() => {})
  }, [])

  if (members.length === 0) return null

  const prev = () => { setDirection(-1); setCurrent((c) => (c - 1 + members.length) % members.length) }
  const next = () => { setDirection(1); setCurrent((c) => (c + 1) % members.length) }

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const delta = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(delta) > 40) delta < 0 ? next() : prev()
    touchStartX.current = null
  }

  const m = members[current]

  return (
    <section id="equipe" className="py-12 sm:py-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 relative">

        {/* Left arrow — desktop only */}
        <button
          onClick={prev}
          className="hidden sm:flex absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 z-10 p-[9px] border border-gold/60 text-gold rounded-[10px] hover:bg-gold/10 transition-all"
          aria-label="Anterior"
        >
          <ArrowLeft size={20} />
        </button>

        {/* Right arrow — desktop only */}
        <button
          onClick={next}
          className="hidden sm:flex absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 z-10 p-[9px] border border-gold/60 text-gold rounded-[10px] hover:bg-gold/10 transition-all"
          aria-label="Próximo"
        >
          <ArrowRight size={20} />
        </button>

      <div
        className="max-w-5xl mx-auto px-4 sm:px-16 xl:px-8"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="overflow-hidden relative">
        <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={current}
          custom={direction}
          variants={{
            enter: (d: number) => ({ x: d * 80, opacity: 0 }),
            center: { x: 0, opacity: 1, position: 'relative' as const },
            exit: (d: number) => ({
              x: d * -80,
              opacity: 0,
              position: 'absolute' as const,
              top: 0,
              left: 0,
              width: '100%',
            }),
          }}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.35, ease: 'easeInOut' }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 items-center"
        >

          {/* Text */}
          <div className="order-2 lg:order-1 text-center lg:text-left">
            <h2
              className="text-[1.5rem] sm:text-[1.8rem] font-bold mb-3 sm:mb-5"
              style={{
                backgroundImage: 'linear-gradient(to right,#C49B3C 0%,#C49B3C 30%,#F0D882 50%,#C49B3C 70%,#C49B3C 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                color: 'transparent',
              }}
            >
              Equipe
            </h2>

            <h2 className="font-light text-white leading-[1.05]" style={{ fontSize: 'clamp(2rem, 7vw, 4.5rem)' }}>
              {m.nome}
              <br />
              <span className="font-light">{m.sobrenome}</span>
            </h2>

            <h2
              className="text-[1.2rem] sm:text-[1.5rem] mb-5 sm:mb-8 mt-[-4px] sm:mt-[-9px]"
              style={{
                backgroundImage: 'linear-gradient(to right,#C49B3C 0%,#C49B3C 30%,#F0D882 50%,#C49B3C 70%,#C49B3C 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                color: 'transparent',
              }}
            >
              {m.cargo}
            </h2>

            <p className="text-white text-sm sm:text-[18px] leading-relaxed sm:leading-[23px] mb-4 whitespace-pre-line">
              {m.descricao}
            </p>

          </div>

          {/* Doctor image */}
          <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
            <img
              src={resolveImageUrl(m.imageUrl)}
              alt={m.nome}
              className="rounded-[2rem] max-h-[420px] sm:max-h-[600px] w-auto object-cover object-top"
            />
          </div>

        </motion.div>
        </AnimatePresence>
        </div>

        {/* Mobile inline nav */}
        <div className="flex sm:hidden items-center justify-center gap-6 mt-6">
          <button
            onClick={prev}
            className="w-11 h-11 rounded-lg border border-gold/60 flex items-center justify-center text-gold hover:bg-gold/10 active:scale-95 transition-all duration-200"
            aria-label="Anterior"
          >
            <ArrowLeft size={18} />
          </button>
          <button
            onClick={next}
            className="w-11 h-11 rounded-lg border border-gold/60 flex items-center justify-center text-gold hover:bg-gold/10 active:scale-95 transition-all duration-200"
            aria-label="Próximo"
          >
            <ArrowRight size={18} />
          </button>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-3 mt-6 sm:mt-10">
          {members.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={[
                'rounded-full transition-all duration-300',
                i === current ? 'w-6 h-[6px] bg-gold' : 'w-[6px] h-[6px] bg-white/30',
              ].join(' ')}
              aria-label={'Membro ' + String(i + 1)}
            />
          ))}
        </div>
      </div>
      </div>
    </section>
  )
}
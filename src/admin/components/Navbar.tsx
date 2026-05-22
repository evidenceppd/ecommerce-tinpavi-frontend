import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useContatoInfo, toWhatsAppHref } from '../services/contatoInfo.service'

const leftLinks = [
  { label: 'Sobre nós', href: '#sobre' },
  { label: 'Procedimentos', href: '#procedimentos' },
]
const rightLinks = [
  { label: 'Equipe', href: '#equipe' },
  { label: 'Blog', href: '#blog' },
]

const allLinks = [...leftLinks, ...rightLinks]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const contato = useContatoInfo()
  const waHref = contato?.whatsapp
    ? toWhatsAppHref(contato.whatsapp)
    : contato?.telefone_1
    ? toWhatsAppHref(contato.telefone_1)
    : null

  const handleLink = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault()
    setOpen(false)
    if (location.pathname === '/') {
      document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' })
    } else {
      navigate('/' + href)
    }
  }

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      <header
        className="fixed top-0 inset-x-0 py-[8px] sm:py-[14px] z-50 transition-all duration-500 border-b border-white/5 bg-[#110c10]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <nav className="flex items-center justify-between h-20">
            {/* Left links */}
            <div className="hidden md:flex items-center gap-12 flex-1">
              {leftLinks.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={(e) => handleLink(e, l.href)}
                  className="text-white/90 text-[1.5rem] font-light tracking-wide hover:text-white transition-colors duration-200"
                >
                  {l.label}
                </a>
              ))}
            </div>

            {/* Logo */}
            <a href="#home" onClick={(e) => handleLink(e, '#home')} className="flex-shrink-0 flex items-center">
              <img
                src="/logoHeader.png"
                alt="Instituto Drefahl"
                className="h-[2.7rem] sm:h-[4rem] w-auto"
              />
            </a>

            {/* Right links */}
            <div className="hidden md:flex items-center gap-12 flex-1 justify-end">
              {rightLinks.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={(e) => handleLink(e, l.href)}
                  className="text-white/90 text-[1.5rem] font-light tracking-wide hover:text-white transition-colors duration-200"
                >
                  {l.label}
                </a>
              ))}
              {waHref ? (
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-[2px] rounded-[12px] bg-gradient-to-r from-[#8B6914] via-[#E8C96A] to-[#8B6914] hover:shadow-[0_0_12px_rgba(196,155,60,0.3)] transition-all duration-200"
                >
                  <span className="block text-white text-[1.5rem] font-light tracking-wide bg-[#0d0d0d] px-[12px] py-[1px] rounded-[11px] hover:bg-[#141414] transition-colors duration-200">
                    Contato
                  </span>
                </a>
              ) : (
                <a
                  href="#contato"
                  onClick={(e) => handleLink(e, '#contato')}
                  className="p-[2px] rounded-[12px] bg-gradient-to-r from-[#8B6914] via-[#E8C96A] to-[#8B6914] hover:shadow-[0_0_12px_rgba(196,155,60,0.3)] transition-all duration-200"
                >
                  <span className="block text-white text-[1.5rem] font-light tracking-wide bg-[#0d0d0d] px-[12px] py-[1px] rounded-[11px] hover:bg-[#141414] transition-colors duration-200">
                    Contato
                  </span>
                </a>
              )}
            </div>

            {/* Mobile toggle */}
            <button
              onClick={() => setOpen(true)}
              className="md:hidden text-white p-1"
              aria-label="Abrir menu"
            >
              <Menu size={22} />
            </button>
          </nav>
        </div>
      </header>

      {/* Mobile fullscreen overlay */}
      <div
        className={[
          'fixed inset-0 z-[60] md:hidden transition-all duration-300',
          open ? 'pointer-events-auto' : 'pointer-events-none',
        ].join(' ')}
      >
        {/* Backdrop */}
        <div
          className={[
            'absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300',
            open ? 'opacity-100' : 'opacity-0',
          ].join(' ')}
          onClick={() => setOpen(false)}
        />

        {/* Drawer — slides in from right */}
        <div
          className={[
            'absolute top-0 right-0 h-full w-full bg-[#0d0d0d] flex flex-col px-8 pt-8 pb-12',
            'transition-transform duration-400 ease-[cubic-bezier(0.22,1,0.36,1)]',
            open ? 'translate-x-0' : 'translate-x-full',
          ].join(' ')}
          style={{ transitionDuration: '420ms' }}
        >
          {/* Header row inside drawer */}
          <div className="flex items-center justify-between mb-12">
            <img
              src="/logoHeader.png"
              alt="Instituto Drefahl"
              className="h-[2.7rem] w-auto"
            />
            <button
              onClick={() => setOpen(false)}
              className="text-white p-1"
              aria-label="Fechar menu"
            >
              <X size={24} />
            </button>
          </div>

          {/* Links */}
          <nav className="flex flex-col gap-8 flex-1">
            {allLinks.map((l, i) => (
              <a
                key={l.href}
                href={l.href}
                onClick={(e) => handleLink(e, l.href)}
                className="text-white text-[1.6rem] font-light tracking-wide border-b border-white/10 pb-4 hover:text-gold transition-colors duration-200"
                style={{
                  transitionDelay: open ? `${i * 50 + 80}ms` : '0ms',
                  transform: open ? 'translateX(0)' : 'translateX(40px)',
                  opacity: open ? 1 : 0,
                  transition: `transform 380ms cubic-bezier(0.22,1,0.36,1) ${i * 50 + 80}ms, opacity 300ms ease ${i * 50 + 80}ms, color 200ms`,
                }}
              >
                {l.label}
              </a>
            ))}
          </nav>

          {/* Contato button at bottom */}
          {waHref ? (
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-auto p-[2px] rounded-[12px] bg-gradient-to-r from-[#8B6914] via-[#E8C96A] to-[#8B6914]"
              style={{
                transitionDelay: open ? `${allLinks.length * 50 + 80}ms` : '0ms',
                transform: open ? 'translateX(0)' : 'translateX(40px)',
                opacity: open ? 1 : 0,
                transition: `transform 380ms cubic-bezier(0.22,1,0.36,1) ${allLinks.length * 50 + 80}ms, opacity 300ms ease ${allLinks.length * 50 + 80}ms`,
              }}
            >
              <span className="block text-white text-[1.2rem] font-light tracking-wide text-center bg-[#0d0d0d] px-[12px] py-[10px] rounded-[11px]">
                Contato
              </span>
            </a>
          ) : (
            <a
              href="#contato"
              onClick={(e) => handleLink(e, '#contato')}
              className="mt-auto p-[2px] rounded-[12px] bg-gradient-to-r from-[#8B6914] via-[#E8C96A] to-[#8B6914]"
              style={{
                transitionDelay: open ? `${allLinks.length * 50 + 80}ms` : '0ms',
                transform: open ? 'translateX(0)' : 'translateX(40px)',
                opacity: open ? 1 : 0,
                transition: `transform 380ms cubic-bezier(0.22,1,0.36,1) ${allLinks.length * 50 + 80}ms, opacity 300ms ease ${allLinks.length * 50 + 80}ms`,
              }}
            >
              <span className="block text-white text-[1.2rem] font-light tracking-wide text-center bg-[#0d0d0d] px-[12px] py-[10px] rounded-[11px]">
                Contato
              </span>
            </a>
          )}
        </div>
      </div>
    </>
  )
}
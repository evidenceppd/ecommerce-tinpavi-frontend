import { Clock, Facebook, Instagram, Linkedin, Mail, MapPin, Phone, Youtube } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useContatoInfo, toWhatsAppHref } from '../services/contatoInfo.service'

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
)

export default function Footer() {
  const contato = useContatoInfo()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLink = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault()
    if (location.pathname === '/') {
      document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' })
    } else {
      navigate('/' + href)
    }
  }


  const email = contato?.email || ''
  const endereco = contato?.endereco || ''
  const whatsapp = contato?.whatsapp || ''
  const horario = contato?.horario_funcionamento || ''
  const telefone1 = contato?.telefone_1 || ''
  const telefone2 = contato?.telefone_2 || ''
  const linkMaps = contato?.link_maps || ''
  const instagram = contato?.link_instagram || ''
  const facebook = contato?.link_facebook || ''
  const linkedin = contato?.link_linkedin || ''
  const youtube = contato?.link_youtube || ''

  const waHref = whatsapp ? toWhatsAppHref(whatsapp) : telefone1 ? toWhatsAppHref(telefone1) : '#'

  function toTelHref(phone: string) {
    const digits = phone.replace(/\D/g, '')
    return digits ? `tel:+55${digits}` : '#'
  }

  return (
    <footer id="contato" className="bg-[#0D0D0D]">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_auto] gap-12 lg:gap-20 items-start">

          {/* Logo */}
          <div className="flex flex-col items-center lg:items-start">
            <img
              src="/logo-footer.png"
              alt="Instituto Drefahl"
              className="h-[100px] sm:h-[180px] w-auto mb-3"
            />
          </div>

          {/* Menu */}
          <div className="text-center lg:text-left">
            <h4 className="text-white text-xl sm:text-[2.3rem] mb-[12px] font-bold">Menu</h4>
            <ul className="space-y-3">
              {[
                { label: 'Sobre nós', href: '#sobrenos' },
                { label: 'Procedimentos', href: '#procedimentos' },
                { label: 'Equipe', href: '#equipe' },
                { label: 'Blog', href: '#blog' },
              ].map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    onClick={(e) => handleLink(e, item.href)}
                    className="text-white text-[1rem] hover:text-gold transition-colors"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contato */}
          <div className="text-center lg:text-left">
            <h4 className="text-white text-xl mb-[12px] sm:text-[2.3rem] font-bold">Contato</h4>
            <ul className="space-y-2">
              {!!email && (
                <li className="flex items-center justify-center lg:justify-start gap-2 max-w-[320px] mx-auto lg:max-w-none lg:mx-0">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-gold text-black shrink-0"><Mail size={11} /></span>
                  <a href={`mailto:${email}`} className="text-white text-[1rem] hover:text-gold transition-colors break-all">
                    {email}
                  </a>
                </li>
              )}
              {!!endereco && (
                <li className="flex items-center justify-center lg:justify-start gap-2 max-w-[320px] mx-auto lg:max-w-none lg:mx-0">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-gold text-black shrink-0"><MapPin size={11} /></span>
                  {linkMaps ? (
                    <a href={linkMaps} target="_blank" rel="noopener noreferrer" className="text-white text-[1rem] hover:text-gold transition-colors break-words">
                      {endereco}
                    </a>
                  ) : (
                    <span className="text-white text-[1rem] break-words">{endereco}</span>
                  )}
                </li>
              )}
              {!!whatsapp && (
                <li className="flex items-center justify-center lg:justify-start gap-2 max-w-[320px] mx-auto lg:max-w-none lg:mx-0">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-gold text-black shrink-0"><WhatsAppIcon /></span>
                  <a href={toWhatsAppHref(whatsapp)} target="_blank" rel="noopener noreferrer" className="text-white text-[1rem] hover:text-gold transition-colors">
                    {whatsapp}
                  </a>
                </li>
              )}
              {!!horario && (
                <li className="flex items-center justify-center lg:justify-start gap-2 max-w-[320px] mx-auto lg:max-w-none lg:mx-0">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-gold text-black shrink-0"><Clock size={11} /></span>
                  <span className="text-white text-[1rem] break-words">{horario}</span>
                </li>
              )}
              {!!telefone1 && (
                <li className="flex items-center justify-center lg:justify-start gap-2 max-w-[320px] mx-auto lg:max-w-none lg:mx-0">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-gold text-black shrink-0"><Phone size={11} /></span>
                  <a href={toTelHref(telefone1)} className="text-white text-[1rem] hover:text-gold transition-colors">
                    {telefone1}
                  </a>
                </li>
              )}
              {!!telefone2 && (
                <li className="flex items-center justify-center lg:justify-start gap-2 max-w-[320px] mx-auto lg:max-w-none lg:mx-0">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-gold text-black shrink-0"><Phone size={11} /></span>
                  <a href={toTelHref(telefone2)} className="text-white text-[1rem] hover:text-gold transition-colors">
                    {telefone2}
                  </a>
                </li>
              )}
            </ul>

            {/* Social icons */}
            <div className="flex items-center justify-center lg:justify-start gap-3 mt-4">
              {!!instagram && instagram !== '#' && (
                <a href={instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram"
                  className="w-5 h-5 rounded bg-gold flex items-center justify-center text-black hover:brightness-110 transition-all">
                  <Instagram size={11} />
                </a>
              )}
              {!!facebook && facebook !== '#' && (
                <a href={facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook"
                  className="w-5 h-5 rounded bg-gold flex items-center justify-center text-black hover:brightness-110 transition-all">
                  <Facebook size={11} />
                </a>
              )}
              {!!linkedin && linkedin !== '#' && (
                <a href={linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"
                  className="w-5 h-5 rounded bg-gold flex items-center justify-center text-black hover:brightness-110 transition-all">
                  <Linkedin size={11} />
                </a>
              )}
              {!!youtube && youtube !== '#' && (
                <a href={youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube"
                  className="w-5 h-5 rounded bg-gold flex items-center justify-center text-black hover:brightness-110 transition-all">
                  <Youtube size={11} />
                </a>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gold/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 flex items-center justify-center">
          <p className="text-white text-sm">
            © Copyright <span className="text-gold font-semibold">2026</span> Desenvolvido por{' '}
            <a href="https://agenciaevidence.com.br/" target='_blank' rel="noopener noreferrer" className="text-gold font-semibold hover:underline transition-all">Agência Evidence.</a>
          </p>
        </div>
      </div>
    </footer>
  )
}

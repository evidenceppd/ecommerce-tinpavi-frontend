import { useRef, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
// @ts-ignore — types path mismatch in package.json, runtime works correctly
import { Splide, SplideSlide } from '@splidejs/react-splide'
import '@splidejs/splide/dist/css/splide-core.min.css'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { noticiasService } from '../services/noticias.service'
import { resolveImageUrl } from '../services/api'

type PostSlide = { id: string; image: string; title: string; href: string }

export default function Blog() {
  const splideRef = useRef<any>(null)
  const carouselRef = useRef<HTMLDivElement>(null)
  const [posts, setPosts] = useState<PostSlide[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    noticiasService.getPublished()
      .then((data) => {
        const sorted = [...data].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        setPosts(
          sorted.map((p) => ({
            id: p.id,
            image: p.imagemCapa ? resolveImageUrl(p.imagemCapa) : '/blog.png',
            title: p.titulo,
            href: `/blog/${p.id}`,
          }))
        )
      })
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [])

  // ResizeObserver fires exactly when the container's layout is finalized,
  // ensuring Splide recalculates slide positions with the correct dimensions.
  useEffect(() => {
    const el = carouselRef.current
    if (!el) return
    let called = false
    const ro = new ResizeObserver(() => {
      splideRef.current?.splide?.refresh()
      if (!called) {
        called = true
        ro.disconnect()
      }
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [posts])

  // Fix: slides with aria-hidden="true" must not contain focusable elements.
  // Splide hides inactive slides via aria-hidden but leaves links in tab order,
  // triggering a WAI-ARIA violation. We sync tabIndex with aria-hidden on every move.
  useEffect(() => {
    const splide = splideRef.current?.splide
    if (!splide) return

    const syncTabIndex = () => {
      const track = carouselRef.current
      if (!track) return
      track.querySelectorAll<HTMLElement>('.splide__slide').forEach((slide) => {
        const hidden = slide.getAttribute('aria-hidden') === 'true'
        slide.querySelectorAll<HTMLElement>('a, button, input, [tabindex]').forEach((el) => {
          if (hidden) {
            el.setAttribute('tabindex', '-1')
          } else {
            el.removeAttribute('tabindex')
          }
        })
      })
    }

    splide.on('mounted move', syncTabIndex)
    return () => splide.off('mounted move', syncTabIndex)
  }, [posts])

  if (loaded && posts.length === 0) return null

  return (
    <section id="blog" className="py-12 sm:py-24 relative overflow-x-hidden" style={{ backgroundColor: '#F2EDE3', backgroundImage: 'url(/logobg.png)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-8">

        {/* Title */}
        <div className="text-center mb-[8px]">
          <h2 className="text-[2rem] sm:text-[2.8rem] font-bold text-[#3B2F1E]">Blog</h2>
        </div>

        {/* Arrows — desktop only */}
        <button
          onClick={() => splideRef.current?.splide?.go('<')}
          className="hidden sm:flex absolute left-4 sm:left-8 top-1/2 z-10 w-10 h-10 rounded-lg border border-[#514228]/60 items-center justify-center text-[#514228] hover:bg-[#514228]/10 transition-all duration-300"
          aria-label="Anterior"
        >
          <ArrowLeft size={16} />
        </button>

        <button
          onClick={() => splideRef.current?.splide?.go('>')}
          className="hidden sm:flex absolute right-4 sm:right-8 top-1/2 z-10 w-10 h-10 rounded-lg border border-[#514228]/60 items-center justify-center text-[#514228] hover:bg-[#514228]/10 transition-all duration-300"
          aria-label="Próximo"
        >
          <ArrowRight size={16} />
        </button>

        {/* Carousel */}
        <style>{`
          #blog-carousel .splide__list {
            align-items: center;
          }
          #blog-carousel .splide__track {
            overflow: hidden;
            padding-top: 24px;
            padding-bottom: 24px;
          }
          #blog-carousel .splide__slide {
            transform: scale(0.93);
            opacity: 1;
            margin-right: 0 !important;
            padding: 0 1rem;
            transition: transform 400ms cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 400ms ease;
          }
          #blog-carousel .splide__slide.is-active {
            transform: scale(1.04);
            opacity: 1;
            z-index: 2;
          }
          @media (max-width: 767px) {
            #blog-carousel .splide__track {
              overflow: hidden;
              padding-top: 0;
              padding-bottom: 0;
            }
            #blog-carousel .splide__slide,
            #blog-carousel .splide__slide.is-active,
            #blog-carousel .splide__slide.is-next-active {
              transform: scale(1) !important;
              width: 100% !important;
            }
          }
        `}</style>
        <div id="blog-carousel" ref={carouselRef} className="max-w-5xl mx-auto" style={{ overflowY: 'visible' }}>
          <Splide
            ref={splideRef}
            aria-label="Blog"
            options={{
              type: posts.length >= 3 ? 'loop' : 'slide',
              perPage: 3,
              perMove: 1,
              focus: 'center',
              clones: posts.length >= 3 ? undefined : 0,
              gap: 0,
              arrows: false,
              pagination: false,
              speed: 400,
              breakpoints: {
                768: { perPage: 1, focus: 0, padding: 0, clones: 0 },
              },
            }}
          >
            {posts.map((post) => (
              <SplideSlide key={post.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Link
                  to={post.href}
                  className="group relative block rounded-[1.5rem] overflow-hidden shadow-lg cursor-pointer w-full max-w-[360px] sm:w-[360px]"
                >
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full aspect-square object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </Link>
              </SplideSlide>
            ))}
          </Splide>
        </div>

        {/* Mobile inline nav */}
        <div className="flex sm:hidden items-center justify-center gap-6 mt-4 mb-6">
          <button
            onClick={() => splideRef.current?.splide?.go('<')}
            className="w-11 h-11 rounded-lg border border-[#514228]/60 flex items-center justify-center text-[#514228] hover:bg-[#514228]/10 active:scale-95 transition-all duration-200"
            aria-label="Anterior"
          >
            <ArrowLeft size={18} />
          </button>
          <button
            onClick={() => splideRef.current?.splide?.go('>')}
            className="w-11 h-11 rounded-lg border border-[#514228]/60 flex items-center justify-center text-[#514228] hover:bg-[#514228]/10 active:scale-95 transition-all duration-200"
            aria-label="Próximo"
          >
            <ArrowRight size={18} />
          </button>
        </div>
        <div className="flex justify-center">
          <Link
            to="/blog"
            className="bg-gold text-white text-[1.4rem] pb-[0] px-[25px] py-[3px] rounded-[8px] hover:bg-gold-dark transition-colors duration-300"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.45'/%3E%3C/svg%3E")`,
              backgroundSize: '200px 200px',
            }}
          >
            Leia mais
          </Link>
        </div>

      </div>
    </section>
  )
}
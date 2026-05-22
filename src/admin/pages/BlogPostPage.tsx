import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Calendar, Clock, Tag } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { noticiasService, type Noticia } from '../services/noticias.service'
import { resolveImageUrl } from '../services/api'

function computeReadTime(text: string): string {
  const words = text.trim().split(/\s+/).length
  const minutes = Math.max(1, Math.ceil(words / 200))
  return `${minutes} min`
}

export default function BlogPostPage() {
  const { id } = useParams<{ id: string }>()

  const [post, setPost] = useState<Noticia | null>(null)
  const [allPosts, setAllPosts] = useState<Noticia[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    // Fetch the specific post and the full list (for prev/next) in parallel
    Promise.all([
      noticiasService.getById(id),
      noticiasService.getPublished().catch(() => [] as Noticia[]),
    ])
      .then(([current, list]) => {
        setPost(current)
        setAllPosts(list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))

        // Update page title
        const prevTitle = document.title
        document.title = `${current.titulo} | Instituto Drefahl`

        // Update meta description
        let metaDesc = document.querySelector<HTMLMetaElement>('meta[name="description"]')
        const prevDesc = metaDesc?.getAttribute('content') ?? ''
        if (!metaDesc) {
          metaDesc = document.createElement('meta')
          metaDesc.setAttribute('name', 'description')
          document.head.appendChild(metaDesc)
        }
        const summary = current.descricao?.trim() || current.materia.slice(0, 160).replace(/\n/g, ' ').trimEnd()
        metaDesc.setAttribute('content', summary)

        return () => {
          document.title = prevTitle
          if (metaDesc) metaDesc.setAttribute('content', prevDesc)
        }
      })
      .catch(() => setPost(null))
      .finally(() => setLoading(false))
  }, [id])

  const postIndex = allPosts.findIndex((p) => p.id === id)
  const prevPost = postIndex > 0 ? allPosts[postIndex - 1] : null
  const nextPost = postIndex !== -1 && postIndex < allPosts.length - 1 ? allPosts[postIndex + 1] : null

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
    } catch {
      return ''
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F2EDE3] flex items-center justify-center">
        <Navbar />
        <p className="text-[#514228]/60 mt-[97px]">Carregando...</p>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-[#F2EDE3] flex flex-col items-center justify-center gap-4">
        <Navbar />
        <p className="text-[#514228] text-xl mt-[97px]">Artigo não encontrado.</p>
        <Link to="/blog" className="text-[#C49B3C] underline">Voltar ao blog</Link>
      </div>
    )
  }

  const paragraphs = post.materia.split(/\n\n+/).filter(Boolean)
  const readTime = post.tempoLeitura || computeReadTime(post.materia)
  const bannerUrl = post.imagemBanner ? resolveImageUrl(post.imagemBanner) : ''
  const bannerMobileUrl = post.imagemBannerMobile ? resolveImageUrl(post.imagemBannerMobile) : ''
  const hasBanner = !!(bannerUrl || bannerMobileUrl)

  return (
    <div className="min-h-screen bg-[#F2EDE3]">
      <Navbar />

      {hasBanner && (
        <style>{`
          .blog-post-header {
            background-image: ${bannerMobileUrl ? `url(${bannerMobileUrl})` : `url(${bannerUrl})`};
            background-size: cover;
            background-position: center;
          }
          @media (min-width: 640px) {
            .blog-post-header {
              background-image: ${bannerUrl ? `url(${bannerUrl})` : bannerMobileUrl ? `url(${bannerMobileUrl})` : 'none'};
            }
          }
        `}</style>
      )}

      <section
        className={`blog-post-header relative w-full mt-[97px] sm:mt-[108px] bg-[#0d0d0d] overflow-hidden`}
      >
        {hasBanner && <div className="absolute inset-0 bg-black/70" />}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.035]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: '200px 200px',
          }}
        />
        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-transparent via-[#C49B3C]/60 to-transparent" />
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="relative max-w-5xl mx-auto px-6 sm:px-12 pt-12 pb-14 sm:pt-16 sm:pb-20"
        >
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-white/40 hover:text-[#C49B3C] text-xs uppercase tracking-[0.15em] font-semibold mb-10 transition-colors duration-200"
          >
            <ArrowLeft size={12} />
            Blog
          </Link>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 mb-6">
            {post.categoria && (
              <span className="flex items-center gap-1.5 text-[#C49B3C] text-xs tracking-wide font-semibold uppercase">
                <Tag size={11} />{post.categoria}
              </span>
            )}
            <span className="flex items-center gap-1.5 text-[#C49B3C] text-xs tracking-wide">
              <Calendar size={11} />{formatDate(post.createdAt)}
            </span>
            <span className="flex items-center gap-1.5 text-white/30 text-xs tracking-wide">
              <Clock size={11} />{readTime} de leitura
            </span>
          </div>
          <h1
            className="text-white font-bold leading-[1.02] mb-5"
            style={{ fontSize: 'clamp(2.25rem, 5.5vw, 4.25rem)' }}
          >
            {post.titulo}
          </h1>
          <div className="w-16 h-[2px] bg-[#C49B3C] mb-5" />
          <p className="text-white/55 text-base sm:text-[1.125rem] leading-relaxed max-w-2xl whitespace-pre-line">
            {post.descricao}
          </p>
        </motion.div>
      </section>

      <motion.main
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-5xl mx-auto px-6 sm:px-12 py-14"
      >
        {paragraphs.map((paragraph, i) => (
          <p
            key={i}
            className={[
              'text-[#3B2F1E]/90 leading-[1.92] mb-6 text-[1.0625rem] whitespace-pre-line',
              i === 0
                ? 'first-letter:text-[3.5rem] first-letter:font-bold first-letter:text-[#C49B3C] first-letter:float-left first-letter:leading-[0.85] first-letter:mr-2 first-letter:mt-1'
                : '',
            ].join(' ')}
          >
            {paragraph}
          </p>
        ))}

        <div className="w-14 h-[2px] bg-[#C49B3C] mt-12 mb-12" />

        <nav className="flex items-stretch gap-4">
          {prevPost ? (
            <Link
              to={`/blog/${prevPost.id}`}
              className="flex-1 group flex flex-col gap-1.5 p-5 rounded-[16px] bg-white shadow-sm hover:shadow-md border border-transparent hover:border-[#C49B3C]/30 transition-all duration-300"
            >
              <span className="flex items-center gap-1 text-[#C49B3C] text-xs font-semibold uppercase tracking-wider">
                <ArrowLeft size={12} /> Anterior
              </span>
              <span className="text-[#3B2F1E] text-sm font-semibold leading-snug line-clamp-2 group-hover:text-[#C49B3C] transition-colors duration-200">
                {prevPost.titulo}
              </span>
            </Link>
          ) : (
            <div className="flex-1" />
          )}
          {nextPost ? (
            <Link
              to={`/blog/${nextPost.id}`}
              className="flex-1 group flex flex-col gap-1.5 p-5 rounded-[16px] bg-white shadow-sm hover:shadow-md border border-transparent hover:border-[#C49B3C]/30 transition-all duration-300 items-end text-right"
            >
              <span className="flex items-center justify-end gap-1 text-[#C49B3C] text-xs font-semibold uppercase tracking-wider">
                Próximo <ArrowRight size={12} />
              </span>
              <span className="text-[#3B2F1E] text-sm font-semibold leading-snug line-clamp-2 group-hover:text-[#C49B3C] transition-colors duration-200">
                {nextPost.titulo}
              </span>
            </Link>
          ) : (
            <div className="flex-1" />
          )}
        </nav>
      </motion.main>

      <Footer />
    </div>
  )
}

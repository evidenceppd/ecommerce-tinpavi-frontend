import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { noticiasService } from '../services/noticias.service'
import { resolveImageUrl } from '../services/api'

const POSTS_PER_PAGE = 6

type ApiPost = Awaited<ReturnType<typeof noticiasService.getPublished>>[number]

function toDisplayPost(p: ApiPost) {
  return {
    id: p.id,
    title: p.titulo,
    subtitle: p.descricao,
    image: p.imagemCapa ? resolveImageUrl(p.imagemCapa) : '/blog.png',
    date: new Date(p.createdAt).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }),
  }
}

export default function BlogPage() {
  const [posts, setPosts] = useState<ReturnType<typeof toDisplayPost>[]>([])
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    noticiasService.getPublished()
      .then((data) => {
        setPosts(
          [...data]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map(toDisplayPost)
        )
      })
      .catch(() => {})
  }, [])

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return posts
    return posts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.subtitle.toLowerCase().includes(q)
    )
  }, [query, posts])

  const totalPages = Math.max(1, Math.ceil(filtered.length / POSTS_PER_PAGE))
  const currentPage = Math.min(page, totalPages)
  const paginated = filtered.slice((currentPage - 1) * POSTS_PER_PAGE, currentPage * POSTS_PER_PAGE)

  const handleSearch = (value: string) => {
    setQuery(value)
    setPage(1)
  }

  const goToPage = (n: number) => {
    setPage(n)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-[#F2EDE3]">
      <Navbar />

      <main className="mt-[97px] sm:mt-[108px]">
        {/* Header */}
        <section className="py-12 sm:py-20 text-center px-4">
          <h1 className="text-[2rem] sm:text-[3.5rem] font-bold leading-none text-black">
            Blog
          </h1>
          <p className="text-[#514228]/70 text-base sm:text-lg mt-3 mb-8">
            Artigos, dicas e novidades sobre cirurgia plástica
          </p>

          {/* Search bar */}
          <div className="relative max-w-lg mx-auto">
            <Search
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#C49B3C] pointer-events-none"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Buscar artigos..."
              className="w-full pl-10 pr-4 py-3 rounded-[12px] bg-white border border-[#C49B3C]/30 text-[#3B2F1E] placeholder:text-[#514228]/40 text-sm focus:outline-none focus:border-[#C49B3C] focus:ring-2 focus:ring-[#C49B3C]/20 transition-all duration-200 shadow-sm"
            />
          </div>
        </section>

        {/* Grid */}
        <section className="max-w-7xl mx-auto px-4 sm:px-8 pb-12">
          {paginated.length === 0 ? (
            <p className="text-center text-[#514228]/60 py-20 text-lg">
              {query
                ? <>Nenhum artigo encontrado para "<span className="text-[#C49B3C]">{query}</span>".</>
                : 'Nenhum artigo publicado ainda.'}
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {paginated.map((post) => (
                <div key={post.id}>
                  <Link
                    to={`/blog/${post.id}`}
                    className="group block rounded-[2rem] overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 bg-white h-full"
                  >
                    <div className="overflow-hidden">
                      <img
                        src={post.image}
                        alt={post.title}
                        className="w-full aspect-square object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-5">
                      <p className="text-[#C49B3C] text-sm mb-1">{post.date}</p>
                      <h2 className="text-[#3B2F1E] font-bold text-lg leading-snug">{post.title}</h2>
                      <p className="text-[#555] text-sm mt-1 leading-relaxed line-clamp-3">{post.subtitle}</p>
                      <span className="inline-block mt-4 text-[#C49B3C] text-sm font-semibold group-hover:underline transition-all">
                        Leia mais &rarr;
                      </span>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Pagination */}
        {totalPages > 1 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-8 pb-20 flex items-center justify-center gap-2">
            <button
              onClick={() => goToPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="w-10 h-10 flex items-center justify-center rounded-[10px] border border-[#C49B3C]/40 text-[#C49B3C] disabled:opacity-30 hover:bg-[#C49B3C]/10 active:scale-95 transition-all duration-200"
              aria-label="Página anterior"
            >
              <ChevronLeft size={16} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => goToPage(n)}
                className={[
                  'w-10 h-10 flex items-center justify-center rounded-[10px] text-sm font-semibold transition-all duration-200 active:scale-95',
                  n === currentPage
                    ? 'bg-[#C49B3C] text-white shadow-md'
                    : 'border border-[#C49B3C]/40 text-[#C49B3C] hover:bg-[#C49B3C]/10',
                ].join(' ')}
                aria-label={`Página ${n}`}
                aria-current={n === currentPage ? 'page' : undefined}
              >
                {n}
              </button>
            ))}

            <button
              onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="w-10 h-10 flex items-center justify-center rounded-[10px] border border-[#C49B3C]/40 text-[#C49B3C] disabled:opacity-30 hover:bg-[#C49B3C]/10 active:scale-95 transition-all duration-200"
              aria-label="Próxima página"
            >
              <ChevronRight size={16} />
            </button>
          </section>
        )}
      </main>

      <Footer />
    </div>
  )
}

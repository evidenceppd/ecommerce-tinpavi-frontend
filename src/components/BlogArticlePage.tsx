import { useEffect, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, CalendarDays, Check, Clock, Share2, Tag } from "lucide-react";
import { CTABanner } from "./CTABanner";
import { noticiasService, type Noticia } from "../admin/services/noticias.service";
import { resolveImageUrl } from "../admin/services/api";
import { toWhatsAppHref, useContatoInfo } from "../admin/services/contatoInfo.service";

type Props = {
  id: string;
};

function formatDate(isoString: string) {
  return new Date(isoString).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function summarizeRelatedArticle(article: Pick<Noticia, 'descricao' | 'materia'>, maxChars = 120) {
  const description = article.descricao?.replace(/\r\n/g, '\n').trim() ?? ''
  const materiaFallback = article.materia
    .split(/\n+/)
    .map((line) => line.trim())
    .find(
      (line) =>
        line.length > 0 &&
        !/^imagem$/i.test(line) &&
        !/^dica tecnica$/i.test(line) &&
        !line.startsWith('/uploads/'),
    )

  const source = description || materiaFallback || ''
  if (!source) return ''

  if (source.length <= maxChars) {
    return source
  }

  const slice = source.slice(0, maxChars)
  const lastBoundary = Math.max(slice.lastIndexOf(' '), slice.lastIndexOf('\n'))
  const compact = (lastBoundary > maxChars * 0.6 ? slice.slice(0, lastBoundary) : slice).trimEnd()

  return `${compact.replace(/[.\s]+$/g, '')}...`
}

function renderInline(text: string): ReactNode[] {
  return text.split(/(\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean).map((part, i) => {
    if (part.startsWith('***') && part.endsWith('***')) return <strong key={i}><em>{part.slice(3, -3)}</em></strong>
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>
    if (part.startsWith('*') && part.endsWith('*')) return <em key={i}>{part.slice(1, -1)}</em>
    return <span key={i}>{part}</span>
  })
}

function renderTextContent(text: string): ReactNode {
  const lines = text.split('\n')
  const elements: ReactNode[] = []
  let listItems: string[] = []

  const flushList = () => {
    if (!listItems.length) return
    elements.push(
      <ul key={`list-${elements.length}`} className="my-3 list-disc space-y-1 pl-5 text-[15px] text-gray-700">
        {listItems.map((item, idx) => <li key={idx}>{renderInline(item)}</li>)}
      </ul>
    )
    listItems = []
  }

  lines.forEach((line, idx) => {
    const trimmed = line.trim()
    if (!trimmed) { flushList(); return }
    if (trimmed.startsWith('- ')) { listItems.push(trimmed.slice(2)); return }
    flushList()
    if (trimmed.startsWith('## ')) {
      elements.push(<h3 key={idx} className="mt-6 mb-2 text-[18px] font-black text-gray-950">{renderInline(trimmed.slice(3))}</h3>)
      return
    }
    elements.push(<p key={idx} className="mb-2 text-[15px] leading-7 text-gray-700">{renderInline(trimmed)}</p>)
  })
  flushList()

  return <>{elements}</>
}

function MateriaRenderer({ materia }: { materia: string }) {
  const segments = materia.split(/\n\n+/).filter(Boolean)

  return (
    <div className="space-y-1">
      {segments.map((segment, i) => {
        if (segment.startsWith('Dica tecnica\n')) {
          const text = segment.slice('Dica tecnica\n'.length).trim()
          return (
            <div key={i} className="my-6 rounded-lg bg-[#f5c518] p-4">
              <p className="mb-1 text-xs font-black uppercase tracking-wide text-black">Dica técnica</p>
              <p className="text-sm text-black">{text}</p>
            </div>
          )
        }

        if (segment.startsWith('Imagem\n')) {
          const src = segment.slice('Imagem\n'.length).trim()
          if (!src) return null
          return (
            <img
              key={i}
              src={resolveImageUrl(src)}
              className="my-6 w-full rounded-lg object-cover"
              alt=""
            />
          )
        }

        const newlineIdx = segment.indexOf('\n')
        if (newlineIdx !== -1) {
          const title = segment.slice(0, newlineIdx)
          const body = segment.slice(newlineIdx + 1)
          return (
            <div key={i}>
              <h2 className="mb-3 mt-8 text-[22px] font-bold leading-tight text-gray-950">{title}</h2>
              {renderTextContent(body)}
            </div>
          )
        }

        return <div key={i}>{renderTextContent(segment)}</div>
      })}
    </div>
  )
}

export function BlogArticlePage({ id }: Props) {
  const contato = useContatoInfo();
  const whatsapp = contato?.whatsapp || contato?.telefone_1 || "(11) 99999-9999";
  const whatsappHref = `${toWhatsAppHref(whatsapp)}?text=${encodeURIComponent("Olá, preciso de orientação sobre sinalização viária.")}`;
  const [article, setArticle] = useState<Noticia | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<Noticia[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [found, all] = await Promise.all([
          noticiasService.getById(id),
          noticiasService.getPublished(),
        ]);
        setArticle(found);
        setRelatedArticles(all.filter((a) => a.id !== id).slice(0, 3));
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [id]);

  function handleCopyLink() {
    navigator.clipboard.writeText(window.location.href)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {});
  }

  if (loading) {
    return (
      <main className="w-full max-w-full">
        <div className="flex min-h-[60vh] items-center justify-center text-sm text-gray-400">
          Carregando artigo...
        </div>
        <CTABanner />
      </main>
    );
  }

  if (notFound || !article) {
    return (
      <main className="w-full max-w-full">
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
          <p className="text-lg font-bold text-gray-700">Artigo não encontrado</p>
          <a href="/blog" className="inline-flex items-center gap-2 text-sm font-bold text-gray-700 hover:text-black">
            <ArrowLeft size={16} /> Voltar para o blog
          </a>
        </div>
        <CTABanner />
      </main>
    );
  }

  const bannerImage = article.imagemBanner
    ? resolveImageUrl(article.imagemBanner)
    : article.imagemCapa
      ? resolveImageUrl(article.imagemCapa)
      : null;

  return (
    <main className="w-full max-w-full">
      <div className="bg-white">
        <article>
          <header className="border-b border-gray-200 bg-gray-50">
            <div className="mx-auto max-w-8xl px-3 py-7 min-[360px]:px-4 md:py-10">
              <a href="/blog" className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-gray-700 hover:text-black">
                <ArrowLeft size={16} aria-hidden="true" /> Voltar para o blog
              </a>

              <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
                <div className="min-w-0">
                  <span className="inline-flex rounded bg-[#F5C518] px-2 py-1 text-[11px] font-black uppercase text-black" style={{ fontWeight: "bold" }}>
                    {article.categoria}
                  </span>
                  <h1 className="mt-4 max-w-3xl break-words text-[31px] font-black leading-[1.06] text-gray-950 min-[360px]:text-[36px] md:text-[48px] [overflow-wrap:anywhere]" style={{ fontWeight: "bold" }}>
                    {article.titulo}
                  </h1>
                  <p className="mt-4 max-w-2xl whitespace-pre-line break-words text-[16px] leading-7 text-gray-700 [overflow-wrap:anywhere]">
                    {article.descricao}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-4 text-[13px] font-semibold text-gray-600">
                    <span className="inline-flex items-center gap-2">
                      <CalendarDays size={16} /> {formatDate(article.createdAt)}
                    </span>
                    {article.tempoLeitura && (
                      <span className="inline-flex items-center gap-2">
                        <Clock size={16} /> {article.tempoLeitura}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-2">
                      <Tag size={16} /> {article.categoria}
                    </span>
                  </div>
                </div>

                {bannerImage && (
                  <img
                    src={bannerImage}
                    alt={article.titulo}
                    className="h-56 w-full rounded-lg object-cover md:h-72 lg:h-64"
                  />
                )}
              </div>
            </div>
          </header>

          <div className="mx-auto flex max-w-8xl flex-col gap-8 px-3 py-8 min-[360px]:px-4 lg:flex-row lg:items-start lg:py-10">
            <div className="min-w-0">
              <div className="prose-content rounded-lg border border-gray-200 bg-white p-5 md:p-8">
                <MateriaRenderer materia={article.materia} />
              </div>

              {relatedArticles.length > 0 && (
                <section className="mt-8">
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <h2 className="text-xl font-bold text-gray-950">Artigos relacionados</h2>
                    <a href="/blog" className="text-sm font-bold text-gray-700 hover:text-black">Ver todos</a>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    {relatedArticles.map((related) => {
                      const relatedSummary = summarizeRelatedArticle(related)

                      return (
                        <a key={related.id} href={`/blog/${related.id}`} className="group flex h-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-white transition hover:border-[#F5C518] hover:shadow-md">
                          {related.imagemCapa
                            ? <img src={resolveImageUrl(related.imagemCapa)} alt="" className="h-32 w-full object-cover" />
                            : <div className="h-32 w-full bg-gray-100" />}
                          <div className="flex flex-1 flex-col p-4">
                            <h3
                              className="break-words text-[14px] font-bold leading-tight text-gray-950 [overflow-wrap:anywhere]"
                              style={{
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                              }}
                            >
                              {related.titulo}
                            </h3>
                            {relatedSummary ? (
                              <p
                                className="mt-2 break-words text-[13px] leading-5 text-gray-600 [overflow-wrap:anywhere]"
                                style={{
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                }}
                              >
                                {relatedSummary}
                              </p>
                            ) : null}
                            <span className="mt-auto inline-flex items-center gap-2 pt-3 text-[13px] font-bold text-gray-900">
                              Ler artigo <ArrowRight size={14} />
                            </span>
                          </div>
                        </a>
                      )
                    })}
                  </div>
                </section>
              )}
            </div>

            <aside className="w-full shrink-0 space-y-5 lg:sticky lg:top-[184px] lg:w-[310px]">
              {article.topicos && article.topicos.length > 0 && (
                <section className="rounded-lg border border-gray-200 bg-white p-5">
                  <h2 className="text-[16px] font-black text-gray-950" style={{ fontWeight: "bold" }}>Neste artigo</h2>
                  <div className="mt-3 space-y-2">
                    {article.topicos.map((topic) => (
                      <p key={topic} className="break-words text-sm font-bold text-gray-700 [overflow-wrap:anywhere]">{topic}</p>
                    ))}
                  </div>
                </section>
              )}
              <section className="rounded-lg border border-gray-200 bg-white p-5">
                <h2 className="text-[16px] font-black text-gray-950" style={{ fontWeight: "bold" }}>Compartilhar</h2>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#F5C518] px-4 py-3 text-sm font-black text-black"
                  style={{ fontWeight: "bold" }}
                >
                  {copied ? <><Check size={17} /> Copiado!</> : <><Share2 size={17} /> Copiar link</>}
                </button>
              </section>

              <section className="rounded-lg border border-gray-200 bg-gray-950 p-5 text-white">
                <h2 className="text-[18px] font-black" style={{ fontWeight: "bold" }}>Precisa de orientação?</h2>
                <p className="mt-2 text-sm leading-6 text-gray-300">
                  Fale com um especialista para escolher os produtos certos para sua aplicação.
                </p>
                <a
                  href={whatsappHref}
                  className="mt-4 inline-flex w-full items-center justify-center rounded-md bg-[#F5C518] px-4 py-3 text-sm font-black text-black"
                  style={{ fontWeight: "bold" }}
                >
                  Falar com especialista
                </a>
              </section>
            </aside>
          </div>
        </article>

        <CTABanner />
      </div>
    </main>
  );
}

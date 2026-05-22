import { useEffect, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  FileText,
  HardHat,
  Package,
  Search,
  TrafficCone,
  TriangleAlert,
} from "lucide-react";
import { CTABanner } from "./CTABanner";
import { noticiasService, type Noticia } from "../admin/services/noticias.service";
import { resolveImageUrl } from "../admin/services/api";
import { useBlogBanner } from "../admin/services/blog-banner.service";

const categoryTabs = [
  { label: "Todos os artigos", icon: BookOpen, slug: "todos", href: "/blog" },
  { label: "Normas e Legislação", icon: FileText, slug: "normas-e-legislacao", href: "/blog?categoria=normas-e-legislacao" },
  { label: "Sinalização Viária", icon: TriangleAlert, slug: "sinalizacao-viaria", href: "/blog?categoria=sinalizacao-viaria" },
  { label: "Produtos", icon: Package, slug: "produtos", href: "/blog?categoria=produtos" },
  { label: "Aplicações", icon: TrafficCone, slug: "aplicacoes", href: "/blog?categoria=aplicacoes" },
  { label: "Dicas e Boas Práticas", icon: HardHat, slug: "dicas-e-boas-praticas", href: "/blog?categoria=dicas-e-boas-praticas" },
];

function slugifyCategory(cat: string) {
  return cat
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function formatArticleDate(isoString: string) {
  return new Date(isoString).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function formatCardSummary(value: string, maxLines = 3, maxChars = 120) {
  const normalized = value.replace(/\r\n/g, "\n").trim();
  if (!normalized) return "";

  let summary = normalized;
  let truncated = false;

  const lines = summary.split("\n");
  if (lines.length > maxLines) {
    summary = lines.slice(0, maxLines).join("\n").trimEnd();
    truncated = true;
  }

  if (summary.length > maxChars) {
    const slice = summary.slice(0, maxChars);
    const lastBoundary = Math.max(slice.lastIndexOf(" "), slice.lastIndexOf("\n"));
    summary = (lastBoundary > maxChars * 0.6 ? slice.slice(0, lastBoundary) : slice).trimEnd();
    truncated = true;
  }

  return truncated ? `${summary.replace(/[.\s]+$/g, "")}...` : summary;
}

interface Article {
  id: string;
  title: string;
  category: string;
  categorySlug: string;
  date: string;
  excerpt: string;
  image: string;
}

function noticiaToArticle(n: Noticia): Article {
  return {
    id: n.id,
    title: n.titulo,
    category: n.categoria,
    categorySlug: slugifyCategory(n.categoria),
    date: formatArticleDate(n.createdAt),
    excerpt: n.descricao,
    image: n.imagemCapa ? resolveImageUrl(n.imagemCapa) : '',
  };
}

function ArticleCard({ article }: { article: Article }) {
  const summary = formatCardSummary(article.excerpt, 3, 500);

  return (
    <article className="overflow-hidden rounded-lg border border-gray-200 bg-white transition hover:border-[#F5C518] hover:shadow-md">
      <div className="flex h-42 items-center justify-center overflow-hidden bg-gray-100">
        {article.image && (
          <img
            src={article.image}
            alt={article.title}
            className="h-full w-full object-cover"
          />
        )}
      </div>
      <div className="p-3">
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <span className="rounded bg-[#F5C518] px-2 py-0.5 text-[9px] font-black uppercase text-black" style={{ fontWeight: "bold" }}>
            {article.category}
          </span>
          <span className="text-[11px] font-medium text-gray-500">{article.date}</span>
        </div>
        <h2 className="mt-[25px] break-words text-[15px] font-black leading-tight text-gray-950 [overflow-wrap:anywhere]" style={{ fontWeight: "bold" }}>{article.title}</h2>
        <p
          className="mt-1.5 h-[3.75rem] whitespace-pre-line break-words text-[13px] leading-5 text-gray-600 [overflow-wrap:anywhere]"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {summary}
        </p>
        <a href={`/blog/${article.id}`} className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-black text-gray-950 hover:underline" style={{ fontWeight: "bold" }}>
          Ler mais <ArrowRight size={14} aria-hidden="true" />
        </a>
      </div>
    </article>
  );
}

function blogHref(categorySlug: string, page = 1, search = "") {
  const params = new URLSearchParams();
  if (categorySlug !== "todos") params.set("categoria", categorySlug);
  if (search.trim()) params.set("busca", search.trim());
  if (page > 1) params.set("pagina", String(page));
  const query = params.toString();
  return query ? `/blog?${query}` : "/blog";
}

export function BlogPage() {
  const blogBanner = useBlogBanner();
  const [locationSearch, setLocationSearch] = useState(window.location.search);
  const [allArticles, setAllArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  const params = new URLSearchParams(locationSearch);
  const requestedCategory = params.get("categoria") || "todos";
  const requestedSearch = params.get("busca") || "";
  const currentPage = Math.max(1, Number(params.get("pagina") || "1"));
  const activeTab = categoryTabs.find((tab) => tab.slug === requestedCategory) || categoryTabs[0];
  const activeCategory = activeTab.slug;
  const normalizedSearch = normalizeSearchText(requestedSearch.trim());

  const categoryFilteredArticles =
    activeCategory === "todos"
      ? allArticles
      : allArticles.filter((a) => a.categorySlug === activeCategory);

  const filteredArticles = categoryFilteredArticles.filter((a) => {
    if (!normalizedSearch) return true;
    const haystack = normalizeSearchText([a.title, a.excerpt, a.category].join(" "));
    return haystack.includes(normalizedSearch);
  });

  const articlesPerPage = 6;
  const pageCount = Math.max(1, Math.ceil(filteredArticles.length / articlesPerPage));
  const normalizedPage = Math.min(currentPage, pageCount);
  const visibleArticles = filteredArticles.slice(
    (normalizedPage - 1) * articlesPerPage,
    normalizedPage * articlesPerPage
  );

  const sidebarCategories = [
    { label: "Todos os artigos", slug: "todos", href: blogHref("todos", 1, requestedSearch), count: allArticles.length },
    ...categoryTabs.slice(1).map((tab) => ({
      label: tab.label,
      slug: tab.slug,
      href: blogHref(tab.slug, 1, requestedSearch),
      count: allArticles.filter((a) => a.categorySlug === tab.slug).length,
    })),
  ];

  const recentArticles = allArticles.slice(0, 5);

  useEffect(() => {
    noticiasService
      .getPublished()
      .then((items) => setAllArticles(items.map(noticiaToArticle)))
      .catch(() => setAllArticles([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    function handlePopState() {
      setLocationSearch(window.location.search);
    }
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  function navigateBlog(href: string) {
    window.history.pushState(null, "", href);
    setLocationSearch(window.location.search);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleNavigation(event: React.MouseEvent<HTMLAnchorElement>, href: string) {
    event.preventDefault();
    navigateBlog(href);
  }

  function handleBlogSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const query = String(formData.get("busca") || "").trim();
    const nextParams = new URLSearchParams();
    if (activeCategory !== "todos") nextParams.set("categoria", activeCategory);
    if (query) nextParams.set("busca", query);
    const href = nextParams.toString() ? `/blog?${nextParams.toString()}` : "/blog";
    navigateBlog(href);
  }

  return (
    <div className="bg-white">
      <section
        className="relative overflow-hidden bg-gray-950 bg-cover bg-center"
        style={blogBanner.imagem ? { backgroundImage: `url(${resolveImageUrl(blogBanner.imagem)})` } : { backgroundImage: "url('/assets/banner-hometp.png')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-black/15" />
        <div className="relative mx-auto max-w-8xl px-3 py-10 text-white min-[360px]:px-4 min-[360px]:py-14 md:py-17">
          <p className="text-[12px] font-black uppercase text-[#F5C518]" style={{ fontWeight: "bold" }}>{blogBanner.supertitulo}</p>
          <h1 className="mt-3 max-w-lg text-[29px] font-black leading-[1.05] min-[360px]:text-[34px] md:text-[44px]" style={{ fontWeight: "bold" }}>
            {blogBanner.titulo}
          </h1>
          <p className="mt-4 max-w-lg whitespace-pre-line text-[15px] font-semibold leading-6 text-white" style={{ fontWeight: "unset" }}>
            {blogBanner.descricao}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-8xl px-3 py-6 min-[360px]:px-4 min-[360px]:py-7">
        <div className="mb-7 flex gap-3 overflow-x-auto pb-2">
          {categoryTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.slug === activeTab.slug;
            const tabHref = blogHref(tab.slug, 1, requestedSearch);
            return (
              <a
                key={tab.label}
                href={tabHref}
                onClick={(event) => handleNavigation(event, tabHref)}
                className={`flex h-11 shrink-0 items-center gap-2 rounded-md border bg-white px-3 text-[12px] font-bold text-gray-900 transition hover:border-[#F5C518] min-[360px]:h-12 min-[360px]:px-5 min-[360px]:text-[13px] ${isActive ? "border-[#F5C518] shadow-sm" : "border-gray-200"}`}
              >
                <Icon size={17} aria-hidden="true" />
                {tab.label}
              </a>
            );
          })}
        </div>

        <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1fr)_310px]">
          <div>
            {loading ? (
              <div className="py-16 text-center text-sm text-gray-400">Carregando artigos...</div>
            ) : visibleArticles.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 py-16 text-center text-sm text-gray-400">
                Nenhum artigo encontrado
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {visibleArticles.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            )}

            {!loading && pageCount > 1 && (
              <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                <a
                  href={blogHref(activeCategory, Math.max(1, normalizedPage - 1), requestedSearch)}
                  onClick={(event) => handleNavigation(event, blogHref(activeCategory, Math.max(1, normalizedPage - 1), requestedSearch))}
                  className={`inline-flex h-9 items-center gap-1 rounded-md border px-3 text-sm font-bold min-[360px]:gap-2 min-[360px]:px-4 ${normalizedPage === 1 ? "pointer-events-none border-gray-200 bg-gray-50 text-gray-400" : "border-gray-200 bg-white text-black hover:border-[#F5C518]"}`}
                >
                  <ArrowRight size={14} className="rotate-180" aria-hidden="true" /> Anterior
                </a>
                {Array.from({ length: pageCount }).map((_, index) => {
                  const page = index + 1;
                  return (
                    <a
                      key={page}
                      href={blogHref(activeCategory, page, requestedSearch)}
                      onClick={(event) => handleNavigation(event, blogHref(activeCategory, page, requestedSearch))}
                      className={`flex h-9 w-9 items-center justify-center rounded-md border text-sm font-bold ${page === normalizedPage ? "border-black bg-black text-white" : "border-gray-200 bg-white text-black hover:border-[#F5C518]"}`}
                    >
                      {page}
                    </a>
                  );
                })}
                <a
                  href={blogHref(activeCategory, Math.min(pageCount, normalizedPage + 1), requestedSearch)}
                  onClick={(event) => handleNavigation(event, blogHref(activeCategory, Math.min(pageCount, normalizedPage + 1), requestedSearch))}
                  className={`inline-flex h-9 items-center gap-1 rounded-md border px-3 text-sm font-bold min-[360px]:gap-2 min-[360px]:px-4 ${normalizedPage === pageCount ? "pointer-events-none border-gray-200 bg-gray-50 text-gray-400" : "border-gray-200 bg-white text-black hover:border-[#F5C518]"}`}
                >
                  Próxima <ArrowRight size={14} aria-hidden="true" />
                </a>
              </div>
            )}
          </div>

          <aside className="space-y-5">
            <section className="rounded-lg border border-gray-200 bg-white p-5">
              <h2 className="text-[16px] font-black text-gray-950" style={{ fontWeight: "bold" }}>Buscar no blog</h2>
              <form onSubmit={handleBlogSearch} className="mt-4 flex">
                <input
                  key={requestedSearch}
                  defaultValue={requestedSearch}
                  type="search"
                  name="busca"
                  placeholder="Pesquisar artigos..."
                  className="min-w-0 flex-1 rounded-l-md border border-gray-300 px-3 py-2.5 text-[13px] outline-none focus:border-[#F5C518]"
                />
                <button type="submit" className="flex w-11 items-center justify-center rounded-r-md bg-[#F5C518] text-black">
                  <Search size={18} aria-hidden="true" />
                </button>
              </form>
            </section>

            <section className="rounded-lg border border-gray-200 bg-white p-5">
              <h2 className="text-[16px] font-black text-gray-950" style={{ fontWeight: "bold" }}>Categorias</h2>
              <div className="mt-4 space-y-3">
                {sidebarCategories.map(({ label, count, slug, href }) => (
                  <a
                    key={label}
                    href={href}
                    onClick={(event) => handleNavigation(event, href)}
                    className={`flex items-center justify-between text-[13px] font-bold hover:text-black ${slug === activeTab.slug ? "text-black" : "text-gray-700"}`}
                  >
                    <span>{label}</span>
                    <span className={`flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-[11px] ${slug === activeTab.slug ? "bg-[#F5C518] text-black" : "bg-gray-100 text-gray-700"}`}>
                      {count}
                    </span>
                  </a>
                ))}
              </div>
            </section>

            {recentArticles.length > 0 && (
              <section className="rounded-lg border border-gray-200 bg-white p-5">
                <h2 className="text-[16px] font-black text-gray-950" style={{ fontWeight: "bold" }}>Artigos recentes</h2>
                <div className="mt-4 space-y-6">
                  {recentArticles.map((item, index) => {
                    const recentSummary = formatCardSummary(item.excerpt, 3, 120);

                    return (
                      <a key={item.id} href={`/blog/${item.id}`} className="grid grid-cols-[24px_56px_minmax(0,1fr)] gap-3">
                        <span className={`mt-4 flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-black ${index < 3 ? "bg-[#F5C518] text-black" : "bg-gray-200 text-gray-700"}`} style={{ fontWeight: "bold" }}>
                          {index + 1}
                        </span>
                        <img src={item.image} alt="" className="h-14 w-14 rounded-md bg-gray-100 object-cover" />
                        <span className="min-w-0">
                          <strong className="line-clamp-2 break-words text-[13px] leading-tight text-gray-950 [overflow-wrap:anywhere]">{item.title}</strong>
                          {recentSummary ? (
                            <span
                              className="mt-1 block whitespace-pre-line break-words text-[11px] leading-4 text-gray-600 [overflow-wrap:anywhere]"
                              style={{
                                display: "-webkit-box",
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                              }}
                            >
                              {recentSummary}
                            </span>
                          ) : null}
                          <span className="mt-1 block text-[11px] text-gray-500">{item.date}</span>
                        </span>
                      </a>
                    );
                  })}
                </div>
              </section>
            )}
          </aside>
        </div>
      </div>

      <CTABanner />
    </div>
  );
}

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { noticiasService, type Noticia } from "../admin/services/noticias.service";
import { resolveImageUrl } from "../admin/services/api";

function formatCardSummary(value: string, maxLines = 3, maxChars = 160) {
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

export function BlogSection() {
  const [articles, setArticles] = useState<Noticia[]>([]);

  useEffect(() => {
    noticiasService
      .getPublished()
      .then((items) => setArticles(items.slice(0, 3)))
      .catch(() => {});
  }, []);

  if (articles.length === 0) return null;

  return (
    <section className="bg-gray-50 py-10">
      <div className="max-w-8xl mx-auto px-4">
        <div className="flex flex-col items-start gap-2 mb-6 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-bold text-gray-900">Conteúdo técnico e orientações</h2>
          <a href="/blog" className="text-sm text-gray-900 hover:underline font-medium flex items-center gap-1">
            Ver todos os  <ArrowRight size={14} />
          </a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {articles.map((a) => {
            const summary = formatCardSummary(a.descricao || "");

            return (
              <article key={a.id} className="h-full rounded-xl border border-gray-200 bg-white overflow-hidden transition-all hover:border-[#F5C518] hover:shadow-md">
                <div className="flex h-full flex-col lg:flex-row">
                  <img src={a.imagemCapa ? resolveImageUrl(a.imagemCapa) : "/assets/conteudos/rua.jpeg"} alt={a.titulo} className="h-40 w-full object-cover lg:h-full lg:w-32 xl:w-36" />
                  <div className="min-w-0 flex flex-1 flex-col p-3">
                    <h3 className="mb-1 break-words text-[15px] font-bold leading-tight text-gray-900 [overflow-wrap:anywhere]">{a.titulo}</h3>
                    <p className="mb-1.5 line-clamp-3 whitespace-pre-line break-words text-[13px] leading-snug text-gray-600 [overflow-wrap:anywhere]">{summary}</p>
                    <a href={`/blog/${a.id}`} className="mt-auto inline-flex items-center gap-1 pt-1 text-[13px] font-semibold text-gray-900 hover:underline">
                      Leia mais <ArrowRight size={14} />
                    </a>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

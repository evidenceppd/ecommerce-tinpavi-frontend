import { useEffect, useState, useRef, useCallback } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { produtoService, type Produto } from "../admin/services/produto.service";
import { categoriaProdutoService, type CategoriaProduto } from "../admin/services/categoriaProduto.service";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export function CategoryHighlights() {
  const [categories, setCategories] = useState<CategoriaProduto[]>([]);
  const [products, setProducts] = useState<Produto[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const SCROLL_AMOUNT = 900;

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll);
    el.addEventListener("scrollend", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      el.removeEventListener("scrollend", checkScroll);
    };
  }, [checkScroll]);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(checkScroll);
    return () => window.cancelAnimationFrame(frameId);
  }, [categories.length, checkScroll]);

  useEffect(() => {
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [checkScroll]);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      categoriaProdutoService.listPublic({ page: 1, limit: 50 }),
      produtoService.listPublic({ page: 1, limit: 100, orderBy: "title" }),
    ])
      .then(([catResponse, prodResponse]) => {
        if (!mounted) return;
        setCategories(catResponse.items);
        setProducts(prodResponse.items);
      })
      .catch((error) => {
        console.error("Erro ao carregar destaques por categoria:", error);
      });
    return () => { mounted = false; };
  }, []);

  function scrollAndCheck(delta: number) {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: delta, behavior: "smooth" });
    let prev = el.scrollLeft;
    function poll() {
      if (!scrollRef.current) return;
      const cur = scrollRef.current.scrollLeft;
      checkScroll();
      if (cur !== prev) { prev = cur; requestAnimationFrame(poll); }
    }
    requestAnimationFrame(poll);
  }

  const columns = categories
    .map((cat) => ({
      title: cat.name,
      slug: cat.slug,
      items: products.filter((p) => p.categoryName === cat.name && p.isFeatured === true).slice(0, 4),
    }))
    .filter((col) => col.items.length > 0);

  if (columns.length === 0) return null;

  return (
    <section className="bg-white py-10">
      <div className="max-w-8xl mx-auto px-4">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Destaques por categoria</h2>
        <div className="relative">
          {canScrollLeft && (
            <button
              onClick={() => scrollAndCheck(-SCROLL_AMOUNT)}
              className="absolute left-1 top-1/2 -translate-y-1/2 z-10 bg-white border border-gray-200 shadow-md rounded-full w-9 h-9 hidden items-center justify-center hover:bg-gray-50 transition-colors sm:flex lg:-translate-x-4"
              aria-label="Anterior"
            >
              <ChevronLeft size={18} />
            </button>
          )}

          <div
            ref={scrollRef}
            className="flex gap-6 overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >

            {columns.map((col) => (
              <div key={col.title} className="w-[78vw] max-w-72 shrink-0 sm:w-72">
                <h3 className="text-sm font-bold text-gray-800 border-b-2 border-[#F5C518] pb-2 mb-3">{col.title}</h3>
                <div className="flex flex-col gap-3.75">
                  {col.items.map((item) => {
                    const image = item.images?.[0]?.url || item.galleryImages?.[0] || "";
                    return (
                      <a key={item.id} href={`/produto/${item.slug}`} className="group flex min-h-20 items-center gap-3.25 rounded p-1 -m-1 transition-colors hover:bg-gray-50">
                        <div className="relative flex h-18 w-18 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-transparent p-1 md:h-12.5 md:w-12.5">
                          {image ? (
                            <img
                              alt={item.name}
                              src={image}
                              className="h-full w-full object-contain transition-transform group-hover:scale-105"
                            />
                          ) : (
                            <span className="text-[10px] font-bold text-gray-400">Sem imagem</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[15px] text-gray-700 leading-tight">{item.name}</p>
                          <p className="text-[14px] font-bold text-gray-900">{formatCurrency(item.price)}</p>
                        </div>
                      </a>
                    );
                  })}
                </div>
                <a href={`/busca?categoria=${encodeURIComponent(col.title)}`} className="mt-3 flex items-center gap-1 text-[13px] text-gray-900 font-medium hover:underline">
                  Ver todos <ArrowRight size={12} />
                </a>
              </div>
            ))}
          </div>

          {canScrollRight && (
            <button
              onClick={() => scrollAndCheck(SCROLL_AMOUNT)}
              className="absolute right-1 top-1/2 -translate-y-1/2 z-10 bg-white border border-gray-200 shadow-md rounded-full w-9 h-9 hidden items-center justify-center hover:bg-gray-50 transition-colors sm:flex lg:translate-x-4"
              aria-label="Próximo"
            >
              <ChevronRight size={18} />
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

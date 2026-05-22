import { useEffect, useState, useRef, useCallback } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { categoriaProdutoService, type CategoriaProduto } from "../admin/services/categoriaProduto.service";
import { resolveImageUrl } from "../admin/services/api";

function categoryHref(category: string) {
  return `/busca?categoria=${encodeURIComponent(category)}`;
}

function getCategoryImage(category: CategoriaProduto) {
  return category.coverImage ? resolveImageUrl(category.coverImage) : "";
}

export function CategoryGrid() {
  const [apiCategories, setApiCategories] = useState<CategoriaProduto[]>([]);
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
  }, [apiCategories.length, checkScroll]);

  useEffect(() => {
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [checkScroll]);

  useEffect(() => {
    let cancelled = false;
    categoriaProdutoService
      .listPublic({ page: 1, limit: 50 })
      .then((response) => { if (!cancelled) setApiCategories(response.items); })
      .catch(() => { if (!cancelled) setApiCategories([]); });
    return () => { cancelled = true; };
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

  function handleScrollLeft() { scrollAndCheck(-SCROLL_AMOUNT); }
  function handleScrollRight() { scrollAndCheck(SCROLL_AMOUNT); }

  const categories = apiCategories.map((category) => ({
    name: category.name,
    img: getCategoryImage(category),
  }));

  return (
    <section className="bg-white py-10">
      <div className="max-w-8xl mx-auto px-4">
        <div className="mb-6 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-bold text-gray-900">Compre por categoria</h2>
          <a href="/busca" className="flex items-center gap-1 text-sm font-medium text-gray-900 hover:underline">
            Ver todas as categorias <ArrowRight size={14} />
          </a>
        </div>

        {categories.length > 0 ? (
          <div className="relative">
            {canScrollLeft && (
              <button
                onClick={handleScrollLeft}
                className="absolute left-1 top-1/2 -translate-y-1/2 z-10 bg-white border border-gray-200 shadow-md rounded-full w-9 h-9 hidden items-center justify-center hover:bg-gray-50 transition-colors sm:flex lg:-translate-x-4"
                aria-label="Anterior"
              >
                <ChevronLeft size={18} />
              </button>
            )}

            <div
              ref={scrollRef}
              className="flex gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            >
              {categories.map((cat) => (
                <a
                  key={cat.name}
                  href={categoryHref(cat.name)}
                  className="group flex w-[44vw] max-w-44 shrink-0 flex-col items-center gap-2 rounded-lg border border-gray-100 p-3 transition-all hover:border-[#F5C518] hover:shadow-md sm:w-44"
                >
                  <div className="flex h-28 w-full items-center justify-center overflow-hidden rounded-lg bg-transparent p-2 sm:h-32.5">
                    {cat.img ? (
                      <img
                        src={cat.img}
                        alt={cat.name}
                        className="h-full w-full object-contain transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <span className="text-xs font-bold text-gray-400">Sem imagem</span>
                    )}
                  </div>
                  <p className="max-w-32 text-center text-[15px] font-medium leading-tight text-gray-700">{cat.name}</p>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 512 512"
                    className="mt-auto h-5 w-auto text-black"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="m506.134 241.843-.018-.019-104.504-104c-7.829-7.791-20.492-7.762-28.285.068-7.792 7.829-7.762 20.492.067 28.284L443.558 236H20c-11.046 0-20 8.954-20 20s8.954 20 20 20h423.557l-70.162 69.824c-7.829 7.792-7.859 20.455-.067 28.284 7.793 7.831 20.457 7.858 28.285.068l104.504-104 .018-.019c7.833-7.818 7.808-20.522-.001-28.314z" />
                  </svg>
                </a>
              ))}
            </div>

            {canScrollRight && (
              <button
                onClick={handleScrollRight}
                className="absolute right-1 top-1/2 -translate-y-1/2 z-10 bg-white border border-gray-200 shadow-md rounded-full w-9 h-9 hidden items-center justify-center hover:bg-gray-50 transition-colors sm:flex lg:translate-x-4"
                aria-label="Próximo"
              >
                <ChevronRight size={18} />
              </button>
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-gray-200 p-8 text-center text-sm text-gray-600">
            Nenhuma categoria cadastrada.
          </div>
        )}
      </div>
    </section>
  );
}

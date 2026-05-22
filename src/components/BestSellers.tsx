import { ShoppingCart, ChevronRight, ChevronLeft } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { produtoService, type Produto } from "../admin/services/produto.service";

function formatPrice(price: number) {
  return price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function BestSellers() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [apiProducts, setApiProducts] = useState<Produto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const products = apiProducts
    .slice(0, 8)
    .map((product) => ({
      id: product.id,
      name: product.name,
      price: product.price,
      installment: `2x de ${formatPrice(product.price / 2)} sem juros`,
      tag: product.badge || "PRODUTO",
      img: product.images?.[0]?.url || product.galleryImages?.[0] || "",
      slug: product.slug,
    }));

  const SCROLL_AMOUNT = 900;

  function checkScroll() {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }

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
  }, []);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      checkScroll();
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [apiProducts.length, isLoading]);

  useEffect(() => {
    function handleResize() {
      checkScroll();
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    let mounted = true;
    produtoService.listPublic({ limit: 12, orderBy: "createdAt" })
      .then((result) => {
        if (mounted) setApiProducts(result.items);
      })
      .catch((error) => {
        console.error("Erro ao carregar produtos:", error);
        if (mounted) setApiProducts([]);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
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

  return (
    <section id="mais-vendidos" className="scroll-mt-72 bg-gray-50 py-10 sm:scroll-mt-48">
      <div className="max-w-8xl mx-auto px-4">
        <div className="flex flex-col items-start gap-2 mb-6 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-bold text-gray-900">Mais vendidos</h2>
          <a href="/busca" className="text-sm text-gray-900 hover:underline font-medium flex items-center gap-1">
            Ver todos <ChevronRight size={14} />
          </a>
        </div>
        <div className="relative">
          {!isLoading && products.length === 0 && (
            <div className="rounded-lg border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-600">
              Nenhum produto cadastrado para exibir.
            </div>
          )}

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
            {products.map((product) => (
              <a
                key={product.id}
                href={`/produto/${product.slug}`}
                className="shrink-0 w-[78vw] max-w-52 bg-white rounded-lg border border-gray-100 hover:shadow-lg hover:border-[#F5C518] transition-all overflow-hidden sm:w-52"
              >
                <div className="relative flex h-44.25 items-center justify-center overflow-hidden rounded-lg bg-transparent p-4">
                  {product.img ? (
                    <img
                      src={product.img}
                      alt={product.name}
                      className="h-full w-full object-contain transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <span className="text-xs font-bold text-gray-400">Sem imagem</span>
                  )}
                  <span className="absolute top-2 left-2 bg-[#F5C518] text-black text-[9px] font-bold px-1.5 py-0.5 rounded">
                    {product.tag}
                  </span>
                </div>
                <div className="p-3">
                  <p className="text-sm text-gray-700 font-medium leading-tight mb-2 line-clamp-2 h-8">{product.name}</p>
                  <div className="mt-3.5 mb-2 h-0.5 w-5 rounded-full bg-[#F5C518]" />
                  <p className="text-lg font-bold text-gray-900">{formatPrice(product.price)}</p>
                  <p className="text-[10px] text-gray-500 mb-3">{product.installment}</p>
                  <span className="w-full bg-[#F5C518] hover:bg-[#e6b800] text-black text-xs font-bold py-2 rounded-[5px] flex items-center justify-center gap-1 transition-colors">
                    <ShoppingCart size={12} />
                    Comprar
                  </span>
                </div>
              </a>
            ))}
          </div>

          {canScrollRight && (
            <button
              onClick={handleScrollRight}
              className="absolute right-1 top-1/2 -translate-y-1/2 z-10 bg-white border border-gray-200 shadow-md rounded-full w-9 h-9 hidden items-center justify-center hover:bg-gray-50 transition-colors sm:flex lg:translate-x-4"
              aria-label="Proximo"
            >
              <ChevronRight size={18} />
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

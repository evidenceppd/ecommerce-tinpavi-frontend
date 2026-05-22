import { useEffect, useMemo, useState } from "react";
import { ShoppingCart, SlidersHorizontal } from "lucide-react";
import { Select } from "./shared/Select";
import { produtoService, type Produto } from "../admin/services/produto.service";
import { categoriaProdutoService } from "../admin/services/categoriaProduto.service";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function SearchPage() {
  const params = new URLSearchParams(window.location.search);
  const query = params.get("q") || "";
  const initialCategory = params.get("categoria") || "Todas";
  const [apiProducts, setApiProducts] = useState<Produto[]>([]);
  const [apiCategories, setApiCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [maximumPrice, setMaximumPrice] = useState(0);
  const [sortBy, setSortBy] = useState("relevance");

  const normalizedQuery = normalize(query);
  const products = apiProducts.map((product) => ({
    id: product.id,
    name: product.name,
    category: product.categoryName || "",
    price: product.price,
    tag: product.badge || "Produto",
    image: product.images?.[0]?.url || product.galleryImages?.[0] || "",
    slug: product.slug,
  }));
  const maxProductPrice = Math.max(1, Math.ceil(Math.max(...products.map((product) => product.price), 1)));

  useEffect(() => {
    let mounted = true;

    async function loadCatalog() {
      try {
        const [productResult, categoryResult] = await Promise.all([
          produtoService.listPublic({ search: query, limit: 100 }),
          categoriaProdutoService.listPublic({ limit: 100 }),
        ]);

        if (!mounted) return;
        setApiProducts(productResult.items);
        setApiCategories(categoryResult.items.map((category) => category.name));
      } catch (error) {
        console.error("Erro ao carregar catalogo publico:", error);
        if (!mounted) return;
        setApiProducts([]);
        setApiCategories([]);
      }
    }

    void loadCatalog();
    return () => {
      mounted = false;
    };
  }, [query]);

  useEffect(() => {
    setMaximumPrice(maxProductPrice);
  }, [maxProductPrice]);

  const filteredProducts = useMemo(() => {
    const result = products.filter((product) => {
      const matchesSearch =
        !normalizedQuery ||
        normalize(product.name).includes(normalizedQuery) ||
        normalize(product.category).includes(normalizedQuery);
      const matchesCategory = selectedCategory === "Todas" || product.category === selectedCategory;
      const matchesPrice = product.price <= maximumPrice;

      return matchesSearch && matchesCategory && matchesPrice;
    });

    return [...result].sort((a, b) => {
      if (sortBy === "price-asc") return a.price - b.price;
      if (sortBy === "price-desc") return b.price - a.price;
      return a.name.localeCompare(b.name);
    });
  }, [maximumPrice, normalizedQuery, products, selectedCategory, sortBy]);

  return (
    <div className="bg-gray-50">
      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-8xl px-4 py-8">
          <p className="text-xs font-bold uppercase text-[#ffa201]">Busca</p>
          <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-950">
                {query ? `Resultado para "${query}"` : selectedCategory !== "Todas" ? selectedCategory : "Produtos"}
              </h1>
              <p className="mt-2 text-sm text-gray-600">{filteredProducts.length} produtos encontrados</p>
            </div>

            <label className="w-full max-w-xs">
              <span className="mb-1.5 block text-sm font-bold text-gray-800">Ordenar por</span>
              <Select
                value={sortBy}
                onChange={setSortBy}
                options={[
                  { value: "relevance", label: "Mais relevantes" },
                  { value: "price-asc", label: "Menor preço" },
                  { value: "price-desc", label: "Maior preço" },
                ]}
              />
            </label>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-8xl gap-6 px-4 py-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:py-8">
        <aside className="h-fit rounded-lg border border-gray-200 bg-white p-5 shadow-sm lg:sticky lg:top-32">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={20} aria-hidden="true" />
            <h2 className="text-lg font-bold text-gray-950">Filtros</h2>
          </div>

          <div className="mt-5 border-t border-gray-100 pt-5">
            <h3 className="text-sm font-bold text-gray-950">Categoria</h3>
            <div className="mt-3 space-y-2">
              {["Todas", ...apiCategories].map((category) => (
                <label key={category} className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                  <input
                    type="radio"
                    name="category"
                    checked={selectedCategory === category}
                    onChange={() => setSelectedCategory(category)}
                    className="h-4 w-4 cursor-pointer appearance-none rounded-full bg-gray-200 checked:bg-[#F5C518]"
                  />
                  {category}
                </label>
              ))}
            </div>
          </div>

          <div className="mt-5 border-t border-gray-100 pt-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-gray-950">Preço</h3>
              <span className="text-xs font-bold text-gray-600">Até {formatCurrency(maximumPrice)}</span>
            </div>
            <input
              type="range"
              min="0"
              max={maxProductPrice}
              step="10"
              value={maximumPrice}
              onChange={(event) => setMaximumPrice(Number(event.target.value))}
              className="mt-4 h-2 w-full cursor-pointer accent-[#F5C518]"
              aria-label="Preço máximo"
            />
            <div className="mt-2 flex items-center justify-between text-xs font-bold text-gray-500">
              <span>{formatCurrency(0)}</span>
              <span>{formatCurrency(maxProductPrice)}</span>
            </div>
            <button
              type="button"
              className="mt-3 cursor-pointer text-sm font-bold text-gray-950 hover:underline"
              onClick={() => setMaximumPrice(maxProductPrice)}
            >
              Limpar preço
            </button>
          </div>
        </aside>

        <section className="min-w-0">
          {filteredProducts.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredProducts.map((product) => (
                <a
                  key={product.id}
                  href={`/produto/${product.slug}`}
                  className="group overflow-hidden rounded-lg border border-gray-200 bg-white transition hover:border-[#F5C518] hover:shadow-md"
                >
                  <div className="relative flex h-48 items-center justify-center bg-gray-50 p-5">
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="h-full w-full object-contain transition group-hover:scale-105" />
                    ) : (
                      <span className="text-xs font-bold text-gray-400">Sem imagem</span>
                    )}
                    <span className="absolute left-3 top-3 rounded bg-[#F5C518] px-2 py-1 text-[10px] font-bold uppercase text-black">
                      {product.tag}
                    </span>
                  </div>
                  <div className="p-4">
                    <h2 className="min-h-10 text-sm font-medium leading-tight text-gray-800">{product.name}</h2>
                    <p className="text-xl font-black text-gray-950">{formatCurrency(product.price)}</p>
                    <p className="mt-1 text-xs text-gray-500">2x de {formatCurrency(product.price / 2)} sem juros</p>
                    <span className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[#F5C518] text-sm font-bold text-black transition hover:bg-[#e6b800]">
                      <ShoppingCart size={16} aria-hidden="true" />
                      Comprar
                    </span>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
              <h2 className="text-xl font-bold text-gray-950">Nenhum produto encontrado</h2>
              <p className="mt-2 text-sm text-gray-600">Ajuste os filtros ou cadastre produtos no painel.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

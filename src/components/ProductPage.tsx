import { useEffect, useMemo, useState } from "react";
import {
  Award,
  Building2,
  CalendarDays,
  ChevronRight,
  CircleParking,
  ClipboardCheck,
  Factory,
  FileText,
  HardHat,
  Headphones,
  Lock,
  MapPin,
  Minus,
  Plus,
  Route,
  ShieldCheck,
  ShoppingCart,
  Star,
  Truck,
  X,
} from "lucide-react";
import { ImageZoom } from "./ImageZoom";
import { BlogSection } from "./BlogSection";
import { produtoService, type Produto } from "../admin/services/produto.service";
import { cartService } from "../admin/services/cart.service";
import { toWhatsAppHref, useContatoInfo } from "../admin/services/contatoInfo.service";
import { avaliacaoService, type Avaliacao } from "../admin/services/avaliacao.service";

const productTabs = [
  { id: "description", label: "DESCRIÇÃO" },
  { id: "specs", label: "ESPECIFICAÇÕES" },
  { id: "applications", label: "APLICAÇÕES" },
  { id: "questions", label: "PERGUNTAS FREQUENTES" },
] as const;

type ProductTabId = (typeof productTabs)[number]["id"];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getRatingAriaLabel(averageRating: number, reviewsCount: number) {
  if (reviewsCount <= 0) return "Sem avaliações ainda";
  const averageText = averageRating.toFixed(1).replace(".", ",");
  return `${averageText} de 5 estrelas com base em ${reviewsCount} avaliações`;
}

function getErrorStatus(error: unknown): number | undefined {
  if (!error || typeof error !== "object") return undefined;
  const response = (error as { response?: { status?: number } }).response;
  return typeof response?.status === "number" ? response.status : undefined;
}

function getProductCodeFromPath() {
  return decodeURIComponent(window.location.pathname.replace(/^\/produto\//, "").replace(/\/$/, ""));
}

function productImage(product: Produto) {
  return product.images?.[0]?.url || product.galleryImages?.[0] || "";
}

function formatVariantLabel(product: Produto, variant: NonNullable<Produto["variants"]>[number], index: number) {
  const attributes = Object.entries(variant.attributes || {})
    .map(([key, value]) => `${key}: ${value}`)
    .join(" | ");

  if (attributes) return attributes;
  if (variant.sku) return `SKU ${variant.sku}`;
  return `${product.name} - Variante ${index + 1}`;
}

function normalizeUsageArea(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function UsageAreaIcon({ area }: { area: string }) {
  const normalized = normalizeUsageArea(area);

  if (normalized.includes("obra")) return <HardHat size={25} aria-hidden="true" />;
  if (normalized.includes("condominio")) return <Building2 size={25} aria-hidden="true" />;
  if (normalized.includes("estacionamento")) return <CircleParking size={25} aria-hidden="true" />;
  if (normalized.includes("empresa") || normalized.includes("industrial")) return <Factory size={25} aria-hidden="true" />;
  if (normalized.includes("evento")) return <CalendarDays size={25} aria-hidden="true" />;
  return <Route size={25} aria-hidden="true" />;
}

function RelatedProductCard({ product }: { product: Produto }) {
  const image = productImage(product);

  return (
    <a
      href={`/produto/${product.slug}`}
      className="group flex h-full min-h-[344px] flex-col overflow-hidden rounded-lg border border-gray-100 bg-white transition-all hover:border-[#F5C518] hover:shadow-lg"
    >
      <div className="relative flex h-44 items-center justify-center overflow-hidden rounded-lg bg-transparent p-4">
        {image ? (
          <img
            src={image}
            alt={product.name}
            className="h-full w-full object-contain transition-transform group-hover:scale-105"
          />
        ) : (
          <span className="text-xs font-bold text-gray-400">Sem imagem</span>
        )}
        <span className="absolute left-2 top-2 rounded bg-[#F5C518] px-1.5 py-0.5 text-[9px] font-bold uppercase text-black">
          {product.badge || "PRODUTO"}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-3">
        <p className="mb-2 line-clamp-2 h-10 text-sm font-medium leading-tight text-gray-700">{product.name}</p>
        <div className="mb-2 mt-3.5 h-0.5 w-5 rounded-full bg-[#F5C518]" />
        <p className="text-lg font-bold text-gray-900">{formatCurrency(product.price)}</p>
        <p className="mb-3 text-[10px] text-gray-500">2x de {formatCurrency(product.price / 2)} sem juros</p>
        <span className="mt-auto flex w-full items-center justify-center gap-1 rounded-[5px] bg-[#F5C518] py-2 text-xs font-bold text-black transition-colors hover:bg-[#e6b800]">
          <ShoppingCart size={12} aria-hidden="true" />
          Comprar
        </span>
      </div>
    </a>
  );
}

function getRelatedProducts(currentProduct: Produto, sameCategoryItems: Produto[], fallbackItems: Produto[]) {
  const relatedMap = new Map<string, Produto>();

  for (const item of sameCategoryItems) {
    if (item.id !== currentProduct.id) relatedMap.set(item.id, item);
  }

  for (const item of fallbackItems) {
    if (item.id !== currentProduct.id) relatedMap.set(item.id, item);
    if (relatedMap.size >= 5) break;
  }

  return Array.from(relatedMap.values()).slice(0, 5);
}

export function ProductPage() {
  const contato = useContatoInfo();
  const [product, setProduct] = useState<Produto | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Produto[]>([]);
  const [activeTab, setActiveTab] = useState<ProductTabId>("description");
  const [activeImage, setActiveImage] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [isFreightModalOpen, setIsFreightModalOpen] = useState(false);
  const [isReviewsModalOpen, setIsReviewsModalOpen] = useState(false);
  const [cep, setCep] = useState("");
  const [freightStep, setFreightStep] = useState<"form" | "options">("form");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [variantErrorMessage, setVariantErrorMessage] = useState("");
  const [cartStatusMessage, setCartStatusMessage] = useState("");
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [reviews, setReviews] = useState<Avaliacao[]>([]);
  const productCode = useMemo(getProductCodeFromPath, []);

  useEffect(() => {
    let mounted = true;

    async function loadProduct() {
      try {
        const loadedProduct = await produtoService.getPublicByCode(productCode);
        const [sameCategoryProductsResult, fallbackProductsResult] = await Promise.allSettled([
          loadedProduct.categoryId
            ? produtoService.listPublic({ limit: 8, category_id: loadedProduct.categoryId })
            : Promise.resolve({ items: [] as Produto[], total: 0 }),
          produtoService.listPublic({ limit: 12, orderBy: "createdAt" }),
        ]);

        const sameCategoryProducts =
          sameCategoryProductsResult.status === "fulfilled"
            ? sameCategoryProductsResult.value
            : { items: [] as Produto[], total: 0 };

        const fallbackProducts =
          fallbackProductsResult.status === "fulfilled"
            ? fallbackProductsResult.value
            : { items: [] as Produto[], total: 0 };

        if (!mounted) return;
        setProduct(loadedProduct);
        avaliacaoService
          .listByProduct(loadedProduct.id, { limit: 10 })
          .then((result) => {
            if (mounted) setReviews(result.items);
          })
          .catch(() => {
            if (mounted) setReviews([]);
          });
        setActiveImage(productImage(loadedProduct));
        setSelectedVariantId(null);
        setVariantErrorMessage("");
        setCartStatusMessage("");
        setErrorMessage("");
        setRelatedProducts(getRelatedProducts(loadedProduct, sameCategoryProducts.items, fallbackProducts.items));
      } catch (error) {
        console.error("Erro ao carregar produto:", error);
        if (!mounted) return;
        const status = getErrorStatus(error);
        setErrorMessage(
          status === 429
            ? "Muitas requisições no momento. Tente novamente em instantes."
            : "Produto não encontrado.",
        );
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    void loadProduct();
    return () => {
      mounted = false;
    };
  }, [productCode]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-8xl px-4 py-16">
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-gray-600">Carregando produto...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-8xl px-4 py-16">
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <h1 className="text-xl font-bold text-gray-950">{errorMessage || "Produto não encontrado."}</h1>
          <a href="/busca" className="mt-4 inline-flex rounded-md bg-[#F5C518] px-5 py-3 text-sm font-bold text-black">Ver produtos</a>
        </div>
      </div>
    );
  }

  const availableVariants = (product.variants || []).filter((variant) => variant.isActive !== false);
  const selectedVariant = availableVariants.find((variant) => variant.id === selectedVariantId) || null;
  const requiresVariantSelection = availableVariants.length > 0;
  const selectedPrice = selectedVariant
    ? Math.max(0, product.price + Number(selectedVariant.priceAdjustment || 0))
    : product.price;
  const selectedStock = selectedVariant ? selectedVariant.stock : product.stock;
  const variantImage = selectedVariant?.imageUrl || "";
  const images = product.galleryImages?.length ? product.galleryImages : product.images?.map((image) => image.url) || [];
  const activeDisplayImage = variantImage || activeImage;
  const installments = selectedPrice / 6;
  const selectedVariantLabel = selectedVariant
    ? formatVariantLabel(
      product,
      selectedVariant,
      Math.max(0, availableVariants.findIndex((item) => item.id === selectedVariant.id)),
    )
    : "";
  const whatsappText = encodeURIComponent(
    `Olá, quero comprar ${quantity} unidade(s) do ${product.name}.${selectedVariantLabel ? `\nVariante: ${selectedVariantLabel}` : ""}`,
  );
  const whatsapp = contato?.whatsapp || contato?.telefone_1 || "(11) 99999-9999";
  const productHelpHref = `${toWhatsAppHref(whatsapp)}?text=${encodeURIComponent("Olá, preciso de ajuda para escolher o produto ideal.")}`;
  const usageAreas = product.usageAreas || [];
  const reviewsCount = Math.max(0, product.reviewsCount ?? 0);
  const averageRating = reviewsCount > 0 ? clamp(product.averageRating ?? 0, 0, 5) : 0;
  const cartProductSnapshot = {
    name: product.name,
    code: product.sku || product.slug,
    unitPrice: selectedPrice,
    pixPrice: selectedPrice,
    image: activeDisplayImage || productImage(product),
    stock: selectedStock,
    variantName: selectedVariantLabel || undefined,
  };

  const handleSelectVariant = (variantId: string) => {
    setVariantErrorMessage("");
    setCartStatusMessage("");

    if (selectedVariantId === variantId) {
      setSelectedVariantId(null);
      setActiveImage(productImage(product));
      if (quantity > product.stock && product.stock > 0) {
        setQuantity(product.stock);
      }
      if (product.stock === 0) {
        setQuantity(1);
      }
      return;
    }

    setSelectedVariantId(variantId);
    const selected = availableVariants.find((item) => item.id === variantId);
    if (!selected) return;
    if (selected.imageUrl) setActiveImage(selected.imageUrl);
    if (quantity > selected.stock && selected.stock > 0) {
      setQuantity(selected.stock);
    }
    if (selected.stock === 0) {
      setQuantity(1);
    }
  };

  const handleAddToCart = async () => {
    if (requiresVariantSelection && !selectedVariant) {
      setVariantErrorMessage("Selecione uma variante antes de adicionar ao carrinho.");
      return;
    }

    if (selectedStock <= 0) {
      setVariantErrorMessage("A variante selecionada está sem estoque.");
      return;
    }

    try {
      setIsAddingToCart(true);
      setVariantErrorMessage("");
      await cartService.addItem(product.id, quantity, selectedVariantId ?? undefined, cartProductSnapshot);
      setCartStatusMessage("Produto adicionado ao carrinho.");
    } catch {
      setCartStatusMessage("");
      setVariantErrorMessage("Faça login como cliente para adicionar itens ao carrinho.");
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (requiresVariantSelection && !selectedVariant) {
      setVariantErrorMessage("Selecione uma variante para continuar.");
      return;
    }

    if (selectedStock <= 0) {
      setVariantErrorMessage("A variante selecionada está sem estoque.");
      return;
    }

    try {
      setIsAddingToCart(true);
      setVariantErrorMessage("");
      await cartService.addItem(product.id, quantity, selectedVariantId ?? undefined, cartProductSnapshot);
      window.location.href = "/checkout";
    } catch {
      setVariantErrorMessage("Faça login como cliente para finalizar a compra.");
    } finally {
      setIsAddingToCart(false);
    }
  };

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-8xl px-4 py-10 lg:py-8">
        <nav className="mb-6 flex flex-wrap items-center gap-2 text-[12px] font-medium text-gray-500">
          <a href="/" className="hover:text-gray-900">Home</a>
          <ChevronRight size={14} />
          <a href={`/busca?categoria=${encodeURIComponent(product.categoryName || "Produtos")}`} className="hover:text-gray-900">
            {product.categoryName || "Produtos"}
          </a>
          <ChevronRight size={14} />
          <span className="text-gray-700">{product.name}</span>
        </nav>

        <section className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(380px,0.9fr)]">
          <div className="grid gap-4 sm:grid-cols-[74px_minmax(0,1fr)]">
            <div className="order-2 flex gap-3 overflow-x-auto pb-1 sm:order-1 sm:flex-col sm:overflow-visible">
              {images.map((img, index) => (
                <button
                  key={`${img}-${index}`}
                  type="button"
                  className={`flex h-18 w-18 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-white p-1 ${activeImage === img ? "border-[#F5C518] ring-1 ring-[#F5C518]" : "border-gray-200"}`}
                  aria-label={`Imagem ${index + 1}`}
                  onClick={() => setActiveImage(img)}
                  onMouseEnter={() => setActiveImage(img)}
                >
                  <img src={img} alt="" className="h-full w-full object-contain" />
                </button>
              ))}
            </div>

            <div className="group order-1 relative flex min-h-[360px] items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-white p-6 sm:order-2 lg:min-h-[600px]">
              {product.badge && <span className="absolute left-4 top-4 z-10 rounded bg-[#F5C518] px-2 py-1 text-[10px] font-bold text-black">{product.badge}</span>}
              {activeDisplayImage ? (
                <ImageZoom
                  src={activeDisplayImage}
                  alt={product.name}
                  imgClassName="h-full max-h-[500px] w-full object-contain"
                  containerClassName="h-full w-full items-center justify-center flex"
                  zoomPanelSize={520}
                  zoomScale={3}
                />
              ) : (
                <span className="text-sm font-bold text-gray-400">Produto sem imagem cadastrada</span>
              )}
              {activeDisplayImage && (
                <p className="absolute bottom-6 hidden items-center gap-2 text-[12px] font-semibold text-gray-500 md:flex">
                  <Star size={14} aria-hidden="true" /> Passe o mouse para ampliar
                </p>
              )}
            </div>
          </div>

          <aside>
            <p className="mb-3 text-[12px] font-bold uppercase tracking-wide text-gray-500">CÓD.: {product.sku}</p>
            <h1 className="max-w-xl text-[30px] font-bold leading-[1.04] text-gray-950 md:text-[36px]">{product.name}</h1>

            <button
              type="button"
              className="mt-4 flex flex-wrap items-center gap-2 text-left text-[13px] transition hover:text-gray-950"
              onClick={() => setIsReviewsModalOpen(true)}
              aria-label="Ver avaliações dos clientes"
            >
              <span className="flex items-center gap-0.5" role="img" aria-label={getRatingAriaLabel(averageRating, reviewsCount)}>
                {Array.from({ length: 5 }).map((_, index) => {
                  const fillPercent = clamp((averageRating - index) * 100, 0, 100);

                  return (
                    <span key={index} className="relative inline-flex h-[15px] w-[15px]" aria-hidden="true">
                      <Star size={15} className="absolute inset-0 text-gray-300" fill="currentColor" strokeWidth={0} />
                      <span className="absolute inset-0 overflow-hidden" style={{ width: `${fillPercent}%` }}>
                        <Star size={15} className="text-[#F5C518]" fill="currentColor" strokeWidth={0} />
                      </span>
                    </span>
                  );
                })}
              </span>
              <strong>{reviewsCount} avaliações</strong>
              <span className="text-gray-300">|</span>
              <span className="text-gray-700">{product.sales || 0} vendidos</span>
            </button>

            <div className="mt-6 grid grid-cols-1 overflow-hidden rounded-lg border border-gray-200 sm:grid-cols-3">
              <div className="flex items-center gap-2 border-b border-gray-200 px-4 py-3 sm:border-b-0 sm:border-r">
                <ShieldCheck size={18} aria-hidden="true" />
                <span className="text-[13px] font-bold">Alta durabilidade</span>
              </div>
              <div className="flex items-center gap-2 border-b border-gray-200 px-4 py-3 sm:border-b-0 sm:border-r">
                <Award size={18} aria-hidden="true" />
                <span className="text-[13px] font-bold">Uso profissional</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-3">
                <ClipboardCheck size={18} aria-hidden="true" />
                <span className="text-[13px] font-bold">Pronta entrega</span>
              </div>
            </div>

            <div className="mt-6">
              <p className="text-[32px] font-bold text-gray-950">{formatCurrency(selectedPrice)}</p>
              <p className="text-[13px] font-bold text-gray-900">ou 6x de {formatCurrency(installments)} sem juros</p>
            </div>

            {availableVariants.length > 0 && (
              <div className="mt-6 rounded-lg border border-gray-200 p-3">
                <p className="mb-3 text-[12px] font-bold uppercase tracking-wide text-gray-500">Escolha a variante</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {availableVariants.map((variant, index) => {
                    const isSelected = selectedVariantId === variant.id;
                    const label = formatVariantLabel(product, variant, index);
                    const adjustment = Number(variant.priceAdjustment || 0);

                    return (
                      <button
                        key={variant.id}
                        type="button"
                        onClick={() => handleSelectVariant(variant.id)}
                        className={`rounded-md border px-3 py-2 text-left transition ${isSelected ? "border-[#F5C518] bg-[#F5C518]/10" : "border-gray-200 hover:border-[#F5C518]/60"}`}
                      >
                        <p className="text-sm font-bold text-gray-900">{label}</p>
                        <p className="text-xs text-gray-600">
                          Estoque: {variant.stock}
                          {adjustment !== 0 ? ` | Ajuste: ${adjustment > 0 ? "+" : ""}${formatCurrency(adjustment)}` : ""}
                        </p>
                      </button>
                    );
                  })}
                </div>
                {variantErrorMessage && <p className="mt-2 text-xs font-semibold text-red-600">{variantErrorMessage}</p>}
                {cartStatusMessage && <p className="mt-2 text-xs font-semibold text-emerald-700">{cartStatusMessage}</p>}
              </div>
            )}

            <div className="mt-6 flex items-center justify-between gap-4">
              <div className="flex h-11 w-32 items-center justify-between rounded-md border border-gray-200 bg-white px-3">
                <button type="button" aria-label="Diminuir quantidade" onClick={() => setQuantity((current) => Math.max(1, current - 1))}><Minus size={16} aria-hidden="true" /></button>
                <span className="text-sm font-bold">{quantity}</span>
                <button
                  type="button"
                  aria-label="Aumentar quantidade"
                  onClick={() => setQuantity((current) => {
                    const maxQuantity = selectedStock > 0 ? selectedStock : 1;
                    return Math.min(maxQuantity, current + 1);
                  })}
                >
                  <Plus size={16} aria-hidden="true" />
                </button>
              </div>
              <div className="min-w-0 text-right">
                <p className="text-[13px] font-bold text-emerald-700">{selectedStock > 0 ? "Estoque disponível" : "Sem estoque"}</p>
                <p className="text-[12px] text-gray-500">{selectedStock} unidades</p>
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleBuyNow}
                  className="flex h-14 flex-1 items-center justify-center gap-3 rounded-md bg-[#F5C518] text-[15px] font-bold text-black transition hover:bg-[#e6b800]"
                >
                  <Lock size={20} aria-hidden="true" /> COMPRAR AGORA
                </button>
                <button
                  type="button"
                  aria-label="Adicionar ao carrinho"
                  onClick={() => void handleAddToCart()}
                  disabled={isAddingToCart}
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-[#F5C518] text-black transition hover:bg-[#e6b800] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <ShoppingCart size={22} aria-hidden="true" />
                </button>
              </div>
              {variantErrorMessage && availableVariants.length === 0 && (
                <p className="text-xs font-semibold text-red-600">{variantErrorMessage}</p>
              )}
              {cartStatusMessage && availableVariants.length === 0 && (
                <p className="text-xs font-semibold text-emerald-700">{cartStatusMessage}</p>
              )}
              <button type="button" onClick={() => { setIsFreightModalOpen(true); setFreightStep("form"); }} className="flex h-13 items-center justify-center gap-3 rounded-md border border-gray-300 bg-white text-[14px] font-bold text-gray-900 transition hover:border-gray-500">
                <Truck size={20} aria-hidden="true" /> CALCULAR FRETE
              </button>
            </div>

            {product.bullets && product.bullets.length > 0 && (
              <ul className="mt-5 space-y-2 text-[13px] leading-tight text-gray-700">
                {product.bullets.slice(0, 6).map((bullet) => <li key={bullet}>✓ {bullet}</li>)}
              </ul>
            )}
          </aside>
        </section>

        <section className="mt-10 grid gap-4 rounded-lg bg-gray-50 px-4 py-5 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
          <div className="flex min-w-0 items-center gap-3"><Truck size={24} className="shrink-0 text-gray-900" /><div><p className="text-[13px] font-bold leading-tight text-gray-900">Entrega para todo o Brasil</p><p className="text-[12px] leading-tight text-gray-500">Consulte o prazo e valor do frete</p></div></div>
          <div className="flex min-w-0 items-center gap-3"><Lock size={24} className="shrink-0 text-gray-900" /><div><p className="text-[13px] font-bold leading-tight text-gray-900">Compra 100% segura</p><p className="text-[12px] leading-tight text-gray-500">Seus dados protegidos</p></div></div>
          <div className="flex min-w-0 items-center gap-3"><FileText size={24} className="shrink-0 text-gray-900" /><div><p className="text-[13px] font-bold leading-tight text-gray-900">Nota fiscal em todas as compras</p><p className="text-[12px] leading-tight text-gray-500">Empresa regularizada</p></div></div>
          <div className="flex min-w-0 items-center gap-3"><Headphones size={24} className="shrink-0 text-gray-900" /><div><p className="text-[13px] font-bold leading-tight text-gray-900">Atendimento especializado</p><p className="text-[12px] leading-tight text-gray-500">Suporte antes e após a compra</p></div></div>
        </section>

        <section className="mt-8 border-t border-gray-200">
          <div className="flex gap-8 overflow-x-auto border-b border-gray-200 text-[13px] font-bold text-gray-600">
            {productTabs.map((tab) => (
              <button key={tab.id} type="button" className={`shrink-0 py-5 transition-colors ${activeTab === tab.id ? "border-b-2 border-[#F5C518] text-gray-950" : "hover:text-gray-950"}`} onClick={() => setActiveTab(tab.id)}>
                {tab.label}
              </button>
            ))}
          </div>
          <div className="py-10">
            {activeTab === "description" && (
              <div className="max-w-4xl">
                <h2 className="mb-4 text-lg font-bold text-gray-950">Descrição do produto</h2>
                <p className="whitespace-pre-line text-[14px] leading-7 text-gray-600">{product.description || "Descrição não cadastrada."}</p>
              </div>
            )}
            {activeTab === "specs" && (
              <div>
                <h2 className="mb-4 text-lg font-bold text-gray-950">Especificações técnicas</h2>
                {product.specsTable && product.specsTable.length > 0 ? (
                  <div className="overflow-hidden rounded-lg border border-gray-200">
                    {product.specsTable.map((spec) => (
                      <div key={spec.label} className="grid grid-cols-[160px_minmax(0,1fr)] border-b border-gray-200 last:border-b-0">
                        <div className="bg-gray-50 px-4 py-3 text-sm font-bold text-gray-950">{spec.label}</div>
                        <div className="px-4 py-3 text-sm text-gray-700">{spec.value}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">Nenhuma especificação cadastrada.</p>
                )}
              </div>
            )}
            {activeTab === "applications" && (
              <div className="max-w-4xl">
                <h2 className="mb-4 text-lg font-bold text-gray-950">Aplicações</h2>
                <p className="whitespace-pre-line text-[14px] leading-7 text-gray-600">{product.applications || "Aplicações não cadastradas."}</p>
              </div>
            )}
            {activeTab === "questions" && (
              <div className="max-w-full">
                <h2 className="mb-4 text-lg font-bold text-gray-950">Perguntas frequentes</h2>
                {product.faqs && product.faqs.length > 0 ? (
                  <div className="overflow-hidden rounded-lg border border-gray-200">
                    {product.faqs.map((faq) => (
                      <details key={faq.question} className="group border-b border-gray-200 last:border-b-0">
                        <summary className="cursor-pointer list-none px-4 py-4 text-sm font-bold text-gray-950">
                          <span className="mr-2 inline-block transition group-open:rotate-90">▶</span>
                          {faq.question}
                        </summary>
                        <p className="px-8 pb-4 text-sm leading-6 text-gray-600">{faq.answer}</p>
                      </details>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">Nenhuma pergunta frequente cadastrada.</p>
                )}
              </div>
            )}
          </div>
        </section>

        {usageAreas.length > 0 && (
          <section className="py-10">
            <h2 className="mb-4 text-lg font-bold text-gray-950">Onde utilizar</h2>
            <div
              className={usageAreas.length >= 5
                ? 'grid overflow-hidden rounded-lg border border-gray-200 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'
                : 'flex overflow-hidden rounded-lg border border-gray-200'}
              style={usageAreas.length < 5 ? { maxWidth: 'fit-content' } : undefined}
            >
              {usageAreas.map((area) => (
                <div key={area} className={`flex min-h-24 flex-col items-center justify-center gap-2 border-r border-gray-200 px-4 py-4 text-center text-sm font-bold text-gray-950 last:border-r-0${usageAreas.length >= 5 ? ' border-b sm:border-b-0' : ''}`}>
                  <UsageAreaIcon area={area} />
                  <span>{area}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {relatedProducts.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-4 text-xl font-bold text-gray-950">Produtos relacionados</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
              {relatedProducts.map((item) => <RelatedProductCard key={item.id} product={item} />)}
            </div>
          </section>
        )}

      </div>

      <BlogSection />

      <section className="px-4 my-8 lg:my-10">
        <div className="bg-[#F5C518] max-w-8xl mx-auto rounded-[10px] py-7 px-5 lg:py-8 lg:px-12.5">
          <div className="flex flex-col items-stretch justify-between gap-5 md:flex-row md:items-center">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-8.75 md:items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-headphones w-auto h-10 text-black shrink-0 sm:h-13.75" aria-hidden="true">
              <path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"></path></svg>
              <div className="w-full text-center sm:text-left">
                <p className="text-[20px] leading-tight font-bold text-black sm:text-[23px]">Precisa de ajuda para escolher o produto ideal?</p>
                <p className="text-base text-gray-800">Fale com um especialista e receba a orientação certa para sua necessidade.</p>
              </div>
            </div>
            <a href={productHelpHref} target="_blank" rel="noopener noreferrer" className="flex w-full items-center justify-center gap-2 bg-gray-900 hover:bg-black text-white font-normal px-7.5 py-3.75 rounded-lg transition-colors shrink-0 text-base whitespace-nowrap md:w-auto">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="w-auto h-5 fill-current" aria-hidden="true">
            <g><path d="M435.922 74.352C387.824 26.434 323.84.027 255.742 0 187.797 0 123.711 26.383 75.297 74.29 26.797 122.276.063 186.05 0 253.628v.125c.008 40.902 10.754 82.164 31.152 119.828L.7 512l140.012-31.848c35.46 17.871 75.027 27.293 114.934 27.309h.101c67.934 0 132.02-26.387 180.441-74.297 48.543-48.027 75.29-111.719 75.32-179.34.02-67.144-26.82-130.883-75.585-179.472zM255.742 467.5h-.09c-35.832-.016-71.336-9.012-102.668-26.023l-6.62-3.594-93.102 21.176 20.222-91.907-3.898-6.722C50.203 327.004 39.96 290.105 39.96 253.71c.074-117.8 96.863-213.75 215.773-213.75 57.446.024 111.422 22.294 151.985 62.7 41.176 41.031 63.844 94.711 63.824 151.153-.047 117.828-96.856 213.687-215.8 213.687zm0 0"></path>
            <path d="M186.152 141.863h-11.21c-3.903 0-10.239 1.461-15.598 7.293-5.364 5.836-20.477 19.942-20.477 48.63s20.965 56.405 23.887 60.3c2.926 3.89 40.469 64.64 99.93 88.012 49.418 19.422 59.476 15.558 70.199 14.586 10.726-.97 34.613-14.102 39.488-27.715s4.875-25.285 3.414-27.723c-1.465-2.43-5.367-3.887-11.215-6.8-5.851-2.919-34.523-17.262-39.886-19.212-5.364-1.941-9.262-2.914-13.164 2.926-3.903 5.828-15.391 19.313-18.805 23.203-3.41 3.895-6.824 4.383-12.676 1.465-5.852-2.926-24.5-9.191-46.848-29.05-17.394-15.458-29.464-35.169-32.879-41.005-3.41-5.832-.363-8.988 2.57-11.898 2.63-2.61 6.18-6.18 9.106-9.582 2.922-3.406 3.754-5.836 5.707-9.727 1.95-3.89.973-7.296-.488-10.21-1.465-2.919-12.691-31.75-17.895-43.282h.004c-4.382-9.71-8.996-10.039-13.164-10.21zm0 0"></path></g>
            </svg>Falar com especialista
            </a></div></div>
            </section>

      {isReviewsModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 px-4 py-10">
          <div className="w-full max-w-2xl rounded-lg bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-6 border-b border-gray-200 px-5 py-4">
              <div>
                <h2 className="text-xl font-bold text-gray-950">Avaliações dos clientes</h2>
                <p className="mt-1 text-sm text-gray-500">Avaliações publicadas por clientes com compra verificada.</p>
              </div>
              <button
                type="button"
                aria-label="Fechar avaliações"
                onClick={() => setIsReviewsModalOpen(false)}
                className="rounded-full p-1 text-black transition hover:bg-[#F5C518]"
              >
                <X size={24} />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto p-5">
              {reviews.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-200 p-6 text-sm text-gray-500">
                  Nenhuma avaliação publicada ainda.
                </div>
              ) : (
                <div className="grid gap-3">
                  {reviews.map((review) => (
                    <article key={review.id} className="rounded-lg border border-gray-200 p-4">
                      <div className="flex items-center gap-1 text-[#F5C518]" aria-label={`${review.rating} de 5 estrelas`}>
                        {Array.from({ length: 5 }).map((_, index) => (
                          <Star
                            key={index}
                            size={16}
                            fill={index < review.rating ? "currentColor" : "none"}
                            className={index < review.rating ? "text-[#F5C518]" : "text-gray-300"}
                            aria-hidden="true"
                          />
                        ))}
                      </div>
                      {review.customer?.name && (
                        <p className="mt-3 text-sm font-bold text-gray-900">{review.customer.name}</p>
                      )}
                      {review.comment && <p className="mt-1 text-sm leading-6 text-gray-700">{review.comment}</p>}
                      {review.isVerifiedPurchase && (
                        <p className="mt-2 text-xs font-bold text-emerald-700">Compra verificada</p>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isFreightModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 px-4 py-10">
          <div className="freight-modal-enter w-full max-w-3xl rounded-lg bg-white p-7 shadow-2xl ring-1 ring-[#F5C518]/30 md:p-10">
            <div className="flex items-start justify-between gap-6">
              <div>
                <h2 className="text-2xl font-bold text-black">{freightStep === "form" ? "Selecione onde quer receber suas compras" : "Opções de frete"}</h2>
                {freightStep === "form" && <p className="mt-2 text-sm font-bold text-gray-700">Informe o CEP para estimar custos e prazos.</p>}
              </div>
              <button type="button" aria-label="Fechar" onClick={() => setIsFreightModalOpen(false)} className="rounded-full p-1 text-black transition hover:bg-[#F5C518]">
                <X size={24} />
              </button>
            </div>

            {freightStep === "form" ? (
              <form onSubmit={(event) => { event.preventDefault(); setFreightStep("options"); }} className="mt-8">
                <label htmlFor="freight-cep" className="mb-2 block text-sm font-bold text-black">CEP</label>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="flex w-full max-w-sm rounded-md border border-gray-300 bg-white p-1 focus-within:border-[#F5C518] focus-within:ring-2 focus-within:ring-[#F5C518]/30">
                    <input id="freight-cep" value={cep} onChange={(event) => setCep(event.target.value)} placeholder="Informar um CEP" className="min-w-0 flex-1 px-3 py-3 text-base font-bold text-black outline-none placeholder:font-normal placeholder:text-gray-400" />
                    <button type="submit" className="rounded-md bg-[#F5C518] px-5 py-2.5 text-sm font-bold text-black transition hover:bg-[#e6b800]">Usar</button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="mt-8">
                <div className="mt-5 flex gap-4 rounded-md bg-gray-100 p-5 ring-1 ring-gray-200">
                  <MapPin className="mt-1 shrink-0 text-[#F5C518]" size={24} fill="currentColor" />
                  <div>
                    <p className="text-sm font-bold text-black">CEP: {cep || "00000-000"}</p>
                    <button type="button" onClick={() => setFreightStep("form")} className="mt-1 text-sm font-bold text-gray-600 transition hover:text-black hover:underline">Escolher outra localização</button>
                  </div>
                </div>
                <div className="mt-5 divide-y divide-gray-200">
                  <div className="flex items-center justify-between gap-4 py-5"><p className="text-base font-bold text-black">Entrega padrão</p><span className="font-bold text-black">A calcular</span></div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

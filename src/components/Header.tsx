import { useEffect, useRef, useState } from "react";
import { LogOut, PackageCheck, Search, User, ShoppingCart, ChevronDown, ChevronRight, Trash2, X } from "lucide-react";
import { categoriaProdutoService } from "../admin/services/categoriaProduto.service";
import { cartService, type CartItem as ApiCartItem } from "../admin/services/cart.service";
import { customerAuthService, type CustomerProfile } from "../admin/services/customer-auth.service";

interface CartItem {
  id: string;
  productId: string;
  variantId?: string;
  name: string;
  variation: string;
  variantName?: string;
  quantity: number;
  price: number;
  image: string | null;
}

function getErrorStatus(error: unknown): number | undefined {
  if (!error || typeof error !== "object") return undefined;
  const response = (error as { response?: { status?: number } }).response;
  return typeof response?.status === "number" ? response.status : undefined;
}

function mapApiCartItems(items: ApiCartItem[]): CartItem[] {
  return items.map((item) => ({
    id: `${item.productId}:${item.variantId ?? "default"}`,
    productId: item.productId,
    variantId: item.variantId,
    name: item.name,
    variation: item.code,
    variantName: item.variantName,
    quantity: item.quantity,
    price: item.unitPrice,
    image: item.image,
  }));
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function categoryHref(category: string) {
  return `/busca?categoria=${encodeURIComponent(category)}`;
}

function MenuIcon() {
  return (
    <span className="flex flex-col gap-0.5" aria-hidden="true">
      <span className="block h-0.5 w-4 bg-black"></span>
      <span className="block h-0.5 w-4 bg-black"></span>
      <span className="block h-0.5 w-4 bg-black"></span>
    </span>
  );
}

type CartLinkProps = {
  compact?: boolean;
  onOpen: () => void;
  itemCount: number;
};

function CartLink({ compact = false, onOpen, itemCount }: CartLinkProps) {
  return (
    <button
      type="button"
      aria-label={`Carrinho com ${itemCount} itens`}
      aria-haspopup="dialog"
      onClick={onOpen}
      className={`group relative flex cursor-pointer shrink-0 items-center text-[#1f2937] transition-colors hover:text-black ${
        compact ? "h-10 px-1" : "min-h-10 gap-2.5 px-1"
      }`}
    >
      <span className="relative flex h-9 w-9 items-center justify-center" aria-hidden="true">
        <ShoppingCart size={29} strokeWidth={1.9} />
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#F5C518] px-1 text-[10px] font-extrabold leading-none text-black">
          {itemCount}
        </span>
      </span>

      {!compact && <span className="text-base font-semibold leading-none">Carrinho</span>}
    </button>
  );
}

function ProfileDropdown({
  customerProfile,
  onLogout,
  onNavigate,
  className = "",
}: {
  customerProfile: CustomerProfile;
  onLogout: () => void;
  onNavigate: (href: string) => void;
  className?: string;
}) {
  return (
    <div role="menu" className={`z-50 mt-3 w-64 max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl shadow-black/10 ${className || "absolute right-0 top-full"}`}>
      <div className="border-b border-gray-100 bg-gray-50 px-4 py-3">
        <p className="truncate text-sm font-bold text-gray-950">{customerProfile.name}</p>
        <p className="mt-0.5 truncate text-xs text-gray-500">{customerProfile.email}</p>
      </div>
      <div className="p-2">
        <a
          href="/profile"
          role="menuitem"
          onPointerDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onNavigate("/profile");
          }}
          className="flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:text-black focus:bg-gray-50 focus:outline-none"
        >
          <User size={17} className="text-gray-500" aria-hidden="true" />
          Minha conta
        </a>
        <a
          href="/me/orders"
          role="menuitem"
          onPointerDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onNavigate("/me/orders");
          }}
          className="flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:text-black focus:bg-gray-50 focus:outline-none"
        >
          <PackageCheck size={17} className="text-gray-500" aria-hidden="true" />
          Meus pedidos
        </a>
        <button
          type="button"
          role="menuitem"
          onClick={onLogout}
          className="mt-1 flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50 focus:bg-red-50 focus:outline-none"
        >
          <LogOut size={17} aria-hidden="true" />
          Sair
        </button>
      </div>
    </div>
  );
}

type CartDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  subtotal: number;
  onRemoveItem: (item: CartItem) => Promise<void>;
};

function CartDrawer({ isOpen, onClose, items, subtotal, onRemoveItem }: CartDrawerProps) {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);
  const [removingItemId, setRemovingItemId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsClosing(false);
      return;
    }

    if (!shouldRender) return;

    setIsClosing(true);
    const timeoutId = window.setTimeout(() => {
      setShouldRender(false);
      setIsClosing(false);
    }, 220);

    return () => window.clearTimeout(timeoutId);
  }, [isOpen, shouldRender]);

  if (!shouldRender) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cart-drawer-title"
    >
      <button
        type="button"
        className={`fixed inset-0 z-[92] h-full w-full cursor-pointer bg-black/45 ${
          isClosing ? "cart-backdrop-exit" : "cart-backdrop-enter"
        }`}
        aria-label="Fechar carrinho"
        onClick={onClose}
      />

      <aside
        className={`fixed right-0 top-0 z-[95] flex h-full w-full max-w-[420px] flex-col bg-white shadow-2xl ${
          isClosing ? "cart-drawer-exit" : "cart-drawer-enter"
        }`}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div>
            <h2 id="cart-drawer-title" className="text-lg font-extrabold text-gray-950" style={{ fontWeight: "bold" }}>
              Carrinho
            </h2>
            <p className="mt-0.5 text-sm text-gray-500">
              {items.reduce((total, item) => total + item.quantity, 0)} itens
            </p>
          </div>

          <button
            type="button"
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-md text-gray-600 transition hover:bg-gray-100 hover:text-black"
            aria-label="Fechar carrinho"
            onClick={onClose}
          >
            <X size={22} aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-2">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 py-16 text-center text-sm text-gray-400">
              <ShoppingCart size={40} strokeWidth={1.4} />
              <p>Seu carrinho está vazio</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex gap-3 border-b border-gray-100 py-4">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-md bg-gray-100 text-gray-400">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                  ) : (
                    <ShoppingCart size={26} strokeWidth={1.7} aria-hidden="true" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-bold leading-5 text-gray-950">{item.name}</p>
                  <p className="mt-1 text-xs leading-5 text-gray-500">{item.variation}</p>
                  {item.variantName && (
                    <p className="mt-0.5 text-xs leading-5 text-gray-500">Variação: {item.variantName}</p>
                  )}
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <span className="rounded-md border border-gray-200 px-2.5 py-1 text-xs font-bold text-gray-700">
                      Qtd. {item.quantity}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-extrabold text-gray-950">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                      <button
                        type="button"
                        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-red-100 text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label={`Remover ${item.name} do carrinho`}
                        disabled={removingItemId === item.id}
                        onClick={async () => {
                          try {
                            setRemovingItemId(item.id);
                            await onRemoveItem(item);
                          } finally {
                            setRemovingItemId(null);
                          }
                        }}
                      >
                        <Trash2 size={15} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-gray-200 p-5">
          <div className="mb-4 space-y-2 text-sm">
            <div className="flex items-center justify-between text-base font-extrabold text-gray-950">
              <span style={{ fontWeight: "bold" }}>Total</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
          </div>

          <a
            href="/checkout"
            className="mb-3 flex h-12 w-full cursor-pointer items-center justify-center rounded-md bg-[#F5C518] text-sm font-extrabold text-black transition hover:bg-[#e6b800]"
            style={{ fontWeight: "bold" }}
            onClick={onClose}
          >
            Finalizar compra
          </a>

          <a
            href="/"
            className="flex h-11 w-full cursor-pointer items-center justify-center rounded-md border border-gray-300 bg-white text-sm font-bold text-gray-800 transition hover:bg-gray-50"
            onClick={onClose}
          >
            Continuar comprando
          </a>
        </div>
      </aside>
    </div>
  );
}

type CategoriesMenuProps = {
  isOpen: boolean;
  menuId: string;
  onToggle: () => void;
  onClose: () => void;
  menuClassName?: string;
  categories: string[];
};

function CategoriesMenu({ isOpen, menuId, onToggle, onClose, menuClassName = "", categories }: CategoriesMenuProps) {
  return (
    <>
      <button
        type="button"
        className="flex items-center gap-2 bg-transparent px-2 py-2 text-sm transition-colors hover:bg-gray-50"
        aria-expanded={isOpen}
        aria-controls={menuId}
        onClick={onToggle}
      >
        <MenuIcon />
        <span>Todas as categorias</span>
        <ChevronDown
          size={14}
          className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div
          id={menuId}
          className={`absolute left-0 top-full z-50 mt-2 w-[calc(100vw-2rem)] max-w-72 overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg ${menuClassName}`}
        >
          {categories.map((cat) => (
            <a
              key={cat}
              href={categoryHref(cat)}
              className="block px-4 py-3 text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-black"
              onClick={onClose}
            >
              {cat}
            </a>
          ))}
        </div>
      )}
    </>
  );
}

type UserAccountMenuProps = {
  customerProfile: CustomerProfile | null;
  isLoading: boolean;
  isOpen: boolean;
  onToggle: () => void;
  onLogout: () => void;
};

function getFirstName(name: string) {
  return name.trim().split(/\s+/)[0] || "Cliente";
}

function UserAccountMenu({ customerProfile, isLoading, isOpen, onToggle, onLogout }: UserAccountMenuProps) {
  if (isLoading) {
    return (
      <div
        aria-label="Carregando conta"
        aria-busy="true"
        className="flex h-11 w-44 shrink-0 items-center gap-3 rounded-md px-2 text-sm text-gray-700"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-300">
          <User size={19} aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1 space-y-1.5">
          <span className="block h-3 w-16 rounded bg-gray-100" />
          <span className="block h-3.5 w-24 rounded bg-gray-100" />
        </span>
      </div>
    );
  }

  if (!customerProfile) {
    return (
      <a
        href="/signin"
        className="flex h-11 w-44 shrink-0 items-center gap-3 rounded-md px-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-black focus:outline-none focus:ring-2 focus:ring-[#F5C518]/60"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-700">
          <User size={19} aria-hidden="true" />
        </span>
        <span className="min-w-0 text-left leading-tight">
          <span className="block text-xs text-gray-500">Minha conta</span>
          <span className="block truncate text-sm font-bold text-gray-950">Entrar / Cadastrar</span>
        </span>
      </a>
    );
  }

  const firstName = getFirstName(customerProfile.name);
  const initial = firstName.slice(0, 1).toUpperCase();

  return (
    <>
      <button
        type="button"
        id="customer-account-button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls="customer-account-menu"
        onClick={onToggle}
        className="group flex h-11 w-44 shrink-0 cursor-pointer items-center gap-3 rounded-md px-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-black focus:outline-none focus:ring-2 focus:ring-[#F5C518]/60"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F5C518] text-sm font-black text-black">
          {initial}
        </span>
        <span className="min-w-0 flex-1 text-left leading-tight">
          <span className="block text-xs text-gray-500">Ola,</span>
          <span className="block truncate text-sm font-bold text-gray-950">{firstName}</span>
        </span>
        <ChevronDown
          size={15}
          className={`shrink-0 text-gray-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div
          id="customer-account-menu"
          role="menu"
          aria-labelledby="customer-account-button"
          className="absolute right-0 top-full z-50 mt-3 w-64 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl shadow-black/10"
        >
          <div className="border-b border-gray-100 bg-gray-50 px-4 py-3">
            <p className="truncate text-sm font-bold text-gray-950">{customerProfile.name}</p>
            <p className="mt-0.5 truncate text-xs text-gray-500">{customerProfile.email}</p>
          </div>

          <div className="p-2">
            <a
              href="/profile"
              role="menuitem"
              className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:text-black focus:bg-gray-50 focus:outline-none"
            >
              <User size={17} className="text-gray-500" aria-hidden="true" />
              Minha conta
            </a>
            <a
              href="/me/orders"
              role="menuitem"
              className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:text-black focus:bg-gray-50 focus:outline-none"
            >
              <PackageCheck size={17} className="text-gray-500" aria-hidden="true" />
              Meus pedidos
            </a>
            <button
              type="button"
              role="menuitem"
              onClick={onLogout}
              className="mt-1 flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50 focus:bg-red-50 focus:outline-none"
            >
              <LogOut size={17} aria-hidden="true" />
              Sair
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export function Header() {
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [customerProfile, setCustomerProfile] = useState<CustomerProfile | null>(null);
  const [isRestoringSession, setIsRestoringSession] = useState(true);
  const mobileCategoriesRef = useRef<HTMLDivElement>(null);
  const desktopCategoriesRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const navScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);

  const cartItemCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const cartSubtotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

  useEffect(() => {
    categoriaProdutoService
      .listPublic({ limit: 20 })
      .then(({ items }) => setCategories(items.map((c) => c.name)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    let isMounted = true;

    customerAuthService
      .restoreSession()
      .then((profile) => {
        if (!isMounted) return;
        setCustomerProfile(profile);
      })
      .catch(() => {})
      .finally(() => {
        if (!isMounted) return;
        setIsRestoringSession(false);
      });

    function onAuthExpired(event: Event) {
      const scope = (event as CustomEvent<{ scope?: "admin" | "customer" | "all" }>).detail?.scope;
      if (scope === "admin") {
        return;
      }
      cartService.clearCache();
      setCustomerProfile(null);
      setCartItems([]);
      setIsRestoringSession(false);
    }
    window.addEventListener("auth:expired", onAuthExpired);
    return () => {
      isMounted = false;
      window.removeEventListener("auth:expired", onAuthExpired);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    function handleCartUpdated(event: Event) {
      const customEvent = event as CustomEvent<{ items?: ApiCartItem[] }>;
      if (!isMounted || !customEvent.detail?.items) return;
      setCartItems(mapApiCartItems(customEvent.detail.items));
    }

    window.addEventListener("cart:updated", handleCartUpdated as EventListener);

    async function loadCart() {
      if (isRestoringSession) return;

      if (!customerProfile) {
        if (isMounted) setCartItems(mapApiCartItems(cartService.getGuestCart().items));
        return;
      }

      try {
        const cart = await cartService.get();
        if (!isMounted) return;
        setCartItems(mapApiCartItems(cart.items));
      } catch (error) {
        if (!isMounted) return;
        const status = getErrorStatus(error);
        if (status === 401) {
          setCartItems([]);
          return;
        }
        if (status === 429) return;
        setCartItems([]);
      }
    }

    void loadCart();

    return () => {
      isMounted = false;
      window.removeEventListener("cart:updated", handleCartUpdated as EventListener);
    };
  }, [customerProfile?.id, isRestoringSession]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      const isInsideMobile = mobileCategoriesRef.current?.contains(target);
      const isInsideDesktop = desktopCategoriesRef.current?.contains(target);
      const isInsideProfile = profileMenuRef.current?.contains(target);

      if (!isInsideMobile && !isInsideDesktop) {
        setIsCategoriesOpen(false);
      }
      if (!isInsideProfile) {
        setIsProfileMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsCategoriesOpen(false);
        setIsCartOpen(false);
        setIsProfileMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    if (!isCartOpen) return;

    const html = document.documentElement;
    const previousOverflow = html.style.overflow;
    html.style.overflow = "hidden";

    return () => {
      html.style.overflow = previousOverflow;
    };
  }, [isCartOpen]);

  useEffect(() => {
    const el = navScrollRef.current;
    if (!el) return;
    const check = () => {
      setCanScrollRight(el.scrollWidth - el.scrollLeft > el.clientWidth + 1);
      setCanScrollLeft(el.scrollLeft > 1);
    };
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    el.addEventListener("scroll", check);
    return () => {
      ro.disconnect();
      el.removeEventListener("scroll", check);
    };
  }, [categories]);

  function toggleCategories() {
    setIsCategoriesOpen((current) => !current);
  }

  function closeCategories() {
    setIsCategoriesOpen(false);
  }

  function openCart() {
    setIsCategoriesOpen(false);
    setIsCartOpen(true);
  }

  async function handleRemoveCartItem(item: CartItem) {
    const cart = await cartService.removeItem(item.productId, item.variantId);
    setCartItems(mapApiCartItems(cart.items));
  }

  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = searchQuery.trim();
    window.location.href = query ? `/busca?q=${encodeURIComponent(query)}` : "/busca";
  }

  async function handleLogout() {
    setIsProfileMenuOpen(false);
    await customerAuthService.logout();
    cartService.clearCache();
    setCustomerProfile(null);
    setCartItems([]);
    window.location.href = "/";
  }

  return (
    <>
    <header
      className={`w-full max-w-full bg-white lg:border-b lg:border-gray-200 sticky top-0 z-[90]`}
    >
      <div className="w-full max-w-full bg-white lg:hidden">
        <div className="flex items-center justify-between px-4 pb-3 pt-3">
          <a href="/" className="shrink-0">
            <img
              src="/logo-mobile.png"
              alt="Tinpavi Sinalização Viária"
              className="h-[30px] w-auto max-w-[130px] object-contain"
            />
          </a>

          <div className="flex items-center gap-1 text-gray-800">
            <div className="relative" ref={profileMenuRef}>
              <button
                type="button"
                aria-label="Minha conta"
                aria-haspopup={customerProfile ? "menu" : undefined}
                aria-expanded={customerProfile ? isProfileMenuOpen : undefined}
                aria-busy={isRestoringSession}
                onClick={() => {
                  if (isRestoringSession) return;
                  if (!customerProfile) {
                    window.location.href = "/signin";
                    return;
                  }
                  setIsProfileMenuOpen((current) => !current);
                }}
                className="flex h-9 w-9 cursor-pointer items-center justify-center"
              >
                <User size={22} strokeWidth={1.8} aria-hidden="true" />
              </button>
              {customerProfile && isProfileMenuOpen && (
                <ProfileDropdown
                  customerProfile={customerProfile}
                  onLogout={() => {
                    void handleLogout();
                  }}
                  onNavigate={(href) => {
                    setIsProfileMenuOpen(false);
                    window.location.assign(href);
                  }}
                  className="absolute right-[-52px] top-full w-[calc(100vw-2rem)]"
                />
              )}
            </div>

            <CartLink compact onOpen={openCart} itemCount={cartItemCount} />
          </div>
        </div>

        <form className="flex p-4" onSubmit={handleSearchSubmit}>
          <input
            type="text"
            placeholder="O que você procura? Ex.: placa de sinalização..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="min-w-0 flex-1 rounded-l-md border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-[#F5C518]"
          />
          <button
            type="submit"
            className="flex w-13 items-center justify-center rounded-r-md bg-[#F5C518] transition-colors hover:bg-[#e6b800]"
            aria-label="Buscar"
          >
            <Search size={20} className="text-black" aria-hidden="true" />
          </button>
        </form>

        <nav className="relative px-4 pb-3" ref={mobileCategoriesRef}>
          <div className="flex items-center gap-1 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <button
              type="button"
              className="flex shrink-0 items-center gap-2 bg-transparent px-2 py-2 text-sm transition-colors hover:bg-gray-50"
              aria-expanded={isCategoriesOpen}
              aria-controls="mobile-categories-menu"
              onClick={toggleCategories}
            >
              <MenuIcon />
              <span>Todas as categorias</span>
              <ChevronDown
                size={14}
                className={`transition-transform ${isCategoriesOpen ? "rotate-180" : ""}`}
                aria-hidden="true"
              />
            </button>

            {categories.map((cat) => (
              <a
                key={cat}
                href={categoryHref(cat)}
                className="shrink-0 whitespace-nowrap px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-black"
              >
                {cat}
              </a>
            ))}
            <a
              href="/blog"
              className="shrink-0 whitespace-nowrap px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-black"
            >
              Blog
            </a>
          </div>

          {isCategoriesOpen && (
            <div
              id="mobile-categories-menu"
              className="absolute left-4 right-4 top-full z-50 mt-1 overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg"
            >
              {categories.map((cat) => (
                <a
                  key={cat}
                  href={categoryHref(cat)}
                  className="block px-4 py-3 text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-black"
                  onClick={closeCategories}
                >
                  {cat}
                </a>
              ))}
            </div>
          )}
        </nav>
      </div>

      <div className="hidden lg:block">
        <div className="max-w-8xl mx-auto flex items-center justify-between gap-6 px-4 pb-6.25 pt-7.5">
          <a href="/" className="shrink-0">
            <img
              src="/logo-tinpavi.webp"
              alt="Tinpavi Sinalização Viária"
              className="h-auto w-full max-w-40 object-contain"
            />
          </a>

          <form className="flex max-w-2xl flex-1" onSubmit={handleSearchSubmit}>
            <input
              type="text"
              placeholder="O que você procura? Ex.: placa de sinalização, tachão, tinta viária..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="min-w-0 flex-1 rounded-l-md border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-[#F5C518]"
            />
            <button className="rounded-r-md bg-[#F5C518] px-5 py-2.5 transition-colors hover:bg-[#e6b800]" aria-label="Buscar">
              <Search size={18} className="text-black" />
            </button>
          </form>

          {isRestoringSession ? (
            <div className="relative" ref={profileMenuRef}>
              <UserAccountMenu
                customerProfile={customerProfile}
                isLoading={isRestoringSession}
                isOpen={isProfileMenuOpen}
                onToggle={() => setIsProfileMenuOpen((v) => !v)}
                onLogout={() => { void handleLogout(); }}
              />
            </div>
          ) : customerProfile ? (
            <div className="relative" ref={profileMenuRef}>
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={isProfileMenuOpen}
                onClick={() => setIsProfileMenuOpen((v) => !v)}
                className="group flex h-11 w-44 shrink-0 cursor-pointer items-center gap-3 rounded-md px-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-black focus:outline-none focus:ring-2 focus:ring-[#F5C518]/60"
                style={{ gap: 10, maxWidth: "fit-content" }}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F5C518] text-sm font-black text-black">
                  {customerProfile.name.trim().slice(0, 1).toUpperCase() || "C"}
                </span>
                <div className="min-w-0 flex-1 text-left leading-tight" style={{ display: "flex", gap: 5, maxWidth: "fit-content" }}>
                  <div className="text-sm text-gray-500">Olá,</div>
                  <div className="truncate text-sm font-bold text-gray-950">{customerProfile.name.split(" ")[0]}</div>
                </div>
                <ChevronDown
                  size={15}
                  className="shrink-0 text-gray-500 transition-transform duration-200"
                  style={{ transform: isProfileMenuOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                  aria-hidden="true"
                />
              </button>
              {isProfileMenuOpen && (
                <ProfileDropdown
                  customerProfile={customerProfile}
                  onLogout={() => {
                    void handleLogout();
                  }}
                  onNavigate={(href) => {
                    setIsProfileMenuOpen(false);
                    window.location.assign(href);
                  }}
                />
              )}
            </div>
          ) : (
            <a href="/signin" className="flex h-11 w-44 shrink-0 items-center gap-3 rounded-md px-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-black focus:outline-none focus:ring-2 focus:ring-[#F5C518]/60">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-700">
                <User size={19} aria-hidden="true" />
              </span>
              <div className="min-w-0 text-left leading-tight">
                <div className="text-xs text-gray-500">Minha conta</div>
                <div className="truncate text-sm font-bold text-gray-950">Entrar / Cadastrar</div>
              </div>
            </a>
          )}

          <CartLink onOpen={openCart} itemCount={cartItemCount} />
        </div>

        <nav className="border-0 pb-2.5">
          <div className="max-w-8xl mx-auto flex items-center px-0">
            <div className="relative shrink-0 mr-2" ref={desktopCategoriesRef}>
              <CategoriesMenu
                isOpen={isCategoriesOpen}
                menuId="desktop-categories-menu"
                onToggle={toggleCategories}
                onClose={closeCategories}
                menuClassName="w-72"
                categories={categories}
              />
            </div>

            <div className="group relative flex-1 overflow-hidden">
              <div
                ref={navScrollRef}
                className="flex items-center overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
              >
                {categories.map((cat) => (
                  <a
                    key={cat}
                    href={categoryHref(cat)}
                    className="shrink-0 whitespace-nowrap px-4 py-3 text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-black"
                  >
                    {cat}
                  </a>
                ))}
                <a
                  href="/blog"
                  className="shrink-0 whitespace-nowrap px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 hover:text-black"
                >
                  Blog
                </a>
              </div>


              {canScrollLeft && (
                <div className="pointer-events-none absolute left-0 top-0 h-full w-14 flex items-center justify-start pl-1 bg-gradient-to-r from-white via-white/80 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  <button
                    type="button"
                    className="pointer-events-auto flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-sm border border-gray-200 text-gray-400 hover:text-gray-700 transition-colors"
                    onClick={() => navScrollRef.current?.scrollBy({ left: -220, behavior: "smooth" })}
                    aria-label="Ver categorias anteriores"
                  >
                    <ChevronRight size={13} className="rotate-180" aria-hidden="true" />
                  </button>
                </div>
              )}

              {canScrollRight && (
                <div className="pointer-events-none absolute right-0 top-0 h-full w-14 flex items-center justify-end pr-1 bg-gradient-to-l from-white via-white/80 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  <button
                    type="button"
                    className="pointer-events-auto flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-sm border border-gray-200 text-gray-400 hover:text-gray-700 transition-colors"
                    onClick={() => navScrollRef.current?.scrollBy({ left: 220, behavior: "smooth" })}
                    aria-label="Ver mais categorias"
                  >
                    <ChevronRight size={13} aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </nav>
      </div>
    </header>
    <CartDrawer
      isOpen={isCartOpen}
      onClose={() => setIsCartOpen(false)}
      items={cartItems}
      subtotal={cartSubtotal}
      onRemoveItem={handleRemoveCartItem}
    />
    </>
  );
}

import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Check, CreditCard, MapPin, PackageCheck, ShieldCheck, Truck } from "lucide-react";
import { cartService, type Cart, type CartItem } from "../admin/services/cart.service";
import { clearPublicCatalogCache } from "../admin/services/produto.service";
import {
  checkoutService,
  type CheckoutAddressPayload,
  type CheckoutItemPayload,
  type CheckoutOrder,
  type ShippingQuoteOption,
  type CheckoutShippingAddressPayload,
  type CouponValidationResponse,
} from "../admin/services/checkout.service";
import { customerAuthService, type CustomerAddress } from "../admin/services/customer-auth.service";
import {
  AddressFormFields,
  emptyAddressForm,
  formatAddressFromForm,
  isAddressFormComplete,
  normalizeAddressForm,
  type AddressFormValues,
} from "./shared/AddressFormFields";

const paymentMethods = [
  { id: "credit", title: "Cartão de crédito", description: "Até 6x sem juros" },
  { id: "pix", title: "Pix", description: "Aprovação imediata" },
  { id: "boleto", title: "Boleto bancário", description: "Vencimento em 2 dias úteis" },
];

const steps = [
  { id: "address", label: "Endereço", icon: MapPin },
  { id: "review", label: "Revisão", icon: PackageCheck },
  { id: "payment", label: "Pagamento", icon: CreditCard },
] as const;

type StepId = (typeof steps)[number]["id"];
type AddressFieldErrors = Partial<Record<keyof AddressFormValues, string>>;
type NewAddressPayload = Omit<CustomerAddress, "id" | "complement"> & { complement?: string };

const requiredAddressFields: Array<keyof AddressFormValues> = [
  "zipCode",
  "street",
  "number",
  "district",
  "city",
  "state",
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function getCartItemTotal(item: CartItem): number {
  return typeof item.total === "number" ? item.total : item.unitPrice * item.quantity;
}

function getCartSubtotal(cart: Cart | null): number {
  if (!cart) return 0;
  if (typeof cart.subtotal === "number") return cart.subtotal;
  return cart.items.reduce((total, item) => total + getCartItemTotal(item), 0);
}

function getOrderTotal(order: CheckoutOrder): number {
  const value = order.total ?? order.totalAmount;
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function getErrorStatus(error: unknown): number | null {
  if (error && typeof error === "object") {
    const err = error as { response?: { status?: number } };
    const status = err.response?.status;
    if (typeof status === "number") return status;
  }
  return null;
}

function getApiErrorMessage(error: unknown): string | null {
  if (error && typeof error === "object") {
    const err = error as { response?: { data?: { error?: string; data?: unknown } } };
    const data = err.response?.data;
    if (typeof data?.error === "string") return data.error;
  }
  return null;
}

function formatZipCode(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 8) return value;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

function formatAddressLine(address: CustomerAddress): string {
  const streetNumber = [address.street, address.number].filter(Boolean).join(", ");
  return address.complement ? [streetNumber, address.complement].filter(Boolean).join(" - ") : streetNumber;
}

function formatAddressCity(address: CustomerAddress): string {
  return [
    [address.district, [address.city, address.state].filter(Boolean).join(" - ")].filter(Boolean).join(" - "),
    formatZipCode(address.zipCode),
  ]
    .filter(Boolean)
    .join(" - ");
}

function getAddressErrors(address: AddressFormValues): AddressFieldErrors {
  const normalized = normalizeAddressForm(address);
  const errors: AddressFieldErrors = {};

  if (normalized.zipCode.length !== 8) {
    errors.zipCode = "Informe um CEP valido com 8 digitos.";
  }
  if (!normalized.street) errors.street = "Informe a rua.";
  if (!normalized.number) errors.number = "Informe o numero.";
  if (!normalized.district) errors.district = "Informe o bairro.";
  if (!normalized.city) errors.city = "Informe a cidade.";
  if (normalized.state.length !== 2) {
    errors.state = "UF deve ter 2 caracteres.";
  }

  return errors;
}

function buildNewAddressPayload(address: AddressFormValues, isDefault: boolean): NewAddressPayload {
  const normalized = normalizeAddressForm(address);
  const payload: NewAddressPayload = {
    zipCode: normalized.zipCode,
    street: normalized.street,
    number: normalized.number,
    district: normalized.district,
    city: normalized.city,
    state: normalized.state,
    country: "BR",
    isDefault,
  };
  if (normalized.complement) payload.complement = normalized.complement;
  return payload;
}

function buildInlineShippingAddress(address: AddressFormValues | CustomerAddress): CheckoutShippingAddressPayload {
  const normalized = "id" in address
    ? {
        zipCode: address.zipCode.replace(/\D/g, ""),
        street: address.street.trim(),
        number: address.number.trim(),
        complement: address.complement?.trim() || "",
        district: address.district.trim(),
        city: address.city.trim(),
        state: address.state.trim().toUpperCase(),
        country: address.country.trim().toUpperCase(),
      }
    : { ...normalizeAddressForm(address), country: "BR" };

  const payload: CheckoutShippingAddressPayload = {
    zipCode: normalized.zipCode,
    street: normalized.street,
    number: normalized.number,
    district: normalized.district,
    city: normalized.city,
    state: normalized.state,
    country: normalized.country || "BR",
  };
  if (normalized.complement) payload.complement = normalized.complement;
  return payload;
}

function getNewAddressKey(address: NewAddressPayload): string {
  return JSON.stringify(address);
}

export function CheckoutPage() {
  const [activeStep, setActiveStep] = useState<StepId>("address");
  const [addressMode, setAddressMode] = useState<"saved" | "new">("saved");
  const [savedAddresses, setSavedAddresses] = useState<CustomerAddress[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [newAddressForm, setNewAddressForm] = useState<AddressFormValues>(emptyAddressForm);
  const [newAddressErrors, setNewAddressErrors] = useState<AddressFieldErrors>({});
  const [isFetchingNewCep, setIsFetchingNewCep] = useState(false);
  const [saveNewAddress, setSaveNewAddress] = useState(true);
  const [setAsDefaultAddress, setSetAsDefaultAddress] = useState(false);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [addressSubmitError, setAddressSubmitError] = useState<string | null>(null);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [savedNewAddress, setSavedNewAddress] = useState<{ key: string; address: CustomerAddress } | null>(null);
  const [selectedPayment, setSelectedPayment] = useState(paymentMethods[0].id);
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoadingCart, setIsLoadingCart] = useState(true);
  const [cartError, setCartError] = useState<string | null>(null);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [createdOrder, setCreatedOrder] = useState<CheckoutOrder | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<CouponValidationResponse | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [selectedShippingQuote, setSelectedShippingQuote] = useState<ShippingQuoteOption | null>(null);
  const [isLoadingShippingQuote, setIsLoadingShippingQuote] = useState(false);
  const [shippingQuoteError, setShippingQuoteError] = useState<string | null>(null);

  const cartItems = useMemo(() => cart?.items ?? [], [cart]);
  const hasCartItems = cartItems.length > 0;
  const subtotal = getCartSubtotal(cart);
  const shipping = hasCartItems ? selectedShippingQuote?.price ?? 0 : 0;
  const discount = appliedCoupon?.discountAmount ?? 0;
  const total = Math.max(0, subtotal + shipping - discount);
  const activeIndex = steps.findIndex((step) => step.id === activeStep);
  const canContinueAddressStep =
    hasCartItems &&
    !isLoadingCart &&
    !isSavingAddress &&
    !cartError &&
    (addressMode === "new"
      ? isAddressFormComplete(newAddressForm)
      : (!isLoadingAddresses && !addressError && savedAddresses.length > 0 && Boolean(selectedAddress)));

  const selectedSavedAddress = useMemo(
    () => savedAddresses.find((address) => address.id === selectedAddress) ?? null,
    [savedAddresses, selectedAddress],
  );

  const checkoutItems = useMemo<CheckoutItemPayload[]>(
    () => cartItems.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      ...(item.variantId ? { variantId: item.variantId } : {}),
    })),
    [cartItems],
  );

  const reviewAddressText = useMemo(() => {
    if (addressMode === "saved") {
      if (!selectedSavedAddress) return "Selecione um endereco para continuar.";
      return [formatAddressLine(selectedSavedAddress), formatAddressCity(selectedSavedAddress)]
        .filter(Boolean)
        .join(" - ");
    }

    return formatAddressFromForm(newAddressForm);
  }, [addressMode, selectedSavedAddress, newAddressForm]);

  async function handleApplyCoupon(event?: FormEvent) {
    event?.preventDefault();
    const normalizedCode = couponCode.trim().toUpperCase();
    setCouponError(null);

    if (!normalizedCode) {
      setAppliedCoupon(null);
      setCouponError("Informe um cupom para aplicar.");
      return;
    }

    setIsApplyingCoupon(true);
    try {
      const coupon = await checkoutService.validateCoupon({
        code: normalizedCode,
        subtotal,
        shippingCost: shipping,
      });
      setCouponCode(coupon.code);
      setAppliedCoupon(coupon);
    } catch (error) {
      setAppliedCoupon(null);
      setCouponError(getApiErrorMessage(error) ?? "Cupom invalido ou indisponivel.");
    } finally {
      setIsApplyingCoupon(false);
    }
  }

  function handleRemoveCoupon() {
    setCouponCode("");
    setAppliedCoupon(null);
    setCouponError(null);
  }

  const loadSavedAddresses = useCallback(async () => {
    setIsLoadingAddresses(true);
    setAddressError(null);

    try {
      const customer = await customerAuthService.restoreSession();
      if (!customer) {
        window.location.href = "/signin?returnTo=/checkout";
        return;
      }

      const addresses = await customerAuthService.listAddresses();
      setSavedAddresses(addresses);

      const defaultAddress = addresses.find((address) => address.isDefault) ?? addresses[0] ?? null;
      setSelectedAddress(defaultAddress?.id ?? null);
    } catch (error) {
      const status = getErrorStatus(error);
      if (status === 401) {
        window.location.href = "/signin?returnTo=/checkout";
        return;
      }

      if (status === 429) {
        setAddressError("Muitas requisições ao carregar seus endereços. Tente novamente em instantes.");
      } else {
        setAddressError("Não foi possível carregar seus endereços agora. Tente novamente.");
      }
    } finally {
      setIsLoadingAddresses(false);
    }
  }, []);

  const loadCart = useCallback(async () => {
    setIsLoadingCart(true);
    setCartError(null);

    try {
      const nextCart = await cartService.get({ forceRefresh: true });
      setCart(nextCart);
    } catch (error) {
      const status = getErrorStatus(error);
      if (status === 401) {
        window.location.href = "/signin";
        return;
      }

      setCart(null);
      setCartError("Não foi possível carregar seu carrinho agora. Tente novamente.");
    } finally {
      setIsLoadingCart(false);
    }
  }, []);

  useEffect(() => {
    void loadSavedAddresses();
  }, [loadSavedAddresses]);

  useEffect(() => {
    void loadCart();
  }, [loadCart]);

  useEffect(() => {
    function handleCartUpdated(event: Event) {
      const customEvent = event as CustomEvent<Cart>;
      if (customEvent.detail?.items) {
        setCart(customEvent.detail);
        setCartError(null);
      }
    }

    window.addEventListener("cart:updated", handleCartUpdated as EventListener);
    return () => {
      window.removeEventListener("cart:updated", handleCartUpdated as EventListener);
    };
  }, []);

  useEffect(() => {
    if (createdOrder || isLoadingCart) return;
    if (!hasCartItems) {
      window.location.href = "/";
    }
  }, [createdOrder, hasCartItems, isLoadingCart]);

  useEffect(() => {
    let isMounted = true;

    async function loadShippingQuote() {
      setSelectedShippingQuote(null);
      setShippingQuoteError(null);
      setAppliedCoupon(null);

      if (!hasCartItems || isLoadingCart || cartError || checkoutItems.length === 0) return;

      let addressPayload: CheckoutAddressPayload | null = null;
      if (addressMode === "saved") {
        if (!selectedAddress || isLoadingAddresses || addressError) return;
        addressPayload = { shippingAddressId: selectedAddress };
      } else {
        if (!isAddressFormComplete(newAddressForm)) return;
        addressPayload = { shippingAddress: buildInlineShippingAddress(newAddressForm) };
      }

      setIsLoadingShippingQuote(true);
      try {
        const quote = await checkoutService.quoteShipping({ ...addressPayload, items: checkoutItems });
        if (!isMounted) return;
        const firstOption = quote.options[0] ?? null;
        setSelectedShippingQuote(firstOption);
        if (!firstOption) setShippingQuoteError("Não foi possível calcular o frete para este endereço.");
      } catch {
        if (isMounted) setShippingQuoteError("Não foi possível calcular o frete agora.");
      } finally {
        if (isMounted) setIsLoadingShippingQuote(false);
      }
    }

    void loadShippingQuote();
    return () => {
      isMounted = false;
    };
  }, [
    addressError,
    addressMode,
    cartError,
    checkoutItems,
    hasCartItems,
    isLoadingAddresses,
    isLoadingCart,
    newAddressForm,
    selectedAddress,
  ]);

  function updateNewAddress(field: keyof AddressFormValues, value: string) {
    setNewAddressForm((current) => ({ ...current, [field]: value }));
    setNewAddressErrors((current) => ({ ...current, [field]: undefined }));
    setAddressSubmitError(null);
    setSavedNewAddress(null);
  }

  async function fetchAddressByCep(cep: string) {
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8) return;

    setIsFetchingNewCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      if (!response.ok) return;
      const data = await response.json() as {
        erro?: boolean;
        logradouro?: string;
        bairro?: string;
        localidade?: string;
        uf?: string;
      };
      if (data.erro) return;

      setNewAddressForm((current) => ({
        ...current,
        street: data.logradouro ?? current.street,
        district: data.bairro ?? current.district,
        city: data.localidade ?? current.city,
        state: data.uf ?? current.state,
      }));
    } catch {
      // silently ignore network errors
    } finally {
      setIsFetchingNewCep(false);
    }
  }

  function validateNewAddress(): boolean {
    const errors = getAddressErrors(newAddressForm);
    setNewAddressErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function persistNewAddressIfNeeded(): Promise<CustomerAddress | true | false> {
    if (addressMode !== "new" || !saveNewAddress) return true;

    const payload = buildNewAddressPayload(newAddressForm, setAsDefaultAddress);
    const key = getNewAddressKey(payload);
    if (savedNewAddress?.key === key) return savedNewAddress.address;

    setIsSavingAddress(true);
    setAddressSubmitError(null);

    try {
      const createdAddress = await customerAuthService.createAddress(payload);
      setSavedNewAddress({ key, address: createdAddress });
      setSavedAddresses((current) => {
        const withoutCreated = current.filter((address) => address.id !== createdAddress.id);
        const normalizedCurrent = createdAddress.isDefault
          ? withoutCreated.map((address) => ({ ...address, isDefault: false }))
          : withoutCreated;
        return [createdAddress, ...normalizedCurrent].sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
      });
      setSelectedAddress(createdAddress.id);
      return createdAddress;
    } catch (error) {
      const status = getErrorStatus(error);
      if (status === 401) {
        window.location.href = "/signin";
        return false;
      }

      setAddressSubmitError("Não foi possível salvar o endereço agora. Tente novamente.");
      return false;
    } finally {
      setIsSavingAddress(false);
    }
  }

  async function goNext() {
    if (activeStep === "address" && addressMode === "new") {
      if (!validateNewAddress()) return;
      const persisted = await persistNewAddressIfNeeded();
      if (!persisted) return;
    }

    const nextStep = steps[Math.min(activeIndex + 1, steps.length - 1)];
    setActiveStep(nextStep.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function getCheckoutItems(): CheckoutItemPayload[] {
    return checkoutItems;
  }

  function getCheckoutAddressPayload(_savedInlineAddress?: CustomerAddress): CheckoutAddressPayload | null {
    if (addressMode === "saved") {
      return selectedAddress ? { shippingAddressId: selectedAddress } : null;
    }
    // Always send inline address for new addresses — the shipping quote snapshot
    // was created with the inline address, so the payload must match.
    return { shippingAddress: buildInlineShippingAddress(newAddressForm) };
  }

  async function handleConfirmOrder() {
    setOrderError(null);

    if (!hasCartItems || isLoadingCart || cartError) return;
    if (addressMode === "new" && !validateNewAddress()) {
      setActiveStep("address");
      return;
    }

    setIsSubmittingOrder(true);
    try {
      const persistedAddress = addressMode === "new" ? await persistNewAddressIfNeeded() : true;
      if (persistedAddress === false) return;

      const addressPayload = getCheckoutAddressPayload(persistedAddress === true ? undefined : persistedAddress);
      if (!addressPayload) {
        setOrderError("Selecione ou informe um endereço de entrega antes de confirmar o pedido.");
        setActiveStep("address");
        return;
      }

      const items = getCheckoutItems();
      let selectedQuote = selectedShippingQuote;
      if (!selectedQuote) {
        const quote = await checkoutService.quoteShipping({ ...addressPayload, items });
        selectedQuote = quote.options[0] ?? null;
      }
      if (!selectedQuote?.quoteId) {
        setOrderError("Não foi possível calcular o frete para criar o pedido. Tente novamente.");
        return;
      }

      const order = await checkoutService.createOrder({
        ...addressPayload,
        items,
        quoteId: selectedQuote.quoteId,
        ...(appliedCoupon ? { couponCode: appliedCoupon.code } : {}),
      });

      clearPublicCatalogCache();
      setCreatedOrder(order);
      try {
        const emptyCart = await cartService.clear();
        setCart(emptyCart);
      } catch {
        cartService.clearCache();
      }
    } catch (error) {
      const status = getErrorStatus(error);
      if (status === 401) {
        window.location.href = "/signin";
        return;
      }

      const apiMsg = getApiErrorMessage(error);
      const friendlyMsg =
        apiMsg === "Shipping quote is invalid or expired"
          ? "A cotação de frete expirou. Volte à etapa de endereço e selecione o frete novamente."
          : (apiMsg ?? "Não foi possível confirmar o pedido agora. Tente novamente.");
      setOrderError(friendlyMsg);
    } finally {
      setIsSubmittingOrder(false);
    }
  }

  function goBack() {
    const previousStep = steps[Math.max(activeIndex - 1, 0)];
    setActiveStep(previousStep.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goToStep(stepId: StepId) {
    if (!hasCartItems && stepId !== "address") return;
    setActiveStep(stepId);
  }

  if (createdOrder) {
    return (
      <div className="bg-gray-50">
        <section className="border-b border-gray-200 bg-white">
          <div className="mx-auto max-w-8xl px-4 py-8">
            <p className="text-xs font-black uppercase text-[#ffa201]" style={{ fontWeight: "bold", color: "#ffa201" }}>
              Pedido enviado
            </p>
            <h1 className="mt-2 text-3xl font-bold text-gray-950">
              Recebemos seu pedido
            </h1>
          </div>
        </section>

        <div className="mx-auto max-w-3xl px-4 py-10">
          <section className="rounded-lg border border-emerald-200 bg-white p-6 text-center shadow-sm sm:p-8">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
              <Check size={28} aria-hidden="true" />
            </span>
            <h2 className="mt-5 text-2xl font-bold text-gray-950">Pedido enviado com sucesso</h2>
            <p className="mt-2 text-sm text-gray-600">
              Seu pedido foi enviado para análise da equipe Tinpavi. O pagamento será combinado depois.
            </p>

            <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4 text-left text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Código do pedido</span>
                <span className="font-mono font-bold text-gray-950">{createdOrder.id}</span>
              </div>
              <div className="mt-3 flex justify-between gap-4 border-t border-gray-200 pt-3">
                <span className="text-gray-500">Total</span>
                <span className="font-bold text-gray-950">{formatCurrency(getOrderTotal(createdOrder))}</span>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <a
                href="/me/orders"
                className="inline-flex h-11 items-center justify-center rounded-md bg-[#F5C518] px-5 text-sm font-bold text-black transition hover:bg-[#e6b800]"
              >
                Ver meus pedidos
              </a>
              <a
                href="/"
                className="inline-flex h-11 items-center justify-center rounded-md border border-gray-300 px-5 text-sm font-bold text-gray-800 transition hover:bg-gray-50"
              >
                Finalizar
              </a>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50">
      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-8xl px-4 py-8">
          <p className="text-xs font-black uppercase text-[#ffa201]" style={{ fontWeight: "bold", color: "#ffa201" }}>
            Finalização da compra
          </p>
          <h1 className="mt-2 text-3xl font-bold text-gray-950">
            Confira seus dados
          </h1>
        </div>
      </section>

      <div className="mx-auto grid max-w-8xl gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:py-8">
        <div className="min-w-0">
          <div className="mb-6 grid grid-cols-3 rounded-lg border border-gray-200 bg-white p-2">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = step.id === activeStep;
              const isDone = index < activeIndex;

              return (
                <button
                  key={step.id}
                  type="button"
                  className={`flex min-h-14 cursor-pointer items-center justify-center gap-2 rounded-md px-2 text-xs font-bold transition sm:text-sm ${
                    isActive ? "bg-[#F5C518] text-black" : "text-gray-600 hover:bg-gray-50"
                  }`}
                 
                  onClick={() => goToStep(step.id)}
                  disabled={!hasCartItems && step.id !== "address"}
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/70">
                    {isDone ? <Check size={16} aria-hidden="true" /> : <Icon size={16} aria-hidden="true" />}
                  </span>
                  <span className="hidden sm:inline">{step.label}</span>
                </button>
              );
            })}
          </div>

          <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            {isLoadingCart ? (
              <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                Carregando carrinho...
              </div>
            ) : cartError ? (
              <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <p>{cartError}</p>
                <button
                  type="button"
                  className="mt-3 cursor-pointer rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-bold text-red-700 transition hover:bg-red-100"
                  onClick={() => {
                    void loadCart();
                  }}
                >
                  Tentar novamente
                </button>
              </div>
            ) : !hasCartItems && !createdOrder ? (
              <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                <p className="font-bold text-gray-900">Seu carrinho está vazio.</p>
                <p className="mt-1">Adicione produtos ao carrinho antes de finalizar a compra.</p>
                <a
                  href="/"
                  className="mt-3 inline-flex h-9 items-center rounded-md border border-gray-300 px-3 text-xs font-bold text-gray-800 transition hover:bg-gray-100"
                >
                  Continuar comprando
                </a>
              </div>
            ) : null}

            {activeStep === "address" && (
              <div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-950">
                      Endereço de entrega
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">Escolha um endereço cadastrado ou informe um novo.</p>
                  </div>

                  <div className="grid grid-cols-2 overflow-hidden rounded-md border border-gray-200 text-sm font-bold">
                    <button
                      type="button"
                      className={`cursor-pointer px-4 py-2 ${addressMode === "saved" ? "bg-black text-white" : "bg-white text-gray-800"}`}
                      onClick={() => {
                        setAddressMode("saved");
                        setNewAddressErrors({});
                      }}
                    >
                      Cadastrado
                    </button>
                    <button
                      type="button"
                      className={`cursor-pointer px-4 py-2 ${addressMode === "new" ? "bg-black text-white" : "bg-white text-gray-800"}`}
                      onClick={() => {
                        setAddressMode("new");
                        setAddressError(null);
                      }}
                    >
                      Novo
                    </button>
                  </div>
                </div>

                {addressMode === "saved" ? (
                  <div className="mt-6 grid gap-3">
                    {isLoadingAddresses ? (
                      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                        Carregando endereços cadastrados...
                      </div>
                    ) : addressError ? (
                      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        <p>{addressError}</p>
                        <button
                          type="button"
                          className="mt-3 cursor-pointer rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-bold text-red-700 transition hover:bg-red-100"
                          onClick={() => {
                            void loadSavedAddresses();
                          }}
                        >
                          Tentar novamente
                        </button>
                      </div>
                    ) : savedAddresses.length === 0 ? (
                      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                        <p className="font-bold text-gray-900">Você ainda não possui endereços cadastrados.</p>
                        <p className="mt-1">Cadastre um endereço no perfil para continuar com a entrega.</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <a
                            href="/profile"
                            className="inline-flex h-9 items-center rounded-md border border-gray-300 px-3 text-xs font-bold text-gray-800 transition hover:bg-gray-100"
                          >
                            Cadastrar endereço no perfil
                          </a>
                          <button
                            type="button"
                            className="inline-flex h-9 items-center rounded-md border border-gray-300 px-3 text-xs font-bold text-gray-800 transition hover:bg-gray-100"
                            onClick={() => setAddressMode("new")}
                          >
                            Informar endereço agora
                          </button>
                        </div>
                      </div>
                    ) : (
                      savedAddresses.map((address, index) => (
                        <label
                          key={address.id}
                          className={`flex cursor-pointer gap-3 rounded-lg border p-4 transition ${
                            selectedAddress === address.id ? "border-[#F5C518] bg-[#fff9df]" : "border-gray-200 bg-white"
                          }`}
                        >
                          <input
                            type="radio"
                            name="address"
                            aria-label={`Selecionar endereço ${index + 1}`}
                            className="mt-1 accent-[#F5C518]"
                            checked={selectedAddress === address.id}
                            onChange={() => setSelectedAddress(address.id)}
                          />
                          <span>
                            <strong className="block text-sm text-gray-950">
                              {address.isDefault ? "Endereço principal" : `Endereço ${index + 1}`}
                            </strong>
                            <span className="mt-1 block text-sm text-gray-600">{formatAddressLine(address)}</span>
                            <span className="block text-sm text-gray-600">{formatAddressCity(address)}</span>
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                ) : (
                  <div className="mt-6">
                    <AddressFormFields
                      values={newAddressForm}
                      onChange={updateNewAddress}
                      requiredFields={requiredAddressFields}
                      showRequiredMarks
                      errors={newAddressErrors}
                      onZipCodeBlur={(zipCode) => {
                        void fetchAddressByCep(zipCode);
                      }}
                      isFetchingCep={isFetchingNewCep}
                      disabledFields={isFetchingNewCep ? ["street", "district", "city", "state"] : []}
                    />

                    <div className="mt-4 grid gap-2 rounded-md border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
                      <label className="flex cursor-pointer items-start gap-2">
                        <input
                          type="checkbox"
                          className="mt-0.5 h-4 w-4 cursor-pointer accent-[#F5C518]"
                          checked={saveNewAddress}
                          onChange={(event) => {
                            setSaveNewAddress(event.target.checked);
                            setAddressSubmitError(null);
                          }}
                        />
                        Salvar para próximas compras
                      </label>

                      {saveNewAddress ? (
                        <label className="flex cursor-pointer items-start gap-2">
                          <input
                            type="checkbox"
                            className="mt-0.5 h-4 w-4 cursor-pointer accent-[#F5C518]"
                            checked={setAsDefaultAddress}
                            onChange={(event) => {
                              setSetAsDefaultAddress(event.target.checked);
                              setAddressSubmitError(null);
                              setSavedNewAddress(null);
                            }}
                          />
                          Definir este endereço como principal
                        </label>
                      ) : (
                        <p className="text-xs text-gray-500">Este endereço será usado apenas neste pedido.</p>
                      )}
                    </div>
                    {addressSubmitError && (
                      <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                        {addressSubmitError}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeStep === "review" && (
              <div>
                <h2 className="text-xl font-bold text-gray-950">
                  Revisão da compra
                </h2>
                <p className="mt-1 text-sm text-gray-500">Confira produtos, quantidades e entrega antes do pagamento.</p>

                <div className="mt-6 divide-y divide-gray-100">
                  {cartItems.map((item) => (
                    <div key={item.productId} className="flex gap-4 py-4">
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-400">
                        {item.image ? (
                          <img src={item.image} alt="" className="h-full w-full rounded-md object-cover" />
                        ) : (
                          <PackageCheck size={26} aria-hidden="true" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-gray-950">{item.name}</p>
                        <p className="mt-1 text-sm text-gray-500">{item.code}</p>
                        {item.variantName && (
                          <p className="mt-1 text-xs text-gray-500">Variação: {item.variantName}</p>
                        )}
                        <div className="mt-3 flex items-center justify-between gap-3">
                          <span className="rounded-md border border-gray-200 px-2.5 py-1 text-xs font-bold text-gray-700">
                            Qtd. {item.quantity}
                          </span>
                          <strong className="text-sm text-gray-950">{formatCurrency(getCartItemTotal(item))}</strong>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-center gap-3 text-sm font-bold text-gray-950">
                    <Truck size={18} aria-hidden="true" />
                    Entrega estimada em 5 a 8 dias úteis
                  </div>
                  <p className="mt-2 text-sm text-gray-600">Frete calculado para o endereço selecionado.</p>
                  <p className="mt-3 text-sm text-gray-700">{reviewAddressText}</p>
                  {addressMode === "new" && (
                    <p className="mt-1 text-xs text-gray-500">
                      {saveNewAddress
                        ? "Novo endereço será salvo no perfil ao concluir o pedido."
                        : "Novo endereço será usado somente neste pedido."}
                    </p>
                  )}
                  {addressMode === "new" && saveNewAddress && setAsDefaultAddress && (
                    <p className="mt-1 text-xs text-gray-500">Este endereço também será marcado como principal.</p>
                  )}
                  {isLoadingShippingQuote && (
                    <p className="mt-3 text-sm font-bold text-gray-600">Calculando frete...</p>
                  )}
                  {shippingQuoteError && (
                    <p className="mt-3 text-sm font-bold text-red-600">{shippingQuoteError}</p>
                  )}
                </div>
              </div>
            )}

            {activeStep === "payment" && (
              <div>
                <h2 className="text-xl font-black text-gray-950" style={{ fontWeight: "bold" }}>
                  Método de pagamento
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Pagamento será combinado depois. Ao confirmar, o pedido entra no painel admin.
                </p>

                <div className="mt-6 grid gap-3">
                  {paymentMethods.map((method) => (
                    <label
                      key={method.id}
                      className={`flex cursor-pointer gap-3 rounded-lg border p-4 transition ${
                        selectedPayment === method.id ? "border-[#F5C518] bg-[#fff9df]" : "border-gray-200 bg-white"
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        className="mt-1 accent-[#F5C518]"
                        checked={selectedPayment === method.id}
                        onChange={() => setSelectedPayment(method.id)}
                      />
                      <span>
                        <strong className="block text-sm text-gray-950">{method.title}</strong>
                        <span className="mt-1 block text-sm text-gray-600">{method.description}</span>
                      </span>
                    </label>
                  ))}
                </div>

                {selectedPayment === "credit" && (
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <label className="sm:col-span-2">
                      <span className="mb-1.5 block text-sm font-bold text-gray-800">Número do cartão</span>
                      <input className="h-11 w-full rounded-md border border-gray-300 px-3 text-sm outline-none focus:border-[#F5C518]" />
                    </label>
                    <label>
                      <span className="mb-1.5 block text-sm font-bold text-gray-800">Validade</span>
                      <input className="h-11 w-full rounded-md border border-gray-300 px-3 text-sm outline-none focus:border-[#F5C518]" />
                    </label>
                    <label>
                      <span className="mb-1.5 block text-sm font-bold text-gray-800">CVV</span>
                      <input className="h-11 w-full rounded-md border border-gray-300 px-3 text-sm outline-none focus:border-[#F5C518]" />
                    </label>
                  </div>
                )}

                <div className="mt-6 flex items-start gap-3 rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
                  <ShieldCheck className="mt-0.5 shrink-0 text-gray-900" size={18} aria-hidden="true" />
                  <span>Ambiente seguro e dados protegidos para finalizar sua compra.</span>
                </div>
              </div>
            )}

            {orderError && (
              <p className="mt-6 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {orderError}
              </p>
            )}

            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
              <button
                type="button"
                className="h-11 cursor-pointer rounded-md border border-gray-300 px-5 text-sm font-bold text-gray-800 transition hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-40"
                disabled={activeIndex === 0}
                onClick={goBack}
              >
                Voltar
              </button>

              {activeStep === "payment" ? (
                <button
                  type="button"
                  className="h-11 cursor-pointer rounded-md bg-[#F5C518] px-6 text-sm font-black text-black transition hover:bg-[#e6b800] disabled:pointer-events-none disabled:opacity-40"
                  style={{ fontWeight: "bold" }}
                  onClick={handleConfirmOrder}
                  disabled={
                    !hasCartItems ||
                    isLoadingCart ||
                    Boolean(cartError) ||
                    isLoadingShippingQuote ||
                    Boolean(shippingQuoteError) ||
                    !selectedShippingQuote ||
                    isSubmittingOrder ||
                    Boolean(createdOrder)
                  }
                >
                  {isSubmittingOrder ? "Enviando pedido..." : createdOrder ? "Pedido confirmado" : "Confirmar pedido"}
                </button>
              ) : (
                <button
                  type="button"
                  className="h-11 cursor-pointer rounded-md bg-[#F5C518] px-6 text-sm font-black text-black transition hover:bg-[#e6b800] disabled:pointer-events-none disabled:opacity-40"
                  style={{ fontWeight: "bold" }}
                  onClick={goNext}
                  disabled={!hasCartItems || isLoadingCart || Boolean(cartError) || (activeStep === "address" && !canContinueAddressStep)}
                >
                  {isSavingAddress ? "Salvando..." : "Continuar"}
                </button>
              )}
            </div>
          </section>
        </div>

        <aside className="h-fit rounded-lg border border-gray-200 bg-white p-5 shadow-sm lg:sticky lg:top-32">
          <h2 className="text-lg font-bold text-gray-950">
            Resumo do pedido
          </h2>

          <div className="mt-5 space-y-3 text-sm">
            <form onSubmit={handleApplyCoupon} className="rounded-lg border border-gray-200 p-3">
              <label htmlFor="coupon-code" className="block text-xs font-bold uppercase tracking-wide text-gray-500">
                Cupom de desconto
              </label>
              <div className="mt-2 flex gap-2">
                <input
                  id="coupon-code"
                  value={couponCode}
                  onChange={(event) => {
                    setCouponCode(event.target.value.toUpperCase());
                    setAppliedCoupon(null);
                    setCouponError(null);
                  }}
                  placeholder="Ex.: TINPAVI10"
                  className="min-w-0 flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm font-bold uppercase tracking-wide text-gray-950 outline-none focus:border-[#F5C518]"
                  disabled={isApplyingCoupon || isSubmittingOrder || Boolean(createdOrder)}
                />
                {appliedCoupon ? (
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="rounded-md border border-gray-300 px-3 text-sm font-bold text-gray-700 transition hover:bg-gray-50"
                    disabled={isSubmittingOrder}
                  >
                    Remover
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="rounded-md bg-[#F5C518] px-3 text-sm font-black text-black transition hover:bg-[#e6b800] disabled:pointer-events-none disabled:opacity-50"
                    disabled={isApplyingCoupon || isLoadingShippingQuote || !selectedShippingQuote || !hasCartItems || subtotal <= 0}
                  >
                    {isApplyingCoupon ? "Aplicando..." : "Aplicar"}
                  </button>
                )}
              </div>
              {appliedCoupon && (
                <p className="mt-2 text-xs font-bold text-emerald-700">
                  Cupom {appliedCoupon.code} aplicado: -{formatCurrency(appliedCoupon.discountAmount)}
                </p>
              )}
              {couponError && <p className="mt-2 text-xs font-bold text-red-600">{couponError}</p>}
            </form>

            <div className="flex justify-between gap-4 text-gray-600">
              <span>Subtotal</span>
              <span className="font-bold text-gray-950">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between gap-4 text-gray-600">
              <span>Frete</span>
              <span className="font-bold text-gray-950">
                {isLoadingShippingQuote ? "Calculando..." : shippingQuoteError ? "Indisponível" : formatCurrency(shipping)}
              </span>
            </div>
            {appliedCoupon && (
              <div className="flex justify-between gap-4 text-emerald-700">
                <span>Desconto</span>
                <span className="font-bold">-{formatCurrency(discount)}</span>
              </div>
            )}
            <div className="border-t border-gray-200 pt-3">
              <div className="flex justify-between gap-4 text-base font-bold text-gray-950">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
            <strong className="block text-gray-950">Compra protegida</strong>
            Nota fiscal em todas as compras e suporte técnico especializado.
          </div>
        </aside>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import {
  Check,
  CheckCircle2,
  CreditCard,
  Edit3,
  KeyRound,
  Lock,
  MapPin,
  PackageCheck,
  Save,
  ShieldCheck,
  Star,
  Truck,
  User,
  X,
} from "lucide-react";
import { avaliacaoService } from "../admin/services/avaliacao.service";
import { clearPublicCatalogCache } from "../admin/services/produto.service";
import { customerAuthService, type CustomerAddress } from "../admin/services/customer-auth.service";
import { customerOrdersService } from "../admin/services/customer-orders.service";
import { type Pedido, type PedidoStatus } from "../admin/services/pedido.service";
import {
  AddressFormFields,
  emptyAddressForm,
  formatAddressFromForm,
  hasAddressData,
  mapAddressToForm,
  normalizeAddressForm,
  type AddressFormValues,
} from "./shared/AddressFormFields";

const profileSteps = [
  { id: "info", label: "Cadastro", icon: User },
  { id: "security", label: "Segurança", icon: ShieldCheck },
  { id: "payments", label: "Pagamentos", icon: CreditCard },
  { id: "tracking", label: "Rastreio", icon: Truck },
  { id: "history", label: "Histórico", icon: PackageCheck },
] as const;

type ProfileStep = (typeof profileSteps)[number]["id"];
type ProfileEditableField = "name" | "email" | "phone" | "company" | "document" | "address";

type SavedPaymentCard = {
  id: string;
  brand: string;
  holderName: string;
  last4: string;
  expiry: string;
  document: string;
  isDefault: boolean;
};

type PaymentCardForm = {
  number: string;
  holderName: string;
  expiry: string;
  cvv: string;
  document: string;
  isDefault: boolean;
};

type PaymentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (card: PaymentCardForm) => void;
};

type Purchase = {
  id: string;
  date: string;
  items: string;
  status: string;
  tracking: string;
  total: string;
};

type PurchaseDetailsModalProps = {
  purchase: Purchase | null;
  onClose: () => void;
};

type ReviewTarget = {
  productId: string;
  productName: string;
};

const orderStatusLabel: Record<PedidoStatus, string> = {
  PENDING_PAYMENT: "Aguardando pagamento",
  PAID: "Pago",
  SHIPPED: "Enviado",
  DELIVERED: "Entregue",
  CANCELLED: "Cancelado",
  REFUNDED: "Reembolsado",
};

function formatCurrency(value: number) {
  return (Number.isFinite(value) ? value : 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatOrderNumber(id: string) {
  return `#${id.slice(-6).toUpperCase()}`;
}

function formatOrderItemSummary(order: Pedido) {
  const firstItem = order.items?.[0];
  if (!firstItem) return "Pedido Tinpavi";
  const extraItems = (order.items?.length ?? 0) - 1;
  const firstName = firstItem.productName || firstItem.productId;
  return extraItems > 0 ? `${firstName} +${extraItems}` : firstName;
}

function getOrderItemsQuantity(order: Pedido) {
  return (order.items || []).reduce((total, item) => total + item.quantity, 0);
}

function getPaymentStorageKey(email: string) {
  return `tinpavi:payment-cards:${email || "guest"}`;
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function formatCardNumber(value: string) {
  return onlyDigits(value).slice(0, 19).replace(/(\d{4})(?=\d)/g, "$1 ");
}

function formatCardExpiry(value: string) {
  const digits = onlyDigits(value).slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function detectCardBrand(cardNumber: string) {
  const digits = onlyDigits(cardNumber);
  if (/^4/.test(digits)) return "Visa";
  if (/^(5[1-5]|2[2-7])/.test(digits)) return "Mastercard";
  if (/^3[47]/.test(digits)) return "Amex";
  if (/^(4011|4312|4389|4514|4576|5041|5067|509|6277|6362|6363)/.test(digits)) return "Elo";
  return "Cartao";
}

function validatePaymentCardForm(form: PaymentCardForm): string | null {
  const cardDigits = onlyDigits(form.number);
  const docDigits = onlyDigits(form.document);
  if (cardDigits.length < 13 || cardDigits.length > 19) return "Informe um numero de cartao valido.";
  if (!form.holderName.trim()) return "Informe o nome impresso no cartao.";
  if (!/^\d{2}\/\d{2}$/.test(form.expiry)) return "Informe a validade no formato MM/AA.";
  const [monthText] = form.expiry.split("/");
  const month = Number(monthText);
  if (!Number.isInteger(month) || month < 1 || month > 12) return "Informe um mes de validade valido.";
  if (onlyDigits(form.cvv).length < 3 || onlyDigits(form.cvv).length > 4) return "Informe um CVV valido.";
  if (docDigits.length !== 11 && docDigits.length !== 14) return "Informe o CPF/CNPJ do titular.";
  return null;
}

function useAnimatedModal(isOpen: boolean, onClose: () => void) {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);

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
    }, 180);

    return () => window.clearTimeout(timeoutId);
  }, [isOpen, shouldRender]);

  useEffect(() => {
    if (!shouldRender) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [shouldRender, onClose]);

  return { shouldRender, isClosing };
}

function PaymentModal({ isOpen, onClose, onSave }: PaymentModalProps) {
  const { shouldRender, isClosing } = useAnimatedModal(isOpen, onClose);
  const [form, setForm] = useState<PaymentCardForm>({
    number: "",
    holderName: "",
    expiry: "",
    cvv: "",
    document: "",
    isDefault: false,
  });
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setForm({
      number: "",
      holderName: "",
      expiry: "",
      cvv: "",
      document: "",
      isDefault: false,
    });
    setMessage(null);
  }, [isOpen]);

  if (!shouldRender) return null;

  function updateForm<K extends keyof PaymentCardForm>(field: K, value: PaymentCardForm[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const error = validatePaymentCardForm(form);
    if (error) {
      setMessage(error);
      return;
    }
    onSave(form);
  }

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-modal-title"
    >
      <button
        type="button"
        className={`absolute inset-0 h-full w-full cursor-pointer bg-black/45 ${
          isClosing ? "payment-backdrop-exit" : "payment-backdrop-enter"
        }`}
        aria-label="Fechar cadastro de cartão"
        onClick={onClose}
      />

      <div
        className={`relative max-h-[calc(100vh-2rem)] w-full max-w-lg overflow-y-auto rounded-lg bg-white shadow-2xl ${
          isClosing ? "payment-modal-exit" : "payment-modal-enter"
        }`}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div>
            <h2 id="payment-modal-title" className="text-lg font-bold text-gray-950">
              Adicionar cartão
            </h2>
            <p className="mt-0.5 text-sm text-gray-500">Cadastre um método de pagamento.</p>
          </div>

          <button
            type="button"
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-md text-gray-600 transition hover:bg-gray-100 hover:text-black"
            aria-label="Fechar cadastro de cartão"
            onClick={onClose}
          >
            <X size={22} aria-hidden="true" />
          </button>
        </div>

        <form className="grid gap-4 p-5 sm:grid-cols-2" onSubmit={handleSubmit}>
          <label className="sm:col-span-2">
            <span className="mb-1.5 block text-sm font-bold text-gray-800">Número do cartão</span>
            <input
              type="text"
              inputMode="numeric"
              placeholder="0000 0000 0000 0000"
              value={form.number}
              onChange={(event) => updateForm("number", formatCardNumber(event.target.value))}
              className="h-11 w-full rounded-md border border-gray-300 px-3 text-sm outline-none focus:border-[#F5C518]"
            />
          </label>

          <label className="sm:col-span-2">
            <span className="mb-1.5 block text-sm font-bold text-gray-800">Nome impresso no cartão</span>
            <input
              type="text"
              placeholder="Nome completo"
              value={form.holderName}
              onChange={(event) => updateForm("holderName", event.target.value.toUpperCase())}
              className="h-11 w-full rounded-md border border-gray-300 px-3 text-sm outline-none focus:border-[#F5C518]"
            />
          </label>

          <label>
            <span className="mb-1.5 block text-sm font-bold text-gray-800">Validade</span>
            <input
              type="text"
              inputMode="numeric"
              placeholder="MM/AA"
              value={form.expiry}
              onChange={(event) => updateForm("expiry", formatCardExpiry(event.target.value))}
              className="h-11 w-full rounded-md border border-gray-300 px-3 text-sm outline-none focus:border-[#F5C518]"
            />
          </label>

          <label>
            <span className="mb-1.5 block text-sm font-bold text-gray-800">CVV</span>
            <input
              type="password"
              inputMode="numeric"
              placeholder="000"
              maxLength={4}
              value={form.cvv}
              onChange={(event) => updateForm("cvv", onlyDigits(event.target.value).slice(0, 4))}
              className="h-11 w-full rounded-md border border-gray-300 px-3 text-sm outline-none focus:border-[#F5C518]"
            />
          </label>

          <label className="sm:col-span-2">
            <span className="mb-1.5 block text-sm font-bold text-gray-800">CPF/CNPJ do titular</span>
            <input
              type="text"
              inputMode="numeric"
              placeholder="000.000.000-00"
              value={form.document}
              onChange={(event) => updateForm("document", onlyDigits(event.target.value).slice(0, 14))}
              className="h-11 w-full rounded-md border border-gray-300 px-3 text-sm outline-none focus:border-[#F5C518]"
            />
          </label>

          <label className="flex cursor-pointer items-start gap-2 text-sm text-gray-600 sm:col-span-2">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(event) => updateForm("isDefault", event.target.checked)}
              className="mt-0.5 h-4 w-4 cursor-pointer accent-[#F5C518]"
            />
            Salvar esse cartão como principal.
          </label>

          {message && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 sm:col-span-2">{message}</p>
          )}

          <div className="grid gap-3 pt-2 sm:col-span-2 sm:grid-cols-2">
            <button
              type="button"
              className="h-11 cursor-pointer rounded-md border border-gray-300 bg-white text-sm font-bold text-gray-800 transition hover:bg-gray-50"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="h-11 cursor-pointer rounded-md bg-[#F5C518] text-sm font-bold text-black transition hover:bg-[#e6b800]"
            >
              Salvar cartão
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PurchaseDetailsModal({ purchase, onClose }: PurchaseDetailsModalProps) {
  const { shouldRender, isClosing } = useAnimatedModal(Boolean(purchase), onClose);
  const [visiblePurchase, setVisiblePurchase] = useState<Purchase | null>(purchase);

  useEffect(() => {
    if (purchase) {
      setVisiblePurchase(purchase);
      return;
    }

    if (!shouldRender) {
      setVisiblePurchase(null);
    }
  }, [purchase, shouldRender]);

  if (!shouldRender || !visiblePurchase) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="purchase-modal-title"
    >
      <button
        type="button"
        className={`absolute inset-0 h-full w-full cursor-pointer bg-black/45 ${
          isClosing ? "payment-backdrop-exit" : "payment-backdrop-enter"
        }`}
        aria-label="Fechar detalhes do pedido"
        onClick={onClose}
      />

      <div
        className={`relative max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-2xl ${
          isClosing ? "payment-modal-exit" : "payment-modal-enter"
        }`}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div>
            <h2 id="purchase-modal-title" className="text-lg font-bold text-gray-950">
              Pedido {visiblePurchase.id}
            </h2>
            <p className="mt-0.5 text-sm text-gray-500">
              {visiblePurchase.date} · {visiblePurchase.items}
            </p>
          </div>

          <button
            type="button"
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-md text-gray-600 transition hover:bg-gray-100 hover:text-black"
            aria-label="Fechar detalhes do pedido"
            onClick={onClose}
          >
            <X size={22} aria-hidden="true" />
          </button>
        </div>

        <div className="grid gap-5 p-5">
          <div className="rounded-lg border border-[#F5C518] bg-[#fff9df] p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <strong className="text-sm text-gray-950">{orderStatusLabel[visiblePurchase.status as PedidoStatus] ?? visiblePurchase.status}</strong>
                <p className="mt-1 text-sm text-gray-600">{visiblePurchase.tracking}</p>
              </div>
              <span className="w-fit rounded-full bg-black px-3 py-1 text-xs font-bold text-white">
                Rastreamento ativo
              </span>
            </div>
          </div>

          <section>
            <h3 className="text-base font-bold text-gray-950">Itens do pedido</h3>
            <div className="mt-3 divide-y divide-gray-100 rounded-lg border border-gray-200">
              {[
                ["Placa de sinalização Pare R-1", "Qtd. 2", "R$ 179,80"],
                ["Tachão refletivo bidirecional", "Qtd. 6", "R$ 147,00"],
                ["Tinta viária acrílica 18L", "Qtd. 1", "R$ 219,90"],
              ].map(([name, qty, total]) => (
                <div key={name} className="grid gap-2 p-4 sm:grid-cols-[1fr_auto_auto] sm:items-center">
                  <strong className="text-sm text-gray-950">{name}</strong>
                  <span className="text-sm text-gray-600">{qty}</span>
                  <span className="text-sm font-bold text-gray-950">{total}</span>
                </div>
              ))}
            </div>
          </section>

          <div className="grid gap-4 sm:grid-cols-2">
            <section className="rounded-lg border border-gray-200 p-4">
              <h3 className="text-base font-bold text-gray-950">Entrega</h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                Av. Paulista, 1000 - Bela Vista, São Paulo - SP
              </p>
              <p className="mt-2 text-sm font-bold text-gray-950">Previsão: 13/05/2026</p>
            </section>

            <section className="rounded-lg border border-gray-200 p-4">
              <h3 className="text-base font-bold text-gray-950">Pagamento</h3>
              <p className="mt-2 text-sm text-gray-600">Cartão Visa •••• 4321</p>
              <p className="mt-2 text-sm font-bold text-gray-950">Total: {visiblePurchase.total}</p>
            </section>
          </div>

          <button
            type="button"
            className="h-11 cursor-pointer rounded-md bg-[#F5C518] px-5 text-sm font-bold text-black transition hover:bg-[#e6b800] sm:ml-auto"
            onClick={onClose}
          >
            Fechar detalhes
          </button>
        </div>
      </div>
    </div>
  );
}

function ReviewModal({
  target,
  onClose,
  onPublished,
}: {
  target: ReviewTarget | null;
  onClose: () => void;
  onPublished: () => void;
}) {
  const { shouldRender, isClosing } = useAnimatedModal(Boolean(target), onClose);
  const [visibleTarget, setVisibleTarget] = useState<ReviewTarget | null>(target);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (target) {
      setVisibleTarget(target);
      setRating(5);
      setComment("");
      setMessage("");
      return;
    }

    if (!shouldRender) setVisibleTarget(null);
  }, [target, shouldRender]);

  if (!shouldRender || !visibleTarget) return null;

  async function submitReview() {
    if (!visibleTarget) return;
    try {
      setIsSubmitting(true);
      setMessage("");
      await avaliacaoService.createForProduct(visibleTarget.productId, {
        rating,
        comment: comment.trim() || undefined,
      });
      clearPublicCatalogCache();
      onPublished();
      setMessage("Avaliação publicada.");
      window.setTimeout(onClose, 700);
    } catch (error) {
      const status = (error as { response?: { status?: number } }).response?.status;
      if (status === 409) setMessage("Você já avaliou este produto.");
      else if (status === 403) setMessage("Somente compras confirmadas podem ser avaliadas.");
      else if (status === 401) setMessage("Entre como cliente para avaliar.");
      else setMessage("Não foi possível publicar sua avaliação agora.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button
        type="button"
        className={`absolute inset-0 h-full w-full cursor-pointer bg-black/45 ${isClosing ? "payment-backdrop-exit" : "payment-backdrop-enter"}`}
        aria-label="Fechar avaliação"
        onClick={onClose}
      />
      <div className={`relative w-full max-w-lg rounded-lg bg-white shadow-2xl ${isClosing ? "payment-modal-exit" : "payment-modal-enter"}`}>
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-gray-950">Avaliar produto</h2>
            <p className="mt-0.5 text-sm text-gray-500">{visibleTarget.productName}</p>
          </div>
          <button
            type="button"
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-md text-gray-600 transition hover:bg-gray-100 hover:text-black"
            aria-label="Fechar avaliação"
            onClick={onClose}
          >
            <X size={22} aria-hidden="true" />
          </button>
        </div>
        <div className="grid gap-4 p-5">
          <div>
            <span className="mb-2 block text-sm font-bold text-gray-800">Nota</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  className="cursor-pointer p-1 text-[#F5C518]"
                  aria-label={`${value} estrelas`}
                  onClick={() => setRating(value)}
                >
                  <Star size={28} fill={value <= rating ? "currentColor" : "none"} aria-hidden="true" />
                </button>
              ))}
            </div>
          </div>
          <label>
            <span className="mb-1.5 block text-sm font-bold text-gray-800">Comentário</span>
            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              maxLength={500}
              rows={4}
              className="w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#F5C518]"
              placeholder="Conte como foi sua experiência com o produto"
            />
          </label>
          {message && <p className="text-sm font-bold text-gray-700">{message}</p>}
          <button
            type="button"
            className="h-11 cursor-pointer rounded-md bg-[#F5C518] px-5 text-sm font-bold text-black transition hover:bg-[#e6b800] disabled:pointer-events-none disabled:opacity-60"
            disabled={isSubmitting}
            onClick={() => void submitReview()}
          >
            {isSubmitting ? "Publicando..." : "Publicar avaliação"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ProfilePage() {
  const [activeStep, setActiveStep] = useState<ProfileStep>("info");
  const [isEditing, setIsEditing] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentCards, setPaymentCards] = useState<SavedPaymentCard[]>([]);
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null);
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    document: "",
    address: "",
    mfaEnabled: false,
  });
  const [securityForm, setSecurityForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [securityMessage, setSecurityMessage] = useState<string | null>(null);
  const [isSavingSecurity, setIsSavingSecurity] = useState(false);
  const [isMfaModalOpen, setIsMfaModalOpen] = useState(false);
  const [mfaSetupCode, setMfaSetupCode] = useState("");
  const [mfaSetupEmail, setMfaSetupEmail] = useState("");
  const [isSavingMfa, setIsSavingMfa] = useState(false);
  const [defaultAddressId, setDefaultAddressId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState<AddressFormValues>(emptyAddressForm);
  const [isFetchingCep, setIsFetchingCep] = useState(false);
  const [orders, setOrders] = useState<Pedido[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [reviewTarget, setReviewTarget] = useState<ReviewTarget | null>(null);
  const [reviewedProductIds, setReviewedProductIds] = useState<Set<string>>(new Set());

  const activeIndex = profileSteps.findIndex((step) => step.id === activeStep);
  const activeOrders = orders.filter((order) => !["DELIVERED", "CANCELLED", "REFUNDED"].includes(order.status));
  const canReviewOrder = (order: Pedido) => order.paymentStatus === "PAID" || ["PAID", "SHIPPED", "DELIVERED"].includes(order.status);

  async function syncReviewedProducts(nextOrders: Pedido[]) {
    const productIds = Array.from(
      new Set(
        nextOrders
          .filter(canReviewOrder)
          .flatMap((order) => order.items || [])
          .map((item) => item.productId)
          .filter(Boolean),
      ),
    );

    const results = await Promise.allSettled(
      productIds.map(async (productId) => ({
        productId,
        eligibility: await avaliacaoService.checkEligibility(productId),
      })),
    );

    setReviewedProductIds((current) => {
      const next = new Set(current);
      for (const result of results) {
        if (result.status === "fulfilled" && result.value.eligibility.reason === "ALREADY_REVIEWED") {
          next.add(result.value.productId);
        }
      }
      return next;
    });
  }

  useEffect(() => {
    let isMounted = true;

    customerAuthService
      .refreshProfile()
      .then(async (customer) => {
        if (!customer) {
          window.location.href = "/signin";
          return;
        }

        if (!isMounted) return;
        setProfile({
          name: customer.name ?? "",
          email: customer.email ?? "",
          phone: customer.phone ?? "",
          company: customer.company ?? "",
          document: customer.document ?? "",
          address: customer.address ?? "",
          mfaEnabled: Boolean(customer.mfaEnabled),
        });
        try {
          const storedCards = localStorage.getItem(getPaymentStorageKey(customer.email ?? ""));
          setPaymentCards(storedCards ? JSON.parse(storedCards) as SavedPaymentCard[] : []);
        } catch {
          setPaymentCards([]);
        }
        setDefaultAddressId(customer.defaultAddress?.id ?? null);
        setAddressForm(mapAddressToForm(customer.defaultAddress ?? null));

        try {
          setIsLoadingOrders(true);
          setOrdersError(null);
          const response = await customerOrdersService.list();
          if (!isMounted) return;
          setOrders(response.items);
          void syncReviewedProducts(response.items);
        } catch {
          if (isMounted) setOrdersError("Não foi possível carregar seus pedidos agora.");
        } finally {
          if (isMounted) setIsLoadingOrders(false);
        }
      })
      .catch(() => {
        window.location.href = "/signin";
      });

    return () => {
      isMounted = false;
    };
  }, []);

  function updateProfile(field: ProfileEditableField, value: string) {
    setProfile((current) => ({ ...current, [field]: value }));
  }

  function updateAddress(field: keyof AddressFormValues, value: string) {
    setAddressForm((current) => ({ ...current, [field]: value }));
  }

  async function fetchAddressByCep(cep: string) {
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8) return;
    setIsFetchingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      if (!response.ok) return;
      const data = await response.json() as { erro?: boolean; logradouro?: string; bairro?: string; localidade?: string; uf?: string };
      if (data.erro) return;
      setAddressForm((current) => ({
        ...current,
        street: data.logradouro ?? current.street,
        district: data.bairro ?? current.district,
        city: data.localidade ?? current.city,
        state: data.uf ?? current.state,
      }));
    } catch {
      // silently ignore network errors
    } finally {
      setIsFetchingCep(false);
    }
  }

  async function handleProfileAction() {
    if (!isEditing) {
      setIsEditing(true);
      return;
    }

    setIsSavingProfile(true);
    try {
      const updated = await customerAuthService.updateProfile({
        name: profile.name,
        phone: profile.phone || null,
        company: profile.company || null,
        document: profile.document || null,
      });

      let savedAddress: CustomerAddress | null = updated.defaultAddress ?? null;
      if (hasAddressData(addressForm)) {
        const normalizedAddress = normalizeAddressForm(addressForm);
        const payload: {
          zipCode: string;
          street: string;
          number: string;
          district: string;
          city: string;
          state: string;
          country: string;
          isDefault: boolean;
          complement?: string;
        } = {
          zipCode: normalizedAddress.zipCode,
          street: normalizedAddress.street,
          number: normalizedAddress.number,
          district: normalizedAddress.district,
          city: normalizedAddress.city,
          state: normalizedAddress.state,
          country: "BR",
          isDefault: true,
        };
        if (normalizedAddress.complement) payload.complement = normalizedAddress.complement;
        savedAddress = defaultAddressId
          ? await customerAuthService.updateAddress(defaultAddressId, payload)
          : await customerAuthService.createAddress(payload);
        setDefaultAddressId(savedAddress.id);
      }

      const addressText = savedAddress ? formatAddressFromForm(mapAddressToForm(savedAddress)) : updated.address ?? "";
      setProfile((current) => ({
        ...current,
        name: updated.name ?? current.name,
        email: updated.email ?? current.email,
        phone: updated.phone ?? "",
        company: updated.company ?? "",
        document: updated.document ?? "",
        address: addressText,
        mfaEnabled: current.mfaEnabled,
      }));
      if (savedAddress) setAddressForm(mapAddressToForm(savedAddress));
      setIsEditing(false);
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handleChangePassword() {
    if (securityForm.newPassword.length < 8) {
      setSecurityMessage("A nova senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (securityForm.newPassword !== securityForm.confirmPassword) {
      setSecurityMessage("As senhas não conferem.");
      return;
    }

    setIsSavingSecurity(true);
    setSecurityMessage(null);
    try {
      await customerAuthService.changePassword({
        currentPassword: securityForm.currentPassword,
        newPassword: securityForm.newPassword,
      });
      setSecurityForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setSecurityMessage("Senha alterada com sucesso.");
    } catch {
      setSecurityMessage("Não foi possível alterar a senha. Confira a senha atual.");
    } finally {
      setIsSavingSecurity(false);
    }
  }

  async function handleMfaAction() {
    setSecurityMessage(null);
    if (profile.mfaEnabled) {
      setIsSavingMfa(true);
      try {
        const updated = await customerAuthService.disableMfa();
        setProfile((current) => ({ ...current, mfaEnabled: Boolean(updated.mfaEnabled) }));
        setSecurityMessage("Verificação em duas etapas desativada.");
      } catch {
        setSecurityMessage("Não foi possível desativar a verificação em duas etapas.");
      } finally {
        setIsSavingMfa(false);
      }
      return;
    }

    setIsSavingMfa(true);
    try {
      const setup = await customerAuthService.requestMfaSetup();
      setMfaSetupEmail(setup.emailMasked);
      setMfaSetupCode("");
      setIsMfaModalOpen(true);
    } catch {
      setSecurityMessage("Não foi possível enviar o código de verificação.");
    } finally {
      setIsSavingMfa(false);
    }
  }

  async function handleVerifyMfaSetup() {
    if (!/^\d{6}$/.test(mfaSetupCode)) {
      setSecurityMessage("Informe o código de 6 dígitos enviado por e-mail.");
      return;
    }

    setIsSavingMfa(true);
    setSecurityMessage(null);
    try {
      const updated = await customerAuthService.verifyMfaSetup(mfaSetupCode);
      setProfile((current) => ({ ...current, mfaEnabled: Boolean(updated.mfaEnabled) }));
      setIsMfaModalOpen(false);
      setSecurityMessage("Verificação em duas etapas ativada.");
    } catch {
      setSecurityMessage("Código inválido ou expirado.");
    } finally {
      setIsSavingMfa(false);
    }
  }

  function goNext() {
    const nextStep = profileSteps[Math.min(activeIndex + 1, profileSteps.length - 1)];
    setActiveStep(nextStep.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goBack() {
    const previousStep = profileSteps[Math.max(activeIndex - 1, 0)];
    setActiveStep(previousStep.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function persistPaymentCards(cards: SavedPaymentCard[]) {
    setPaymentCards(cards);
    localStorage.setItem(getPaymentStorageKey(profile.email), JSON.stringify(cards));
  }

  function handleSavePaymentCard(form: PaymentCardForm) {
    const cardDigits = onlyDigits(form.number);
    const nextCard: SavedPaymentCard = {
      id: crypto.randomUUID(),
      brand: detectCardBrand(form.number),
      holderName: form.holderName.trim(),
      last4: cardDigits.slice(-4),
      expiry: form.expiry,
      document: onlyDigits(form.document),
      isDefault: form.isDefault || paymentCards.length === 0,
    };
    const nextCards = [
      ...paymentCards.map((card) => ({ ...card, isDefault: nextCard.isDefault ? false : card.isDefault })),
      nextCard,
    ];
    persistPaymentCards(nextCards);
    setPaymentMessage("Cartao salvo com seguranca. Numero completo e CVV nao sao armazenados.");
    setIsPaymentModalOpen(false);
  }

  function handleSetDefaultCard(cardId: string) {
    persistPaymentCards(paymentCards.map((card) => ({ ...card, isDefault: card.id === cardId })));
  }

  function handleRemovePaymentCard(cardId: string) {
    const remainingCards = paymentCards.filter((card) => card.id !== cardId);
    if (remainingCards.length > 0 && !remainingCards.some((card) => card.isDefault)) {
      remainingCards[0] = { ...remainingCards[0], isDefault: true };
    }
    persistPaymentCards(remainingCards);
    setPaymentMessage("Cartao removido.");
  }

  return (
    <div className="bg-gray-50">
      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-8xl px-4 py-8">
          <p className="text-xs font-black uppercase text-[#ffa201]" style={{ fontWeight: "bold", color: "#ffa201" }}>
            Minha conta
          </p>
          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-950">Perfil</h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-gray-600">
                Gerencie seus dados, compras, rastreamentos e métodos de pagamento.
              </p>
            </div>
            {activeStep === "info" && (
              <button
                type="button"
                className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-md bg-[#F5C518] px-5 text-sm font-bold text-black transition hover:bg-[#e6b800]"
                disabled={isSavingProfile}
                onClick={() => { void handleProfileAction(); }}
              >
                {isEditing ? <Save size={17} aria-hidden="true" /> : <Edit3 size={17} aria-hidden="true" />}
                {isSavingProfile ? "Salvando..." : isEditing ? "Salvar dados" : "Editar perfil"}
              </button>
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-8xl gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:py-8">
        <div className="min-w-0">
          <div className="mb-6 grid grid-cols-2 rounded-lg border border-gray-200 bg-white p-2 sm:grid-cols-5">
            {profileSteps.map((step, index) => {
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
                  onClick={() => setActiveStep(step.id)}
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/70">
                    {isDone ? <Check size={16} aria-hidden="true" /> : <Icon size={16} aria-hidden="true" />}
                  </span>
                  <span className="hidden md:inline">{step.label}</span>
                </button>
              );
            })}
          </div>

          <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            {activeStep === "info" && (
              <div>
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#fff4c2] text-black">
                    <User size={22} aria-hidden="true" />
                  </span>
                  <div>
                    <h2 className="text-xl font-bold text-gray-950">Informações de cadastro</h2>
                    <p className="text-sm text-gray-500">Dados usados para compras e emissão de nota fiscal.</p>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {[
                    ["name", "Nome"],
                    ["email", "E-mail"],
                    ["phone", "Telefone"],
                    ["company", "Empresa"],
                    ["document", "CNPJ/CPF"],
                  ].map(([field, label]) => (
                    <label key={field}>
                      <span className="mb-1.5 block text-sm font-bold text-gray-800">{label}</span>
                      <input
                        value={profile[field as ProfileEditableField]}
                        readOnly={!isEditing || field === "email" || field === "address"}
                        onChange={(event) => updateProfile(field as ProfileEditableField, event.target.value)}
                        className={`h-11 w-full rounded-md border px-3 text-sm outline-none ${
                          isEditing && field !== "email" && field !== "address"
                            ? "border-gray-300 bg-white focus:border-[#F5C518]"
                            : "cursor-default border-gray-200 bg-gray-50 text-gray-700"
                        }`}
                      />
                    </label>
                  ))}
                </div>

                <div className="mt-6 border-t border-gray-100 pt-5">
                  <div className="mb-4">
                    <h3 className="text-base font-bold text-gray-950">Endereco principal</h3>
                    <p className="mt-1 text-sm text-gray-500">Usado como padrao para entrega e calculo de frete.</p>
                  </div>

                  <AddressFormFields
                    values={addressForm}
                    onChange={updateAddress}
                    readOnly={!isEditing}
                    requiredFields={["zipCode", "street", "number", "district", "city", "state"]}
                    disabledFields={
                      isEditing && isFetchingCep
                        ? ["street", "district", "city", "state"]
                        : []
                    }
                    isFetchingCep={isEditing && isFetchingCep}
                    showRequiredMarks={isEditing}
                    onZipCodeBlur={isEditing ? (zipCode) => { void fetchAddressByCep(zipCode); } : undefined}
                  />
                </div>

                <div className="hidden">
                  <div className="mb-4 flex items-start gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fff4c2] text-black">
                      <Lock size={20} aria-hidden="true" />
                    </span>
                    <div>
                      <h3 className="text-base font-bold text-gray-950">Segurança</h3>
                      <p className="mt-1 text-sm text-gray-500">Atualize sua senha e gerencie a verificação em duas etapas.</p>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <label>
                      <span className="mb-1.5 block text-sm font-bold text-gray-800">Senha atual</span>
                      <input
                        type="password"
                        value={securityForm.currentPassword}
                        onChange={(event) => setSecurityForm((current) => ({ ...current, currentPassword: event.target.value }))}
                        className="h-11 w-full rounded-md border border-gray-300 px-3 text-sm outline-none focus:border-[#F5C518]"
                        autoComplete="current-password"
                      />
                    </label>
                    <label>
                      <span className="mb-1.5 block text-sm font-bold text-gray-800">Nova senha</span>
                      <input
                        type="password"
                        value={securityForm.newPassword}
                        onChange={(event) => setSecurityForm((current) => ({ ...current, newPassword: event.target.value }))}
                        className="h-11 w-full rounded-md border border-gray-300 px-3 text-sm outline-none focus:border-[#F5C518]"
                        autoComplete="new-password"
                      />
                    </label>
                    <label>
                      <span className="mb-1.5 block text-sm font-bold text-gray-800">Confirmar nova senha</span>
                      <input
                        type="password"
                        value={securityForm.confirmPassword}
                        onChange={(event) => setSecurityForm((current) => ({ ...current, confirmPassword: event.target.value }))}
                        className="h-11 w-full rounded-md border border-gray-300 px-3 text-sm outline-none focus:border-[#F5C518]"
                        autoComplete="new-password"
                      />
                    </label>
                  </div>

                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <button
                      type="button"
                      className="h-10 cursor-pointer rounded-md bg-[#F5C518] px-5 text-sm font-bold text-black transition hover:bg-[#e6b800] disabled:pointer-events-none disabled:opacity-60"
                      disabled={isSavingSecurity}
                      onClick={() => { void handleChangePassword(); }}
                    >
                      {isSavingSecurity ? "Alterando..." : "Alterar senha"}
                    </button>

                    <button
                      type="button"
                      className="cursor-pointer text-left text-sm font-bold text-gray-950 underline decoration-[#F5C518] decoration-2 underline-offset-4 transition hover:text-[#9a7600] disabled:pointer-events-none disabled:opacity-60"
                      disabled={isSavingMfa}
                      onClick={() => { void handleMfaAction(); }}
                    >
                      {profile.mfaEnabled ? "Desativar verificação 2 etapas" : "Ativar verificação 2 etapas"}
                    </button>
                  </div>

                  {securityMessage && (
                    <p className="mt-3 rounded-md bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700">{securityMessage}</p>
                  )}
                </div>
              </div>
            )}

            {activeStep === "security" && (
              <div>
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#fff4c2] text-black">
                    <Lock size={22} aria-hidden="true" />
                  </span>
                  <div>
                    <h2 className="text-xl font-bold text-gray-950">Segurança</h2>
                    <p className="text-sm text-gray-500">Atualize sua senha e gerencie a verificação em duas etapas.</p>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  <label>
                    <span className="mb-1.5 block text-sm font-bold text-gray-800">Senha atual</span>
                    <input
                      type="password"
                      value={securityForm.currentPassword}
                      onChange={(event) => setSecurityForm((current) => ({ ...current, currentPassword: event.target.value }))}
                      className="h-11 w-full rounded-md border border-gray-300 px-3 text-sm outline-none focus:border-[#F5C518]"
                      autoComplete="current-password"
                    />
                  </label>
                  <label>
                    <span className="mb-1.5 block text-sm font-bold text-gray-800">Nova senha</span>
                    <input
                      type="password"
                      value={securityForm.newPassword}
                      onChange={(event) => setSecurityForm((current) => ({ ...current, newPassword: event.target.value }))}
                      className="h-11 w-full rounded-md border border-gray-300 px-3 text-sm outline-none focus:border-[#F5C518]"
                      autoComplete="new-password"
                    />
                  </label>
                  <label>
                    <span className="mb-1.5 block text-sm font-bold text-gray-800">Confirmar nova senha</span>
                    <input
                      type="password"
                      value={securityForm.confirmPassword}
                      onChange={(event) => setSecurityForm((current) => ({ ...current, confirmPassword: event.target.value }))}
                      className="h-11 w-full rounded-md border border-gray-300 px-3 text-sm outline-none focus:border-[#F5C518]"
                      autoComplete="new-password"
                    />
                  </label>
                </div>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    className="h-10 cursor-pointer rounded-md bg-[#F5C518] px-5 text-sm font-bold text-black transition hover:bg-[#e6b800] disabled:pointer-events-none disabled:opacity-60"
                    disabled={isSavingSecurity}
                    onClick={() => { void handleChangePassword(); }}
                  >
                    {isSavingSecurity ? "Alterando..." : "Alterar senha"}
                  </button>

                  <button
                    type="button"
                    className="cursor-pointer text-left text-sm font-bold text-gray-950 underline decoration-[#F5C518] decoration-2 underline-offset-4 transition hover:text-[#9a7600] disabled:pointer-events-none disabled:opacity-60"
                    disabled={isSavingMfa}
                    onClick={() => { void handleMfaAction(); }}
                  >
                    {profile.mfaEnabled ? "Desativar verificação 2 etapas" : "Ativar verificação 2 etapas"}
                  </button>
                </div>

                {securityMessage && (
                  <p className="mt-3 rounded-md bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700">{securityMessage}</p>
                )}
              </div>
            )}

            {activeStep === "payments" && (
              <div>
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#fff4c2] text-black">
                    <CreditCard size={22} aria-hidden="true" />
                  </span>
                  <div>
                    <h2 className="text-xl font-bold text-gray-950">Métodos de pagamento</h2>
                    <p className="text-sm text-gray-500">Gerencie cartões cadastrados para próximas compras.</p>
                  </div>
                </div>

                {paymentCards.length === 0 ? (
                <div className="mt-6 rounded-lg border border-dashed border-gray-200 py-10 text-center">
                  <CreditCard size={32} className="mx-auto text-gray-300" aria-hidden="true" />
                  <p className="mt-3 text-sm font-bold text-gray-500">Nenhum método de pagamento cadastrado</p>
                  <p className="mt-1 text-xs text-gray-400">Adicione um cartão para agilizar suas compras.</p>
                </div>
                ) : (
                  <div className="mt-6 grid gap-3">
                    {paymentCards.map((card) => (
                      <div key={card.id} className="rounded-lg border border-gray-200 bg-white p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-3">
                            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-[#fff4c2] text-black">
                              <CreditCard size={20} aria-hidden="true" />
                            </span>
                            <div>
                              <p className="text-sm font-bold text-gray-950">{card.brand} final {card.last4}</p>
                              <p className="mt-0.5 text-xs text-gray-500">{card.holderName} - vence {card.expiry}</p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {card.isDefault ? (
                              <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">Principal</span>
                            ) : (
                              <button
                                type="button"
                                className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-bold text-gray-700 transition hover:bg-gray-50"
                                onClick={() => handleSetDefaultCard(card.id)}
                              >
                                Tornar principal
                              </button>
                            )}
                            <button
                              type="button"
                              className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-bold text-red-700 transition hover:bg-red-50"
                              onClick={() => handleRemovePaymentCard(card.id)}
                            >
                              Remover
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {paymentMessage && (
                  <p className="mt-4 rounded-md bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700">{paymentMessage}</p>
                )}

                <button
                  type="button"
                  className="mt-5 h-11 w-full cursor-pointer rounded-md border border-gray-300 bg-white text-sm font-bold text-gray-800 transition hover:bg-gray-50 sm:w-auto sm:px-6"
                  onClick={() => setIsPaymentModalOpen(true)}
                >
                  Adicionar pagamento
                </button>
              </div>
            )}

            {activeStep === "tracking" && (
              <div>
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#fff4c2] text-black">
                    <Truck size={22} aria-hidden="true" />
                  </span>
                  <div>
                    <h2 className="text-xl font-bold text-gray-950">Rastrear compras</h2>
                    <p className="text-sm text-gray-500">Acompanhe os pedidos em andamento.</p>
                  </div>
                </div>

                {isLoadingOrders ? (
                  <p className="mt-6 text-sm text-gray-500">Carregando pedidos...</p>
                ) : ordersError ? (
                  <p className="mt-6 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{ordersError}</p>
                ) : activeOrders.length === 0 ? (
                  <div className="mt-6 rounded-lg border border-dashed border-gray-200 py-10 text-center">
                    <Truck size={32} className="mx-auto text-gray-300" aria-hidden="true" />
                    <p className="mt-3 text-sm font-bold text-gray-500">Nenhum pedido em andamento</p>
                    <p className="mt-1 text-xs text-gray-400">Seus pedidos ativos aparecerão aqui.</p>
                  </div>
                ) : (
                  <div className="mt-6 grid gap-3">
                    {activeOrders.map((order) => (
                      <div key={order.id} className="rounded-lg border border-gray-200 p-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm font-bold text-gray-950">{formatOrderNumber(order.id)}</p>
                            <p className="mt-1 text-sm text-gray-600">{formatOrderItemSummary(order)}</p>
                          </div>
                          <span className="w-fit rounded-full bg-[#fff4c2] px-3 py-1 text-xs font-bold text-gray-900">
                            {orderStatusLabel[order.status]}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeStep === "history" && (
              <div>
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#fff4c2] text-black">
                    <PackageCheck size={22} aria-hidden="true" />
                  </span>
                  <div>
                    <h2 className="text-xl font-bold text-gray-950">Histórico de compras</h2>
                    <p className="text-sm text-gray-500">Consulte pedidos anteriores e valores.</p>
                  </div>
                </div>

                {isLoadingOrders ? (
                  <p className="mt-6 text-sm text-gray-500">Carregando pedidos...</p>
                ) : ordersError ? (
                  <p className="mt-6 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{ordersError}</p>
                ) : orders.length === 0 ? (
                  <div className="mt-6 rounded-lg border border-dashed border-gray-200 py-10 text-center">
                    <PackageCheck size={32} className="mx-auto text-gray-300" aria-hidden="true" />
                    <p className="mt-3 text-sm font-bold text-gray-500">Nenhum pedido encontrado</p>
                    <p className="mt-1 text-xs text-gray-400">Seus pedidos anteriores aparecerão aqui.</p>
                  </div>
                ) : (
                  <div className="mt-6 grid gap-3">
                    {orders.map((order) => {
                      const itemsQuantity = getOrderItemsQuantity(order);

                      return (
                        <div key={order.id} className="rounded-lg border border-gray-200 p-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-bold text-gray-950">{formatOrderNumber(order.id)}</p>
                                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-700">
                                  {orderStatusLabel[order.status]}
                                </span>
                                {itemsQuantity > 0 && (
                                  <span className="rounded-full bg-[#fff4c2] px-2.5 py-1 text-xs font-bold text-gray-900">
                                    {itemsQuantity} {itemsQuantity === 1 ? "item" : "itens"}
                                  </span>
                                )}
                              </div>
                              <p className="mt-1 text-xs text-gray-500">
                                {new Date(order.createdAt).toLocaleDateString("pt-BR")}
                              </p>
                            </div>
                            <div className="shrink-0 text-left sm:text-right">
                              <p className="text-xs font-semibold text-gray-500">Frete {formatCurrency(order.shippingCost ?? 0)}</p>
                              <strong className="text-base text-gray-950">{formatCurrency(order.total)}</strong>
                            </div>
                          </div>

                          {(order.items || []).length > 0 ? (
                            <div className="mt-4 divide-y divide-gray-100 rounded-md border border-gray-100">
                              {(order.items || []).map((item) => (
                                <div key={item.id} className="grid gap-2 p-3 text-sm sm:grid-cols-[1fr_auto_auto_auto] sm:items-center">
                                  <div className="min-w-0">
                                    <p className="font-semibold text-gray-800">{item.productName || item.productId}</p>
                                    {item.variationName && (
                                      <p className="mt-1 text-xs text-gray-500">Variação: {item.variationName}</p>
                                    )}
                                  </div>
                                  <span className="text-gray-500">Qtd. {item.quantity}</span>
                                  <span className="font-bold text-gray-950">{formatCurrency(item.subtotal)}</span>
                                  {canReviewOrder(order) && (
                                    <button
                                      type="button"
                                      className="h-9 rounded-md border border-gray-300 px-3 text-xs font-bold text-gray-800 transition hover:border-[#F5C518] hover:bg-[#fff9df] disabled:pointer-events-none disabled:opacity-50"
                                      disabled={reviewedProductIds.has(item.productId)}
                                      onClick={() => {
                                        if (reviewedProductIds.has(item.productId)) return;
                                        setReviewTarget({
                                          productId: item.productId,
                                          productName: item.productName || item.productId,
                                        });
                                      }}
                                    >
                                      {reviewedProductIds.has(item.productId) ? "Avaliado" : "Avaliar"}
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="mt-3 text-sm font-semibold text-gray-700">{formatOrderItemSummary(order)}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
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
              <button
                type="button"
                className="h-11 cursor-pointer rounded-md bg-[#F5C518] px-6 text-sm font-bold text-black transition hover:bg-[#e6b800] disabled:pointer-events-none disabled:opacity-40"
                disabled={activeIndex === profileSteps.length - 1}
                onClick={goNext}
              >
                Próximo
              </button>
            </div>
          </section>
        </div>

        <aside className="h-fit rounded-lg border border-gray-200 bg-white p-5 shadow-sm lg:sticky lg:top-48">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 shrink-0 text-gray-900" size={20} aria-hidden="true" />
            <div>
              <h2 className="text-lg font-bold text-gray-950">Conta protegida</h2>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                Seus dados ficam salvos para agilizar compras e emissão de notas fiscais.
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 text-sm font-bold text-gray-700">
            <CheckCircle2 size={17} className="text-green-600" aria-hidden="true" />
            Cadastro verificado
          </div>
          <div className="mt-2 flex items-center gap-2 text-sm font-bold text-gray-700">
            <ShieldCheck size={17} className={profile.mfaEnabled ? "text-green-600" : "text-gray-400"} aria-hidden="true" />
            2 etapas {profile.mfaEnabled ? "ativa" : "desativada"}
          </div>
          {defaultAddressId && (
            <div className="mt-2 flex items-center gap-2 text-sm font-bold text-gray-700">
              <MapPin size={17} className="text-gray-900" aria-hidden="true" />
              Endereço principal salvo
            </div>
          )}
        </aside>
      </div>
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSave={handleSavePaymentCard}
      />
      {isMfaModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 h-full w-full cursor-pointer bg-black/45"
            aria-label="Fechar verificação em duas etapas"
            onClick={() => setIsMfaModalOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-lg bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-gray-950">Ativar verificação 2 etapas</h2>
                <p className="mt-0.5 text-sm text-gray-500">Cole o código enviado para {mfaSetupEmail}.</p>
              </div>
              <button
                type="button"
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-md text-gray-600 transition hover:bg-gray-100 hover:text-black"
                aria-label="Fechar"
                onClick={() => setIsMfaModalOpen(false)}
              >
                <X size={22} aria-hidden="true" />
              </button>
            </div>
            <div className="grid gap-4 p-5">
              <label>
                <span className="mb-1.5 block text-sm font-bold text-gray-800">Código 2 etapas</span>
                <span className="flex h-11 items-center rounded-md border border-gray-300 bg-white px-3 focus-within:border-[#F5C518]">
                  <KeyRound size={18} className="mr-2 shrink-0 text-gray-500" aria-hidden="true" />
                  <input
                    value={mfaSetupCode}
                    onChange={(event) => setMfaSetupCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="min-w-0 flex-1 border-0 bg-transparent text-sm outline-none"
                    placeholder="000000"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                  />
                </span>
              </label>
              {securityMessage && <p className="text-sm font-semibold text-red-700">{securityMessage}</p>}
              <button
                type="button"
                className="h-11 cursor-pointer rounded-md bg-[#F5C518] px-5 text-sm font-bold text-black transition hover:bg-[#e6b800] disabled:pointer-events-none disabled:opacity-60"
                disabled={isSavingMfa}
                onClick={() => { void handleVerifyMfaSetup(); }}
              >
                {isSavingMfa ? "Verificando..." : "Ativar verificação"}
              </button>
            </div>
          </div>
        </div>
      )}
      <ReviewModal
        target={reviewTarget}
        onClose={() => setReviewTarget(null)}
        onPublished={() => {
          if (!reviewTarget) return;
          setReviewedProductIds((current) => new Set([...current, reviewTarget.productId]));
        }}
      />
    </div>
  );
}

import { useEffect, useState } from "react";
import { CalendarDays, Package, ReceiptText, Star, Truck, X } from "lucide-react";
import { customerOrdersService } from "../admin/services/customer-orders.service";
import { type Pedido, type PedidoDetalhe, type PedidoStatus } from "../admin/services/pedido.service";
import { avaliacaoService } from "../admin/services/avaliacao.service";
import { clearPublicCatalogCache } from "../admin/services/produto.service";

const statusLabel: Record<PedidoStatus, string> = {
  PENDING_PAYMENT: "Aguardando pagamento",
  PAID: "Pago",
  SHIPPED: "Enviado",
  DELIVERED: "Entregue",
  CANCELLED: "Cancelado",
  REFUNDED: "Reembolsado",
};

const statusColor: Record<PedidoStatus, string> = {
  PENDING_PAYMENT: "bg-amber-50 text-amber-700",
  PAID: "bg-emerald-50 text-emerald-700",
  SHIPPED: "bg-blue-50 text-blue-700",
  DELIVERED: "bg-teal-50 text-teal-700",
  CANCELLED: "bg-red-50 text-red-600",
  REFUNDED: "bg-slate-100 text-slate-600",
};

function currency(value: number) {
  return (Number.isFinite(value) ? value : 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function orderNumber(id: string) {
  return `#${id.slice(-6).toUpperCase()}`;
}

function orderMainItem(order: Pedido) {
  const firstItem = order.items?.[0];
  if (!firstItem) return "Pedido Tinpavi";
  const extraItems = (order.items?.length ?? 0) - 1;
  return extraItems > 0 ? `${firstItem.productName || firstItem.productId} +${extraItems}` : firstItem.productName || firstItem.productId;
}

type ReviewTarget = {
  productId: string;
  productName: string;
};

function canReviewOrder(order: Pedido) {
  return order.paymentStatus === "PAID" || ["PAID", "SHIPPED", "DELIVERED"].includes(order.status);
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
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!target) return;
    setRating(5);
    setComment("");
    setMessage("");
  }, [target]);

  if (!target) return null;

  async function submitReview() {
    if (!target) return;
    if (message === "Você já avaliou este produto.") return;
    try {
      setIsSubmitting(true);
      setMessage("");
      await avaliacaoService.createForProduct(target.productId, {
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
      <button type="button" className="absolute inset-0 h-full w-full cursor-pointer bg-black/45" aria-label="Fechar avaliação" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-lg bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-gray-950">Avaliar produto</h2>
            <p className="mt-0.5 text-sm text-gray-500">{target.productName}</p>
          </div>
          <button type="button" className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-md text-gray-600 transition hover:bg-gray-100 hover:text-black" aria-label="Fechar avaliação" onClick={onClose}>
            <X size={22} aria-hidden="true" />
          </button>
        </div>
        <div className="grid gap-4 p-5">
          <div>
            <span className="mb-2 block text-sm font-bold text-gray-800">Nota</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <button key={value} type="button" className="cursor-pointer p-1 text-[#F5C518]" aria-label={`${value} estrelas`} onClick={() => setRating(value)}>
                  <Star size={28} fill={value <= rating ? "currentColor" : "none"} aria-hidden="true" />
                </button>
              ))}
            </div>
          </div>
          <label>
            <span className="mb-1.5 block text-sm font-bold text-gray-800">Comentário</span>
            <textarea value={comment} onChange={(event) => setComment(event.target.value)} maxLength={500} rows={4} className="w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#F5C518]" placeholder="Conte como foi sua experiência com o produto" />
          </label>
          {message && <p className="text-sm font-bold text-gray-700">{message}</p>}
          <button type="button" className="h-11 cursor-pointer rounded-md bg-[#F5C518] px-5 text-sm font-bold text-black transition hover:bg-[#e6b800] disabled:pointer-events-none disabled:opacity-60" disabled={isSubmitting || message === "Você já avaliou este produto."} onClick={() => void submitReview()}>
            {isSubmitting ? "Publicando..." : "Publicar avaliação"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function OrdersPage() {
  const [orders, setOrders] = useState<Pedido[]>([]);
  const [selected, setSelected] = useState<PedidoDetalhe | null>(null);
  const [reviewTarget, setReviewTarget] = useState<ReviewTarget | null>(null);
  const [reviewedProductIds, setReviewedProductIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function syncReviewedProducts(nextOrders: Pedido[]) {
    const paidProductIds = Array.from(
      new Set(
        nextOrders
          .filter(canReviewOrder)
          .flatMap((order) => order.items || [])
          .map((item) => item.productId)
          .filter(Boolean),
      ),
    );

    const results = await Promise.allSettled(
      paidProductIds.map(async (productId) => ({
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

    async function loadOrders() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await customerOrdersService.list();
        if (!isMounted) return;
        setOrders(response.items);
        void syncReviewedProducts(response.items);
      } catch (err) {
        const status = (err as { response?: { status?: number } }).response?.status;
        if (status === 401) {
          window.location.href = "/signin";
          return;
        }
        if (isMounted) setError("Não foi possível carregar seus pedidos agora.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void loadOrders();
    return () => {
      isMounted = false;
    };
  }, []);

  async function openOrder(order: Pedido) {
    setSelected(order as PedidoDetalhe);
    try {
      const detail = await customerOrdersService.getById(order.id);
      setSelected(detail);
      void syncReviewedProducts([detail]);
    } catch {
      setSelected(order as PedidoDetalhe);
    }
  }

  return (
    <div className="bg-gray-50">
      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-8xl px-4 py-8">
          <p className="text-xs font-black uppercase text-[#ffa201]" style={{ fontWeight: "bold", color: "#ffa201" }}>
            Minha conta
          </p>
          <h1 className="mt-2 text-3xl font-bold text-gray-950">Meus pedidos</h1>
        </div>
      </section>

      <div className="mx-auto grid max-w-8xl gap-4 px-3 py-6 sm:px-4 sm:py-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-6">
        <section className="min-w-0 rounded-lg border border-gray-200 bg-white p-3 shadow-sm sm:p-5">
          {isLoading ? (
            <p className="text-sm text-gray-500">Carregando pedidos...</p>
          ) : error ? (
            <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>
          ) : orders.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-200 py-12 text-center">
              <Package className="mx-auto text-gray-300" size={34} />
              <p className="mt-3 text-sm font-bold text-gray-600">Nenhum pedido encontrado</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {orders.map((order) => (
                <button
                  key={order.id}
                  type="button"
                  onClick={() => void openOrder(order)}
                  className={`w-full min-w-0 cursor-pointer rounded-lg border p-3 text-left transition sm:p-4 ${
                    selected?.id === order.id ? "border-[#F5C518] bg-[#fff9df]" : "border-gray-200 bg-white hover:border-[#F5C518]"
                  }`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="shrink-0 font-bold text-gray-950">{orderNumber(order.id)}</span>
                        <span className={`max-w-full rounded-full px-2.5 py-1 text-xs font-bold leading-tight ${statusColor[order.status]}`}>
                          {statusLabel[order.status]}
                        </span>
                      </div>
                      <p className="mt-2 line-clamp-2 overflow-hidden text-sm font-semibold text-gray-700">{orderMainItem(order)}</p>
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
                        <CalendarDays size={13} aria-hidden="true" />
                        {new Date(order.createdAt).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <strong className="shrink-0 text-base text-gray-950 sm:text-right">{currency(order.total)}</strong>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        <aside className="min-w-0 h-fit rounded-lg border border-gray-200 bg-white p-3 shadow-sm sm:p-5 lg:sticky lg:top-32">
          <h2 className="text-lg font-bold text-gray-950">Detalhes</h2>
          {!selected ? (
            <p className="mt-3 text-sm text-gray-500">Selecione um pedido para ver os itens comprados.</p>
          ) : (
            <div className="mt-5 space-y-5">
              <div>
                <p className="text-sm font-bold text-gray-950">{orderNumber(selected.id)}</p>
                <p className="mt-1 text-sm text-gray-500">{statusLabel[selected.status]}</p>
              </div>

              <div>
                <div className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase text-gray-500">
                  <Package size={13} /> Itens comprados
                </div>
                <div className="divide-y divide-gray-100 rounded-lg border border-gray-200">
                  {(selected.items || []).map((item) => (
                    <div key={item.id} className="p-3 text-sm">
                      <p className="break-words font-bold text-gray-950">{item.productName || item.productId}</p>
                      {item.variationName && (
                        <p className="mt-1 text-xs text-gray-500">Variação: {item.variationName}</p>
                      )}
                      <div className="mt-2 flex flex-col gap-2 text-gray-500 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                        <span>{item.productCode ? `${item.productCode} · ` : ""}Qtd. {item.quantity}</span>
                        <div className="flex shrink-0 items-center gap-2 sm:justify-end">
                          <span className="font-bold text-gray-950 sm:text-right">{currency(item.subtotal)}</span>
                          {canReviewOrder(selected) && (
                            <button
                              type="button"
                              className="inline-flex h-9 cursor-pointer items-center justify-center rounded-md border border-[#F5C518] px-3 text-xs font-bold text-gray-950 transition hover:bg-[#F5C518] disabled:cursor-not-allowed disabled:opacity-60"
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
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg bg-gray-50 p-3 text-sm">
                <div className="flex items-center gap-2 font-bold text-gray-950">
                  <Truck size={16} /> Entrega
                </div>
                <p className="mt-2 text-gray-600">A equipe Tinpavi acompanha o envio pelo status do pedido.</p>
              </div>

              <div className="space-y-2 border-t border-gray-200 pt-4 text-sm">
                <div className="flex flex-wrap justify-between gap-3 text-gray-600">
                  <span>Frete</span>
                  <span className="font-bold text-gray-950">{currency(selected.shippingCost ?? 0)}</span>
                </div>
              </div>

              <div className="flex flex-wrap justify-between gap-3 border-t border-gray-200 pt-4 text-base font-bold">
                <span>Total</span>
                <span>{currency(selected.total)}</span>
              </div>
            </div>
          )}
        </aside>
      </div>
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

// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CheckoutPage } from "../CheckoutPage";

const {
  mockRestoreSession,
  mockListAddresses,
  mockCreateAddress,
  mockGetCart,
  mockClearCart,
  mockClearCartCache,
  mockQuoteShipping,
  mockCreateOrder,
} = vi.hoisted(() => ({
  mockRestoreSession: vi.fn(),
  mockListAddresses: vi.fn(),
  mockCreateAddress: vi.fn(),
  mockGetCart: vi.fn(),
  mockClearCart: vi.fn(),
  mockClearCartCache: vi.fn(),
  mockQuoteShipping: vi.fn(),
  mockCreateOrder: vi.fn(),
}));

vi.mock("../../admin/services/customer-auth.service", () => ({
  customerAuthService: {
    restoreSession: mockRestoreSession,
    listAddresses: mockListAddresses,
    createAddress: mockCreateAddress,
  },
}));

vi.mock("../../admin/services/cart.service", () => ({
  cartService: {
    get: mockGetCart,
    clear: mockClearCart,
    clearCache: mockClearCartCache,
  },
}));

vi.mock("../../admin/services/checkout.service", () => ({
  checkoutService: {
    quoteShipping: mockQuoteShipping,
    createOrder: mockCreateOrder,
  },
}));

const filledCart = {
  id: "cart-1",
  itemCount: 2,
  subtotal: 199.8,
  items: [
    {
      productId: "prod-real-1",
      name: "Cone refletivo real",
      code: "CON-75",
      quantity: 2,
      unitPrice: 99.9,
      pixPrice: 94.9,
      total: 199.8,
      image: null,
      stock: 10,
    },
  ],
};

describe("CheckoutPage addresses", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    window.history.pushState({}, "", "/checkout");
    window.scrollTo = vi.fn();

    mockRestoreSession.mockResolvedValue({
      id: "customer-1",
      name: "Cliente",
      email: "cliente@site.com",
    });
    mockCreateAddress.mockResolvedValue({
      id: "addr-created",
      zipCode: "01310100",
      street: "Av. Paulista",
      number: "1000",
      complement: null,
      district: "Bela Vista",
      city: "Sao Paulo",
      state: "SP",
      country: "BR",
      isDefault: true,
    });
    mockGetCart.mockResolvedValue(filledCart);
    mockClearCart.mockResolvedValue({
      id: "cart-1",
      itemCount: 0,
      subtotal: 0,
      items: [],
    });
    mockQuoteShipping.mockResolvedValue({
      source: "fallback",
      options: [{ quoteId: "quote-1", carrier: "Manual", service: "Entrega", price: 39.9, estimatedDays: 5 }],
    });
    mockCreateOrder.mockResolvedValue({
      id: "order-1",
      status: "PENDING_PAYMENT",
      paymentStatus: "PENDING",
      totalAmount: 264.6,
    });
  });

  it("shows empty state when customer has no addresses", async () => {
    mockListAddresses.mockResolvedValue([]);

    render(<CheckoutPage />);

    expect(await screen.findByText("Você ainda não possui endereços cadastrados.")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Cadastrar endereço no perfil" })).toBeTruthy();
    expect(screen.queryByText("Tinpavi Engenharia")).toBeNull();
  });

  it("loads checkout products from the authenticated cart", async () => {
    mockListAddresses.mockResolvedValue([
      {
        id: "addr-1",
        zipCode: "01310100",
        street: "Av. Paulista",
        number: "1000",
        complement: null,
        district: "Bela Vista",
        city: "São Paulo",
        state: "SP",
        country: "BR",
        isDefault: true,
      },
    ]);

    render(<CheckoutPage />);

    await screen.findByText("Av. Paulista, 1000");
    expect(mockGetCart).toHaveBeenCalledWith({ forceRefresh: true });

    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));

    expect(await screen.findByText("Cone refletivo real")).toBeTruthy();
    expect(screen.getByText("CON-75")).toBeTruthy();
    expect(screen.getByText("Qtd. 2")).toBeTruthy();
    expect(screen.getAllByText("R$ 199,80").length).toBeGreaterThan(0);
    expect(screen.queryByText(/Placa de sinalização Pare R-1/i)).toBeNull();
  });

  it("blocks checkout progress when the authenticated cart is empty", async () => {
    mockGetCart.mockResolvedValueOnce({
      id: "cart-empty",
      itemCount: 0,
      subtotal: 0,
      items: [],
    });
    mockListAddresses.mockResolvedValue([
      {
        id: "addr-1",
        zipCode: "01310100",
        street: "Av. Paulista",
        number: "1000",
        complement: null,
        district: "Bela Vista",
        city: "São Paulo",
        state: "SP",
        country: "BR",
        isDefault: true,
      },
    ]);

    render(<CheckoutPage />);

    expect(await screen.findByText("Seu carrinho está vazio.")).toBeTruthy();
    const continueButton = screen.getByRole("button", { name: "Continuar" });
    expect((continueButton as HTMLButtonElement).disabled).toBe(true);
  });

  it("renders one address and keeps it selected as default", async () => {
    mockListAddresses.mockResolvedValue([
      {
        id: "addr-1",
        zipCode: "01310100",
        street: "Av. Paulista",
        number: "1000",
        complement: "Conjunto 1",
        district: "Bela Vista",
        city: "São Paulo",
        state: "SP",
        country: "BR",
        isDefault: true,
      },
    ]);

    render(<CheckoutPage />);

    expect(await screen.findByText("Endereço principal")).toBeTruthy();
    expect(screen.getByText("Av. Paulista, 1000 - Conjunto 1")).toBeTruthy();
    expect(screen.getByText("Bela Vista - São Paulo - SP - 01310-100")).toBeTruthy();

    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(1);
    expect((radios[0] as HTMLInputElement).checked).toBe(true);
  });

  it("renders multiple addresses and selects the default one", async () => {
    mockListAddresses.mockResolvedValue([
      {
        id: "addr-1",
        zipCode: "02010000",
        street: "Rua A",
        number: "10",
        complement: null,
        district: "Santana",
        city: "São Paulo",
        state: "SP",
        country: "BR",
        isDefault: false,
      },
      {
        id: "addr-2",
        zipCode: "01310100",
        street: "Av. Paulista",
        number: "1000",
        complement: null,
        district: "Bela Vista",
        city: "São Paulo",
        state: "SP",
        country: "BR",
        isDefault: true,
      },
    ]);

    render(<CheckoutPage />);

    await screen.findByText("Endereço principal");
    expect(screen.getByText("Rua A, 10")).toBeTruthy();
    expect(screen.getByText("Av. Paulista, 1000")).toBeTruthy();

    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(2);
    expect((radios[0] as HTMLInputElement).checked).toBe(false);
    expect((radios[1] as HTMLInputElement).checked).toBe(true);
  });

  it("shows retry state when addresses endpoint is rate limited", async () => {
    mockListAddresses.mockRejectedValueOnce({ response: { status: 429 } });

    render(<CheckoutPage />);

    expect(await screen.findByText(/Muitas requisições ao carregar seus endereços/i)).toBeTruthy();
    const retryButton = screen.getByRole("button", { name: "Tentar novamente" });
    expect(retryButton).toBeTruthy();

    mockListAddresses.mockResolvedValueOnce([]);
    retryButton.click();

    await waitFor(() => {
      expect(mockListAddresses).toHaveBeenCalledTimes(2);
    });
  });

  it("blocks continue in new mode until required address fields are valid", async () => {
    mockListAddresses.mockResolvedValue([]);

    render(<CheckoutPage />);

    expect(await screen.findByText("Você ainda não possui endereços cadastrados.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Novo" }));

    const continueButton = screen.getByRole("button", { name: "Continuar" });
    expect((continueButton as HTMLButtonElement).disabled).toBe(true);

    fireEvent.change(screen.getByLabelText(/CEP/i), { target: { value: "01310100" } });
    fireEvent.change(screen.getByLabelText(/Rua/i), { target: { value: "Av. Paulista" } });
    fireEvent.change(screen.getByLabelText(/Numero/i), { target: { value: "1000" } });
    fireEvent.change(screen.getByLabelText(/Bairro/i), { target: { value: "Bela Vista" } });
    fireEvent.change(screen.getByLabelText(/Cidade/i), { target: { value: "Sao Paulo" } });
    fireEvent.change(screen.getByLabelText(/UF/i), { target: { value: "SP" } });

    expect((continueButton as HTMLButtonElement).disabled).toBe(false);
  });

  it("allows disabling address persistence for new address", async () => {
    mockListAddresses.mockResolvedValue([]);

    render(<CheckoutPage />);

    expect(await screen.findByText("Você ainda não possui endereços cadastrados.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Novo" }));

    const persistCheckbox = screen.getByRole("checkbox", { name: "Salvar para próximas compras" });
    expect((persistCheckbox as HTMLInputElement).checked).toBe(true);

    fireEvent.click(persistCheckbox);
    expect((persistCheckbox as HTMLInputElement).checked).toBe(false);
    expect(screen.getByText("Este endereço será usado apenas neste pedido.")).toBeTruthy();
  });

  it("saves a new checkout address as default before continuing", async () => {
    mockListAddresses.mockResolvedValue([]);

    render(<CheckoutPage />);

    expect(await screen.findByText("Você ainda não possui endereços cadastrados.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Novo" }));

    fireEvent.change(screen.getByLabelText(/CEP/i), { target: { value: "01310-100" } });
    fireEvent.change(screen.getByLabelText(/Rua/i), { target: { value: "Av. Paulista" } });
    fireEvent.change(screen.getByLabelText(/Numero/i), { target: { value: "1000" } });
    fireEvent.change(screen.getByLabelText(/Bairro/i), { target: { value: "Bela Vista" } });
    fireEvent.change(screen.getByLabelText(/Cidade/i), { target: { value: "Sao Paulo" } });
    fireEvent.change(screen.getByLabelText(/UF/i), { target: { value: "sp" } });

    fireEvent.click(screen.getByRole("checkbox", { name: "Definir este endereço como principal" }));
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));

    await waitFor(() => {
      expect(mockCreateAddress).toHaveBeenCalledWith({
        zipCode: "01310100",
        street: "Av. Paulista",
        number: "1000",
        district: "Bela Vista",
        city: "Sao Paulo",
        state: "SP",
        country: "BR",
        isDefault: true,
      });
    });
    expect(await screen.findByText("Revisão da compra")).toBeTruthy();
  });

  it("creates an order for the admin when confirming checkout", async () => {
    mockListAddresses.mockResolvedValue([
      {
        id: "addr-1",
        zipCode: "01310100",
        street: "Av. Paulista",
        number: "1000",
        complement: null,
        district: "Bela Vista",
        city: "São Paulo",
        state: "SP",
        country: "BR",
        isDefault: true,
      },
    ]);

    render(<CheckoutPage />);

    await screen.findByText("Av. Paulista, 1000");
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    expect(await screen.findByText("Revisão da compra")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    expect(await screen.findByText("Método de pagamento")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Confirmar pedido" }));

    await waitFor(() => {
      expect(mockQuoteShipping).toHaveBeenCalledWith({
        shippingAddressId: "addr-1",
        items: [{ productId: "prod-real-1", quantity: 2 }],
      });
      expect(mockCreateOrder).toHaveBeenCalledWith({
        shippingAddressId: "addr-1",
        items: [{ productId: "prod-real-1", quantity: 2 }],
        quoteId: "quote-1",
      });
    });
    expect(await screen.findByText("Pedido enviado com sucesso")).toBeTruthy();
    expect(screen.getByText("order-1")).toBeTruthy();
    expect(mockClearCart).toHaveBeenCalled();
  });
});

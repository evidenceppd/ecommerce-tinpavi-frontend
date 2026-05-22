// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, beforeEach, vi } from "vitest";
import { ProductPage } from "../ProductPage";

const { mockGetPublicByCode, mockListPublic, mockAddItem, mockTrack } = vi.hoisted(() => ({
  mockGetPublicByCode: vi.fn(),
  mockListPublic: vi.fn(),
  mockAddItem: vi.fn(),
  mockTrack: vi.fn(),
}));

vi.mock("../BlogSection", () => ({
  BlogSection: () => null,
}));

vi.mock("../ImageZoom", () => ({
  ImageZoom: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

vi.mock("../../admin/services/produto.service", () => ({
  produtoService: {
    getPublicByCode: mockGetPublicByCode,
    listPublic: mockListPublic,
  },
}));

vi.mock("../../admin/services/cart.service", () => ({
  cartService: {
    addItem: mockAddItem,
  },
}));

vi.mock("../../admin/services/analytics.service", () => ({
  analyticsService: {
    track: mockTrack,
  },
}));

describe("ProductPage variants", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    window.history.pushState({}, "", "/produto/ABCDEF12");

    mockGetPublicByCode.mockResolvedValue({
      id: "prod-1",
      name: "Produto com variante",
      slug: "produto-com-variante",
      sku: "ABCDEF12",
      price: 100,
      stock: 12,
      isActive: true,
      bullets: [],
      galleryImages: [],
      faqs: [],
      usageAreas: [],
      variants: [
        {
          id: "v1",
          sku: "VERM-P",
          stock: 3,
          priceAdjustment: 20,
          attributes: { cor: "vermelho" },
          isActive: true,
          position: 1,
        },
      ],
    });

    mockListPublic.mockResolvedValue({ items: [], total: 0 });
    mockAddItem.mockResolvedValue({ id: "cart-1", items: [], itemCount: 0, subtotal: 0 });
    mockTrack.mockResolvedValue({ id: 1, counted: true });
  });

  it("tracks product page visits for admin analytics", async () => {
    render(<ProductPage />);

    await screen.findByRole("heading", { name: "Produto com variante" });

    expect(mockTrack).toHaveBeenCalledWith({
      page: "/produto/produto-com-variante",
      referrer: "",
      title: "Produto com variante",
    });
  });

  it("requires variant selection before add to cart and updates price after selection", async () => {
    render(<ProductPage />);

    await screen.findByRole("heading", { name: "Produto com variante" });

    fireEvent.click(screen.getByLabelText("Adicionar ao carrinho"));

    expect(await screen.findByText("Selecione uma variante antes de adicionar ao carrinho.")).toBeTruthy();
    expect(mockAddItem).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /cor: vermelho/i }));

    await waitFor(() => {
      expect(screen.getByText(/120,00/)).toBeTruthy();
    });

    fireEvent.click(screen.getByLabelText("Adicionar ao carrinho"));

    await waitFor(() => {
      expect(mockAddItem).toHaveBeenCalledWith("prod-1", 1, "v1", expect.objectContaining({
        name: "Produto com variante",
        unitPrice: 120,
        variantName: "cor: vermelho",
      }));
    });
  });

  it("deselects variant when clicking selected option again", async () => {
    render(<ProductPage />);

    await screen.findByRole("heading", { name: "Produto com variante" });

    const variantButton = screen.getByRole("button", { name: /cor: vermelho/i });
    fireEvent.click(variantButton);

    await waitFor(() => {
      expect(screen.getByText(/120,00/)).toBeTruthy();
    });

    fireEvent.click(variantButton);

    await waitFor(() => {
      expect(screen.getByText(/100,00/)).toBeTruthy();
    });

    fireEvent.click(screen.getByLabelText("Adicionar ao carrinho"));

    expect(await screen.findByText("Selecione uma variante antes de adicionar ao carrinho.")).toBeTruthy();
    expect(mockAddItem).not.toHaveBeenCalled();
  });

  it("shows rate limit message instead of product-not-found when product request returns 429", async () => {
    mockGetPublicByCode.mockRejectedValueOnce({ response: { status: 429 } });

    render(<ProductPage />);

    expect(await screen.findByText(/Muitas requisições no momento/i)).toBeTruthy();
    expect(screen.queryByText("Produto não encontrado.")).toBeNull();
  });

  it("keeps product page rendered when related product requests fail", async () => {
    mockListPublic.mockRejectedValue({ response: { status: 429 } });

    render(<ProductPage />);

    expect(await screen.findByRole("heading", { name: "Produto com variante" })).toBeTruthy();
    expect(screen.getAllByText("Escolha a variante").length).toBeGreaterThan(0);
  });
});

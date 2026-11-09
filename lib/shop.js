// Regras da loja: produtos, preços, frete, pedidos e Mercado Pago.
import crypto from "node:crypto";
import * as store from "./store.js";
import { httpError } from "./http.js";

export const CATEGORIES = ["meias", "quadros", "almofadas"];
export const ORDER_STATUSES = {
  aguardando_pagamento: "Aguardando pagamento",
  pago: "Pago",
  em_preparacao: "Em preparação",
  enviado: "Enviado",
  entregue: "Entregue",
  pagamento_recusado: "Pagamento recusado",
  cancelado: "Cancelado"
};
const PAID_STATES = ["pago", "em_preparacao", "enviado", "entregue"];

const str = (v, max = 200) => String(v == null ? "" : v).trim().slice(0, max);
const int = (v) => { const n = Math.round(Number(v)); return Number.isFinite(n) && n >= 0 ? n : 0; };

export function slugify(s) {
  return str(s, 80).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "item";
}

// ---------- produtos ----------
export function normalizeProduct(input, existing) {
  const name = str(input.name, 120);
  if (!name) throw httpError(400, "Informe o nome do produto.");
  const category = CATEGORIES.includes(input.category) ? input.category : null;
  if (!category) throw httpError(400, "Escolha uma categoria válida.");
  const price = int(input.price);
  if (!price) throw httpError(400, "Informe o preço do produto.");
  let variants = Array.isArray(input.variants) ? input.variants : [];
  variants = variants
    .map((v) => ({ name: str(v.name, 60) || "Único", stock: int(v.stock) }))
    .filter((v, i, a) => a.findIndex((x) => x.name === v.name) === i);
  if (!variants.length) variants = [{ name: "Único", stock: 0 }];
  const now = new Date().toISOString();
  return {
    id: existing ? existing.id : str(input.id, 80) || slugify(name) + "-" + crypto.randomBytes(2).toString("hex"),
    name,
    category,
    collection: str(input.collection, 80),
    price,
    description: str(input.description, 2000),
    care: str(input.care, 1000),
    images: (Array.isArray(input.images) ? input.images : []).map((u) => str(u, 500)).filter(Boolean).slice(0, 12),
    variants,
    active: input.active !== false,
    featured: !!input.featured,
    createdAt: existing ? existing.createdAt : now,
    updatedAt: now
  };
}

export function publicProduct(p) {
  return {
    id: p.id, name: p.name, category: p.category, collection: p.collection, price: p.price,
    description: p.description, care: p.care, images: p.images, featured: p.featured,
    variants: p.variants.map((v) => ({ name: v.name, available: v.stock > 0, stock: Math.min(v.stock, 10) }))
  };
}

export function normalizeCollection(input, existing) {
  const name = str(input.name, 80);
  if (!name) throw httpError(400, "Informe o nome da coleção.");
  return {
    id: existing ? existing.id : slugify(name),
    name,
    description: str(input.description, 500),
    image: str(input.image, 500),
    order: int(input.order)
  };
}

// ---------- preço e frete ----------
export function shippingOptions(subtotal, settings) {
  const opts = [];
  const free = settings.freeShippingAbove > 0 && subtotal >= settings.freeShippingAbove;
  opts.push({ id: "entrega", label: free ? "Entrega em casa — frete grátis" : "Entrega em casa", price: free ? 0 : settings.shippingFlat });
  if (settings.pickupEnabled) opts.push({ id: "retirada", label: settings.pickupLabel || "Retirada em mãos", price: 0 });
  return opts;
}

// Recalcula tudo no servidor: nunca confia em preços enviados pelo navegador.
export async function priceCart(items, shippingId) {
  const settings = await store.getSettings();
  if (!Array.isArray(items) || !items.length) throw httpError(400, "Seu carrinho está vazio.");
  if (items.length > 50) throw httpError(400, "Carrinho muito grande.");
  const lines = [];
  for (const it of items) {
    const p = await store.get("products", str(it.id, 120));
    const qty = int(it.qty);
    if (!p || !p.active || !qty) throw httpError(409, "Um item do carrinho não está mais disponível. Revise seu carrinho.");
    const v = p.variants.find((x) => x.name === str(it.variant, 60)) || (p.variants.length === 1 ? p.variants[0] : null);
    if (!v) throw httpError(409, `Escolha uma opção para "${p.name}".`);
    const already = lines.filter((l) => l.productId === p.id && l.variant === v.name).reduce((s, l) => s + l.qty, 0);
    if (v.stock < qty + already) {
      throw httpError(409, v.stock > 0
        ? `Temos apenas ${v.stock} unidade(s) de "${p.name}${v.name !== "Único" ? " — " + v.name : ""}".`
        : `"${p.name}${v.name !== "Único" ? " — " + v.name : ""}" esgotou.`);
    }
    lines.push({ productId: p.id, name: p.name, variant: v.name, qty, unitPrice: p.price, image: (p.images || [])[0] || "" });
  }
  const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.qty, 0);
  const options = shippingOptions(subtotal, settings);
  const shipping = options.find((o) => o.id === shippingId) || options[0];
  return { lines, subtotal, shipping, total: subtotal + shipping.price, settings, options };
}

// ---------- validação de cliente ----------
export function validCPF(cpf) {
  const d = String(cpf).replace(/\D/g, "");
  if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false;
  for (const t of [9, 10]) {
    let s = 0;
    for (let i = 0; i < t; i++) s += Number(d[i]) * (t + 1 - i);
    const r = ((s * 10) % 11) % 10;
    if (r !== Number(d[t])) return false;
  }
  return true;
}

export function normalizeCustomer(c, needsAddress) {
  const out = {
    name: str(c.name, 120),
    email: str(c.email, 160).toLowerCase(),
    phone: str(c.phone, 20).replace(/\D/g, ""),
    cpf: str(c.cpf, 14).replace(/\D/g, ""),
    address: null
  };
  if (out.name.split(/\s+/).length < 2) throw httpError(400, "Informe seu nome completo.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(out.email)) throw httpError(400, "Informe um e-mail válido.");
  if (out.phone.length < 10) throw httpError(400, "Informe um telefone com DDD.");
  if (!validCPF(out.cpf)) throw httpError(400, "Informe um CPF válido.");
  if (needsAddress) {
    const a = c.address || {};
    out.address = {
      cep: str(a.cep, 9).replace(/\D/g, ""),
      street: str(a.street, 160), number: str(a.number, 20), complement: str(a.complement, 80),
      district: str(a.district, 80), city: str(a.city, 80), state: str(a.state, 2).toUpperCase()
    };
    const A = out.address;
    if (A.cep.length !== 8) throw httpError(400, "Informe um CEP válido.");
    if (!A.street || !A.number || !A.district || !A.city || !/^[A-Z]{2}$/.test(A.state)) {
      throw httpError(400, "Preencha o endereço completo de entrega.");
    }
  }
  return out;
}

export function newOrderId() {
  const d = new Date();
  const ymd = d.toISOString().slice(2, 10).replace(/-/g, "");
  return "DL" + ymd + "-" + crypto.randomBytes(3).toString("hex").toUpperCase();
}

export function publicOrder(o) {
  return {
    id: o.id, status: o.status, statusLabel: ORDER_STATUSES[o.status] || o.status,
    createdAt: o.createdAt, lines: o.lines, subtotal: o.subtotal, shipping: o.shipping, total: o.total,
    trackingCode: o.trackingCode || "", firstName: (o.customer.name || "").split(" ")[0]
  };
}

// ---------- estoque ----------
async function adjustStock(order, sign) {
  for (const l of order.lines) {
    const p = await store.get("products", l.productId);
    if (!p) continue;
    const v = p.variants.find((x) => x.name === l.variant);
    if (!v) continue;
    v.stock = Math.max(0, v.stock + sign * l.qty);
    p.updatedAt = new Date().toISOString();
    await store.put("products", p);
  }
}

// Atualiza o status do pedido e mantém o estoque coerente.
export async function setOrderStatus(order, status, note) {
  const wasPaid = order.stockDeducted;
  const nowPaid = PAID_STATES.includes(status);
  if (nowPaid && !wasPaid) { await adjustStock(order, -1); order.stockDeducted = true; }
  if (status === "cancelado" && wasPaid) { await adjustStock(order, +1); order.stockDeducted = false; }
  if (order.status !== status) {
    order.history = order.history || [];
    order.history.push({ at: new Date().toISOString(), status, note: note || "" });
  }
  order.status = status;
  order.updatedAt = new Date().toISOString();
  await store.put("orders", order);
  return order;
}

// ---------- Mercado Pago ----------
function mpToken() {
  const t = process.env.MP_ACCESS_TOKEN;
  if (!t) throw httpError(503, "Pagamentos ainda não configurados. Fale com a gente pelo WhatsApp para concluir seu pedido.");
  return t;
}

export async function createPreference(order, base) {
  const items = order.lines.map((l) => ({
    id: l.productId,
    title: l.name + (l.variant !== "Único" ? " — " + l.variant : ""),
    quantity: l.qty,
    unit_price: l.unitPrice / 100,
    currency_id: "BRL"
  }));
  if (order.shipping.price > 0) {
    items.push({ id: "frete", title: "Frete", quantity: 1, unit_price: order.shipping.price / 100, currency_id: "BRL" });
  }
  const [first, ...rest] = order.customer.name.split(" ");
  const back = `${base}/pedido?id=${order.id}&t=${order.accessToken}`;
  const body = {
    items,
    external_reference: order.id,
    payer: {
      name: first, surname: rest.join(" "), email: order.customer.email,
      identification: { type: "CPF", number: order.customer.cpf },
      phone: { area_code: order.customer.phone.slice(0, 2), number: order.customer.phone.slice(2) }
    },
    back_urls: { success: back, pending: back, failure: back },
    auto_return: "approved",
    statement_descriptor: "DECALECA",
    payment_methods: { installments: Math.max(1, Math.min(12, order.maxInstallments || 1)) },
    metadata: { order_id: order.id }
  };
  if (base.startsWith("https://")) body.notification_url = `${base}/api/mp-webhook`;
  const r = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: { Authorization: "Bearer " + mpToken(), "Content-Type": "application/json", "X-Idempotency-Key": order.id },
    body: JSON.stringify(body)
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok || !data.init_point) {
    console.error("Mercado Pago preference error", r.status, data);
    throw httpError(502, "Não foi possível iniciar o pagamento agora. Tente novamente em instantes.");
  }
  return data;
}

export async function fetchPayment(paymentId) {
  const r = await fetch("https://api.mercadopago.com/v1/payments/" + encodeURIComponent(paymentId), {
    headers: { Authorization: "Bearer " + mpToken() }
  });
  if (!r.ok) return null;
  return r.json();
}

// Converte o status de pagamento do Mercado Pago no status do pedido.
export function mapPaymentStatus(s) {
  if (s === "approved") return "pago";
  if (s === "rejected") return "pagamento_recusado";
  if (s === "cancelled" || s === "refunded" || s === "charged_back") return "cancelado";
  return "aguardando_pagamento";
}

// Busca o pagamento no Mercado Pago (fonte confiável) e atualiza o pedido.
export async function syncPayment(paymentId) {
  const pay = await fetchPayment(paymentId);
  if (!pay || !pay.external_reference) return null;
  const order = await store.get("orders", String(pay.external_reference));
  if (!order) return null;
  const expected = order.total / 100;
  if (pay.status === "approved" && Math.abs(Number(pay.transaction_amount) - expected) > 0.01) {
    console.error("Valor pago diverge do pedido", order.id, pay.transaction_amount, expected);
    order.paymentWarning = `Valor pago (R$ ${pay.transaction_amount}) diferente do total do pedido.`;
  }
  order.payment = {
    id: pay.id, status: pay.status, detail: pay.status_detail, method: pay.payment_method_id,
    type: pay.payment_type_id, installments: pay.installments, amount: pay.transaction_amount
  };
  const target = mapPaymentStatus(pay.status);
  // não regride pedidos que já avançaram (ex.: enviado)
  const advanced = ["em_preparacao", "enviado", "entregue"].includes(order.status);
  if (!advanced || target === "cancelado") await setOrderStatus(order, target, "Mercado Pago: " + pay.status);
  else await store.put("orders", order);
  return order;
}

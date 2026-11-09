// POST /api/checkout — cria o pedido e devolve o link de pagamento do Mercado Pago.
import crypto from "node:crypto";
import * as store from "../lib/store.js";
import { send, fail, handler, readJson, baseUrl, httpError } from "../lib/http.js";
import { priceCart, normalizeCustomer, newOrderId, createPreference, setOrderStatus } from "../lib/shop.js";

export default handler(async (req, res) => {
  if (req.method !== "POST") return fail(res, 405, "Método não permitido.");
  const body = await readJson(req);
  const priced = await priceCart(body.items, body.shipping);
  if (!priced.settings.storeOpen) throw httpError(503, "As vendas pelo site estão pausadas no momento. Fale com a gente pelo WhatsApp.");
  const customer = normalizeCustomer(body.customer || {}, priced.shipping.id === "entrega");
  const now = new Date().toISOString();
  const order = {
    id: newOrderId(),
    accessToken: crypto.randomBytes(16).toString("hex"),
    status: "aguardando_pagamento",
    createdAt: now, updatedAt: now,
    customer,
    notes: String(body.notes || "").slice(0, 500),
    lines: priced.lines,
    subtotal: priced.subtotal,
    shipping: priced.shipping,
    total: priced.total,
    maxInstallments: priced.settings.maxInstallments,
    stockDeducted: false,
    history: [{ at: now, status: "aguardando_pagamento", note: "Pedido criado no site" }],
    trackingCode: ""
  };
  await store.put("orders", order);
  try {
    const pref = await createPreference(order, baseUrl(req));
    order.preferenceId = pref.id;
    order.paymentUrl = pref.init_point;
    await store.put("orders", order);
    send(res, 200, { orderId: order.id, paymentUrl: pref.init_point });
  } catch (e) {
    await setOrderStatus(order, "cancelado", "Falha ao iniciar pagamento");
    throw e;
  }
});

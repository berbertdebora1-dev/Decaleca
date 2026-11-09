// /api/admin?action=... — operações do painel administrativo.
import * as store from "../lib/store.js";
import { send, fail, handler, readJson, query, httpError } from "../lib/http.js";
import { checkPassword, sessionCookie, clearCookie, isAdmin, requireAdmin } from "../lib/auth.js";
import { normalizeProduct, normalizeCollection, setOrderStatus, ORDER_STATUSES, syncPayment } from "../lib/shop.js";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default handler(async (req, res) => {
  const action = query(req).action || "";
  const body = req.method === "POST" ? await readJson(req) : {};

  if (action === "login") {
    if (req.method !== "POST") return fail(res, 405, "Método não permitido.");
    if (!checkPassword(body.password)) { await sleep(800); return fail(res, 401, "Senha incorreta."); }
    return send(res, 200, { ok: true }, { "Set-Cookie": sessionCookie(req) });
  }
  if (action === "logout") return send(res, 200, { ok: true }, { "Set-Cookie": clearCookie() });
  if (action === "me") return send(res, 200, { admin: isAdmin(req) });

  requireAdmin(req);
  if (req.method === "POST" && req.headers["x-requested-with"] !== "decaleca-admin") throw httpError(403, "Requisição inválida.");

  switch (action) {
    case "dashboard": {
      const [products, collections, orders, settings] = await Promise.all([
        store.list("products"), store.list("collections"), store.list("orders"), store.getSettings()
      ]);
      orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      return send(res, 200, {
        products: products.sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
        collections: collections.sort((a, b) => (a.order || 0) - (b.order || 0)),
        orders, settings, statuses: ORDER_STATUSES,
        config: {
          payments: !!process.env.MP_ACCESS_TOKEN,
          uploads: !!process.env.BLOB_READ_WRITE_TOKEN || !process.env.VERCEL
        }
      });
    }
    case "saveProduct": {
      const existing = body.id ? await store.get("products", body.id) : null;
      const p = normalizeProduct(body, existing);
      if (!existing && await store.get("products", p.id)) throw httpError(409, "Já existe um produto com esse identificador.");
      return send(res, 200, await store.put("products", p));
    }
    case "deleteProduct":
      await store.remove("products", String(body.id || ""));
      return send(res, 200, { ok: true });
    case "saveCollection": {
      const existing = body.id ? await store.get("collections", body.id) : null;
      return send(res, 200, await store.put("collections", normalizeCollection(body, existing)));
    }
    case "deleteCollection":
      await store.remove("collections", String(body.id || ""));
      return send(res, 200, { ok: true });
    case "saveSettings": {
      const n = (v) => Math.max(0, Math.round(Number(v) || 0));
      return send(res, 200, await store.putSettings({
        shippingFlat: n(body.shippingFlat), freeShippingAbove: n(body.freeShippingAbove),
        pickupEnabled: !!body.pickupEnabled, pickupLabel: String(body.pickupLabel || "").slice(0, 120),
        maxInstallments: Math.min(12, Math.max(1, n(body.maxInstallments) || 1)),
        storeOpen: body.storeOpen !== false
      }));
    }
    case "updateOrder": {
      const order = await store.get("orders", String(body.id || ""));
      if (!order) throw httpError(404, "Pedido não encontrado.");
      if (typeof body.trackingCode === "string") order.trackingCode = body.trackingCode.trim().slice(0, 60);
      if (typeof body.adminNotes === "string") order.adminNotes = body.adminNotes.slice(0, 2000);
      if (body.status && body.status !== order.status) {
        if (!ORDER_STATUSES[body.status]) throw httpError(400, "Status inválido.");
        await setOrderStatus(order, body.status, "Alterado no painel");
      } else {
        order.updatedAt = new Date().toISOString();
        await store.put("orders", order);
      }
      return send(res, 200, order);
    }
    case "syncOrder": {
      const order = await store.get("orders", String(body.id || ""));
      if (!order || !order.payment) throw httpError(404, "Este pedido ainda não tem pagamento registrado.");
      return send(res, 200, (await syncPayment(order.payment.id)) || order);
    }
    default:
      return fail(res, 404, "Ação desconhecida.");
  }
});

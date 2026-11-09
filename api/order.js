// GET /api/order?id=...&t=... — status do pedido para o cliente.
// Com payment_id (retorno do Mercado Pago), sincroniza o pagamento antes de responder.
import crypto from "node:crypto";
import * as store from "../lib/store.js";
import { send, fail, handler, query } from "../lib/http.js";
import { publicOrder, syncPayment } from "../lib/shop.js";

export default handler(async (req, res) => {
  const q = query(req);
  const order = q.id ? await store.get("orders", String(q.id)) : null;
  const ok = order && q.t && order.accessToken.length === String(q.t).length &&
    crypto.timingSafeEqual(Buffer.from(order.accessToken), Buffer.from(String(q.t)));
  if (!ok) return fail(res, 404, "Pedido não encontrado.");
  let current = order;
  if (q.payment_id && /^\d+$/.test(q.payment_id) && process.env.MP_ACCESS_TOKEN) {
    const synced = await syncPayment(q.payment_id).catch(() => null);
    if (synced && synced.id === order.id) current = synced;
  }
  send(res, 200, publicOrder(current));
});

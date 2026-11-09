// POST /api/mp-webhook — notificações do Mercado Pago.
// O status é sempre confirmado consultando a API do Mercado Pago (não confiamos no corpo recebido).
import { send, handler, readJson, query } from "../lib/http.js";
import { syncPayment } from "../lib/shop.js";

export default handler(async (req, res) => {
  const q = query(req);
  const body = req.method === "POST" ? await readJson(req) : {};
  const type = body.type || body.topic || q.type || q.topic;
  const id = (body.data && body.data.id) || q["data.id"] || q.id;
  if ((type === "payment" || !type) && id && /^\d+$/.test(String(id))) {
    await syncPayment(String(id));
  }
  send(res, 200, { ok: true });
});

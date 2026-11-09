// GET /api/catalog — produtos ativos, coleções e opções de frete (público).
import * as store from "../lib/store.js";
import { send, handler } from "../lib/http.js";
import { publicProduct } from "../lib/shop.js";

export default handler(async (req, res) => {
  const [products, collections, settings] = await Promise.all([
    store.list("products"), store.list("collections"), store.getSettings()
  ]);
  send(res, 200, {
    products: products.filter((p) => p.active).sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")).map(publicProduct),
    collections: collections.sort((a, b) => (a.order || 0) - (b.order || 0)),
    shipping: {
      flat: settings.shippingFlat, freeAbove: settings.freeShippingAbove,
      pickup: settings.pickupEnabled ? settings.pickupLabel || "Retirada em mãos" : null
    },
    maxInstallments: settings.maxInstallments,
    storeOpen: settings.storeOpen
  }, { "Cache-Control": "public, max-age=0, s-maxage=30, stale-while-revalidate=120" });
});

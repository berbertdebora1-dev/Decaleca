// POST /api/upload?name=foto.jpg — envio de imagens pelo painel (somente admin).
// Produção: Vercel Blob. Local: pasta images/uploads.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { send, fail, handler, readRaw, query } from "../lib/http.js";
import { requireAdmin } from "../lib/auth.js";
import { slugify } from "../lib/shop.js";

const TYPES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export default handler(async (req, res) => {
  if (req.method !== "POST") return fail(res, 405, "Método não permitido.");
  requireAdmin(req);
  const type = (req.headers["content-type"] || "").split(";")[0];
  if (!TYPES[type]) return fail(res, 415, "Envie uma imagem JPG, PNG ou WebP.");
  const buf = await readRaw(req, 4 * 1024 * 1024);
  if (!buf.length) return fail(res, 400, "Arquivo vazio.");
  const base = slugify(String(query(req).name || "foto").replace(/\.[a-z0-9]+$/i, ""));
  const file = `${base}-${crypto.randomBytes(3).toString("hex")}.${TYPES[type]}`;
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import("@vercel/blob");
    const blob = await put("produtos/" + file, buf, { access: "public", contentType: type });
    return send(res, 200, { url: blob.url });
  }
  if (process.env.VERCEL) return fail(res, 503, "Armazenamento de imagens não configurado: conecte um Vercel Blob ao projeto.");
  const dir = path.join(process.cwd(), "images", "uploads");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, file), buf);
  send(res, 200, { url: "/images/uploads/" + file });
});

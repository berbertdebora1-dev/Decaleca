// Utilitários HTTP independentes de framework (funcionam na Vercel e no servidor local).
import { StoreNotConfigured } from "./store.js";

export function send(res, status, data, headers = {}) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
  res.end(JSON.stringify(data));
}

export function fail(res, status, message) {
  send(res, status, { error: message });
}

export async function readRaw(req, limit = 5 * 1024 * 1024) {
  const chunks = [];
  let size = 0;
  for await (const c of req) {
    size += c.length;
    if (size > limit) throw Object.assign(new Error("Arquivo muito grande."), { status: 413 });
    chunks.push(c);
  }
  return Buffer.concat(chunks);
}

export async function readJson(req) {
  // Na Vercel, req.body já vem interpretado para application/json.
  if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === "string") { try { return JSON.parse(req.body); } catch { return {}; } }
  const raw = await readRaw(req, 1024 * 1024);
  if (!raw.length) return {};
  try { return JSON.parse(raw.toString("utf8")); } catch { return {}; }
}

export function query(req) {
  const u = new URL(req.url, "http://x");
  return Object.fromEntries(u.searchParams.entries());
}

export function cookies(req) {
  const out = {};
  (req.headers.cookie || "").split(";").forEach((p) => {
    const i = p.indexOf("=");
    if (i > 0) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
  });
  return out;
}

export function baseUrl(req) {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, "");
  const proto = (req.headers["x-forwarded-proto"] || "http").split(",")[0];
  return proto + "://" + req.headers.host;
}

// Envolve um handler com tratamento de erros padronizado.
export function handler(fn) {
  return async (req, res) => {
    try {
      await fn(req, res);
    } catch (e) {
      if (e instanceof StoreNotConfigured) return fail(res, 503, e.message);
      if (e.status) return fail(res, e.status, e.message);
      console.error(e);
      fail(res, 500, "Erro interno. Tente novamente em instantes.");
    }
  };
}

export function httpError(status, message) {
  return Object.assign(new Error(message), { status });
}

// Autenticação do painel administrativo (senha única definida em ADMIN_PASSWORD).
import crypto from "node:crypto";
import { cookies, httpError } from "./http.js";

const COOKIE = "dl_admin";
const MAX_AGE = 60 * 60 * 12; // 12 horas

function secret() {
  const s = process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD;
  if (!s) throw httpError(503, "Painel não configurado: defina ADMIN_PASSWORD nas variáveis de ambiente da Vercel.");
  return s;
}

function sign(payload) {
  return crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
}

function safeEqual(a, b) {
  const ab = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

export function checkPassword(pw) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) throw httpError(503, "Painel não configurado: defina ADMIN_PASSWORD nas variáveis de ambiente da Vercel.");
  return safeEqual(pw || "", expected);
}

export function sessionCookie(req) {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE;
  const payload = "admin." + exp;
  const token = payload + "." + sign(payload);
  const secure = (req.headers["x-forwarded-proto"] || "").includes("https") ? "; Secure" : "";
  return `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${MAX_AGE}${secure}`;
}

export function clearCookie() {
  return `${COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`;
}

export function isAdmin(req) {
  const t = cookies(req)[COOKIE];
  if (!t) return false;
  const i = t.lastIndexOf(".");
  const payload = t.slice(0, i);
  const sig = t.slice(i + 1);
  const exp = Number(payload.split(".")[1]);
  if (!exp || exp < Date.now() / 1000) return false;
  try { return safeEqual(sig, sign(payload)); } catch { return false; }
}

export function requireAdmin(req) {
  if (!isAdmin(req)) throw httpError(401, "Faça login para continuar.");
}

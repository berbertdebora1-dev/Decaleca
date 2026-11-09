// Armazenamento de dados da loja.
// Produção (Vercel): Upstash Redis (variáveis KV_REST_API_URL/KV_REST_API_TOKEN
// ou UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN).
// Desenvolvimento local: arquivo .data/db.json.
import fs from "node:fs";
import path from "node:path";

const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const ON_VERCEL = !!process.env.VERCEL;

let redis = null;
async function getRedis() {
  if (!URL_ || !TOKEN) return null;
  if (!redis) {
    const { Redis } = await import("@upstash/redis");
    redis = new Redis({ url: URL_, token: TOKEN, automaticDeserialization: false });
  }
  return redis;
}

export class StoreNotConfigured extends Error {
  constructor() {
    super("Banco de dados não configurado. Conecte um banco Upstash Redis ao projeto na Vercel.");
  }
}

// ---------- backend local (arquivo JSON) ----------
const FILE = path.join(process.cwd(), ".data", "db.json");
function readFile() {
  try { return JSON.parse(fs.readFileSync(FILE, "utf8")); } catch { return {}; }
}
function writeFile(db) {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(db, null, 2));
}

async function backend() {
  const r = await getRedis();
  if (r) return { kind: "redis", r };
  if (ON_VERCEL) throw new StoreNotConfigured();
  return { kind: "file" };
}

const parse = (v) => (v == null ? null : typeof v === "string" ? JSON.parse(v) : v);

// kinds: products, collections, orders
export async function list(kind) {
  const b = await backend();
  if (b.kind === "redis") {
    const all = (await b.r.hgetall("dl:" + kind)) || {};
    return Object.values(all).map(parse);
  }
  return Object.values(readFile()[kind] || {});
}

export async function get(kind, id) {
  const b = await backend();
  if (b.kind === "redis") return parse(await b.r.hget("dl:" + kind, id));
  return (readFile()[kind] || {})[id] || null;
}

export async function put(kind, obj) {
  const b = await backend();
  if (b.kind === "redis") {
    await b.r.hset("dl:" + kind, { [obj.id]: JSON.stringify(obj) });
    return obj;
  }
  const db = readFile();
  db[kind] = db[kind] || {};
  db[kind][obj.id] = obj;
  writeFile(db);
  return obj;
}

export async function remove(kind, id) {
  const b = await backend();
  if (b.kind === "redis") return b.r.hdel("dl:" + kind, id);
  const db = readFile();
  if (db[kind]) delete db[kind][id];
  writeFile(db);
}

export const DEFAULT_SETTINGS = {
  shippingFlat: 0,         // frete fixo em centavos
  freeShippingAbove: 0,    // frete grátis acima de (centavos); 0 = desativado
  pickupEnabled: false,    // retirada em mãos
  pickupLabel: "",         // ex.: "Retirada em mãos — combinar pelo WhatsApp"
  maxInstallments: 3,      // parcelas máximas no cartão
  storeOpen: true          // desligue para pausar as vendas no site
};

export async function getSettings() {
  const b = await backend();
  let s;
  if (b.kind === "redis") s = parse(await b.r.get("dl:settings"));
  else s = readFile().settings;
  return { ...DEFAULT_SETTINGS, ...(s || {}) };
}

export async function putSettings(s) {
  const b = await backend();
  const merged = { ...DEFAULT_SETTINGS, ...s };
  if (b.kind === "redis") await b.r.set("dl:settings", JSON.stringify(merged));
  else { const db = readFile(); db.settings = merged; writeFile(db); }
  return merged;
}

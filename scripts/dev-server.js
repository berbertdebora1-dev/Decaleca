// Servidor local para desenvolvimento: `npm run dev` e abra http://localhost:3000
// Simula a Vercel: arquivos estáticos com URLs limpas + funções em /api.
// Variáveis opcionais: ADMIN_PASSWORD (padrão "admin" localmente), MP_ACCESS_TOKEN.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const port = Number(process.env.PORT || 3000);
if (!process.env.ADMIN_PASSWORD) process.env.ADMIN_PASSWORD = "admin";

const TYPES = {
  ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp",
  ".json": "application/json", ".txt": "text/plain"
};

http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  let p = decodeURIComponent(url.pathname);
  if (p.startsWith("/api/")) {
    const file = path.join(root, "api", p.slice(5).replace(/[^a-z0-9-]/gi, "") + ".js");
    if (!fs.existsSync(file)) { res.statusCode = 404; return res.end("not found"); }
    const mod = await import(pathToFileURL(file).href);
    return mod.default(req, res);
  }
  if (p.includes("..") || p.startsWith("/lib") || p.startsWith("/.data") || p.startsWith("/node_modules")) {
    res.statusCode = 403; return res.end();
  }
  if (p === "/") p = "/index.html";
  let f = path.join(root, p);
  if (!path.extname(f)) f += ".html";
  fs.readFile(f, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": TYPES[".html"] });
      return res.end(fs.readFileSync(path.join(root, "404.html")));
    }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(f)] || "application/octet-stream" });
    res.end(data);
  });
}).listen(port, () => console.log(`Decaleca rodando em http://localhost:${port} (senha do painel local: ${process.env.ADMIN_PASSWORD})`));

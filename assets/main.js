/* ============================================================
   DECALECA — site e loja
   ============================================================ */
(function () {
  "use strict";
  document.documentElement.classList.remove("no-js");

  var CFG = window.DECALECA_CONFIG || {};
  var page = document.body.getAttribute("data-page") || "";

  var ICON_WHATS = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.15h-.01a8.23 8.23 0 0 1-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.25-8.23 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.82c0 4.54-3.7 8.23-8.22 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.43-.06-.13-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.28Z"/></svg>';
  var ICON_BAG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 8h14l-1.2 11.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/></svg>';
  var ICON_MENU = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 8h16M4 16h16"/></svg>';
  var ICON_CLOSE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';

  var CATEGORY_LABEL = { meias: "Meias Bordadas", quadros: "Quadros", almofadas: "Almofadas" };
  var CATEGORY_TONE = { meias: "yellow", quadros: "blue", almofadas: "green" };

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function brl(cents) {
    return (Number(cents || 0) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }
  function qs(name) { return new URLSearchParams(location.search).get(name) || ""; }
  function api(path, opts) {
    opts = opts || {};
    return fetch(path, {
      method: opts.method || "GET",
      headers: opts.body ? { "Content-Type": "application/json" } : {},
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      credentials: "same-origin"
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (d) {
        if (!r.ok) throw new Error(d.error || "Algo deu errado. Tente novamente.");
        return d;
      });
    });
  }

  /* ---------- links oficiais ---------- */
  function whatsUrl(msg) {
    if (!CFG.whatsapp) return null;
    var text = msg || CFG.whatsappMessage || "";
    return text ? CFG.whatsapp + (CFG.whatsapp.indexOf("?") === -1 ? "?" : "&") + "text=" + encodeURIComponent(text) : CFG.whatsapp;
  }
  function linkFor(kind, msg) {
    if (kind === "whatsapp") return whatsUrl(msg);
    if (kind === "ml") return CFG.mercadoLivre || null;
    if (kind === "instagram") return CFG.instagram || null;
    if (kind === "clube") return CFG.clube || null;
    return null;
  }
  function applyLinks(root) {
    (root || document).querySelectorAll("[data-link]").forEach(function (a) {
      var url = linkFor(a.getAttribute("data-link"), a.getAttribute("data-msg"));
      if (url) { a.href = url; a.target = "_blank"; a.rel = "noopener"; }
      else { a.href = page === "contato" ? "#canais" : "/contato#canais"; a.removeAttribute("target"); }
    });
  }

  /* ---------- carrinho (salvo no navegador) ---------- */
  var memCart = [];
  var Cart = {
    get: function () {
      try { var c = JSON.parse(localStorage.getItem("dl_cart") || "[]"); return Array.isArray(c) ? c : []; }
      catch (e) { return memCart; }
    },
    save: function (c) {
      memCart = c;
      try { localStorage.setItem("dl_cart", JSON.stringify(c)); } catch (e) {}
      updateBadge();
    },
    add: function (id, variant, qty) {
      var c = Cart.get();
      var line = c.filter(function (l) { return l.id === id && l.variant === variant; })[0];
      if (line) line.qty += qty; else c.push({ id: id, variant: variant, qty: qty });
      Cart.save(c);
    },
    setQty: function (i, qty) { var c = Cart.get(); if (c[i]) { c[i].qty = qty; if (qty <= 0) c.splice(i, 1); } Cart.save(c); },
    clear: function () { Cart.save([]); },
    count: function () { return Cart.get().reduce(function (s, l) { return s + (l.qty || 0); }, 0); }
  };
  function updateBadge() {
    var n = Cart.count();
    document.querySelectorAll(".cart-count").forEach(function (b) { b.textContent = n; b.hidden = !n; });
  }

  /* ---------- header & footer ---------- */
  var NAV = [
    { href: "/", label: "Início", id: "inicio" },
    { href: "/nossa-historia", label: "Nossa História", id: "historia" },
    { href: "/produtos#meias", label: "Meias Bordadas", id: "meias" },
    { href: "/produtos#quadros", label: "Quadros", id: "quadros" },
    { href: "/produtos#almofadas", label: "Almofadas", id: "almofadas" },
    { href: "/contato", label: "Contato", id: "contato" }
  ];
  function navLinks(cls) {
    return NAV.map(function (n) {
      return '<a class="' + (cls || "") + '" href="' + n.href + '"' + (n.id === page ? ' aria-current="page"' : "") + ">" + n.label + "</a>";
    }).join("");
  }
  var LOGO = '<a class="logo" href="/" aria-label="Decaleca — início"><img src="/assets/logo.webp" alt="Decaleca" width="420" height="312"></a>';
  var LOGO_HEADER = '<a class="logo logo--header" href="/" aria-label="Decaleca — início"><img src="/assets/logo-square.png" alt="Decaleca" width="480" height="480"></a>';
  var CART_BTN = '<a class="cart-btn" href="/carrinho" aria-label="Carrinho">' + ICON_BAG + '<span class="cart-count" hidden>0</span></a>';

  var header = document.getElementById("site-header");
  if (header) {
    header.className = "site-header";
    header.innerHTML =
      '<div class="container header-inner">' + LOGO_HEADER +
      '<nav class="nav" aria-label="Principal">' + navLinks() + "</nav>" +
      '<div class="header-actions">' +
      '<a class="btn btn--ghost btn--sm shop-link" href="/produtos">Loja</a>' +
      '<a class="whats-link" data-link="whatsapp" href="/contato" aria-label="WhatsApp">' + ICON_WHATS + "</a>" +
      CART_BTN +
      '<button class="menu-toggle" type="button" aria-expanded="false" aria-controls="mobile-menu" aria-label="Abrir menu">' + ICON_MENU + "</button>" +
      "</div></div>" +
      '<div class="mobile-menu" id="mobile-menu">' + navLinks("m-link") +
      '<a class="btn" href="/produtos">Ver a loja</a>' +
      '<a class="btn btn--whats" data-link="whatsapp" href="/contato">' + ICON_WHATS + "Fale pelo WhatsApp</a>" +
      '<a class="btn btn--ghost" data-link="clube" href="/contato">Entrar no Clube da Decaleca</a>' +
      "</div>";

    var toggle = header.querySelector(".menu-toggle");
    var menu = header.querySelector(".mobile-menu");
    var setMenu = function (open) {
      menu.classList.toggle("open", open);
      document.body.classList.toggle("menu-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
      toggle.innerHTML = open ? ICON_CLOSE : ICON_MENU;
    };
    toggle.addEventListener("click", function () { setMenu(!menu.classList.contains("open")); });
    menu.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });
  }

  var footer = document.getElementById("site-footer");
  if (footer) {
    footer.className = "site-footer";
    footer.innerHTML =
      '<div class="container"><div class="footer-grid">' +
      '<div class="footer-brand">' + LOGO +
      "<p>Meias bordadas, quadros e almofadas com ilustrações exclusivas, criados para vestir, decorar e fazer parte das lembranças da sua família.</p></div>" +
      '<div class="footer-col"><h4>Loja</h4><ul>' +
      '<li><a href="/produtos#meias">Meias Bordadas</a></li>' +
      '<li><a href="/produtos#quadros">Quadros</a></li>' +
      '<li><a href="/produtos#almofadas">Almofadas</a></li>' +
      '<li><a href="/carrinho">Carrinho</a></li></ul></div>' +
      '<div class="footer-col"><h4>Decaleca</h4><ul>' +
      '<li><a href="/nossa-historia">Nossa História</a></li>' +
      '<li><a href="/contato">Contato</a></li>' +
      '<li><a data-link="whatsapp" href="/contato">WhatsApp</a></li>' +
      '<li><a data-link="ml" href="/contato">Mercado Livre</a></li>' +
      '<li><a data-link="instagram" href="/contato">Instagram</a></li>' +
      '<li><a data-link="clube" href="/contato">Clube da Decaleca</a></li></ul></div>' +
      "</div>" +
      '<div class="footer-bottom"><span>© ' + new Date().getFullYear() + " Decaleca. Todos os direitos reservados.</span>" +
      "<span>Pagamento seguro via Mercado Pago · Ilustrações exclusivas por Ludmita.</span></div></div>";
  }

  if (!document.querySelector(".float-whats") && ["checkout", "admin"].indexOf(page) === -1) {
    var fw = document.createElement("a");
    fw.className = "float-whats";
    fw.setAttribute("data-link", "whatsapp");
    fw.setAttribute("aria-label", "Conversar com a Decaleca pelo WhatsApp");
    fw.href = "/contato";
    fw.innerHTML = ICON_WHATS;
    document.body.appendChild(fw);
  }

  /* ---------- fotos ---------- */
  function loadPhoto(el, src, alt) {
    if (!src) return;
    var img = new Image();
    img.loading = "lazy";
    img.decoding = "async";
    img.alt = alt || el.getAttribute("data-alt") || "";
    img.onload = function () { el.classList.add("has-img"); };
    img.onerror = function () { img.remove(); };
    img.src = src;
    el.appendChild(img);
  }
  function initPhotos(root) {
    (root || document).querySelectorAll(".photo[data-img]").forEach(function (el) {
      if (!el.querySelector("img")) loadPhoto(el, el.getAttribute("data-img"));
    });
  }

  /* ---------- animação de entrada ---------- */
  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
  }, { rootMargin: "0px 0px -40px 0px" }) : null;
  function observeReveal(root) {
    (root || document).querySelectorAll(".reveal:not(.in)").forEach(function (el) {
      if (io) io.observe(el); else el.classList.add("in");
    });
  }
  function finalize(root) { applyLinks(root); initPhotos(root); observeReveal(root); }

  /* ---------- aviso flutuante ---------- */
  var toastTimer;
  function toast(html) {
    var t = document.querySelector(".toast");
    if (!t) { t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
    t.innerHTML = html;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("show"); }, 4500);
  }

  /* ---------- catálogo ---------- */
  var catalogPromise;
  function catalog() {
    if (!catalogPromise) {
      catalogPromise = api("/api/catalog").catch(function () {
        return { products: [], collections: [], shipping: { flat: 0, freeAbove: 0, pickup: null }, offline: true, storeOpen: false };
      });
    }
    return catalogPromise;
  }
  function inStock(p) { return p.variants.some(function (v) { return v.available; }); }
  function collectionName(cat, id) {
    var c = (cat.collections || []).filter(function (c) { return c.id === id; })[0];
    return c ? c.name : "";
  }

  function productCard(p, cat) {
    var soldOut = !inStock(p);
    var sizes = p.variants.filter(function (v) { return v.name !== "Único"; }).map(function (v) { return v.name; }).join(" · ");
    var coll = collectionName(cat, p.collection);
    return (
      '<a class="product-card reveal" href="/produto?id=' + encodeURIComponent(p.id) + '">' +
      '<div class="photo photo--' + (CATEGORY_TONE[p.category] || "yellow") + '" data-label="Foto do produto" data-img="' + esc((p.images || [])[0] || "") + '" data-alt="' + esc(p.name) + '">' +
      (soldOut ? '<span class="badge badge--soldout">Esgotado</span>' : "") + "</div>" +
      '<span class="p-cat">' + esc(CATEGORY_LABEL[p.category] || "") + (coll ? " · " + esc(coll) : "") + "</span>" +
      "<h3>" + esc(p.name) + "</h3>" +
      '<div class="p-meta"><span class="p-price">' + brl(p.price) + "</span>" + (sizes ? "<span>" + esc(sizes) + "</span>" : "") + "</div>" +
      '<span class="btn btn--sm' + (soldOut ? " btn--ghost" : "") + '">' + (soldOut ? "Ver produto" : "Comprar") + "</span>" +
      "</a>"
    );
  }

  function emptyState(title, text) {
    return (
      '<div class="empty-state"><h3>' + title + "</h3><p>" + text + "</p>" +
      '<div class="btn-row" style="justify-content:center;margin-top:0">' +
      '<a class="btn btn--whats" data-link="whatsapp" href="/contato">' + ICON_WHATS + "Conversar pelo WhatsApp</a>" +
      '<a class="btn btn--ghost" data-link="clube" href="/contato">Entrar no Clube</a></div></div>'
    );
  }

  // vitrine da página inicial
  var featured = document.getElementById("featured-products");
  if (featured) {
    featured.innerHTML = '<p class="loading">Carregando peças…</p>';
    catalog().then(function (cat) {
      var list = cat.products.filter(function (p) { return p.featured; });
      if (list.length < 4) list = list.concat(cat.products.filter(function (p) { return !p.featured; })).slice(0, 4);
      featured.innerHTML = list.length
        ? '<div class="product-grid product-grid--4">' + list.slice(0, 8).map(function (p) { return productCard(p, cat); }).join("") + "</div>"
        : emptyState("Nossas coleções estão chegando à loja.", "Enquanto isso, fale com a Débora pelo WhatsApp para conhecer as peças disponíveis.");
      finalize(featured);
    });
  }

  /* ---------- página de produtos ---------- */
  var grid = document.getElementById("product-grid");
  if (grid) {
    var filtersEl = document.getElementById("filters");
    var collWrap = document.getElementById("collections");
    var state = { categoria: "", colecao: "", tamanho: "" };
    var CAT;
    var uniq = function (arr) { return arr.filter(function (v, i) { return v && arr.indexOf(v) === i; }); };

    var renderFilters = function () {
      var P = CAT.products;
      var group = function (key, label, values, labeler) {
        if (values.length < 2) return "";
        return '<div class="filter-group"><label>' + label + '</label><div class="chip-row">' +
          '<button class="chip" type="button" data-f="' + key + '" data-v="" aria-pressed="' + (state[key] === "") + '">Todos</button>' +
          values.map(function (v) {
            return '<button class="chip" type="button" data-f="' + key + '" data-v="' + esc(v) + '" aria-pressed="' + (state[key] === v) + '">' + esc(labeler ? labeler(v) : v) + "</button>";
          }).join("") + "</div></div>";
      };
      var sizes = uniq([].concat.apply([], P.map(function (p) { return p.variants.map(function (v) { return v.name; }); }))).filter(function (s) { return s !== "Único"; });
      filtersEl.innerHTML =
        group("categoria", "Categoria", uniq(P.map(function (p) { return p.category; })), function (v) { return CATEGORY_LABEL[v] || v; }) +
        group("colecao", "Coleção", uniq(P.map(function (p) { return p.collection; })), function (v) { return collectionName(CAT, v) || v; }) +
        group("tamanho", "Tamanho", sizes);
      filtersEl.hidden = !filtersEl.innerHTML;
    };
    var renderGrid = function () {
      var list = CAT.products.filter(function (p) {
        return (!state.categoria || p.category === state.categoria) &&
          (!state.colecao || p.collection === state.colecao) &&
          (!state.tamanho || p.variants.some(function (v) { return v.name === state.tamanho; }));
      });
      if (!CAT.products.length) {
        grid.innerHTML = emptyState("Novas peças a caminho da loja.", "Nosso catálogo está sendo preparado. Fale com a Débora pelo WhatsApp para ver o que está disponível agora.");
      } else if (!list.length) {
        grid.innerHTML = '<p class="lead">Nenhuma peça encontrada com esses filtros.</p>';
      } else {
        grid.innerHTML = '<div class="product-grid">' + list.map(function (p) { return productCard(p, CAT); }).join("") + "</div>";
      }
      finalize(grid);
    };
    var setCategory = function (c) {
      state = { categoria: CAT.products.some(function (p) { return p.category === c; }) ? c : "", colecao: "", tamanho: "" };
      renderFilters(); renderGrid();
    };

    grid.innerHTML = '<p class="loading">Carregando peças…</p>';
    catalog().then(function (cat) {
      CAT = cat;
      var h = location.hash.replace("#", "");
      if (CATEGORY_LABEL[h]) state.categoria = cat.products.some(function (p) { return p.category === h; }) ? h : "";
      renderFilters(); renderGrid();

      if (collWrap) {
        collWrap.innerHTML = cat.collections.length
          ? '<div class="collections">' + cat.collections.map(function (c, i) {
            return '<div class="collection reveal"><div class="photo photo--wide photo--' + ["yellow", "blue", "green"][i % 3] + '" data-label="Ilustração ou foto da coleção" data-img="' + esc(c.image || "") + '" data-alt="Coleção ' + esc(c.name) + '"></div>' +
              '<div><span class="eyebrow">Coleção</span><h3>' + esc(c.name) + "</h3>" + (c.description ? '<p class="lead">' + esc(c.description) + "</p>" : "") +
              '<button class="link-btn link-arrow" type="button" data-filter-collection="' + esc(c.id) + '">Ver peças da coleção</button></div></div>';
          }).join("") + "</div>"
          : '<p class="lead">As coleções aparecerão aqui assim que forem cadastradas. Para conhecer as novidades antes de todo mundo, entre para o <a data-link="clube" href="/contato">Clube da Decaleca</a>.</p>';
        finalize(collWrap);
      }
    });

    window.addEventListener("hashchange", function () {
      var h = location.hash.replace("#", "");
      if (CAT && CATEGORY_LABEL[h]) setCategory(h);
    });
    filtersEl.addEventListener("click", function (e) {
      var b = e.target.closest("[data-f]");
      if (!b) return;
      state[b.getAttribute("data-f")] = b.getAttribute("data-v");
      renderFilters(); renderGrid();
    });
    document.querySelectorAll("[data-cat-link]").forEach(function (a) {
      a.addEventListener("click", function () { if (CAT) setCategory(a.getAttribute("data-cat-link")); });
    });
    document.addEventListener("click", function (e) {
      var b = e.target.closest("[data-filter-collection]");
      if (!b || !CAT) return;
      state = { categoria: "", colecao: b.getAttribute("data-filter-collection"), tamanho: "" };
      renderFilters(); renderGrid();
      document.getElementById("catalogo").scrollIntoView({ behavior: "smooth" });
    });
  }

  /* ---------- página do produto ---------- */
  var productEl = document.getElementById("product");
  if (productEl) {
    productEl.innerHTML = '<p class="loading">Carregando…</p>';
    catalog().then(function (cat) {
      var p = cat.products.filter(function (x) { return x.id === qs("id"); })[0];
      if (!p) {
        productEl.innerHTML = '<div class="empty-state"><h3>Produto não encontrado.</h3><p>Ele pode ter saído de linha ou esgotado.</p><a class="btn" href="/produtos">Ver todos os produtos</a></div>';
        return;
      }
      document.title = p.name + " | Decaleca";
      var md = document.querySelector('meta[name="description"]');
      if (md && p.description) md.setAttribute("content", p.description.slice(0, 155));
      var coll = collectionName(cat, p.collection);
      var single = p.variants.length === 1 && p.variants[0].name === "Único";
      var firstAvail = p.variants.filter(function (v) { return v.available; })[0];
      var selected = single ? p.variants[0].name : (firstAvail ? firstAvail.name : "");
      var imgs = p.images || [];
      var msg = 'Olá, Débora! Tenho uma dúvida sobre o produto "' + p.name + '".';

      productEl.innerHTML =
        '<nav class="crumbs" aria-label="Você está em"><a href="/produtos">Loja</a> / <a href="/produtos#' + p.category + '">' + esc(CATEGORY_LABEL[p.category]) + "</a></nav>" +
        '<div class="pdp">' +
        '<div class="pdp-gallery"><div class="photo gallery-main photo--' + (CATEGORY_TONE[p.category] || "yellow") + '" data-label="Foto do produto" data-img="' + esc(imgs[0] || "") + '" data-alt="' + esc(p.name) + '"></div>' +
        (imgs.length > 1 ? '<div class="gallery-thumbs">' + imgs.map(function (src, i) {
          return '<button type="button" data-src="' + esc(src) + '" aria-current="' + (i === 0) + '" aria-label="Foto ' + (i + 1) + '"><img src="' + esc(src) + '" alt="" loading="lazy"></button>';
        }).join("") + "</div>" : "") + "</div>" +
        '<div class="pdp-info">' +
        '<span class="eyebrow">' + esc(CATEGORY_LABEL[p.category]) + (coll ? " · " + esc(coll) : "") + "</span>" +
        "<h1>" + esc(p.name) + "</h1>" +
        '<p class="pdp-price">' + brl(p.price) + "</p>" +
        (cat.maxInstallments > 1 ? '<p class="pdp-installments">em até ' + cat.maxInstallments + "x no cartão, ou Pix e boleto</p>" : '<p class="pdp-installments">Pix, cartão ou boleto</p>') +
        (p.description ? '<div class="pdp-desc"><p>' + esc(p.description).replace(/\n+/g, "</p><p>") + "</p></div>" : "") +
        (single ? "" : '<div class="variant-group"><label>Tamanho</label><div class="chip-row" id="variants">' + p.variants.map(function (v) {
          return '<button class="chip" type="button" data-variant="' + esc(v.name) + '" aria-pressed="' + (v.name === selected) + '"' + (v.available ? "" : " disabled") + ">" + esc(v.name) + (v.available ? "" : " — esgotado") + "</button>";
        }).join("") + "</div></div>") +
        '<div class="buy-row"><div class="qty" aria-label="Quantidade"><button type="button" data-step="-1" aria-label="Diminuir">−</button><input id="qty" type="number" min="1" value="1" inputmode="numeric" aria-label="Quantidade"><button type="button" data-step="1" aria-label="Aumentar">+</button></div>' +
        '<button class="btn btn--grow" id="add-to-cart" type="button">Adicionar ao carrinho</button></div>' +
        '<p class="stock-note" id="stock-note"></p>' +
        '<ul class="pdp-perks"><li>Pagamento seguro pelo Mercado Pago</li><li>Enviamos para todo o Brasil</li><li>Atendimento pessoal com a Débora</li></ul>' +
        (p.care ? '<details class="pdp-care"><summary>Cuidados</summary><p>' + esc(p.care) + "</p></details>" : "") +
        '<a class="link-arrow" data-link="whatsapp" data-msg="' + esc(msg) + '" href="/contato">Dúvidas? Fale com a gente pelo WhatsApp</a>' +
        "</div></div>";

      var addBtn = productEl.querySelector("#add-to-cart");
      var qtyInput = productEl.querySelector("#qty");
      var note = productEl.querySelector("#stock-note");
      var variantOf = function (name) { return p.variants.filter(function (v) { return v.name === name; })[0]; };
      var refresh = function () {
        var v = variantOf(selected);
        var ok = !!(v && v.available) && cat.storeOpen !== false;
        addBtn.disabled = !ok;
        addBtn.textContent = !firstAvail ? "Esgotado" : !v && !single ? "Escolha um tamanho" : ok ? "Adicionar ao carrinho" : cat.storeOpen === false ? "Vendas pausadas" : "Esgotado";
        note.textContent = v && v.available && v.stock <= 3 ? "Últimas " + v.stock + " unidades!" : "";
        qtyInput.max = v ? v.stock : 1;
      };
      refresh();

      productEl.addEventListener("click", function (e) {
        var vb = e.target.closest("[data-variant]");
        if (vb && !vb.disabled) {
          selected = vb.getAttribute("data-variant");
          productEl.querySelectorAll("[data-variant]").forEach(function (b) { b.setAttribute("aria-pressed", String(b === vb)); });
          refresh();
        }
        var sb = e.target.closest("[data-step]");
        if (sb) {
          var max = Number(qtyInput.max) || 99;
          qtyInput.value = Math.min(max, Math.max(1, (Number(qtyInput.value) || 1) + Number(sb.getAttribute("data-step"))));
        }
        var tb = e.target.closest(".gallery-thumbs button");
        if (tb) {
          var main = productEl.querySelector(".gallery-main");
          var img = main.querySelector("img");
          if (img) img.src = tb.getAttribute("data-src"); else loadPhoto(main, tb.getAttribute("data-src"), p.name);
          productEl.querySelectorAll(".gallery-thumbs button").forEach(function (x) { x.setAttribute("aria-current", String(x === tb)); });
        }
      });
      addBtn.addEventListener("click", function () {
        var v = variantOf(selected);
        if (!v || !v.available) return;
        var inCart = Cart.get().filter(function (l) { return l.id === p.id && l.variant === v.name; }).reduce(function (s, l) { return s + l.qty; }, 0);
        var qty = Math.max(1, Math.round(Number(qtyInput.value) || 1));
        if (inCart + qty > v.stock) {
          note.textContent = "Temos " + v.stock + " unidade(s) disponíveis" + (inCart ? " e você já tem " + inCart + " no carrinho." : ".");
          return;
        }
        Cart.add(p.id, v.name, qty);
        toast("<strong>" + esc(p.name) + "</strong> foi para o carrinho. <a href=\"/carrinho\">Ver carrinho</a>");
      });
      finalize(productEl);
    });
  }

  /* ---------- carrinho ---------- */
  function cartLines(cat) {
    return Cart.get().map(function (l, i) {
      var p = cat.products.filter(function (x) { return x.id === l.id; })[0];
      var v = p && p.variants.filter(function (x) { return x.name === l.variant; })[0];
      return { i: i, line: l, product: p, variant: v, ok: !!(p && v && v.available && v.stock >= l.qty) };
    });
  }
  function shippingFor(subtotal, cat) {
    var s = cat.shipping || {};
    var free = s.freeAbove > 0 && subtotal >= s.freeAbove;
    return free ? 0 : s.flat || 0;
  }

  var cartEl = document.getElementById("cart");
  if (cartEl) {
    var renderCart = function (cat) {
      var rows = cartLines(cat);
      if (!rows.length) {
        cartEl.innerHTML = '<div class="empty-state"><h3>Seu carrinho está vazio.</h3><p>Que tal conhecer nossas meias bordadas, quadros e almofadas?</p><a class="btn" href="/produtos">Ir para a loja</a></div>';
        return;
      }
      var subtotal = rows.reduce(function (s, r) { return s + (r.product ? r.product.price * r.line.qty : 0); }, 0);
      var ship = shippingFor(subtotal, cat);
      var s = cat.shipping || {};
      var blocked = rows.some(function (r) { return !r.ok; });
      cartEl.innerHTML =
        '<div class="cart-layout"><div class="cart-lines">' + rows.map(function (r) {
          if (!r.product) {
            return '<div class="cart-line cart-line--off"><div class="cart-info"><strong>Produto indisponível</strong><p>Este item saiu da loja.</p></div><button class="link-btn" type="button" data-remove="' + r.i + '">Remover</button></div>';
          }
          var p = r.product;
          var warn = !r.variant || !r.variant.available ? "Esgotado — remova para continuar." : r.variant.stock < r.line.qty ? "Só temos " + r.variant.stock + " unidade(s)." : "";
          return '<div class="cart-line"><a class="photo photo--square photo--' + (CATEGORY_TONE[p.category] || "yellow") + '" href="/produto?id=' + encodeURIComponent(p.id) + '" data-label="" data-img="' + esc((p.images || [])[0] || "") + '" data-alt="' + esc(p.name) + '"></a>' +
            '<div class="cart-info"><a href="/produto?id=' + encodeURIComponent(p.id) + '"><strong>' + esc(p.name) + "</strong></a>" +
            (r.line.variant !== "Único" ? "<span>Tamanho: " + esc(r.line.variant) + "</span>" : "") +
            "<span>" + brl(p.price) + "</span>" + (warn ? '<span class="warn">' + warn + "</span>" : "") +
            '<div class="qty qty--sm"><button type="button" data-cart-step="-1" data-i="' + r.i + '" aria-label="Diminuir">−</button><span>' + r.line.qty + '</span><button type="button" data-cart-step="1" data-i="' + r.i + '" aria-label="Aumentar">+</button></div></div>' +
            '<div class="cart-side"><strong>' + brl(p.price * r.line.qty) + '</strong><button class="link-btn" type="button" data-remove="' + r.i + '">Remover</button></div></div>';
        }).join("") + "</div>" +
        '<aside class="summary"><h2>Resumo</h2>' +
        '<div class="sum-row"><span>Subtotal</span><span>' + brl(subtotal) + "</span></div>" +
        '<div class="sum-row"><span>Entrega</span><span>' + (ship ? brl(ship) : "Grátis") + "</span></div>" +
        (s.freeAbove > 0 && subtotal < s.freeAbove ? '<p class="sum-note">Faltam ' + brl(s.freeAbove - subtotal) + " para ganhar frete grátis.</p>" : "") +
        (s.pickup ? '<p class="sum-note">Também é possível escolher: ' + esc(s.pickup) + ".</p>" : "") +
        '<div class="sum-row sum-total"><span>Total</span><span>' + brl(subtotal + ship) + "</span></div>" +
        (cat.storeOpen === false ? '<p class="warn">As vendas pelo site estão pausadas no momento.</p>' : "") +
        '<a class="btn btn--grow' + (blocked || cat.storeOpen === false ? " is-disabled" : "") + '" href="/checkout"' + (blocked || cat.storeOpen === false ? ' aria-disabled="true"' : "") + ">Finalizar compra</a>" +
        '<a class="btn btn--ghost btn--grow" href="/produtos">Continuar comprando</a>' +
        '<p class="secure-note">Pagamento seguro pelo Mercado Pago: Pix, cartão ou boleto.</p></aside></div>';
      finalize(cartEl);
    };
    cartEl.innerHTML = '<p class="loading">Carregando carrinho…</p>';
    catalog().then(function (cat) {
      renderCart(cat);
      cartEl.addEventListener("click", function (e) {
        var rm = e.target.closest("[data-remove]");
        var st = e.target.closest("[data-cart-step]");
        var dis = e.target.closest(".is-disabled");
        if (dis) { e.preventDefault(); return; }
        if (rm) { Cart.setQty(Number(rm.getAttribute("data-remove")), 0); renderCart(cat); }
        if (st) {
          var i = Number(st.getAttribute("data-i"));
          var l = Cart.get()[i];
          var row = cartLines(cat)[i];
          var next = l.qty + Number(st.getAttribute("data-cart-step"));
          if (row.variant && next > row.variant.stock) { toast("Temos apenas " + row.variant.stock + " unidade(s) desse item."); return; }
          Cart.setQty(i, next);
          renderCart(cat);
        }
      });
    });
  }

  /* ---------- checkout ---------- */
  var checkoutEl = document.getElementById("checkout");
  if (checkoutEl) {
    catalog().then(function (cat) {
      var rows = cartLines(cat).filter(function (r) { return r.product; });
      if (!rows.length) { location.replace("/carrinho"); return; }
      var subtotal = rows.reduce(function (s, r) { return s + r.product.price * r.line.qty; }, 0);
      var s = cat.shipping || {};
      var deliveryPrice = shippingFor(subtotal, cat);
      var draft = {};
      try { draft = JSON.parse(localStorage.getItem("dl_checkout") || "{}"); } catch (e) {}
      var d = function (k) { return esc(draft[k] || ""); };

      checkoutEl.innerHTML =
        '<form class="checkout-layout" id="checkout-form" novalidate><div class="checkout-main">' +
        '<fieldset><legend>Seus dados</legend>' +
        '<div class="field"><label for="f-name">Nome completo</label><input id="f-name" name="name" autocomplete="name" required value="' + d("name") + '"></div>' +
        '<div class="field-row"><div class="field"><label for="f-email">E-mail</label><input id="f-email" name="email" type="email" autocomplete="email" required value="' + d("email") + '"></div>' +
        '<div class="field"><label for="f-phone">Celular com DDD</label><input id="f-phone" name="phone" type="tel" autocomplete="tel" inputmode="tel" placeholder="(11) 99999-9999" required value="' + d("phone") + '"></div></div>' +
        '<div class="field"><label for="f-cpf">CPF</label><input id="f-cpf" name="cpf" inputmode="numeric" placeholder="000.000.000-00" required value="' + d("cpf") + '"><small>Necessário para o pagamento e para a nota de envio.</small></div>' +
        "</fieldset>" +
        '<fieldset><legend>Entrega</legend><div class="ship-options">' +
        '<label class="ship-opt"><input type="radio" name="shipping" value="entrega" checked><span><strong>Entrega em casa</strong><em>' + (deliveryPrice ? brl(deliveryPrice) : "Frete grátis") + "</em></span></label>" +
        (s.pickup ? '<label class="ship-opt"><input type="radio" name="shipping" value="retirada"><span><strong>' + esc(s.pickup) + "</strong><em>Grátis</em></span></label>" : "") +
        "</div>" +
        '<div id="address-fields">' +
        '<div class="field-row"><div class="field field--sm"><label for="f-cep">CEP</label><input id="f-cep" name="cep" inputmode="numeric" autocomplete="postal-code" placeholder="00000-000" value="' + d("cep") + '"></div>' +
        '<div class="field"><label for="f-street">Rua</label><input id="f-street" name="street" autocomplete="address-line1" value="' + d("street") + '"></div></div>' +
        '<div class="field-row"><div class="field field--sm"><label for="f-number">Número</label><input id="f-number" name="number" value="' + d("number") + '"></div>' +
        '<div class="field"><label for="f-complement">Complemento (opcional)</label><input id="f-complement" name="complement" autocomplete="address-line2" value="' + d("complement") + '"></div></div>' +
        '<div class="field-row"><div class="field"><label for="f-district">Bairro</label><input id="f-district" name="district" value="' + d("district") + '"></div>' +
        '<div class="field"><label for="f-city">Cidade</label><input id="f-city" name="city" autocomplete="address-level2" value="' + d("city") + '"></div>' +
        '<div class="field field--xs"><label for="f-state">UF</label><input id="f-state" name="state" maxlength="2" autocomplete="address-level1" value="' + d("state") + '"></div></div>' +
        "</div></fieldset>" +
        '<fieldset><legend>Observações (opcional)</legend><div class="field"><label for="f-notes" class="sr-only">Observações</label><textarea id="f-notes" name="notes" rows="3" placeholder="É para presente? Quer deixar um recado?"></textarea></div></fieldset>' +
        "</div>" +
        '<aside class="summary"><h2>Seu pedido</h2>' + rows.map(function (r) {
          return '<div class="sum-item"><span>' + r.line.qty + "× " + esc(r.product.name) + (r.line.variant !== "Único" ? " <small>(" + esc(r.line.variant) + ")</small>" : "") + "</span><span>" + brl(r.product.price * r.line.qty) + "</span></div>";
        }).join("") +
        '<div class="sum-row"><span>Subtotal</span><span>' + brl(subtotal) + "</span></div>" +
        '<div class="sum-row"><span>Entrega</span><span id="sum-ship"></span></div>' +
        '<div class="sum-row sum-total"><span>Total</span><span id="sum-total"></span></div>' +
        '<p class="form-error" id="form-error" role="alert" hidden></p>' +
        '<button class="btn btn--grow" type="submit" id="pay-btn">Ir para o pagamento</button>' +
        '<p class="secure-note">Você será levado ao ambiente seguro do Mercado Pago para pagar com Pix, cartão ou boleto. Não guardamos dados do seu cartão.</p>' +
        "</aside></form>";

      var form = checkoutEl.querySelector("#checkout-form");
      var addr = checkoutEl.querySelector("#address-fields");
      var errEl = checkoutEl.querySelector("#form-error");
      var payBtn = checkoutEl.querySelector("#pay-btn");
      var method = function () { return form.querySelector('input[name="shipping"]:checked').value; };
      var updateTotals = function () {
        var ship = method() === "retirada" ? 0 : deliveryPrice;
        addr.hidden = method() === "retirada";
        checkoutEl.querySelector("#sum-ship").textContent = ship ? brl(ship) : "Grátis";
        checkoutEl.querySelector("#sum-total").textContent = brl(subtotal + ship);
      };
      updateTotals();
      form.addEventListener("change", function (e) { if (e.target.name === "shipping") updateTotals(); });

      var mask = function (el, fn) { el.addEventListener("input", function () { el.value = fn(el.value.replace(/\D/g, "")); }); };
      mask(form.cpf, function (v) { v = v.slice(0, 11); return v.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2"); });
      mask(form.cep, function (v) { v = v.slice(0, 8); return v.length > 5 ? v.slice(0, 5) + "-" + v.slice(5) : v; });
      mask(form.phone, function (v) { v = v.slice(0, 11); return v.length > 10 ? "(" + v.slice(0, 2) + ") " + v.slice(2, 7) + "-" + v.slice(7) : v.length > 6 ? "(" + v.slice(0, 2) + ") " + v.slice(2, 6) + "-" + v.slice(6) : v.length > 2 ? "(" + v.slice(0, 2) + ") " + v.slice(2) : v; });
      form.state.addEventListener("input", function () { form.state.value = form.state.value.toUpperCase().replace(/[^A-Z]/g, ""); });

      // busca de endereço pelo CEP (ViaCEP)
      form.cep.addEventListener("input", function () {
        var cep = form.cep.value.replace(/\D/g, "");
        if (cep.length !== 8) return;
        fetch("https://viacep.com.br/ws/" + cep + "/json/").then(function (r) { return r.json(); }).then(function (a) {
          if (a.erro) return;
          if (a.logradouro) form.street.value = a.logradouro;
          if (a.bairro) form.district.value = a.bairro;
          if (a.localidade) form.city.value = a.localidade;
          if (a.uf) form.state.value = a.uf;
          form.number.focus();
        }).catch(function () {});
      });

      form.addEventListener("submit", function (e) {
        e.preventDefault();
        errEl.hidden = true;
        var f = form.elements;
        var values = {};
        ["name", "email", "phone", "cpf", "cep", "street", "number", "complement", "district", "city", "state"].forEach(function (k) { values[k] = f[k].value.trim(); });
        try { localStorage.setItem("dl_checkout", JSON.stringify(values)); } catch (err) {}
        var payload = {
          items: Cart.get(),
          shipping: method(),
          notes: f.notes.value,
          customer: {
            name: values.name, email: values.email, phone: values.phone, cpf: values.cpf,
            address: { cep: values.cep, street: values.street, number: values.number, complement: values.complement, district: values.district, city: values.city, state: values.state }
          }
        };
        payBtn.disabled = true;
        payBtn.textContent = "Preparando pagamento…";
        api("/api/checkout", { method: "POST", body: payload }).then(function (r) {
          try { sessionStorage.setItem("dl_last_order", r.orderId); } catch (err) {}
          location.href = r.paymentUrl;
        }).catch(function (err) {
          errEl.textContent = err.message;
          errEl.hidden = false;
          payBtn.disabled = false;
          payBtn.textContent = "Ir para o pagamento";
        });
      });
    });
  }

  /* ---------- status do pedido ---------- */
  var orderEl = document.getElementById("order");
  if (orderEl) {
    var params = "id=" + encodeURIComponent(qs("id")) + "&t=" + encodeURIComponent(qs("t")) + (qs("payment_id") ? "&payment_id=" + encodeURIComponent(qs("payment_id")) : "");
    orderEl.innerHTML = '<p class="loading">Buscando seu pedido…</p>';
    api("/api/order?" + params).then(function (o) {
      var paid = ["pago", "em_preparacao", "enviado", "entregue"].indexOf(o.status) !== -1;
      if (paid) Cart.clear();
      var titles = {
        pago: "Pedido confirmado! Obrigada, " + esc(o.firstName) + ".",
        em_preparacao: "Seu pedido está sendo preparado.",
        enviado: "Seu pedido está a caminho!",
        entregue: "Pedido entregue.",
        aguardando_pagamento: "Estamos aguardando a confirmação do pagamento.",
        pagamento_recusado: "O pagamento não foi aprovado.",
        cancelado: "Este pedido foi cancelado."
      };
      var texts = {
        pago: "Recebemos seu pagamento. A Débora vai separar e conferir cada peça com atenção antes do envio.",
        aguardando_pagamento: "Se você pagou com Pix ou boleto, a confirmação pode levar alguns minutos (boleto: até 3 dias úteis). Esta página mostra o status atualizado sempre que você voltar.",
        pagamento_recusado: "Nenhum valor foi cobrado. Você pode tentar novamente com outra forma de pagamento.",
        enviado: o.trackingCode ? "Código de rastreio: <strong>" + esc(o.trackingCode) + "</strong>" : "Em breve você recebe o código de rastreio."
      };
      orderEl.innerHTML =
        '<div class="order-box"><span class="status status--' + o.status + '">' + esc(o.statusLabel) + "</span>" +
        "<h1>" + (titles[o.status] || esc(o.statusLabel)) + "</h1>" +
        (texts[o.status] ? '<p class="lead">' + texts[o.status] + "</p>" : "") +
        '<p class="order-id">Pedido <strong>' + esc(o.id) + "</strong> · " + new Date(o.createdAt).toLocaleDateString("pt-BR") + "</p>" +
        '<div class="summary summary--flat">' + o.lines.map(function (l) {
          return '<div class="sum-item"><span>' + l.qty + "× " + esc(l.name) + (l.variant !== "Único" ? " <small>(" + esc(l.variant) + ")</small>" : "") + "</span><span>" + brl(l.unitPrice * l.qty) + "</span></div>";
        }).join("") +
        '<div class="sum-row"><span>' + esc(o.shipping.label) + "</span><span>" + (o.shipping.price ? brl(o.shipping.price) : "Grátis") + "</span></div>" +
        '<div class="sum-row sum-total"><span>Total</span><span>' + brl(o.total) + "</span></div></div>" +
        '<div class="btn-row">' +
        (o.status === "pagamento_recusado" ? '<a class="btn" href="/checkout">Tentar novamente</a>' : '<a class="btn" href="/produtos">Continuar comprando</a>') +
        '<a class="btn btn--whats" data-link="whatsapp" data-msg="' + esc("Olá, Débora! Quero falar sobre o meu pedido " + o.id + ".") + '" href="/contato">' + ICON_WHATS + "Falar sobre meu pedido</a></div>" +
        '<p class="sum-note">Guarde o link desta página para acompanhar seu pedido.</p></div>';
      finalize(orderEl);
    }).catch(function (err) {
      orderEl.innerHTML = '<div class="empty-state"><h3>Não encontramos este pedido.</h3><p>' + esc(err.message) + '</p><a class="btn btn--whats" data-link="whatsapp" href="/contato">Falar com a Decaleca</a></div>';
      finalize(orderEl);
    });
  }

  updateBadge();
  window.addEventListener("storage", updateBadge);
  finalize(document);
})();

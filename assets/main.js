/* ============================================================
   DECALECA — comportamento do site
   ============================================================ */
(function () {
  "use strict";
  document.documentElement.classList.remove("no-js");

  var CFG = window.DECALECA_CONFIG || {};
  var CAT = window.DECALECA_CATALOG || { collections: [], products: [] };
  var page = document.body.getAttribute("data-page") || "";

  var ICON_WHATS = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.15h-.01a8.23 8.23 0 0 1-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.25-8.23 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.82c0 4.54-3.7 8.23-8.22 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.43-.06-.13-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.28Z"/></svg>';
  var ICON_MENU = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 8h16M4 16h16"/></svg>';
  var ICON_CLOSE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ---------- links oficiais ---------- */
  function whatsUrl(msg) {
    if (!CFG.whatsapp) return null;
    var text = msg || CFG.whatsappMessage || "";
    if (!text) return CFG.whatsapp;
    return CFG.whatsapp + (CFG.whatsapp.indexOf("?") === -1 ? "?" : "&") + "text=" + encodeURIComponent(text);
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
      if (url) {
        a.href = url;
        a.target = "_blank";
        a.rel = "noopener";
      } else {
        // Link oficial ainda não configurado em assets/config.js
        a.href = page === "contato" ? "#canais" : "/contato#canais";
        a.removeAttribute("target");
      }
    });
  }

  /* ---------- header & footer ---------- */
  var NAV = [
    { href: "/", label: "Início", id: "inicio" },
    { href: "/nossa-historia", label: "Nossa História", id: "historia" },
    { href: "/produtos#meias", label: "Meias Bordadas", id: "meias" },
    { href: "/produtos#quadros", label: "Quadros Infantis", id: "quadros" },
    { href: "/contato", label: "Contato", id: "contato" }
  ];
  function navLinks(cls) {
    return NAV.map(function (n) {
      var current = n.id === page || (page === "produtos" && n.id === "meias");
      return '<a class="' + (cls || "") + '" href="' + n.href + '"' + (current && n.id === page ? ' aria-current="page"' : "") + ">" + n.label + "</a>";
    }).join("");
  }
  var LOGO = '<a class="logo" href="/" aria-label="Decaleca — início"><img src="/assets/logo.webp" alt="Decaleca" width="420" height="312"></a>';

  var LOGO_HEADER = '<a class="logo logo--header" href="/" aria-label="Decaleca — início"><img src="/assets/logo-square.png" alt="Decaleca" width="480" height="480"></a>';

  var header = document.getElementById("site-header");
  if (header) {
    header.className = "site-header";
    header.innerHTML =
      '<div class="container header-inner">' + LOGO_HEADER +
      '<nav class="nav" aria-label="Principal">' + navLinks() + "</nav>" +
      '<div class="header-actions">' +
      '<a class="ml-link" data-link="ml" href="/contato">Mercado Livre</a>' +
      '<a class="btn btn--whats btn--sm" data-link="whatsapp" href="/contato">' + ICON_WHATS + "Comprar pelo WhatsApp</a>" +
      '<button class="menu-toggle" type="button" aria-expanded="false" aria-controls="mobile-menu" aria-label="Abrir menu">' + ICON_MENU + "</button>" +
      "</div></div>" +
      '<div class="mobile-menu" id="mobile-menu">' + navLinks("m-link") +
      '<a class="btn btn--whats" data-link="whatsapp" href="/contato">' + ICON_WHATS + "Comprar pelo WhatsApp</a>" +
      '<a class="btn btn--ghost" data-link="ml" href="/contato">Comprar no Mercado Livre</a>' +
      '<a class="btn btn--ghost" data-link="clube" href="/contato">Entrar no Clube da Decaleca</a>' +
      "</div>";

    var toggle = header.querySelector(".menu-toggle");
    var menu = header.querySelector(".mobile-menu");
    function setMenu(open) {
      menu.classList.toggle("open", open);
      document.body.classList.toggle("menu-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
      toggle.innerHTML = open ? ICON_CLOSE : ICON_MENU;
    }
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
      "<p>Meias bordadas e quadros infantis com ilustrações exclusivas, criados para vestir, decorar e fazer parte das lembranças da sua família.</p></div>" +
      '<div class="footer-col"><h4>Explore</h4><ul>' +
      '<li><a href="/produtos#meias">Meias Bordadas</a></li>' +
      '<li><a href="/produtos#quadros">Quadros Infantis</a></li>' +
      '<li><a href="/nossa-historia">Nossa História</a></li>' +
      '<li><a href="/contato">Contato</a></li></ul></div>' +
      '<div class="footer-col"><h4>Fale com a gente</h4><ul>' +
      '<li><a data-link="whatsapp" href="/contato">WhatsApp</a></li>' +
      '<li><a data-link="ml" href="/contato">Mercado Livre</a></li>' +
      '<li><a data-link="instagram" href="/contato">Instagram</a></li>' +
      '<li><a data-link="clube" href="/contato">Clube da Decaleca</a></li></ul></div>' +
      "</div>" +
      '<div class="footer-bottom"><span>© ' + new Date().getFullYear() + " Decaleca. Todos os direitos reservados.</span>" +
      "<span>Ilustrações exclusivas por Ludmita.</span></div></div>";
  }

  if (!document.querySelector(".float-whats")) {
    var fw = document.createElement("a");
    fw.className = "float-whats";
    fw.setAttribute("data-link", "whatsapp");
    fw.setAttribute("aria-label", "Conversar com a Decaleca pelo WhatsApp");
    fw.href = "/contato";
    fw.innerHTML = ICON_WHATS;
    document.body.appendChild(fw);
  }

  /* ---------- slots de foto: usa a imagem real se existir em /images ---------- */
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
      if (el.querySelector("img")) return;
      loadPhoto(el, el.getAttribute("data-img"));
    });
  }

  /* ---------- catálogo ---------- */
  var CATEGORY_LABEL = { meias: "Meias Bordadas", quadros: "Quadros Infantis" };
  var products = (CAT.products || []).filter(function (p) { return p && p.available !== false; });
  var collections = CAT.collections || [];
  function collectionName(id) {
    var c = collections.filter(function (c) { return c.id === id; })[0];
    return c ? c.name : "";
  }

  function productCard(p) {
    var cover = (p.images || [])[0] || "";
    var sizes = (p.sizes || []).join(" · ");
    var msg = "Olá, Débora! Tenho interesse no produto \"" + p.name + "\" que vi no site da Decaleca.";
    var mlBtn = p.mercadoLivre
      ? '<a class="btn btn--ghost btn--sm" href="' + esc(p.mercadoLivre) + '" target="_blank" rel="noopener">Comprar no Mercado Livre</a>'
      : "";
    return (
      '<article class="product-card reveal">' +
      '<div class="photo photo--' + (p.category === "quadros" ? "blue" : "yellow") + '" data-label="Foto do produto" role="button" tabindex="0" data-open="' + esc(p.id) + '" aria-label="Ver detalhes de ' + esc(p.name) + '" data-img="' + esc(cover) + '" data-alt="' + esc(p.name) + '"></div>' +
      '<span class="p-cat">' + esc(CATEGORY_LABEL[p.category] || p.category || "") + (p.collection ? " · " + esc(collectionName(p.collection)) : "") + "</span>" +
      "<h3>" + esc(p.name) + "</h3>" +
      (p.description ? "<p>" + esc(p.description) + "</p>" : "") +
      '<div class="p-meta">' + (p.price ? '<span class="p-price">' + esc(p.price) + "</span>" : "") + (sizes ? "<span>" + esc(sizes) + "</span>" : "") + "</div>" +
      '<div class="p-actions">' +
      '<button class="btn btn--sm" type="button" data-open="' + esc(p.id) + '">Ver produto</button>' +
      '<a class="btn btn--whats btn--sm" data-link="whatsapp" data-msg="' + esc(msg) + '" href="/contato">' + ICON_WHATS + "Consultar pelo WhatsApp</a>" +
      mlBtn + "</div></article>"
    );
  }

  function emptyState(title, text) {
    return (
      '<div class="empty-state"><h3>' + title + "</h3><p>" + text + "</p>" +
      '<div class="btn-row" style="justify-content:center;margin-top:0">' +
      '<a class="btn btn--whats" data-link="whatsapp" href="/contato">' + ICON_WHATS + "Conversar pelo WhatsApp</a>" +
      '<a class="btn btn--ghost" data-link="ml" href="/contato">Ver no Mercado Livre</a></div></div>'
    );
  }

  function finalize(root) { applyLinks(root); initPhotos(root); observeReveal(root); }

  // vitrine da home
  var featured = document.getElementById("featured-products");
  if (featured) {
    var feat = products.filter(function (p) { return p.featured; });
    if (!feat.length) feat = products.slice(0, 4);
    featured.innerHTML = feat.length
      ? '<div class="product-grid product-grid--4">' + feat.slice(0, 8).map(productCard).join("") + "</div>"
      : emptyState("Nossas coleções estão chegando ao site.", "Enquanto isso, fale com a Débora pelo WhatsApp para conhecer as peças disponíveis ou visite nossa loja no Mercado Livre.");
    finalize(featured);
  }

  // coleções
  var collWrap = document.getElementById("collections");
  if (collWrap) {
    if (collections.length) {
      collWrap.innerHTML = '<div class="collections">' + collections.map(function (c, i) {
        var tone = ["yellow", "blue", "green"][i % 3];
        return '<div class="collection reveal"><div class="photo photo--wide photo--' + tone + '" data-label="Ilustração ou foto da coleção" data-img="' + esc(c.image || "") + '" data-alt="Coleção ' + esc(c.name) + '"></div>' +
          '<div><span class="eyebrow">Coleção</span><h3>' + esc(c.name) + "</h3>" + (c.description ? '<p class="lead">' + esc(c.description) + "</p>" : "") +
          '<button class="link-arrow" style="background:none;border-top:0;border-left:0;border-right:0;cursor:pointer;font:inherit;font-weight:600;padding:0 0 2px" type="button" data-filter-collection="' + esc(c.id) + '">Ver peças da coleção</button></div></div>';
      }).join("") + "</div>";
    } else {
      collWrap.innerHTML = '<p class="lead">As coleções aparecerão aqui assim que forem cadastradas. Para conhecer as novidades antes de todo mundo, entre para o <a data-link="clube" href="/contato">Clube da Decaleca</a>.</p>';
    }
    finalize(collWrap);
  }

  // grade com filtros
  var grid = document.getElementById("product-grid");
  var filtersEl = document.getElementById("filters");
  var state = { categoria: "", colecao: "", tamanho: "" };

  function uniq(arr) { return arr.filter(function (v, i) { return v && arr.indexOf(v) === i; }); }

  function renderFilters() {
    if (!filtersEl) return;
    var groups = [];
    var cats = uniq(products.map(function (p) { return p.category; }));
    var cols = uniq(products.map(function (p) { return p.collection; }));
    var sizes = uniq([].concat.apply([], products.map(function (p) { return p.sizes || []; })));
    function group(key, label, values, labeler) {
      if (values.length < 2) return "";
      return '<div class="filter-group"><label>' + label + '</label><div class="chip-row">' +
        '<button class="chip" type="button" data-f="' + key + '" data-v="" aria-pressed="' + (state[key] === "") + '">Todos</button>' +
        values.map(function (v) {
          return '<button class="chip" type="button" data-f="' + key + '" data-v="' + esc(v) + '" aria-pressed="' + (state[key] === v) + '">' + esc(labeler ? labeler(v) : v) + "</button>";
        }).join("") + "</div></div>";
    }
    groups.push(group("categoria", "Categoria", cats, function (v) { return CATEGORY_LABEL[v] || v; }));
    groups.push(group("colecao", "Coleção", cols, collectionName));
    groups.push(group("tamanho", "Tamanho", sizes));
    filtersEl.innerHTML = groups.join("");
    filtersEl.hidden = !filtersEl.innerHTML;
  }

  function renderGrid() {
    if (!grid) return;
    var list = products.filter(function (p) {
      return (!state.categoria || p.category === state.categoria) &&
        (!state.colecao || p.collection === state.colecao) &&
        (!state.tamanho || (p.sizes || []).indexOf(state.tamanho) !== -1);
    });
    if (!products.length) {
      grid.innerHTML = emptyState("Novas peças a caminho do site.", "Nosso catálogo online está sendo preparado. Fale com a Débora pelo WhatsApp para ver o que está disponível agora, ou visite a loja no Mercado Livre.");
    } else if (!list.length) {
      grid.innerHTML = '<p class="lead">Nenhuma peça encontrada com esses filtros.</p>';
    } else {
      grid.innerHTML = '<div class="product-grid">' + list.map(productCard).join("") + "</div>";
    }
    finalize(grid);
  }

  if (grid) {
    // atalho por âncora: /produtos#meias ou #quadros
    function fromHash() {
      var h = location.hash.replace("#", "");
      if (h === "meias" || h === "quadros") {
        if (products.some(function (p) { return p.category === h; })) state.categoria = h;
      }
    }
    fromHash();
    renderFilters();
    renderGrid();
    window.addEventListener("hashchange", function () { fromHash(); renderFilters(); renderGrid(); });
    if (filtersEl) {
      filtersEl.addEventListener("click", function (e) {
        var b = e.target.closest("[data-f]");
        if (!b) return;
        state[b.getAttribute("data-f")] = b.getAttribute("data-v");
        renderFilters();
        renderGrid();
      });
    }
    document.querySelectorAll("[data-cat-link]").forEach(function (a) {
      a.addEventListener("click", function () {
        var c = a.getAttribute("data-cat-link");
        if (products.some(function (p) { return p.category === c; })) {
          state = { categoria: c, colecao: "", tamanho: "" };
          renderFilters();
          renderGrid();
        }
      });
    });
    document.addEventListener("click", function (e) {
      var b = e.target.closest("[data-filter-collection]");
      if (!b) return;
      state = { categoria: "", colecao: b.getAttribute("data-filter-collection"), tamanho: "" };
      renderFilters();
      renderGrid();
      document.getElementById("catalogo").scrollIntoView({ behavior: "smooth" });
    });
  }

  /* ---------- detalhe do produto (modal) ---------- */
  var modal;
  function openProduct(id) {
    var p = products.filter(function (x) { return x.id === id; })[0];
    if (!p) return;
    if (!modal) {
      modal = document.createElement("dialog");
      modal.className = "modal";
      document.body.appendChild(modal);
      modal.addEventListener("click", function (e) { if (e.target === modal || e.target.closest(".modal-close")) modal.close(); });
    }
    var imgs = p.images || [];
    var coll = collectionName(p.collection);
    var msg = "Olá, Débora! Quero este produto: \"" + p.name + "\"" + ((p.sizes || []).length ? " (tamanho: ___)" : "") + ". Pode confirmar a disponibilidade?";
    modal.innerHTML =
      '<button class="modal-close" type="button" aria-label="Fechar">×</button>' +
      '<div class="modal-inner"><div>' +
      '<div class="photo gallery-main" data-label="Foto do produto" data-img="' + esc(imgs[0] || "") + '" data-alt="' + esc(p.name) + '"></div>' +
      (imgs.length > 1 ? '<div class="gallery-thumbs">' + imgs.map(function (src, i) {
        return '<button type="button" data-src="' + esc(src) + '" aria-current="' + (i === 0) + '" aria-label="Foto ' + (i + 1) + '"><img src="' + esc(src) + '" alt="" loading="lazy"></button>';
      }).join("") + "</div>" : "") +
      "</div><div>" +
      '<span class="eyebrow">' + esc(CATEGORY_LABEL[p.category] || "") + "</span>" +
      "<h2>" + esc(p.name) + "</h2>" +
      (coll ? '<p class="lead">Uma peça da coleção ' + esc(coll) + ", com ilustração exclusiva e detalhes que dão personalidade a cada momento.</p>" : "") +
      (p.description ? "<p>" + esc(p.description) + "</p>" : "") +
      '<ul class="detail-list">' +
      (p.price ? "<li><strong>Preço</strong> " + esc(p.price) + "</li>" : "") +
      ((p.sizes || []).length ? "<li><strong>Tamanhos</strong> " + esc(p.sizes.join(" · ")) + "</li>" : "") +
      (p.care ? "<li><strong>Cuidados</strong> " + esc(p.care) + "</li>" : "") +
      "</ul>" +
      "<p>Escolha sua variação preferida e fale com a gente para confirmar a disponibilidade.</p>" +
      '<div class="btn-row">' +
      '<a class="btn btn--whats" data-link="whatsapp" data-msg="' + esc(msg) + '" href="/contato">' + ICON_WHATS + "Quero este produto</a>" +
      (p.mercadoLivre ? '<a class="btn btn--ghost" href="' + esc(p.mercadoLivre) + '" target="_blank" rel="noopener">Comprar no Mercado Livre</a>' : "") +
      "</div></div></div>";
    applyLinks(modal);
    initPhotos(modal);
    modal.querySelectorAll(".gallery-thumbs button").forEach(function (b) {
      b.addEventListener("click", function () {
        var main = modal.querySelector(".gallery-main");
        var img = main.querySelector("img");
        if (img) img.src = b.getAttribute("data-src"); else loadPhoto(main, b.getAttribute("data-src"), p.name);
        modal.querySelectorAll(".gallery-thumbs button").forEach(function (x) { x.setAttribute("aria-current", String(x === b)); });
      });
    });
    if (modal.showModal) modal.showModal(); else modal.setAttribute("open", "");
  }
  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-open]");
    if (t) openProduct(t.getAttribute("data-open"));
  });
  document.addEventListener("keydown", function (e) {
    if ((e.key === "Enter" || e.key === " ") && e.target.matches && e.target.matches(".photo[data-open]")) {
      e.preventDefault();
      openProduct(e.target.getAttribute("data-open"));
    }
  });

  /* ---------- animação de entrada (leve) ---------- */
  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
  }, { rootMargin: "0px 0px -40px 0px" }) : null;
  function observeReveal(root) {
    (root || document).querySelectorAll(".reveal:not(.in)").forEach(function (el) {
      if (io) io.observe(el); else el.classList.add("in");
    });
  }

  applyLinks(document);
  initPhotos(document);
  observeReveal(document);
})();

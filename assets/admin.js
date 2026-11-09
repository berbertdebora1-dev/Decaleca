/* Painel administrativo Decaleca */
(function () {
  "use strict";
  var app = document.getElementById("admin-app");
  var CATS = { meias: "Meias Bordadas", quadros: "Quadros", almofadas: "Almofadas" };
  var D = null;            // dados do painel
  var tab = "pedidos";
  var filter = { status: "", q: "" };

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function brl(c) { return (Number(c || 0) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }
  function money(c) { return (Number(c || 0) / 100).toFixed(2).replace(".", ","); }
  function cents(str) {
    var s = String(str || "").replace(/[^\d,.-]/g, "");
    if (s.indexOf(",") !== -1) s = s.replace(/\./g, "").replace(",", ".");
    return Math.round((parseFloat(s) || 0) * 100);
  }
  function date(iso) { return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }); }
  function api(action, body) {
    return fetch("/api/admin?action=" + action, {
      method: body ? "POST" : "GET",
      headers: body ? { "Content-Type": "application/json", "X-Requested-With": "decaleca-admin" } : {},
      body: body ? JSON.stringify(body) : undefined,
      credentials: "same-origin"
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (d) {
        if (r.status === 401 && action !== "login") { showLogin(); throw new Error(d.error || "Sessão expirada."); }
        if (!r.ok) throw new Error(d.error || "Erro ao salvar.");
        return d;
      });
    });
  }
  function msg(el, text, isErr) { if (!el) return; el.textContent = text; el.classList.toggle("err", !!isErr); }

  /* ---------- login ---------- */
  function showLogin(error) {
    app.innerHTML =
      '<div class="adm-login"><form id="login"><img src="/assets/logo-square.png" alt="Decaleca">' +
      '<h1 style="font-size:1.8rem">Painel da loja</h1>' +
      '<div class="field"><label for="pw">Senha</label><input id="pw" type="password" autocomplete="current-password" required autofocus></div>' +
      '<p class="adm-msg err" id="login-msg">' + esc(error || "") + "</p>" +
      '<button class="btn btn--grow" type="submit">Entrar</button></form></div>';
    app.querySelector("#login").addEventListener("submit", function (e) {
      e.preventDefault();
      var m = app.querySelector("#login-msg");
      msg(m, "");
      api("login", { password: app.querySelector("#pw").value }).then(load).catch(function (err) { msg(m, err.message, true); });
    });
  }

  function load() {
    return api("dashboard").then(function (d) { D = d; render(); }).catch(function (e) {
      if (!app.querySelector("#login")) app.innerHTML = '<div class="adm-main"><div class="adm-alert"><strong>Não foi possível carregar o painel.</strong>' + esc(e.message) + "</div></div>";
    });
  }

  /* ---------- estrutura ---------- */
  var TABS = [["pedidos", "Pedidos"], ["produtos", "Produtos"], ["colecoes", "Coleções"], ["config", "Configurações"]];
  function render(inner) {
    app.innerHTML =
      '<header class="adm-top"><div class="adm-top-inner"><img src="/assets/logo-square.png" alt=""><strong>Painel</strong>' +
      '<nav class="adm-tabs" role="tablist">' + TABS.map(function (t) {
        return '<button type="button" role="tab" data-tab="' + t[0] + '" aria-selected="' + (tab === t[0]) + '">' + t[1] + "</button>";
      }).join("") + "</nav>" +
      '<a class="link-btn" href="/" target="_blank">Ver site</a><button class="link-btn" type="button" id="logout">Sair</button></div></header>' +
      '<main class="adm-main" id="adm-main"></main>';
    app.querySelectorAll("[data-tab]").forEach(function (b) {
      b.addEventListener("click", function () { tab = b.getAttribute("data-tab"); render(); });
    });
    app.querySelector("#logout").addEventListener("click", function () { api("logout", {}).then(function () { showLogin(); }); });
    var main = app.querySelector("#adm-main");
    if (inner) return inner(main);
    ({ pedidos: ordersView, produtos: productsView, colecoes: collectionsView, config: settingsView })[tab](main);
  }

  function setupAlerts() {
    var out = "";
    if (!D.config.payments) out += '<div class="adm-alert"><strong>Pagamentos ainda não ativados.</strong>Adicione a variável MP_ACCESS_TOKEN (Mercado Pago) na Vercel para que os clientes consigam pagar. Veja o README.</div>';
    if (!D.config.uploads) out += '<div class="adm-alert"><strong>Envio de fotos não ativado.</strong>Conecte um Vercel Blob ao projeto para enviar fotos pelo painel.</div>';
    return out;
  }

  /* ---------- pedidos ---------- */
  function ordersView(main) {
    var orders = D.orders;
    var paidStates = ["pago", "em_preparacao", "enviado", "entregue"];
    var month = new Date().toISOString().slice(0, 7);
    var paidMonth = orders.filter(function (o) { return paidStates.indexOf(o.status) !== -1 && o.createdAt.slice(0, 7) === month; });
    var toShip = orders.filter(function (o) { return o.status === "pago" || o.status === "em_preparacao"; }).length;
    var list = orders.filter(function (o) {
      if (filter.status && o.status !== filter.status) return false;
      if (!filter.status && o.status === "aguardando_pagamento" && Date.now() - new Date(o.createdAt) > 7 * 864e5) return false;
      if (filter.q) {
        var q = filter.q.toLowerCase();
        return (o.id + " " + o.customer.name + " " + o.customer.email).toLowerCase().indexOf(q) !== -1;
      }
      return true;
    });
    main.innerHTML = setupAlerts() +
      '<div class="adm-head"><h1>Pedidos</h1></div>' +
      '<div class="adm-stats">' +
      '<div class="adm-stat"><span>Para enviar</span><b>' + toShip + "</b></div>" +
      '<div class="adm-stat"><span>Vendas no mês</span><b>' + paidMonth.length + "</b></div>" +
      '<div class="adm-stat"><span>Faturado no mês</span><b>' + brl(paidMonth.reduce(function (s, o) { return s + o.total; }, 0)) + "</b></div></div>" +
      '<div class="adm-filters"><select id="f-status"><option value="">Todos (recentes)</option>' +
      Object.keys(D.statuses).map(function (k) { return '<option value="' + k + '"' + (filter.status === k ? " selected" : "") + ">" + D.statuses[k] + "</option>"; }).join("") +
      '</select><input id="f-q" type="search" placeholder="Buscar nome, e-mail ou nº" value="' + esc(filter.q) + '"></div>' +
      (list.length ? '<div class="adm-list">' + list.map(function (o) {
        return '<button class="adm-row" type="button" data-order="' + esc(o.id) + '"><div><strong>' + esc(o.customer.name) + "</strong><br><small>" + esc(o.id) + " · " + date(o.createdAt) + " · " + o.lines.reduce(function (s, l) { return s + l.qty; }, 0) + " item(ns)</small></div>" +
          '<div style="text-align:right"><strong>' + brl(o.total) + '</strong><br><span class="status status--' + o.status + '">' + esc(D.statuses[o.status]) + "</span></div></button>";
      }).join("") + "</div>" : '<div class="adm-empty">Nenhum pedido por aqui ainda.</div>');
    main.querySelector("#f-status").addEventListener("change", function (e) { filter.status = e.target.value; ordersView(main); });
    var qEl = main.querySelector("#f-q");
    qEl.addEventListener("input", function (e) { filter.q = e.target.value; ordersView(main); main.querySelector("#f-q").focus(); var v = main.querySelector("#f-q"); v.setSelectionRange(v.value.length, v.value.length); });
    main.querySelectorAll("[data-order]").forEach(function (b) {
      b.addEventListener("click", function () { orderDetail(main, b.getAttribute("data-order")); });
    });
  }

  function orderDetail(main, id) {
    var o = D.orders.filter(function (x) { return x.id === id; })[0];
    if (!o) return ordersView(main);
    var c = o.customer, a = c.address;
    var addrText = a ? a.street + ", " + a.number + (a.complement ? " — " + a.complement : "") + "\n" + a.district + " — " + a.city + "/" + a.state + "\nCEP " + a.cep.replace(/(\d{5})(\d{3})/, "$1-$2") : "";
    var wa = "https://wa.me/55" + c.phone;
    main.innerHTML =
      '<div class="adm-head"><button class="link-btn" type="button" id="back">← Voltar aos pedidos</button></div>' +
      '<div class="adm-head"><div><h1>Pedido ' + esc(o.id) + "</h1><small>" + date(o.createdAt) + '</small></div><span class="status status--' + o.status + '">' + esc(D.statuses[o.status]) + "</span></div>" +
      (o.paymentWarning ? '<div class="adm-alert"><strong>Atenção</strong>' + esc(o.paymentWarning) + "</div>" : "") +
      '<div class="adm-grid"><div>' +
      '<div class="adm-card"><h2>Itens</h2>' + o.lines.map(function (l) {
        return '<div class="sum-item"><span>' + l.qty + "× " + esc(l.name) + (l.variant !== "Único" ? " (" + esc(l.variant) + ")" : "") + "</span><span>" + brl(l.unitPrice * l.qty) + "</span></div>";
      }).join("") +
      '<div class="sum-row" style="margin-top:8px"><span>' + esc(o.shipping.label) + "</span><span>" + brl(o.shipping.price) + "</span></div>" +
      '<div class="sum-row sum-total"><span>Total</span><span>' + brl(o.total) + "</span></div>" +
      (o.notes ? '<p style="margin-top:12px"><strong>Observação do cliente:</strong> ' + esc(o.notes) + "</p>" : "") + "</div>" +
      '<div class="adm-card"><h2>Cliente e entrega</h2><dl class="adm-kv">' +
      "<dt>Nome</dt><dd>" + esc(c.name) + "</dd><dt>E-mail</dt><dd><a href=\"mailto:" + esc(c.email) + "\">" + esc(c.email) + "</a></dd>" +
      "<dt>Telefone</dt><dd><a href=\"" + wa + "\" target=\"_blank\" rel=\"noopener\">" + esc(c.phone) + " (WhatsApp)</a></dd>" +
      "<dt>CPF</dt><dd>" + esc(c.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")) + "</dd>" +
      "<dt>Entrega</dt><dd>" + (a ? esc(addrText).replace(/\n/g, "<br>") : "Retirada") + "</dd></dl>" +
      (a ? '<div class="adm-actions"><button class="btn btn--ghost btn--sm" type="button" id="copy-addr">Copiar endereço</button></div>' : "") + "</div>" +
      '<div class="adm-card"><h2>Pagamento</h2>' + (o.payment ? '<dl class="adm-kv"><dt>Status MP</dt><dd>' + esc(o.payment.status) + " (" + esc(o.payment.detail || "") + ")</dd><dt>Forma</dt><dd>" + esc(o.payment.type || "") + " · " + esc(o.payment.method || "") + (o.payment.installments > 1 ? " · " + o.payment.installments + "x" : "") + "</dd><dt>Valor</dt><dd>R$ " + esc(o.payment.amount) + "</dd><dt>ID</dt><dd>" + esc(o.payment.id) + '</dd></dl><div class="adm-actions"><button class="btn btn--ghost btn--sm" type="button" id="sync">Atualizar pelo Mercado Pago</button></div>' : "<p>Ainda sem pagamento registrado.</p>") + "</div>" +
      "</div><div>" +
      '<div class="adm-card"><h2>Andamento</h2>' +
      '<div class="field"><label for="o-status">Status</label><select id="o-status">' + Object.keys(D.statuses).map(function (k) {
        return '<option value="' + k + '"' + (o.status === k ? " selected" : "") + ">" + D.statuses[k] + "</option>";
      }).join("") + "</select></div>" +
      '<div class="field"><label for="o-track">Código de rastreio</label><input id="o-track" value="' + esc(o.trackingCode || "") + '"></div>' +
      '<div class="field"><label for="o-notes">Anotações internas</label><textarea id="o-notes" rows="3">' + esc(o.adminNotes || "") + "</textarea></div>" +
      '<p class="sum-note">Ao marcar como "Pago" o estoque é descontado; ao cancelar um pedido pago, ele volta ao estoque.</p>' +
      '<div class="adm-actions"><button class="btn btn--sm" type="button" id="save-order">Salvar</button>' +
      '<a class="btn btn--whats btn--sm" target="_blank" rel="noopener" href="' + wa + "?text=" + encodeURIComponent("Olá, " + c.name.split(" ")[0] + "! Aqui é a Débora, da Decaleca, sobre o seu pedido " + o.id + ".") + '">Chamar no WhatsApp</a></div>' +
      '<p class="adm-msg" id="o-msg"></p></div>' +
      '<div class="adm-card"><h2>Histórico</h2><ul class="adm-history">' + (o.history || []).slice().reverse().map(function (h) {
        return "<li>" + date(h.at) + " — " + esc(D.statuses[h.status] || h.status) + (h.note ? " · " + esc(h.note) : "") + "</li>";
      }).join("") + "</ul></div>" +
      "</div></div>";

    main.querySelector("#back").addEventListener("click", function () { ordersView(main); });
    var copy = main.querySelector("#copy-addr");
    if (copy) copy.addEventListener("click", function () {
      var text = c.name + "\n" + addrText;
      (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(function () { copy.textContent = "Copiado!"; }).catch(function () { prompt("Copie o endereço:", text); });
    });
    var replace = function (updated) { D.orders = D.orders.map(function (x) { return x.id === updated.id ? updated : x; }); };
    var sync = main.querySelector("#sync");
    if (sync) sync.addEventListener("click", function () {
      api("syncOrder", { id: o.id }).then(function (u) { replace(u); orderDetail(main, o.id); }).catch(function (e) { alert(e.message); });
    });
    main.querySelector("#save-order").addEventListener("click", function () {
      var m = main.querySelector("#o-msg");
      api("updateOrder", { id: o.id, status: main.querySelector("#o-status").value, trackingCode: main.querySelector("#o-track").value, adminNotes: main.querySelector("#o-notes").value })
        .then(function (u) { replace(u); return api("dashboard"); })
        .then(function (d) { D = d; orderDetail(main, o.id); msg(main.querySelector("#o-msg"), "Pedido atualizado."); })
        .catch(function (e) { msg(m, e.message, true); });
    });
  }

  /* ---------- imagens ---------- */
  function resizeImage(file) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () {
        var max = 1600, w = img.naturalWidth, h = img.naturalHeight;
        var scale = Math.min(1, max / Math.max(w, h));
        var cv = document.createElement("canvas");
        cv.width = Math.round(w * scale); cv.height = Math.round(h * scale);
        cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
        cv.toBlob(function (b) { b ? resolve(b) : reject(new Error("Não foi possível ler a imagem.")); }, "image/jpeg", 0.85);
        URL.revokeObjectURL(img.src);
      };
      img.onerror = function () { reject(new Error("Formato de imagem não suportado. Use JPG, PNG ou WebP.")); };
      img.src = URL.createObjectURL(file);
    });
  }
  function upload(file) {
    return resizeImage(file).then(function (blob) {
      return fetch("/api/upload?name=" + encodeURIComponent(file.name), { method: "POST", headers: { "Content-Type": "image/jpeg" }, body: blob, credentials: "same-origin" });
    }).then(function (r) {
      return r.json().then(function (d) { if (!r.ok) throw new Error(d.error || "Falha no envio."); return d.url; });
    });
  }
  function imagesEditor(container, images, onChange, single) {
    function draw() {
      container.innerHTML = '<div class="adm-images">' + images.map(function (u, i) {
        return '<div class="adm-img"><img src="' + esc(u) + '" alt=""><button type="button" class="adm-x" data-rm="' + i + '" aria-label="Remover foto">×</button>' +
          (single ? "" : i === 0 ? '<span class="cover">Capa</span>' : '<button type="button" class="make-cover" data-cover="' + i + '">Tornar capa</button>') + "</div>";
      }).join("") +
        (single && images.length ? "" : '<label class="adm-upload">+ Adicionar foto' + (single ? "" : "s") + '<input type="file" accept="image/*"' + (single ? "" : " multiple") + "></label>") +
        "</div>";
      container.querySelectorAll("[data-rm]").forEach(function (b) {
        b.addEventListener("click", function () { images.splice(Number(b.getAttribute("data-rm")), 1); onChange(images); draw(); });
      });
      container.querySelectorAll("[data-cover]").forEach(function (b) {
        b.addEventListener("click", function () { var i = Number(b.getAttribute("data-cover")); images.unshift(images.splice(i, 1)[0]); onChange(images); draw(); });
      });
      var input = container.querySelector("input[type=file]");
      if (input) input.addEventListener("change", function () {
        var files = Array.prototype.slice.call(input.files);
        var label = input.parentNode;
        label.firstChild.textContent = "Enviando…";
        files.reduce(function (p, f) {
          return p.then(function () { return upload(f).then(function (url) { images.push(url); }); });
        }, Promise.resolve()).catch(function (e) { alert(e.message); }).then(function () { onChange(images); draw(); });
      });
    }
    draw();
  }

  /* ---------- produtos ---------- */
  function productsView(main) {
    main.innerHTML = setupAlerts() +
      '<div class="adm-head"><h1>Produtos</h1><button class="btn btn--sm" type="button" id="new-product">+ Novo produto</button></div>' +
      (D.products.length ? '<div class="adm-list">' + D.products.map(function (p) {
        var stock = p.variants.reduce(function (s, v) { return s + v.stock; }, 0);
        return '<button class="adm-row adm-row--product" type="button" data-product="' + esc(p.id) + '">' +
          (p.images[0] ? '<img class="thumb" src="' + esc(p.images[0]) + '" alt="">' : '<span class="thumb"></span>') +
          "<div><strong>" + esc(p.name) + "</strong><br><small>" + esc(CATS[p.category]) + " · " + brl(p.price) + (p.active ? "" : " · <b>oculto</b>") + (p.featured ? " · destaque" : "") + "</small></div>" +
          '<div style="text-align:right"><strong' + (stock ? "" : ' style="color:#9A3412"') + ">" + stock + "</strong><br><small>em estoque</small></div></button>";
      }).join("") + "</div>" : '<div class="adm-empty">Nenhum produto cadastrado. Clique em "Novo produto" para começar.</div>');
    main.querySelector("#new-product").addEventListener("click", function () { productForm(main, null); });
    main.querySelectorAll("[data-product]").forEach(function (b) {
      b.addEventListener("click", function () { productForm(main, D.products.filter(function (p) { return p.id === b.getAttribute("data-product"); })[0]); });
    });
  }

  function productForm(main, p) {
    var data = p ? JSON.parse(JSON.stringify(p)) : { name: "", category: "meias", collection: "", price: 0, description: "", care: "", images: [], variants: [{ name: "Único", stock: 0 }], active: true, featured: false };
    main.innerHTML =
      '<div class="adm-head"><button class="link-btn" type="button" id="back">← Voltar aos produtos</button></div>' +
      "<h1>" + (p ? "Editar produto" : "Novo produto") + "</h1>" +
      '<form id="pform"><div class="adm-grid"><div>' +
      '<div class="adm-card">' +
      '<div class="field"><label for="p-name">Nome</label><input id="p-name" required value="' + esc(data.name) + '"></div>' +
      '<div class="field-row"><div class="field"><label for="p-cat">Categoria</label><select id="p-cat">' + Object.keys(CATS).map(function (k) {
        return '<option value="' + k + '"' + (data.category === k ? " selected" : "") + ">" + CATS[k] + "</option>";
      }).join("") + "</select></div>" +
      '<div class="field"><label for="p-coll">Coleção</label><select id="p-coll"><option value="">— Nenhuma —</option>' + D.collections.map(function (c) {
        return '<option value="' + esc(c.id) + '"' + (data.collection === c.id ? " selected" : "") + ">" + esc(c.name) + "</option>";
      }).join("") + "</select></div></div>" +
      '<div class="field"><label for="p-price">Preço (R$)</label><input id="p-price" inputmode="decimal" placeholder="49,90" value="' + (data.price ? money(data.price) : "") + '"></div>' +
      '<div class="field"><label for="p-desc">Descrição</label><textarea id="p-desc" rows="5">' + esc(data.description) + "</textarea></div>" +
      '<div class="field"><label for="p-care">Cuidados (opcional)</label><textarea id="p-care" rows="2">' + esc(data.care) + "</textarea></div>" +
      "</div>" +
      '<div class="adm-card"><h2>Fotos</h2><p class="sum-note">A primeira foto é a capa. Inclua um close do bordado ou da ilustração.</p><div id="p-images"></div></div>' +
      "</div><div>" +
      '<div class="adm-card"><h2>Tamanhos e estoque</h2><p class="sum-note">Sem tamanhos? Deixe uma única linha chamada "Único".</p><div class="adm-variants" id="p-variants"></div>' +
      '<button class="btn btn--ghost btn--sm" type="button" id="add-variant">+ Adicionar tamanho</button></div>' +
      '<div class="adm-card"><h2>Visibilidade</h2>' +
      '<label class="adm-check"><input type="checkbox" id="p-active"' + (data.active ? " checked" : "") + "> Mostrar na loja</label>" +
      '<label class="adm-check"><input type="checkbox" id="p-featured"' + (data.featured ? " checked" : "") + "> Destacar na página inicial</label></div>" +
      '<div class="adm-actions"><button class="btn" type="submit">Salvar produto</button>' + (p ? '<button class="btn btn--danger" type="button" id="del">Excluir</button>' : "") + "</div>" +
      '<p class="adm-msg" id="p-msg"></p>' +
      "</div></div></form>";

    main.querySelector("#back").addEventListener("click", function () { productsView(main); });
    imagesEditor(main.querySelector("#p-images"), data.images, function (imgs) { data.images = imgs; });

    var vWrap = main.querySelector("#p-variants");
    function drawVariants() {
      vWrap.innerHTML = '<div class="adm-variant"><small>Tamanho / opção</small><small>Estoque</small><span></span></div>' + data.variants.map(function (v, i) {
        return '<div class="adm-variant"><input data-vn="' + i + '" value="' + esc(v.name) + '" aria-label="Nome do tamanho"><input data-vs="' + i + '" type="number" min="0" inputmode="numeric" value="' + v.stock + '" aria-label="Estoque">' +
          '<button class="adm-x" type="button" data-vrm="' + i + '" aria-label="Remover">×</button></div>';
      }).join("");
      vWrap.querySelectorAll("[data-vn]").forEach(function (el) { el.addEventListener("input", function () { data.variants[el.getAttribute("data-vn")].name = el.value; }); });
      vWrap.querySelectorAll("[data-vs]").forEach(function (el) { el.addEventListener("input", function () { data.variants[el.getAttribute("data-vs")].stock = Math.max(0, parseInt(el.value, 10) || 0); }); });
      vWrap.querySelectorAll("[data-vrm]").forEach(function (b) {
        b.addEventListener("click", function () { data.variants.splice(Number(b.getAttribute("data-vrm")), 1); if (!data.variants.length) data.variants.push({ name: "Único", stock: 0 }); drawVariants(); });
      });
    }
    drawVariants();
    main.querySelector("#add-variant").addEventListener("click", function () {
      if (data.variants.length === 1 && data.variants[0].name === "Único") data.variants[0].name = "";
      data.variants.push({ name: "", stock: 0 });
      drawVariants();
    });

    var del = main.querySelector("#del");
    if (del) del.addEventListener("click", function () {
      if (!confirm('Excluir "' + data.name + '"? Pedidos antigos não são afetados.')) return;
      api("deleteProduct", { id: p.id }).then(load).then(function () { tab = "produtos"; render(); });
    });

    main.querySelector("#pform").addEventListener("submit", function (e) {
      e.preventDefault();
      var m = main.querySelector("#p-msg");
      var body = {
        id: p ? p.id : undefined,
        name: main.querySelector("#p-name").value,
        category: main.querySelector("#p-cat").value,
        collection: main.querySelector("#p-coll").value,
        price: cents(main.querySelector("#p-price").value),
        description: main.querySelector("#p-desc").value,
        care: main.querySelector("#p-care").value,
        images: data.images,
        variants: data.variants.filter(function (v) { return v.name.trim(); }),
        active: main.querySelector("#p-active").checked,
        featured: main.querySelector("#p-featured").checked
      };
      msg(m, "Salvando…");
      api("saveProduct", body).then(function (saved) {
        return load().then(function () { tab = "produtos"; render(function (mm) { productForm(mm, D.products.filter(function (x) { return x.id === saved.id; })[0]); msg(mm.querySelector("#p-msg"), "Produto salvo."); }); });
      }).catch(function (err) { msg(m, err.message, true); });
    });
  }

  /* ---------- coleções ---------- */
  function collectionsView(main) {
    main.innerHTML = setupAlerts() +
      '<div class="adm-head"><h1>Coleções</h1><button class="btn btn--sm" type="button" id="new-coll">+ Nova coleção</button></div>' +
      (D.collections.length ? '<div class="adm-list">' + D.collections.map(function (c) {
        var n = D.products.filter(function (p) { return p.collection === c.id; }).length;
        return '<button class="adm-row adm-row--product" type="button" data-coll="' + esc(c.id) + '">' +
          (c.image ? '<img class="thumb" src="' + esc(c.image) + '" alt="">' : '<span class="thumb"></span>') +
          "<div><strong>" + esc(c.name) + "</strong><br><small>" + esc(c.description || "") + "</small></div><div><small>" + n + " produto(s)</small></div></button>";
      }).join("") + "</div>" : '<div class="adm-empty">Nenhuma coleção ainda. Coleções agrupam produtos com o mesmo universo de ilustrações.</div>');
    main.querySelector("#new-coll").addEventListener("click", function () { collectionForm(main, null); });
    main.querySelectorAll("[data-coll]").forEach(function (b) {
      b.addEventListener("click", function () { collectionForm(main, D.collections.filter(function (c) { return c.id === b.getAttribute("data-coll"); })[0]); });
    });
  }

  function collectionForm(main, c) {
    var data = c ? JSON.parse(JSON.stringify(c)) : { name: "", description: "", image: "", order: D.collections.length };
    var imgs = data.image ? [data.image] : [];
    main.innerHTML =
      '<div class="adm-head"><button class="link-btn" type="button" id="back">← Voltar às coleções</button></div>' +
      "<h1>" + (c ? "Editar coleção" : "Nova coleção") + '</h1><form id="cform" class="adm-card" style="max-width:640px">' +
      '<div class="field"><label for="c-name">Nome</label><input id="c-name" required value="' + esc(data.name) + '"></div>' +
      '<div class="field"><label for="c-desc">Descrição curta</label><textarea id="c-desc" rows="3">' + esc(data.description) + "</textarea></div>" +
      '<div class="field"><label for="c-order">Ordem de exibição</label><input id="c-order" type="number" min="0" value="' + (data.order || 0) + '"></div>' +
      '<div class="field"><label>Imagem (ilustração ou foto da coleção)</label><div id="c-img"></div></div>' +
      '<div class="adm-actions"><button class="btn" type="submit">Salvar coleção</button>' + (c ? '<button class="btn btn--danger" type="button" id="del">Excluir</button>' : "") + "</div>" +
      '<p class="adm-msg" id="c-msg"></p></form>';
    main.querySelector("#back").addEventListener("click", function () { collectionsView(main); });
    imagesEditor(main.querySelector("#c-img"), imgs, function (list) { imgs = list; }, true);
    var del = main.querySelector("#del");
    if (del) del.addEventListener("click", function () {
      if (!confirm('Excluir a coleção "' + data.name + '"? Os produtos continuam na loja.')) return;
      api("deleteCollection", { id: c.id }).then(load).then(function () { tab = "colecoes"; render(); });
    });
    main.querySelector("#cform").addEventListener("submit", function (e) {
      e.preventDefault();
      var m = main.querySelector("#c-msg");
      api("saveCollection", {
        id: c ? c.id : undefined, name: main.querySelector("#c-name").value, description: main.querySelector("#c-desc").value,
        order: Number(main.querySelector("#c-order").value) || 0, image: imgs[0] || ""
      }).then(function () { return load(); }).then(function () { tab = "colecoes"; render(); }).catch(function (err) { msg(m, err.message, true); });
    });
  }

  /* ---------- configurações ---------- */
  function settingsView(main) {
    var s = D.settings;
    main.innerHTML = setupAlerts() +
      '<h1>Configurações</h1><form id="sform" class="adm-card" style="max-width:640px">' +
      '<label class="adm-check"><input type="checkbox" id="s-open"' + (s.storeOpen ? " checked" : "") + "> Loja aberta (desmarque para pausar as vendas pelo site)</label>" +
      "<h2>Frete</h2>" +
      '<div class="field-row"><div class="field"><label for="s-flat">Frete fixo (R$)</label><input id="s-flat" inputmode="decimal" value="' + money(s.shippingFlat) + '"><small>Use 0 para frete grátis sempre.</small></div>' +
      '<div class="field"><label for="s-free">Frete grátis acima de (R$)</label><input id="s-free" inputmode="decimal" value="' + money(s.freeShippingAbove) + '"><small>Use 0 para desativar.</small></div></div>' +
      '<label class="adm-check"><input type="checkbox" id="s-pickup"' + (s.pickupEnabled ? " checked" : "") + "> Oferecer retirada em mãos (grátis)</label>" +
      '<div class="field"><label for="s-pickup-label">Texto da retirada</label><input id="s-pickup-label" placeholder="Retirada em mãos — combinamos pelo WhatsApp" value="' + esc(s.pickupLabel) + '"></div>' +
      "<h2>Pagamento</h2>" +
      '<div class="field"><label for="s-inst">Parcelas máximas no cartão</label><input id="s-inst" type="number" min="1" max="12" value="' + s.maxInstallments + '"><small>Os juros e taxas seguem a configuração da sua conta Mercado Pago.</small></div>' +
      '<div class="adm-actions"><button class="btn" type="submit">Salvar configurações</button></div><p class="adm-msg" id="s-msg"></p></form>';
    main.querySelector("#sform").addEventListener("submit", function (e) {
      e.preventDefault();
      var m = main.querySelector("#s-msg");
      api("saveSettings", {
        storeOpen: main.querySelector("#s-open").checked,
        shippingFlat: cents(main.querySelector("#s-flat").value),
        freeShippingAbove: cents(main.querySelector("#s-free").value),
        pickupEnabled: main.querySelector("#s-pickup").checked,
        pickupLabel: main.querySelector("#s-pickup-label").value,
        maxInstallments: Number(main.querySelector("#s-inst").value) || 1
      }).then(function (saved) { D.settings = saved; msg(m, "Configurações salvas."); }).catch(function (err) { msg(m, err.message, true); });
    });
  }

  api("me").then(function (r) { if (r.admin) load(); else showLogin(); }).catch(function (e) { showLogin(e.message); });
})();

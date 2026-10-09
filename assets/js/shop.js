/* ==========================================================================
   NUTRISPORT — shop: search / filters / sort / favourites + product pages
   Product pages open as a full-screen view at #/p/<product>.
   ========================================================================== */
(() => {
  "use strict";
  const NS = window.NS;
  const { PRODUCTS, SHOP_KEYS, t, tf, euro, num } = NS;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const play = (n) => NS.sfx && NS.sfx.play(n);
  const fold = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

  const GOAL_LABELS = { masse: "Masse", seche: "Sèche", force: "Force", energie: "Énergie", recup: "Récupération" };

  /* ------------------------------------------------------------------------
     Search, filters, sort, favourites
     ------------------------------------------------------------------------ */
  const grid = $("#productGrid");
  const cards = $$(".product-card", grid);
  cards.forEach((card) => {
    const goals = card.dataset.goals.split(" ").flatMap((g) => [GOAL_LABELS[g], t(GOAL_LABELS[g])]);
    card.dataset.search = fold(`${card.dataset.search} ${goals.join(" ")}`);
  });
  const state = { q: "", goal: "all", sort: "pop", favOnly: false };
  const searchInput = $("#shopSearch");
  const sortSel = $("#shopSort");
  // no rating sort while reviews are switched off (hidden <option>s are not reliable on iOS)
  if (!NS.FEATURES.reviews) { const o = $('option[value="rating"]', sortSel); if (o) o.remove(); }
  const favBtn = $("#favFilter");
  const emptyEl = $("#shopEmpty");
  const countEl = $("#shopCount");

  function priceOf(key) { const p = PRODUCTS[key]; return p.sizes[p.defSize].p; }

  function apply(animate = true) {
    // FLIP: remember positions, apply, then animate from the old positions
    const first = new Map(cards.map((c) => [c, c.getBoundingClientRect()]));
    const q = fold(state.q.trim());
    const visible = cards.filter((card) => {
      const key = card.dataset.key;
      return (state.goal === "all" || card.dataset.goals.split(" ").includes(state.goal))
        && (!q || q.split(/\s+/).every((w) => card.dataset.search.includes(w)))
        && (!state.favOnly || NS.favs.includes(key));
    });
    const sorted = [...visible].sort((a, b) => {
      const ka = a.dataset.key, kb = b.dataset.key;
      if (state.sort === "asc") return priceOf(ka) - priceOf(kb);
      if (state.sort === "desc") return priceOf(kb) - priceOf(ka);
      if (state.sort === "rating") return PRODUCTS[kb].rating - PRODUCTS[ka].rating || PRODUCTS[kb].reviews - PRODUCTS[ka].reviews;
      return PRODUCTS[kb].reviews - PRODUCTS[ka].reviews;
    });
    cards.forEach((card) => {
      const on = visible.includes(card);
      const wasHidden = card.hidden;
      card.hidden = !on;
      card.style.order = on ? sorted.indexOf(card) : 99;
      if (on) card.classList.add("is-visible"); // filtered cards skip the scroll reveal
      if (on && wasHidden && animate && !NS.reduceMotion) {
        card.animate([{ opacity: 0, transform: "scale(.92) translateY(20px)" }, { opacity: 1, transform: "none" }], { duration: 500, easing: "cubic-bezier(.16,1,.3,1)" });
      }
    });
    if (animate && !NS.reduceMotion) {
      visible.forEach((card) => {
        const a = first.get(card), b = card.getBoundingClientRect();
        if (!a || !a.width) return;
        const dx = a.left - b.left, dy = a.top - b.top;
        if (dx || dy) card.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }], { duration: 600, easing: "cubic-bezier(.16,1,.3,1)" });
      });
    }
    emptyEl.hidden = visible.length > 0;
    $("#shopEmptyText").textContent = state.favOnly && !NS.favs.length
      ? t("Vous n'avez pas encore de favoris : cliquez sur le cœur d'un produit.")
      : t("Essayez un autre mot-clé ou un autre objectif.");
    const filtered = state.q || state.goal !== "all" || state.favOnly;
    countEl.innerHTML = filtered
      ? `${t("{n} produit(s) sur {total}", { n: visible.length, total: cards.length })} <button class="shop-clear" type="button">${t("Effacer les filtres")}</button>`
      : "";
  }

  let searchT;
  searchInput.addEventListener("input", () => {
    clearTimeout(searchT);
    searchT = setTimeout(() => { state.q = searchInput.value; apply(); }, 120);
  });
  $("#shopGoals").addEventListener("click", (e) => {
    const b = e.target.closest(".goal-chip");
    if (!b) return;
    state.goal = b.dataset.goal;
    $$(".goal-chip", $("#shopGoals")).forEach((c) => { c.classList.toggle("is-active", c === b); c.setAttribute("aria-checked", c === b); });
    play("click");
    apply();
  });
  sortSel.addEventListener("change", () => { state.sort = sortSel.value; apply(); });
  favBtn.addEventListener("click", () => {
    state.favOnly = !state.favOnly;
    favBtn.classList.toggle("is-on", state.favOnly);
    favBtn.setAttribute("aria-pressed", state.favOnly);
    play("click");
    apply();
  });
  countEl.addEventListener("click", (e) => { if (e.target.closest(".shop-clear")) resetFilters(); });
  $("#shopReset").addEventListener("click", () => resetFilters());
  function resetFilters() {
    Object.assign(state, { q: "", goal: "all", sort: "pop", favOnly: false });
    searchInput.value = ""; sortSel.value = "pop";
    favBtn.classList.remove("is-on"); favBtn.setAttribute("aria-pressed", "false");
    $$(".goal-chip", $("#shopGoals")).forEach((c) => c.classList.toggle("is-active", c.dataset.goal === "all"));
    apply();
  }
  const updateFavCount = () => { $("#favCount").textContent = NS.favs.length; };
  NS.bus.addEventListener("favs", () => { updateFavCount(); if (state.favOnly) apply(); });
  updateFavCount();
  apply(false);

  /* ------------------------------------------------------------------------
     Product page
     ------------------------------------------------------------------------ */
  const pdp = $("#pdp");
  const scroller = $("#pdpScroll");
  const jarHost = document.createElement("div");
  jarHost.className = "pdp-jar3d";
  let jar3d = null;
  let current = null; // { key, flavor, size, qty }
  let openedHere = false;
  let lastFocus = null;

  const kgOf = (label) => {
    const m = label.replace(",", ".").match(/([\d.]+)\s*(kg|g)/i);
    return m ? parseFloat(m[1]) / (m[2].toLowerCase() === "g" ? 1000 : 1) : 0;
  };
  const stars = (r) => "★★★★★".slice(0, Math.round(r)) + "☆☆☆☆☆".slice(0, 5 - Math.round(r));

  function render(key) {
    const p = PRODUCTS[key];
    const reviews = NS.REVIEWS.filter((r) => r[3] === key);
    const others = SHOP_KEYS.filter((k) => k !== key).slice(0, 4);
    // a plausible star distribution consistent with the average rating
    const dist = p.rating >= 4.85 ? [88, 9, 2, 1, 0] : p.rating >= 4.75 ? [82, 13, 3, 1, 1] : [76, 17, 4, 2, 1];
    scroller.innerHTML = `
      <header class="pdp-top">
        <button class="pdp-back" id="pdpBack"><span aria-hidden="true">←</span> ${t("Retour")}</button>
        <nav class="pdp-crumbs" aria-label="${t("Fil d'Ariane")}"><a href="#top" data-pdp-close>${t("Accueil")}</a> / <a href="#produits" data-pdp-close>${t("Produits")}</a> / <span>${p.name}</span></nav>
        <button class="icon-btn pdp-cart" id="pdpCart" aria-label="${t("Ouvrir le panier")}"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5 7h14l-1.2 11.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8L5 7Z"/><path d="M9 7V6a3 3 0 0 1 6 0v1"/></svg></button>
      </header>

      <section class="pdp-hero" style="--card-bg:${p.c.card}">
        <div class="pdp-visual">
          <div class="pdp-word" aria-hidden="true">${p.word}</div>
          <div class="pdp-jar" id="pdpJar"><div class="pdp-jar-fallback">${NS.jarSVG(key)}</div></div>
          <span class="drag-hint drag-hint--dark" aria-hidden="true">${t("Glisser pour tourner 360°")}</span>
        </div>
        <div class="pdp-info">
          <span class="product-tag ${p.neon ? "product-tag--neon" : ""}">${t(p.tag)}</span>
          <h1 class="pdp-name" id="pdpName">${p.name}</h1>
          ${NS.FEATURES.reviews ? `<a class="pdp-rating" href="#pdpReviews" data-pdp-anchor><span class="stars">${stars(p.rating)}</span> <b>${num(p.rating, 1)}</b> · ${t("{n} avis", { n: num(p.reviews) })}</a>` : ""}
          <p class="pdp-desc">${t(p.desc)}</p>
          <div class="pdp-price"><strong id="pdpPrice"></strong><span id="pdpPerKg"></span></div>
          <div class="pdp-opt"><span class="opt-label">${t("Goût")} · <b id="pdpFlavorName"></b></span><div class="pdp-flavors" id="pdpFlavors">
            ${p.flavors.map((f) => `<button class="flavor-dot" data-flavor="${f}" style="--c:${NS.flavorColor(f)}" title="${tf(f)}"><i></i><span>${tf(f)}</span></button>`).join("")}
          </div></div>
          <div class="pdp-opt"><span class="opt-label">${t("Format")}</span><div class="chips" id="pdpSizes">
            ${p.sizes.map((s, j) => `<button class="chip" data-size="${j}">${s.l}</button>`).join("")}
          </div></div>
          <div class="pdp-buy">
            <div class="qty qty--lg"><button id="pdpDec" aria-label="${t("Diminuer")}">−</button><span id="pdpQty">1</span><button id="pdpInc" aria-label="${t("Augmenter")}">+</button></div>
            <button class="btn btn--dark pdp-add" id="pdpAdd"><span>${t("Ajouter au panier")}</span></button>
            <button class="fav-btn fav-btn--lg ${NS.favs.includes(key) ? "is-on" : ""}" data-fav="${key}" id="pdpFav" aria-pressed="${NS.favs.includes(key)}" aria-label="${t("Ajouter aux favoris")}"><svg viewBox="0 0 24 24" width="22" height="22"><path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2Z"/></svg></button>
          </div>
          <ul class="pdp-trust">
            <li><span>🚚</span>${t("Livraison offerte dès 60 € en France métropolitaine")}</li>
            <li><span>↩</span>${t("14 jours pour changer d'avis (produit non ouvert)")}</li>
            <li><span>📋</span>${t("Composition complète et allergènes affichés")}</li>
          </ul>
        </div>
      </section>

      <section class="pdp-details">
        <div class="pdp-tabs" role="tablist">
          <button role="tab" class="is-active" data-tab="desc" aria-selected="true">${t("Description")}</button>
          <button role="tab" data-tab="nutri" aria-selected="false">${t("Nutrition")}</button>
          <button role="tab" data-tab="usage" aria-selected="false">${t("Utilisation")}</button>
          <button role="tab" data-tab="ingr" aria-selected="false">${t("Ingrédients")}</button>
        </div>
        <div class="pdp-panels">
          <div class="pdp-panel is-active" data-panel="desc">
            <p>${t(p.long)}</p>
            <div class="pdp-goals">${p.goals.map((g) => `<span>${t(GOAL_LABELS[g])}</span>`).join("")}</div>
          </div>
          <div class="pdp-panel" data-panel="nutri">
            ${NS.FEATURES.provisional ? `<span class="pdp-provisional">${t("Fiche provisoire : les valeurs définitives figureront sur l'emballage.")}</span>` : ""}
            <table class="pdp-table"><caption>${t("Valeurs nutritionnelles pour 1 dose")}</caption>
              <tbody>${p.nutrition.map(([k, v]) => `<tr><th scope="row">${t(k)}</th><td>${t(v)}</td></tr>`).join("")}</tbody>
            </table>
          </div>
          <div class="pdp-panel" data-panel="usage"><p class="pdp-usage">${p.usage.map(t).join(" ")}</p>
            <div class="pdp-warnings">${p.warnings.map((w) => `<p>${t(w)}</p>`).join("")}</div></div>
          <div class="pdp-panel" data-panel="ingr">${NS.FEATURES.provisional ? `<span class="pdp-provisional">${t("Fiche provisoire : les valeurs définitives figureront sur l'emballage.")}</span>` : ""}<p>${t(p.ingredients)}</p>
            <p class="pdp-note">${/<b>/.test(p.ingredients) ? t("Les allergènes sont indiqués en gras.") : t("Aucun allergène majeur parmi les ingrédients.")}</p></div>
        </div>

        <div class="pdp-reviews" id="pdpReviews" ${NS.FEATURES.reviews ? "" : "hidden"}>
          <div class="pdp-reviews-head">
            <h2>${t("Avis clients")}</h2>
            <div class="pdp-score"><strong>${num(p.rating, 1)}</strong><div><span class="stars">${stars(p.rating)}</span><small>${t("{n} avis", { n: num(p.reviews) })}</small></div></div>
            <ul class="pdp-dist">${dist.map((d, i) => `<li><span>${5 - i}★</span><i style="--w:${d}%"></i><em>${d}%</em></li>`).join("")}</ul>
          </div>
          <div class="pdp-review-list">
            ${(reviews.length ? reviews : NS.REVIEWS.slice(0, 2)).map(([n, role, txt]) => `
              <article class="review"><div class="stars">★★★★★</div><p>“${t(txt)}”</p>
                <div class="review-author"><span class="avatar">${n.split(" ").map((w) => w[0]).join("")}</span><div><b>${n}</b><span>${t(role)}</span></div><span class="verified">✓ ${t("Vérifié")}</span></div>
              </article>`).join("")}
          </div>
        </div>

        <div class="pdp-related">
          <h2>${t("Complète ton stack")}</h2>
          <div class="pdp-related-grid">
            ${others.map((k) => { const o = PRODUCTS[k]; return `
              <a class="related-card" href="#/p/${k}" style="--card-bg:${o.c.card}">
                <div class="related-jar">${NS.jarSVG(k)}</div>
                <b>${o.name}</b><span>${t("dès {price}", { price: euro(Math.min(...o.sizes.map((s) => s.p))) })}</span>
              </a>`; }).join("")}
          </div>
        </div>
      </section>`;
  }

  function updateBuy() {
    const p = PRODUCTS[current.key];
    const sz = p.sizes[current.size];
    $("#pdpPrice").textContent = euro(sz.p * current.qty);
    const kg = kgOf(sz.l);
    $("#pdpPerKg").textContent = kg ? t("{price} / kg", { price: euro(sz.p / kg) }) : "";
    $("#pdpQty").textContent = current.qty;
    $("#pdpFlavorName").textContent = tf(current.flavor);
    $$(".flavor-dot", $("#pdpFlavors")).forEach((b) => b.classList.toggle("is-active", b.dataset.flavor === current.flavor));
    $$(".chip", $("#pdpSizes")).forEach((b) => b.classList.toggle("is-active", +b.dataset.size === current.size));
  }

  function mountJar(key, animate) {
    const slot = $("#pdpJar");
    if (!NS.createJar) return; // WebGL unavailable → SVG fallback stays
    if (!jar3d) jar3d = NS.createJar(jarHost, { product: key, autoSpeed: 0.005 });
    if (!jar3d) return;
    slot.classList.add("has-3d");
    slot.appendChild(jarHost);
    jar3d.setProduct(key, current.flavor, animate);
  }

  function open(key) {
    if (!PRODUCTS[key] || !SHOP_KEYS.includes(key)) return close(true);
    const p = PRODUCTS[key];
    const switching = pdp.classList.contains("is-open");
    current = { key, flavor: p.flavors[0], size: p.defSize, qty: 1 };
    if (!switching) lastFocus = document.activeElement;
    render(key);
    updateBuy();
    scroller.scrollTop = 0;
    pdp.classList.add("is-open");
    pdp.setAttribute("aria-hidden", "false");
    document.body.classList.add("pdp-open");
    document.body.style.overflow = "hidden";
    document.title = `${p.name} — NUTRISPORT`;
    // let the slide-in start before creating the 3D jar
    setTimeout(() => mountJar(key, switching), switching ? 0 : 350);
    if (!switching) { play("whoosh"); setTimeout(() => $("#pdpBack") && $("#pdpBack").focus({ preventScroll: true }), 500); }
  }

  function close(silent) {
    if (!pdp.classList.contains("is-open")) return;
    pdp.classList.remove("is-open");
    pdp.setAttribute("aria-hidden", "true");
    document.body.classList.remove("pdp-open");
    if (!document.body.classList.contains("cart-open")) document.body.style.overflow = "";
    document.title = t("NUTRISPORT — Nutrition sportive premium");
    if (!silent) play("whoosh");
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  function leave() {
    // back to the page the visitor came from
    if (openedHere) { openedHere = false; history.back(); }
    else { history.replaceState(null, "", location.pathname + location.search); close(); }
  }

  function route() {
    const m = location.hash.match(/^#\/p\/(\w+)/);
    if (m) open(m[1]); else close();
  }
  window.addEventListener("hashchange", route);
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#/p/"]');
    if (a) openedHere = true;
  }, true);

  pdp.addEventListener("click", (e) => {
    const target = e.target;
    if (target.closest("#pdpBack")) return leave();
    if (target.closest("#pdpCart")) return NS.openCart();
    const closer = target.closest("[data-pdp-close]");
    if (closer) {
      e.preventDefault();
      const hash = closer.getAttribute("href");
      history.replaceState(null, "", location.pathname + location.search);
      openedHere = false;
      close();
      const el = document.querySelector(hash);
      if (el) window.scrollTo({ top: hash === "#top" ? 0 : el.getBoundingClientRect().top + window.scrollY, behavior: "instant" });
      return;
    }
    const anchor = target.closest("[data-pdp-anchor]");
    if (anchor) {
      e.preventDefault();
      const el = $(anchor.getAttribute("href"), pdp);
      if (el) scroller.scrollTo({ top: el.offsetTop - 20, behavior: NS.reduceMotion ? "instant" : "smooth" });
      return;
    }
    const dot = target.closest(".flavor-dot");
    if (dot) {
      current.flavor = dot.dataset.flavor;
      updateBuy();
      if (jar3d) jar3d.setFlavor(current.flavor);
      $$(".jar-flavor", $("#pdpJar")).forEach((el) => { el.textContent = tf(current.flavor).toUpperCase(); });
      play("click");
      return;
    }
    const size = target.closest("[data-size]");
    if (size) { current.size = +size.dataset.size; updateBuy(); play("click"); return; }
    if (target.closest("#pdpInc")) { current.qty = Math.min(20, current.qty + 1); updateBuy(); return; }
    if (target.closest("#pdpDec")) { current.qty = Math.max(1, current.qty - 1); updateBuy(); return; }
    if (target.closest("#pdpAdd")) {
      NS.addToCart(current.key, current.flavor, current.size, $(".pdp-jar-fallback svg", pdp), { qty: current.qty });
      return;
    }
    if (target.closest("#pdpFav")) { NS.toggleFav(current.key); return; }
    const tab = target.closest("[data-tab]");
    if (tab) {
      $$("[data-tab]", pdp).forEach((b) => { b.classList.toggle("is-active", b === tab); b.setAttribute("aria-selected", b === tab); });
      $$("[data-panel]", pdp).forEach((pnl) => pnl.classList.toggle("is-active", pnl.dataset.panel === tab.dataset.tab));
      play("click");
    }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && pdp.classList.contains("is-open") && !document.body.classList.contains("cart-open")) leave();
  });

  // deep link (e.g. a shared product URL) once the page has loaded
  if (/^#\/p\//.test(location.hash)) NS.bus.addEventListener("loaded", route, { once: true });
  NS.openProduct = (key) => { openedHere = true; location.hash = `#/p/${key}`; };
})();

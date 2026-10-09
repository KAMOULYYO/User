/* ==========================================================================
   NUTRISPORT — interactions
   ========================================================================== */
(() => {
  "use strict";

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const euro = (n) => n.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });

  /* ------------------------------------------------------------------------
     Product catalogue
     ------------------------------------------------------------------------ */
  const PRODUCTS = {
    whey: {
      name: "Whey Protein", l1: "WHEY", l2: "PROTEIN", word: "WHEY", tag: "Best-seller",
      desc: "25 g de protéines par dose, BCAA naturels, digestion ultra légère.",
      flavors: ["Chocolat Belge", "Vanille Bourbon", "Caramel Salé", "Fraise"],
      sizes: [{ l: "1 kg", p: 32.9 }, { l: "2 kg", p: 54.9 }], defSize: 1,
      rating: 4.9, reviews: 2184,
      c: { jar: "#141414", label: "#141414", ink: "#f4efe6", accent: "#c9a45c", lid: "#c9a45c", card: "#e9e2d6" },
      badges: [["25g", "protéines / dose"], ["5,5g", "BCAA naturels"]],
    },
    isolate: {
      name: "Whey Isolate", l1: "WHEY", l2: "ISOLATE", word: "ISO", tag: "Premium",
      desc: "Isolat micro-filtré 90 %, sans lactose, pour une sèche maîtrisée.",
      flavors: ["Vanille Bourbon", "Chocolat Noir", "Cookies"],
      sizes: [{ l: "900 g", p: 39.9 }, { l: "1,8 kg", p: 64.9 }], defSize: 1,
      rating: 4.9, reviews: 964,
      c: { jar: "#f4f1eb", label: "#f4f1eb", ink: "#111111", accent: "#c9a45c", lid: "#111111", card: "#ecebe6" },
      badges: [["90%", "taux de protéines"], ["0g", "lactose"]],
    },
    creatine: {
      name: "Creatine Monohydrate", l1: "CREATINE", l2: "MONOHYDRATE", word: "CREA", tag: "Creapure®",
      desc: "Créatine pure micronisée, 5 g par dose. Force et puissance prouvées.",
      flavors: ["Neutre", "Citron", "Fruits rouges"],
      sizes: [{ l: "300 g", p: 22.9 }, { l: "500 g", p: 29.9 }], defSize: 1,
      rating: 4.8, reviews: 1730,
      c: { jar: "#f3f3f0", label: "#111111", ink: "#f3f3f0", accent: "#9be22d", lid: "#111111", card: "#e4e9e1" },
      badges: [["5g", "créatine / dose"], ["100%", "Creapure® pure"]],
    },
    preworkout: {
      name: "Pre-Workout", l1: "PRE", l2: "WORKOUT", word: "PRE", tag: "Nouveau", neon: true,
      desc: "Caféine, citrulline et bêta-alanine. Énergie explosive, zéro crash.",
      flavors: ["Citron Yuzu", "Fruit du dragon", "Cola glacé"],
      sizes: [{ l: "300 g", p: 29.9 }, { l: "400 g", p: 34.9 }], defSize: 1,
      rating: 4.8, reviews: 812,
      c: { jar: "#101010", label: "#101010", ink: "#f4f4f4", accent: "#c6ff3d", lid: "#c6ff3d", card: "#dfe4d6" },
      badges: [["200mg", "caféine naturelle"], ["6g", "citrulline"]],
    },
    gainer: {
      name: "Mass Gainer", l1: "MASS", l2: "GAINER", word: "MASS", tag: "Volume",
      desc: "1 250 kcal et 50 g de protéines par shaker pour une prise de masse dense.",
      flavors: ["Cookies & Cream", "Chocolat", "Banane"],
      sizes: [{ l: "3 kg", p: 49.9 }, { l: "5 kg", p: 74.9 }], defSize: 0,
      rating: 4.7, reviews: 706,
      c: { jar: "#e2d4bd", label: "#e2d4bd", ink: "#161616", accent: "#161616", lid: "#161616", card: "#ebe1d2" },
      badges: [["1250", "kcal / shaker"], ["50g", "protéines"]],
    },
  };

  PRODUCTS.gold = {
    name: "NUTRISPORT Gold", l1: "GOLD", l2: "ISOLATE", word: "GOLD", tag: "Édition limitée", metal: true,
    desc: "Whey isolate signature, pot doré numéroté.",
    flavors: ["Vanille de Madagascar"], sizes: [{ l: "1,5 kg", p: 79.9 }], defSize: 0, rating: 5, reviews: 0,
    c: { jar: "#c9a45c", label: "#0d0d0d", ink: "#ecd49c", accent: "#c9a45c", lid: "#0d0d0d", card: "#1a1a1a" },
    badges: [["2026", "pots numérotés"], ["90%", "protéines"]],
  };

  /* Each flavour has its own colour (powder, shaker liquid, label band) */
  const FLAVOR_COLORS = {
    "Chocolat Belge": "#5b3a26", "Vanille Bourbon": "#e6cf98", "Caramel Salé": "#c0803c", "Fraise": "#e0647a",
    "Chocolat Noir": "#3a2418", "Cookies": "#a8865e", "Neutre": "#dcdcd6", "Citron": "#f2d43a",
    "Fruits rouges": "#b8304a", "Citron Yuzu": "#e2dc3c", "Fruit du dragon": "#e0408a", "Cola glacé": "#5a2a1a",
    "Cookies & Cream": "#8a8178", "Chocolat": "#6b4228", "Banane": "#f0d860", "Vanille de Madagascar": "#ecd49c",
  };
  const flavorColor = (f) => FLAVOR_COLORS[f] || "#c9a45c";

  /* Tiny event bus shared with the effect modules (3D jar, story, lab…) */
  const bus = new EventTarget();
  const emit = (type, detail) => bus.dispatchEvent(new CustomEvent(type, { detail }));
  const sfx = (name) => { try { window.NS && window.NS.sfx && window.NS.sfx.play(name); } catch (_) { /* audio unavailable */ } };

  /* Hero slides & their colour themes */
  const SLIDES = [
    { key: "whey", word: "PROTEIN", theme: "protein", bg: "#ece5da", giant: "#d9cbb3", ink: "#0d0d0d", accent: "#b48a3e", glow: "rgba(201,164,92,.42)", powder: "#7a4b2e", particles: "#7a4b2e" },
    { key: "isolate", word: "ISOLATE", theme: "isolate", bg: "#eeedea", giant: "#dad7cf", ink: "#0d0d0d", accent: "#b48a3e", glow: "rgba(255,255,255,.95)", powder: "#efe2c6", particles: "#c9b48a" },
    { key: "creatine", word: "CREATINE", theme: "creatine", bg: "#e5eae2", giant: "#cdd6c8", ink: "#0d0d0d", accent: "#5f9c12", glow: "rgba(198,255,61,.35)", powder: "#fafafa", particles: "#9aa894" },
    { key: "preworkout", word: "ENERGY", theme: "energy", bg: "#0e0e0e", giant: "#1e1e1e", ink: "#f4f2ee", accent: "#c6ff3d", glow: "rgba(198,255,61,.22)", powder: "#c6ff3d", particles: "#c6ff3d" },
    { key: "gainer", word: "GAINER", theme: "gainer", bg: "#e8decf", giant: "#d3c2a7", ink: "#0d0d0d", accent: "#9a7234", glow: "rgba(255,240,215,.9)", powder: "#d8c4a2", particles: "#a88a5c" },
  ];

  /* ------------------------------------------------------------------------
     3D jar renderer (inline SVG, unique gradient ids per instance)
     ------------------------------------------------------------------------ */
  let jarUid = 0;
  function jarSVG(key, opts = {}) {
    const p = PRODUCTS[key];
    const c = p.c;
    const id = `j${++jarUid}`;
    const flavor = opts.flavor || p.flavors[0];
    const size = opts.size || p.sizes[p.defSize].l;
    const lightLabel = isLight(c.label);
    const sub = lightLabel ? "rgba(0,0,0,.55)" : "rgba(255,255,255,.6)";
    const l1Size = p.l1.length > 6 ? 38 : 50;
    const l2Size = p.l2.length > 8 ? 17 : 22;
    return `
<svg viewBox="0 0 260 340" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Pot ${p.name}">
  <defs>
    <linearGradient id="${id}s" x1="0" x2="1">
      <stop offset="0" stop-color="#000" stop-opacity=".55"/>
      <stop offset=".07" stop-color="#000" stop-opacity=".22"/>
      <stop offset=".22" stop-color="#fff" stop-opacity=".1"/>
      <stop offset=".3" stop-color="#fff" stop-opacity=".32"/>
      <stop offset=".38" stop-color="#fff" stop-opacity=".06"/>
      <stop offset=".7" stop-color="#000" stop-opacity=".04"/>
      <stop offset=".9" stop-color="#000" stop-opacity=".3"/>
      <stop offset="1" stop-color="#000" stop-opacity=".6"/>
    </linearGradient>
    <linearGradient id="${id}v" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity=".18"/>
      <stop offset=".12" stop-color="#fff" stop-opacity="0"/>
      <stop offset=".85" stop-color="#000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity=".28"/>
    </linearGradient>
    <linearGradient id="${id}t" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity=".45"/>
      <stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
    <pattern id="${id}r" width="5" height="10" patternUnits="userSpaceOnUse">
      <rect width="2" height="10" fill="#000" opacity=".22"/>
      <rect x="2" width="1" height="10" fill="#fff" opacity=".12"/>
    </pattern>
    <clipPath id="${id}c"><rect x="30" y="86" width="200" height="236" rx="28"/></clipPath>
    <filter id="${id}b" x="-50%" y="-10%" width="200%" height="120%"><feGaussianBlur stdDeviation="3"/></filter>
  </defs>

  <!-- body -->
  <g clip-path="url(#${id}c)">
    <rect x="30" y="86" width="200" height="236" fill="${c.jar}"/>
    <rect x="30" y="138" width="200" height="140" fill="${c.label}"/>
    <rect x="30" y="138" width="200" height="4" fill="${c.accent}"/>
    <rect x="30" y="274" width="200" height="4" fill="${c.accent}"/>

    <text x="130" y="164" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-weight="800" font-size="10" letter-spacing="4.5" fill="${c.accent === "#161616" ? c.ink : c.accent}">NUTRISPORT</text>
    <text x="130" y="${164 + l1Size + 2}" text-anchor="middle" font-family="Anton, Impact, sans-serif" font-size="${l1Size}" letter-spacing="1" fill="${c.ink}">${p.l1}</text>
    <text x="130" y="${164 + l1Size + 6 + l2Size}" text-anchor="middle" font-family="Anton, Impact, sans-serif" font-size="${l2Size}" letter-spacing="3" fill="${c.ink}">${p.l2}</text>
    <rect x="112" y="${172 + l1Size + l2Size}" width="36" height="2" rx="1" fill="${c.accent === "#161616" ? c.ink : c.accent}"/>
    <text class="jar-flavor" x="130" y="${190 + l1Size + l2Size}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-weight="600" font-size="9.5" letter-spacing="1.5" fill="${sub}">${flavor.toUpperCase()}</text>
    <text class="jar-size" x="130" y="300" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-weight="700" font-size="9" letter-spacing="2" fill="${isLight(c.jar) ? "rgba(0,0,0,.45)" : "rgba(255,255,255,.5)"}">${size.toUpperCase()} · NET WT</text>

    <!-- cylinder shading -->
    <rect x="30" y="86" width="200" height="236" fill="url(#${id}s)"/>
    <rect x="30" y="86" width="200" height="236" fill="url(#${id}v)"/>
    <g class="jar-spec">
      <rect x="74" y="92" width="11" height="224" rx="5.5" fill="#fff" opacity=".42" filter="url(#${id}b)"/>
      <rect x="92" y="92" width="4" height="224" rx="2" fill="#fff" opacity=".2" filter="url(#${id}b)"/>
    </g>
  </g>

  <!-- shoulder -->
  <rect x="52" y="78" width="156" height="14" rx="5" fill="${shade(c.jar, -0.25)}"/>
  <rect x="52" y="78" width="156" height="14" rx="5" fill="url(#${id}s)"/>

  <!-- lid -->
  <rect x="46" y="18" width="168" height="64" rx="14" fill="${c.lid}"/>
  <rect x="46" y="26" width="168" height="50" fill="url(#${id}r)" opacity=".9"/>
  <rect x="46" y="18" width="168" height="64" rx="14" fill="url(#${id}s)"/>
  <rect x="46" y="18" width="168" height="18" rx="10" fill="url(#${id}t)"/>
  <rect x="46" y="74" width="168" height="8" rx="4" fill="#000" opacity=".18"/>
</svg>`;
  }

  function isLight(hex) {
    const n = parseInt(hex.slice(1), 16);
    const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    return (r * 299 + g * 587 + b * 114) / 1000 > 150;
  }
  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    const f = (v) => clamp(Math.round(v + (amt < 0 ? v * amt : (255 - v) * amt)), 0, 255);
    const r = f((n >> 16) & 255), g = f((n >> 8) & 255), b = f(n & 255);
    return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
  }

  /* ------------------------------------------------------------------------
     Preloader
     ------------------------------------------------------------------------ */
  $$(".preloader-word span").forEach((s, i) => s.style.setProperty("--i", i));
  let loaded = false;
  let pageReady = false;
  const preFill = $(".preloader-fill");
  const prePct = $("#prePct");
  const preStart = performance.now();
  const PRE_MIN = reduceMotion ? 0 : 1500;
  (function preTick(now) {
    // the jar fills with powder; it waits at 90 % until the page has really loaded
    const k = clamp((now - preStart) / PRE_MIN, 0, 1);
    const target = pageReady ? 1 : .9;
    const v = Math.min(target, 1 - Math.pow(1 - k, 2.2));
    prePct.textContent = Math.round(v * 100);
    preFill.style.transform = `translate(${(now / 18) % 60 - 60}px, ${142 - v * 108}px)`;
    if (v >= 1) return setTimeout(finishLoading, 250);
    requestAnimationFrame(preTick);
  })(preStart);
  const finishLoading = () => {
    if (loaded) return;
    loaded = true;
    document.body.classList.remove("is-loading");
    document.body.classList.add("is-loaded");
    document.documentElement.classList.add("has-smooth");
    setSlide(0, true);
    emit("loaded");
  };
  window.addEventListener("load", () => { pageReady = true; });

  /* ------------------------------------------------------------------------
     HERO
     ------------------------------------------------------------------------ */
  const hero = $(".hero");
  const heroJars = $("#heroJars");
  const heroProduct = $("#heroProduct");
  const giant = $("#giantText");
  const switcher = $("#heroSwitcher");
  const floats = $$(".float");
  const root = document.documentElement;
  let current = -1;
  let heroFlavorSel = null;
  let autoplayTimer = null;
  const heroFlavors = $("#heroFlavors");
  const AUTOPLAY = 6000;
  root.style.setProperty("--autoplay", AUTOPLAY + "ms");

  SLIDES.forEach((s, i) => {
    const slot = document.createElement("div");
    slot.className = "jar-slot";
    slot.innerHTML = `<div class="jar-float"><div class="jar-spin">${jarSVG(s.key)}</div></div>`;
    heroJars.appendChild(slot);

    const btn = document.createElement("button");
    btn.className = "switch-item magnetic-soft";
    btn.setAttribute("role", "tab");
    btn.innerHTML = `<span class="switch-num">0${i + 1}</span><span>${s.word}<br><small>${PRODUCTS[s.key].name}</small></span><span class="switch-bar"><i></i></span>`;
    btn.addEventListener("click", () => { setSlide(i); });
    switcher.appendChild(btn);
  });

  // mobile dots
  const dots = document.createElement("div");
  dots.className = "hero-dots";
  SLIDES.forEach((s, i) => {
    const d = document.createElement("button");
    d.setAttribute("aria-label", s.word);
    d.addEventListener("click", () => setSlide(i));
    dots.appendChild(d);
  });
  $("#heroStage").after(dots);

  function splitGiant(word) {
    giant.innerHTML = [...word].map((ch, i) => `<span style="--i:${i}">${ch}</span>`).join("");
  }

  function setSlide(i, first = false) {
    if (i === current) return;
    const prev = current;
    current = (i + SLIDES.length) % SLIDES.length;
    const s = SLIDES[current];
    const p = PRODUCTS[s.key];

    // theme
    hero.dataset.theme = s.theme;
    const vars = { "--hero-bg": s.bg, "--hero-giant": s.giant, "--hero-ink": s.ink, "--hero-accent": s.accent, "--hero-glow": s.glow, "--powder": s.powder };
    for (const k in vars) root.style.setProperty(k, vars[k]);
    $('meta[name="theme-color"]').setAttribute("content", s.bg);
    particleColor = s.particles;
    heroFlavorSel = p.flavors[0];

    // jars
    const slots = $$(".jar-slot", heroJars);
    slots.forEach((el, idx) => {
      el.classList.toggle("is-active", idx === current);
      el.classList.toggle("is-leaving", idx === prev);
      if (idx === prev) setTimeout(() => el.classList.remove("is-leaving"), 900);
    });

    // giant text
    if (first || reduceMotion) {
      splitGiant(s.word);
      requestAnimationFrame(() => requestAnimationFrame(() => giant.classList.add("is-in")));
    } else {
      giant.classList.remove("is-in");
      giant.classList.add("is-out");
      setTimeout(() => {
        splitGiant(s.word);
        giant.classList.remove("is-out");
        requestAnimationFrame(() => requestAnimationFrame(() => giant.classList.add("is-in")));
      }, 520);
    }

    // floats
    floats.forEach((f) => f.classList.toggle("is-on", f.dataset.themes.split(" ").includes(s.theme)));

    // info
    const info = $(".hero-product-info");
    info.classList.remove("is-swap"); void info.offsetWidth; info.classList.add("is-swap");
    $("#heroName").textContent = p.name;
    const sz = p.sizes[p.defSize];
    $("#heroFlavor").textContent = `${p.flavors[0]} · ${sz.l}`;
    $("#heroPrice").textContent = euro(sz.p);
    heroFlavors.innerHTML = p.flavors.map((f, j) =>
      `<button class="flavor-dot ${j === 0 ? "is-active" : ""}" role="radio" aria-checked="${j === 0}" data-flavor="${f}" style="--c:${flavorColor(f)}" title="${f}"><i></i><span>${f}</span></button>`).join("");

    // badges
    const [ba, bb] = [$("#badgeA"), $("#badgeB")];
    [ba, bb].forEach((b) => b.classList.add("is-swap"));
    setTimeout(() => {
      ba.innerHTML = `<strong>${p.badges[0][0]}</strong><span>${p.badges[0][1]}</span>`;
      bb.innerHTML = `<strong>${p.badges[1][0]}</strong><span>${p.badges[1][1]}</span>`;
      [ba, bb].forEach((b) => b.classList.remove("is-swap"));
    }, first ? 0 : 500);

    // switcher state
    $$(".switch-item", switcher).forEach((b, idx) => {
      b.classList.toggle("is-active", idx === current);
      b.setAttribute("aria-selected", idx === current);
      const bar = $(".switch-bar i", b);
      bar.style.animation = "none"; void bar.offsetWidth; bar.style.animation = "";
    });
    $$("button", dots).forEach((d, idx) => d.classList.toggle("is-active", idx === current));

    restartAutoplay();
    if (!first) sfx("whoosh");
    emit("slide", { index: current, slide: s, key: s.key, product: p, flavor: heroFlavorSel, first });
  }

  function setHeroFlavor(f) {
    const s = SLIDES[current];
    const p = PRODUCTS[s.key];
    heroFlavorSel = f;
    $$(".flavor-dot", heroFlavors).forEach((b) => {
      const on = b.dataset.flavor === f;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-checked", on);
    });
    $("#heroFlavor").textContent = `${f} · ${p.sizes[p.defSize].l}`;
    // powder, scoop & particles take the flavour colour
    root.style.setProperty("--powder", flavorColor(f));
    particleColor = flavorColor(f);
    $$(".jar-slot", heroJars)[current].querySelectorAll(".jar-flavor").forEach((t) => { t.textContent = f.toUpperCase(); });
    sfx("click");
    emit("flavor", { key: s.key, flavor: f, color: flavorColor(f) });
    restartAutoplay();
  }
  heroFlavors.addEventListener("click", (e) => {
    const b = e.target.closest(".flavor-dot");
    if (b) setHeroFlavor(b.dataset.flavor);
  });

  function restartAutoplay() {
    clearTimeout(autoplayTimer);
    if (reduceMotion) return;
    autoplayTimer = setTimeout(() => {
      if (hero.classList.contains("is-paused") || heroOffscreen) return restartAutoplay();
      setSlide(current + 1);
    }, AUTOPLAY);
  }

  heroProduct.addEventListener("mouseenter", () => hero.classList.add("is-paused"));
  heroProduct.addEventListener("mouseleave", () => hero.classList.remove("is-paused"));
  let downX = 0;
  heroProduct.addEventListener("pointerdown", (e) => { downX = e.clientX; });
  heroProduct.addEventListener("click", (e) => {
    if (window.NS.has3D || Math.abs(e.clientX - downX) > 6) return; // the 3D jar uses drag-to-rotate
    setSlide(current + 1);
  });

  // swipe on mobile
  let touchX = null;
  $("#heroStage").addEventListener("touchstart", (e) => { touchX = e.touches[0].clientX; }, { passive: true });
  $("#heroStage").addEventListener("touchend", (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 40) setSlide(current + (dx < 0 ? 1 : -1));
    touchX = null;
  });
  document.addEventListener("keydown", (e) => {
    if (window.scrollY > window.innerHeight * .6 || document.body.classList.contains("cart-open")) return;
    if (e.key === "ArrowRight") setSlide(current + 1);
    if (e.key === "ArrowLeft") setSlide(current - 1);
  });

  $("#heroBuy").addEventListener("click", (e) => {
    const p = PRODUCTS[SLIDES[current].key];
    addToCart(SLIDES[current].key, heroFlavorSel || p.flavors[0], p.defSize, e.currentTarget.closest(".hero").querySelector(".jar-slot.is-active svg"));
  });

  /* ------------------------------------------------------------------------
     Pointer: tilt, parallax, cursor
     ------------------------------------------------------------------------ */
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  const cursor = { x: innerWidth / 2, y: innerHeight / 2, rx: innerWidth / 2, ry: innerHeight / 2 };
  const cursorEl = $(".cursor");
  const dot = $(".cursor-dot");
  const ring = $(".cursor-ring");

  window.addEventListener("pointermove", (e) => {
    pointer.tx = (e.clientX / innerWidth) * 2 - 1;
    pointer.ty = (e.clientY / innerHeight) * 2 - 1;
    cursor.x = e.clientX; cursor.y = e.clientY;
  }, { passive: true });

  if (finePointer) {
    document.addEventListener("pointerover", (e) => {
      cursorEl.classList.toggle("is-hover", !!e.target.closest("a, button, .hero-product, input, .product-card"));
    });
  }

  /* ------------------------------------------------------------------------
     Particles (canvas)
     ------------------------------------------------------------------------ */
  const canvas = $("#particles");
  const ctx = canvas.getContext("2d");
  let particleColor = SLIDES[0].particles;
  let parts = [];
  let cw = 0, ch = 0, dpr = 1;
  function sizeCanvas() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    cw = hero.clientWidth; ch = hero.clientHeight;
    canvas.width = cw * dpr; canvas.height = ch * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.round(clamp(cw / 16, 30, 90));
    parts = Array.from({ length: count }, () => newParticle(true));
  }
  function newParticle(anywhere) {
    // particles emanate around the product, drifting outwards & upwards
    const cx = cw / 2, cy = ch * (cw < 900 ? .38 : .5);
    const a = Math.random() * Math.PI * 2;
    const r = anywhere ? Math.random() * Math.min(cw, 900) * .55 : 40 + Math.random() * 80;
    return {
      x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r * .7,
      vx: Math.cos(a) * (.1 + Math.random() * .35), vy: -.15 - Math.random() * .35,
      r: Math.random() < .15 ? 2 + Math.random() * 2.5 : .6 + Math.random() * 1.6,
      life: anywhere ? Math.random() : 0, max: .6 + Math.random() * .8,
      z: .3 + Math.random() * .9,
    };
  }
  function drawParticles() {
    ctx.clearRect(0, 0, cw, ch);
    ctx.fillStyle = particleColor;
    for (let i = 0; i < parts.length; i++) {
      const q = parts[i];
      q.life += .0025;
      q.x += q.vx + pointer.x * q.z * .25;
      q.y += q.vy;
      const t = q.life / q.max;
      if (t >= 1 || q.y < -10 || q.x < -10 || q.x > cw + 10) { parts[i] = newParticle(false); continue; }
      ctx.globalAlpha = Math.sin(t * Math.PI) * .7 * q.z;
      ctx.beginPath();
      ctx.arc(q.x + pointer.x * 30 * q.z, q.y + pointer.y * 20 * q.z, q.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  /* ------------------------------------------------------------------------
     Main animation loop (scroll + pointer driven)
     ------------------------------------------------------------------------ */
  let scrollY = window.scrollY;
  let heroOffscreen = false;
  const tilt = { x: 0, y: 0 };
  const benefitsSec = $("#benefices");
  const track = $("#benefitsTrack");
  const benefitEls = $$(".benefit");
  const bar = $("#benefitsBar");
  const benefitsIdx = $("#benefitsIdx");
  const isDesktop = () => window.innerWidth > 900;

  window.addEventListener("scroll", () => { scrollY = window.scrollY; }, { passive: true });

  function frame() {
    pointer.x = lerp(pointer.x, pointer.tx, .06);
    pointer.y = lerp(pointer.y, pointer.ty, .06);

    const vh = window.innerHeight;
    heroOffscreen = scrollY > hero.offsetHeight;

    if (!heroOffscreen) {
      // tilt + parallax
      tilt.x = lerp(tilt.x, pointer.y * -9, .08);
      tilt.y = lerp(tilt.y, pointer.x * 14, .08);
      const sp = clamp(scrollY / vh, 0, 1);
      if (!reduceMotion) {
        heroProduct.style.transform = window.NS.has3D
          ? `translate3d(${pointer.x * 14}px, ${scrollY * .28}px, 0) scale(${1 - sp * .12})`
          : `translate3d(${pointer.x * 14}px, ${scrollY * .28}px, 0) scale(${1 - sp * .12}) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`;
        heroProduct.style.setProperty("--hx", (pointer.x * 30).toFixed(1));
        root.style.setProperty("--mx", pointer.x.toFixed(3));
        root.style.setProperty("--my", pointer.y.toFixed(3));
        root.style.setProperty("--sy", (scrollY * .6).toFixed(1));
        giant.style.setProperty("--gx", `${(-scrollY * .35 + pointer.x * -20).toFixed(1)}px`);
        $(".hero-content").style.transform = `translate3d(0, ${scrollY * -.12}px, 0)`;
        $(".hero-content").style.opacity = 1 - sp * 1.4;
      }
      drawParticles();
    }

    // pinned horizontal benefits
    if (isDesktop() && !reduceMotion) {
      const rect = benefitsSec.getBoundingClientRect();
      const total = benefitsSec.offsetHeight - vh;
      const prog = clamp(-rect.top / total, 0, 1);
      if (rect.top < vh && rect.bottom > 0) {
        track.style.transform = `translate3d(${-prog * 75}%, 0, 0)`;
        bar.style.setProperty("--p", prog.toFixed(4));
        const idx = clamp(Math.round(prog * 3), 0, 3);
        benefitsIdx.textContent = `0${idx + 1}`;
        benefitEls.forEach((el, i) => {
          const local = clamp(1 - Math.abs(prog * 3 - i), 0, 1);
          el.querySelector(".benefit-word").style.setProperty("--fill", `${(local * 100).toFixed(1)}%`);
          el.classList.toggle("is-on", local > .5);
          el.querySelector(".benefit-body").style.transform = `translate3d(${(prog * 3 - i) * -60}px, 0, 0)`;
          el.querySelector(".benefit-body").style.opacity = .25 + local * .75;
        });
      }
    }

    // cursor
    if (finePointer) {
      cursor.rx = lerp(cursor.rx, cursor.x, .18);
      cursor.ry = lerp(cursor.ry, cursor.y, .18);
      dot.style.transform = `translate3d(${cursor.x}px, ${cursor.y}px, 0)`;
      ring.style.transform = `translate3d(${cursor.rx}px, ${cursor.ry}px, 0)`;
    }

    requestAnimationFrame(frame);
  }

  /* ------------------------------------------------------------------------
     Nav behaviour
     ------------------------------------------------------------------------ */
  const nav = $("#nav");
  // the nav turns dark over dark sections
  const darkSections = $$("[data-nav='dark']");
  const updateNav = () => {
    nav.classList.toggle("is-scrolled", window.scrollY > 40);
    const y = nav.offsetHeight; // section under the bottom edge of the nav
    nav.classList.toggle("is-dark", window.scrollY > 40 && darkSections.some((s) => { const r = s.getBoundingClientRect(); return r.top <= y && r.bottom >= y; }));
  };
  window.addEventListener("scroll", updateNav, { passive: true });

  const burger = $("#burger");
  burger.addEventListener("click", () => {
    const open = !nav.classList.contains("menu-open");
    nav.classList.toggle("menu-open", open);
    burger.setAttribute("aria-expanded", open);
    document.body.style.overflow = open ? "hidden" : "";
  });
  $$("#navLinks a").forEach((a) => a.addEventListener("click", () => {
    nav.classList.remove("menu-open");
    burger.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }));

  /* ------------------------------------------------------------------------
     Product cards
     ------------------------------------------------------------------------ */
  const grid = $("#productGrid");
  ["whey", "creatine", "preworkout", "gainer"].forEach((key, i) => {
    const p = PRODUCTS[key];
    const state = { flavor: p.flavors[0], size: p.defSize };
    const card = document.createElement("article");
    card.className = "product-card reveal";
    card.style.setProperty("--delay", `${i * .1}s`);
    card.style.setProperty("--card-bg", p.c.card);
    card.innerHTML = `
      <div class="product-visual" data-word="${p.word}">
        <span class="product-tag ${p.neon ? "product-tag--neon" : ""}">${p.tag}</span>
        <span class="product-rating"><b>★</b> ${p.rating.toString().replace(".", ",")} <span style="opacity:.55">(${p.reviews.toLocaleString("fr-FR")})</span></span>
        <div class="product-jar">${jarSVG(key, { size: p.sizes[p.defSize].l })}</div>
      </div>
      <div class="product-body">
        <div class="product-top"><h3 class="product-name">${p.name}</h3><span class="product-price">${euro(p.sizes[p.defSize].p)}</span></div>
        <p class="product-desc">${p.desc}</p>
        <div><span class="opt-label">Goût</span><div class="chips" data-opt="flavor">${p.flavors.map((f, j) => `<button class="chip ${j === 0 ? "is-active" : ""}" data-v="${f}">${f}</button>`).join("")}</div></div>
        <div><span class="opt-label">Format</span><div class="chips" data-opt="size">${p.sizes.map((s, j) => `<button class="chip ${j === p.defSize ? "is-active" : ""}" data-v="${j}">${s.l}</button>`).join("")}</div></div>
        <button class="btn btn--dark add-btn"><span>Ajouter au panier</span><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></button>
      </div>`;
    grid.appendChild(card);

    card.addEventListener("click", (e) => {
      const chip = e.target.closest(".chip");
      if (chip) {
        const group = chip.parentElement;
        $$(".chip", group).forEach((c) => c.classList.toggle("is-active", c === chip));
        if (group.dataset.opt === "flavor") {
          state.flavor = chip.dataset.v;
          $(".jar-flavor", card).textContent = state.flavor.toUpperCase();
        } else {
          state.size = +chip.dataset.v;
          $(".product-price", card).textContent = euro(p.sizes[state.size].p);
          $(".jar-size", card).textContent = `${p.sizes[state.size].l.toUpperCase()} · NET WT`;
        }
        return;
      }
      if (e.target.closest(".add-btn")) addToCart(key, state.flavor, state.size, $(".product-jar svg", card));
    });

    // 3D tilt on card visual
    if (finePointer && !reduceMotion) {
      const vis = $(".product-visual", card);
      const jar = $(".product-jar", card);
      vis.addEventListener("pointermove", (e) => {
        const r = vis.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - .5;
        const y = (e.clientY - r.top) / r.height - .5;
        jar.style.transform = `translateY(-12px) scale(1.07) perspective(600px) rotateY(${x * 22}deg) rotateX(${y * -14}deg)`;
      });
      vis.addEventListener("pointerleave", () => { jar.style.transform = ""; });
    }
  });

  $$(".benefit-link").forEach((a) => a.addEventListener("click", () => {
    const key = a.dataset.product;
    const idx = ["whey", "creatine", "preworkout", "gainer"].indexOf(key);
    const card = grid.children[idx];
    if (card) setTimeout(() => { card.animate([{ boxShadow: "0 0 0 0 rgba(198,255,61,.9)" }, { boxShadow: "0 0 0 14px rgba(198,255,61,0)" }], { duration: 1200, delay: 600 }); }, 0);
  }));

  /* ------------------------------------------------------------------------
     Cart
     ------------------------------------------------------------------------ */
  const STORE_KEY = "nutrisport-cart";
  const FREE_SHIPPING = 60;
  let cart = [];
  try { cart = JSON.parse(localStorage.getItem(STORE_KEY)) || []; } catch (_) { cart = []; }
  cart = cart.filter((it) => PRODUCTS[it.key] && PRODUCTS[it.key].sizes[it.size] && it.key !== "gold");
  const packPrice = (price, disc) => Math.round(price * (1 - (disc || 0)) * 100) / 100;
  const unitPrice = (it) => packPrice(PRODUCTS[it.key].sizes[it.size].p, it.disc);

  const cartEl = $("#cart");
  const overlay = $("#overlay");

  function saveCart() { try { localStorage.setItem(STORE_KEY, JSON.stringify(cart)); } catch (_) { /* storage unavailable */ } }

  function pushItem(key, flavor, size, disc = 0) {
    const existing = cart.find((it) => it.key === key && it.flavor === flavor && it.size === size && (it.disc || 0) === disc);
    if (existing) existing.qty++;
    else cart.push(disc ? { key, flavor, size, qty: 1, disc } : { key, flavor, size, qty: 1 });
  }
  function bumpCart() {
    renderCart();
    const count = $("#cartCount");
    count.classList.remove("bump"); void count.offsetWidth; count.classList.add("bump");
    sfx("pop");
  }

  function addToCart(key, flavor, size, sourceEl) {
    pushItem(key, flavor, size);
    saveCart();
    flyToCart(sourceEl, bumpCart);
    toast(`${PRODUCTS[key].name} · ${flavor} ajouté au panier`);
    emit("cart:add", { key, flavor });
  }

  /* items: [{key, flavor, size}] — added together with a pack discount */
  function addPack(items, disc, sourceEls = []) {
    items.forEach((it) => pushItem(it.key, it.flavor, it.size, disc));
    saveCart();
    let pending = Math.max(1, sourceEls.length);
    const done = () => { if (--pending === 0) bumpCart(); };
    if (sourceEls.length) sourceEls.forEach((el, i) => setTimeout(() => flyToCart(el, done), i * 140));
    else done();
    toast(`Pack de ${items.length} produits ajouté · -${Math.round(disc * 100)} %`);
    emit("cart:add", { pack: true });
  }

  function flyToCart(sourceEl, done) {
    const target = $("#cartBtn");
    if (!sourceEl || reduceMotion || !sourceEl.animate) return done();
    const s = sourceEl.getBoundingClientRect();
    const t = target.getBoundingClientRect();
    const clone = document.createElement("div");
    clone.className = "fly";
    clone.innerHTML = sourceEl.outerHTML;
    const w = Math.min(s.width, 140);
    clone.style.width = w + "px";
    clone.style.left = s.left + s.width / 2 - w / 2 + "px";
    clone.style.top = s.top + s.height / 2 - (w * 340 / 260) / 2 + "px";
    document.body.appendChild(clone);
    const dx = t.left + t.width / 2 - (s.left + s.width / 2);
    const dy = t.top + t.height / 2 - (s.top + s.height / 2);
    clone.animate([
      { transform: "translate(0,0) scale(1) rotate(0)", opacity: 1 },
      { transform: `translate(${dx * .35}px, ${dy * .2 - 80}px) scale(.7) rotate(-12deg)`, opacity: 1, offset: .45 },
      { transform: `translate(${dx}px, ${dy}px) scale(.1) rotate(20deg)`, opacity: .4 },
    ], { duration: 850, easing: "cubic-bezier(.6,0,.3,1)" }).onfinish = () => { clone.remove(); done(); };
  }

  function renderCart() {
    const items = $("#cartItems");
    const count = cart.reduce((n, it) => n + it.qty, 0);
    const subtotal = cart.reduce((n, it) => n + unitPrice(it) * it.qty, 0);
    $("#cartCount").textContent = count;
    $("#cartHeadCount").textContent = `(${count})`;
    $("#cartSubtotal").textContent = euro(subtotal);
    const left = Math.max(0, FREE_SHIPPING - subtotal);
    $("#shippingText").innerHTML = left > 0 ? `Plus que <b>${euro(left)}</b> pour la livraison offerte` : `🎉 <b>Livraison offerte</b> débloquée !`;
    $("#shippingBar").style.width = `${clamp(subtotal / FREE_SHIPPING, 0, 1) * 100}%`;
    $("#cartShipping").textContent = subtotal === 0 ? "—" : left > 0 ? "4,90 €" : "Offerte";
    $("#checkoutBtn").disabled = count === 0;
    $("#checkoutBtn").style.opacity = count === 0 ? .4 : 1;

    if (!cart.length) {
      items.innerHTML = `<div class="cart-empty"><strong>Votre panier est vide</strong>Faites le plein de performance.<br><a href="#produits" class="btn btn--dark" data-close-cart><span>Voir les produits</span></a></div>`;
      return;
    }
    items.innerHTML = cart.map((it, i) => {
      const p = PRODUCTS[it.key];
      const sz = p.sizes[it.size];
      return `<div class="cart-item">
        <div class="cart-thumb" style="--card-bg:${p.c.card}">${jarSVG(it.key, { flavor: it.flavor, size: sz.l })}</div>
        <div><h4>${p.name}</h4><p>${it.flavor} · ${sz.l}${it.disc ? ` <span class="pack-tag">Pack -${Math.round(it.disc * 100)}%</span>` : ""}</p>
          <div class="qty"><button data-dec="${i}" aria-label="Diminuer">−</button><span>${it.qty}</span><button data-inc="${i}" aria-label="Augmenter">+</button></div>
        </div>
        <div class="cart-item-right">${it.disc ? `<s>${euro(sz.p * it.qty)}</s>` : ""}<b>${euro(unitPrice(it) * it.qty)}</b><button class="remove" data-rm="${i}">Retirer</button></div>
      </div>`;
    }).join("");
  }

  $("#cartItems").addEventListener("click", (e) => {
    const t = e.target.closest("button, a");
    if (!t) return;
    if (t.hasAttribute("data-close-cart")) return closeCart();
    const i = +(t.dataset.inc ?? t.dataset.dec ?? t.dataset.rm);
    if (t.dataset.inc !== undefined) cart[i].qty++;
    else if (t.dataset.dec !== undefined) { cart[i].qty--; if (cart[i].qty <= 0) cart.splice(i, 1); }
    else if (t.dataset.rm !== undefined) cart.splice(i, 1);
    else return;
    saveCart(); renderCart();
  });

  function openCart() {
    cartEl.classList.add("is-open"); overlay.classList.add("is-open");
    cartEl.setAttribute("aria-hidden", "false");
    document.body.classList.add("cart-open");
    document.body.style.overflow = "hidden";
  }
  function closeCart() {
    cartEl.classList.remove("is-open"); overlay.classList.remove("is-open");
    cartEl.setAttribute("aria-hidden", "true");
    document.body.classList.remove("cart-open");
    document.body.style.overflow = "";
  }
  $("#cartBtn").addEventListener("click", openCart);
  $("#cartClose").addEventListener("click", closeCart);
  overlay.addEventListener("click", closeCart);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeCart(); });
  $("#checkoutBtn").addEventListener("click", () => toast("Redirection vers le paiement sécurisé… (démo)"));

  $("#cartItems").addEventListener("click", (e) => { if (e.target.closest("[data-inc],[data-dec],[data-rm]")) sfx("click"); });

  let toastTimer;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("is-show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("is-show"), 2600);
  }

  $("#newsletter").addEventListener("submit", (e) => {
    e.preventDefault();
    e.target.reset();
    toast("Bienvenue dans la Team ! Votre code -10% : TEAMNS10");
  });

  /* ------------------------------------------------------------------------
     Reviews
     ------------------------------------------------------------------------ */
  const REVIEWS = [
    ["Thomas R.", "Powerlifter", "La whey chocolat est juste incroyable. Texture onctueuse, aucun ballonnement et +12 kg au squat en 3 mois avec la créatine."],
    ["Inès M.", "CrossFit", "Le pre-workout yuzu me donne un focus de malade sans les picotements désagréables. Mon WOD du matin n'a jamais été aussi intense."],
    ["Karim B.", "Bodybuilding", "Enfin une marque transparente : analyses labo dispo pour chaque lot. La qualité se sent dès la première dose."],
    ["Léa D.", "Running & fitness", "J'ai testé beaucoup de protéines, l'isolate vanille est la seule qui se mélange parfaitement à l'eau. Livrée en 36h !"],
    ["Hugo P.", "Rugby", "Le mass gainer cookies m'a aidé à prendre 6 kg propres pendant la présaison. Goût top, pas écœurant."],
    ["Sarah K.", "Coach sportive", "Je la recommande à tous mes clients. Formules courtes, dosages sérieux et un packaging qui claque."],
    ["Maxime T.", "Calisthenics", "Récupération clairement meilleure depuis que je prends la whey après mes séances. Je m'entraîne 6 jours sur 7 sans courbatures."],
    ["Nadia F.", "Haltérophilie", "La créatine Creapure est hyper fine, se dissout instantanément. Service client au top, réponse en moins d'une heure."],
  ];
  const avatarColors = ["#0d0d0d", "#c9a45c", "#5f7a3a", "#8b6236", "#2c2c2c", "#a07a3c"];
  const rows = $("#reviewsRows");
  [REVIEWS.slice(0, 4), REVIEWS.slice(4)].forEach((set, r) => {
    const row = document.createElement("div");
    row.className = `reviews-row ${r ? "reviews-row--rev" : ""}`;
    const html = set.map(([n, role, txt], i) => `
      <article class="review">
        <div class="stars" aria-label="5 étoiles">★★★★★</div>
        <p>“${txt}”</p>
        <div class="review-author">
          <span class="avatar" style="background:${avatarColors[(i + r * 3) % avatarColors.length]}">${n.split(" ").map((w) => w[0]).join("")}</span>
          <div><b>${n}</b><span>${role}</span></div>
          <span class="verified">✓ Vérifié</span>
        </div>
      </article>`).join("");
    row.innerHTML = html + html; // duplicate for seamless loop
    rows.appendChild(row);
  });

  /* ------------------------------------------------------------------------
     FAQ
     ------------------------------------------------------------------------ */
  const FAQ = [
    ["Quelle protéine choisir pour débuter ?", "La Whey Protein est idéale pour la majorité des sportifs : 25 g de protéines par dose, excellente digestibilité et un goût premium. Si vous êtes intolérant au lactose ou en sèche, privilégiez l'Isolate."],
    ["Quand prendre la créatine monohydrate ?", "Le moment importe peu : l'essentiel est la régularité. Prenez 3 à 5 g chaque jour, de préférence avec un repas ou votre shaker post-entraînement, y compris les jours de repos."],
    ["Vos produits sont-ils testés anti-dopage ?", "Oui. Chaque lot est analysé par un laboratoire indépendant (pureté, métaux lourds, substances interdites). Les certificats sont disponibles sur demande et via le QR code présent sur chaque pot."],
    ["Quels sont les délais de livraison ?", "Les commandes passées avant 14h sont expédiées le jour même. Comptez 48h en France métropolitaine et 3 à 5 jours en Europe. La livraison est offerte dès 60 € d'achat."],
    ["Puis-je retourner un produit ?", "Absolument. Vous disposez de 30 jours pour nous retourner un produit non ouvert. Si un goût ne vous plaît pas, notre garantie « Satisfait ou remboursé » s'applique sur votre premier pot."],
    ["Le pre-workout convient-il aux débutants ?", "Oui, en commençant par une demi-dose pour évaluer votre tolérance à la caféine. Évitez de le consommer moins de 6h avant le coucher."],
  ];
  const faqList = $("#faqList");
  FAQ.forEach(([q, a], i) => {
    const item = document.createElement("div");
    item.className = `faq-item reveal ${i === 0 ? "is-open" : ""}`;
    item.style.setProperty("--delay", `${i * .06}s`);
    item.innerHTML = `<button class="faq-q" aria-expanded="${i === 0}"><span>${q}</span><span class="faq-icon"></span></button><div class="faq-a"><div><p>${a}</p></div></div>`;
    $(".faq-q", item).addEventListener("click", () => {
      const open = !item.classList.contains("is-open");
      $$(".faq-item", faqList).forEach((it) => { it.classList.remove("is-open"); $(".faq-q", it).setAttribute("aria-expanded", "false"); });
      item.classList.toggle("is-open", open);
      $(".faq-q", item).setAttribute("aria-expanded", open);
    });
    faqList.appendChild(item);
  });

  /* ------------------------------------------------------------------------
     Reveal on scroll + counters
     ------------------------------------------------------------------------ */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add("is-visible");
      const counter = en.target.querySelector("[data-count]");
      if (counter) animateCount(counter);
      io.unobserve(en.target);
    });
  }, { threshold: .15, rootMargin: "0px 0px -8% 0px" });
  $$(".reveal").forEach((el) => io.observe(el));

  // stagger siblings automatically
  $$(".why-grid, .stats").forEach((g) => [...g.children].forEach((c, i) => c.style.setProperty("--delay", `${i * .1}s`)));

  function animateCount(el) {
    const end = parseFloat(el.dataset.count);
    const dec = +(el.dataset.decimals || 0);
    const suffix = el.dataset.suffix || "";
    const fmt = (v) => v.toLocaleString("fr-FR", { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suffix;
    if (reduceMotion) { el.textContent = fmt(end); return; }
    const t0 = performance.now(), dur = 1800;
    const step = (t) => {
      const k = clamp((t - t0) / dur, 0, 1);
      const e = 1 - Math.pow(1 - k, 4);
      el.textContent = fmt(end * e);
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  // mobile: activate benefit meters when visible
  const bio = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (en.isIntersecting && !isDesktop()) en.target.classList.add("is-on");
  }), { threshold: .4 });
  benefitEls.forEach((el) => bio.observe(el));

  /* ------------------------------------------------------------------------
     Magnetic buttons
     ------------------------------------------------------------------------ */
  if (finePointer && !reduceMotion) {
    $$(".magnetic").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .2}px, ${(e.clientY - r.top - r.height / 2) * .3}px)`;
      });
      el.addEventListener("pointerleave", () => { el.style.transform = ""; });
    });
  }

  /* ------------------------------------------------------------------------
     Public API for the effect modules
     ------------------------------------------------------------------------ */
  window.NS = Object.assign(window.NS || {}, {
    PRODUCTS, SLIDES, FLAVOR_COLORS, flavorColor, jarSVG, euro, bus, emit, toast, packPrice,
    addToCart, addPack, openCart, reduceMotion, finePointer, sfx: window.NS && window.NS.sfx,
    has3D: false,
    get currentSlide() { return current; },
    get heroFlavor() { return heroFlavorSel; },
    pointer,
  });

  /* ------------------------------------------------------------------------
     Init
     ------------------------------------------------------------------------ */
  sizeCanvas();
  let resizeT;
  window.addEventListener("resize", () => { clearTimeout(resizeT); resizeT = setTimeout(sizeCanvas, 150); });
  renderCart();
  requestAnimationFrame(frame);
  if (document.readyState === "complete") pageReady = true;
})();

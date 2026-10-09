/* ==========================================================================
   NUTRISPORT — "Crée ton pot" studio
   Name on the 3D label, jar & lid colours, product and flavour.
   Exports a share-ready PNG and adds the personalised jar to the cart.
   ========================================================================== */
(() => {
  "use strict";
  const NS = window.NS;
  const { PRODUCTS, t, tf, euro } = NS;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const play = (n) => NS.sfx && NS.sfx.play(n);

  const section = $("#studio");
  if (!section) return;

  const JAR_COLORS = [
    ["#141414", "Noir mat"], ["#f4f1eb", "Blanc"], ["#e2d4bd", "Sable"], ["#c9a45c", "Or"],
    ["#1b2a44", "Bleu nuit"], ["#7a1f1f", "Bordeaux"], ["#2f4a35", "Kaki"],
  ];
  const LID_COLORS = [["#c9a45c", "Or"], ["#141414", "Noir"], ["#f4f1eb", "Blanc"], ["#c6ff3d", "Néon"], ["#c0c0c0", "Argent"]];
  const BASES = ["whey", "isolate", "creatine", "preworkout", "gainer"];

  const state = { name: "", key: "whey", jar: "#141414", lid: "#c9a45c", flavor: PRODUCTS.whey.flavors[0] };
  const custom = () => ({ name: state.name, jar: state.jar, lid: state.lid });

  const nameInput = $("#creatorName");
  const nameBg = $("#creatorNameBg");
  const fallback = $("#creatorFallback");
  let jar3d = null;

  // ---- controls
  $("#creatorProduct").innerHTML = BASES.map((k) => `<button class="chip ${k === state.key ? "is-active" : ""}" data-key="${k}">${PRODUCTS[k].name}</button>`).join("");
  const swatches = (list, current, attr) => list.map(([c, label]) =>
    `<button class="swatch ${c === current ? "is-active" : ""}" data-${attr}="${c}" style="--c:${c}" title="${t(label)}" aria-label="${t(label)}"></button>`).join("");
  $("#creatorJarColor").innerHTML = swatches(JAR_COLORS, state.jar, "jar");
  $("#creatorLidColor").innerHTML = swatches(LID_COLORS, state.lid, "lid");

  function renderFlavors() {
    $("#creatorFlavor").innerHTML = PRODUCTS[state.key].flavors.map((f) =>
      `<button class="chip chip--flavor ${f === state.flavor ? "is-active" : ""}" data-flavor="${f}" style="--c:${NS.flavorColor(f)}"><i></i>${tf(f)}</button>`).join("");
  }

  function update(spin = false) {
    const p = PRODUCTS[state.key];
    const display = state.name || t("TON NOM");
    nameBg.textContent = display;
    nameBg.style.fontSize = `${Math.min(26, 150 / Math.max(4, display.length))}vw`;
    $("#creatorCount").textContent = `${state.name.length} / 10`;
    $("#creatorPrice").textContent = euro(p.sizes[p.defSize].p + NS.CUSTOM_FEE);
    $("#creatorPriceNote").textContent = t("{size} · personnalisation +{fee} incluse", { size: p.sizes[p.defSize].l, fee: euro(NS.CUSTOM_FEE) });
    section.style.setProperty("--studio-jar", state.jar);
    // the SVG stays in sync too: it is the no-WebGL fallback and the "fly to cart" image
    fallback.innerHTML = NS.jarSVG(state.key, { flavor: state.flavor, custom: custom() });
    if (jar3d) jar3d.setCustom(state.key, state.flavor, custom(), spin);
  }

  nameInput.addEventListener("input", () => {
    // letters (accents included), digits, space and dash only
    const clean = nameInput.value.toUpperCase().replace(/[^A-Z0-9À-ÖØ-Ý \-]/g, "").slice(0, 10);
    if (clean !== nameInput.value) nameInput.value = clean;
    state.name = clean.trim();
    update();
  });
  section.addEventListener("click", (e) => {
    const prod = e.target.closest("[data-key]");
    if (prod) {
      state.key = prod.dataset.key;
      state.flavor = PRODUCTS[state.key].flavors[0];
      $$("[data-key]", section).forEach((b) => b.classList.toggle("is-active", b === prod));
      renderFlavors(); play("click"); update(true);
      return;
    }
    const jar = e.target.closest("[data-jar]");
    if (jar) { state.jar = jar.dataset.jar; $$("[data-jar]", section).forEach((b) => b.classList.toggle("is-active", b === jar)); play("click"); update(true); return; }
    const lid = e.target.closest("[data-lid]");
    if (lid) { state.lid = lid.dataset.lid; $$("[data-lid]", section).forEach((b) => b.classList.toggle("is-active", b === lid)); play("twist"); update(true); return; }
    const fl = e.target.closest("[data-flavor]");
    if (fl) { state.flavor = fl.dataset.flavor; renderFlavors(); play("click"); update(true); }
  });

  // ---- 3D (when available)
  function mount3D() {
    if (jar3d || !NS.createJar) return;
    jar3d = NS.createJar($("#creatorJar"), { product: state.key, custom: custom(), flavor: state.flavor, autoSpeed: 0.004, startAngle: -0.3 });
    if (jar3d) $("#creatorJar").classList.add("is-3d");
    update();
  }
  // create the jar only when the studio comes near the viewport
  new IntersectionObserver(([en], obs) => {
    if (!en.isIntersecting) return;
    obs.disconnect();
    if (NS.createJar) mount3D();
    else NS.bus.addEventListener("jar3d:ready", mount3D, { once: true });
  }, { rootMargin: "300px" }).observe(section);

  // ---- share image (1080 × 1350, Instagram portrait)
  async function buildImage() {
    const W = 1080, H = 1350;
    const cv = document.createElement("canvas");
    cv.width = W; cv.height = H;
    const ctx = cv.getContext("2d");
    const light = NS.isLight(state.jar === "#c9a45c" ? "#0d0d0d" : state.jar);
    const bg = ctx.createRadialGradient(W / 2, H * 0.45, 50, W / 2, H * 0.5, H * 0.75);
    bg.addColorStop(0, light ? "#ffffff" : "#2a2a2a");
    bg.addColorStop(1, light ? "#e9e3d8" : "#0b0b0b");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    const ink = light ? "#0d0d0d" : "#f4f1ec";

    // giant name behind the jar
    const name = state.name || "NUTRISPORT";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `${Math.min(420, 1900 / Math.max(4, name.length))}px Anton, Impact, sans-serif`;
    ctx.fillStyle = light ? "rgba(0,0,0,.07)" : "rgba(255,255,255,.07)";
    ctx.fillText(name, W / 2, H * 0.47);

    // the jar
    let img = null;
    try {
      const src = jar3d ? jar3d.snapshot() : svgToDataUrl($("svg", fallback));
      img = await loadImage(src);
    } catch (_) { img = null; }
    if (img) {
      const h = H * 0.62, w = h * (img.width / img.height);
      ctx.drawImage(img, (W - w) / 2, H * 0.47 - h / 2, w, h);
    }

    // texts
    ctx.fillStyle = "#c9a45c";
    ctx.font = "800 30px Inter, Arial, sans-serif";
    ctx.letterSpacing = "14px";
    ctx.fillText("NUTRISPORT", W / 2 + 7, 110);
    ctx.letterSpacing = "0px";
    ctx.fillStyle = ink;
    ctx.font = "78px Anton, Impact, sans-serif";
    ctx.fillText(t("MON POT NUTRISPORT"), W / 2, H - 200);
    ctx.font = "600 30px Inter, Arial, sans-serif";
    ctx.fillStyle = light ? "rgba(0,0,0,.55)" : "rgba(255,255,255,.6)";
    ctx.fillText(`${PRODUCTS[state.key].name} · ${tf(state.flavor)}`, W / 2, H - 130);
    ctx.fillText("#NUTRISPORT", W / 2, H - 80);
    return new Promise((res) => cv.toBlob(res, "image/png"));
  }
  function loadImage(src) {
    return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
  }
  function svgToDataUrl(svg) {
    const clone = svg.cloneNode(true);
    clone.setAttribute("width", "780"); clone.setAttribute("height", "1020");
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(new XMLSerializer().serializeToString(clone));
  }
  const fileName = () => `nutrisport-${(state.name || "mon-pot").toLowerCase().replace(/\s+/g, "-")}.png`;

  $("#creatorDownload").addEventListener("click", async () => {
    const blob = await buildImage();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = fileName();
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    play("pop");
    NS.toast(t("Image téléchargée : partage-la avec #NUTRISPORT !"));
  });

  // native share sheet with the image (mobile browsers that support files)
  const shareBtn = $("#creatorShare");
  try {
    const probe = new File([new Blob(["x"], { type: "image/png" })], "x.png", { type: "image/png" });
    if (navigator.canShare && navigator.canShare({ files: [probe] })) shareBtn.hidden = false;
  } catch (_) { /* File constructor unsupported */ }
  shareBtn.addEventListener("click", async () => {
    const blob = await buildImage();
    if (!blob) return;
    try {
      await navigator.share({ files: [new File([blob], fileName(), { type: "image/png" })], title: "NUTRISPORT", text: t("Mon pot NUTRISPORT personnalisé 💪 #NUTRISPORT") });
    } catch (_) { /* share cancelled */ }
  });

  $("#creatorAdd").addEventListener("click", () => {
    if (!state.name) {
      nameInput.focus();
      nameInput.parentElement.classList.remove("shake"); void nameInput.offsetWidth; nameInput.parentElement.classList.add("shake");
      NS.toast(t("Écris d'abord ton prénom sur l'étiquette ✍️"));
      return;
    }
    const p = PRODUCTS[state.key];
    NS.addToCart(state.key, state.flavor, p.defSize, $("svg", fallback), { custom: custom() });
  });

  renderFlavors();
  update();
})();

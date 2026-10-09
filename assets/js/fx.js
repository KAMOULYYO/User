/* ==========================================================================
   NUTRISPORT — global effects
   - powder trail following the cursor (desktop)
   - curtain transition on in-page navigation
   - Gold edition countdown
   ========================================================================== */
(() => {
  "use strict";
  const NS = window.NS;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const root = document.documentElement;

  /* ------------------------------------------------------------------------
     Powder cursor trail
     ------------------------------------------------------------------------ */
  const trail = $("#trail");
  if (trail && NS.finePointer && !NS.reduceMotion) {
    const ctx = trail.getContext("2d");
    let w = 0, h = 0, dpr = 1;
    const parts = [];
    const GOLD = ["#c9a45c", "#e2c88f", "#9a7234"];
    let last = null;
    let running = false;

    const size = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = innerWidth; h = innerHeight;
      trail.width = w * dpr; trail.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size();
    window.addEventListener("resize", size);

    const heroEl = $(".hero");
    function color() {
      // in the hero the trail takes the current flavour colour, elsewhere it is gold
      if (window.scrollY < heroEl.offsetHeight * .8) return getComputedStyle(root).getPropertyValue("--powder").trim() || GOLD[0];
      return GOLD[(Math.random() * GOLD.length) | 0];
    }

    window.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      if (document.body.classList.contains("cart-open")) return;
      const x = e.clientX, y = e.clientY;
      if (last) {
        const dist = Math.hypot(x - last.x, y - last.y);
        const n = Math.min(5, Math.floor(dist / 7));
        const c = color();
        for (let i = 0; i < n; i++) {
          const t = i / Math.max(1, n);
          parts.push({
            x: last.x + (x - last.x) * t + (Math.random() - .5) * 6,
            y: last.y + (y - last.y) * t + (Math.random() - .5) * 6,
            vx: (Math.random() - .5) * .8, vy: (Math.random() - .5) * .8 - .2,
            r: .8 + Math.random() * 2.2, life: 1, decay: .012 + Math.random() * .02, c,
          });
        }
        if (parts.length > 260) parts.splice(0, parts.length - 260);
      }
      last = { x, y };
      if (!running) { running = true; requestAnimationFrame(tick); }
    }, { passive: true });
    document.addEventListener("pointerleave", () => { last = null; });

    function tick() {
      ctx.clearRect(0, 0, w, h);
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.x += p.vx; p.y += p.vy; p.vy += .025; p.vx *= .98;
        p.life -= p.decay;
        if (p.life <= 0) { parts.splice(i, 1); continue; }
        ctx.globalAlpha = p.life * .85;
        ctx.fillStyle = p.c;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * (.6 + p.life * .4), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (parts.length) requestAnimationFrame(tick);
      else running = false;
    }
  }

  /* ------------------------------------------------------------------------
     Curtain transition for in-page links
     ------------------------------------------------------------------------ */
  const curtain = $(".curtain");
  let busy = false;
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey) return;
    const id = a.getAttribute("href");
    if (id.length < 2) return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    const go = () => window.scrollTo({ top: id === "#top" ? 0 : target.getBoundingClientRect().top + window.scrollY, behavior: "instant" });
    if (NS.reduceMotion || busy) { go(); return; }
    busy = true;
    NS.sfx && NS.sfx.play("whoosh");
    curtain.classList.remove("is-out");
    curtain.classList.add("is-in");
    setTimeout(() => {
      go();
      history.replaceState(null, "", id);
      curtain.classList.add("is-out");
      setTimeout(() => { curtain.classList.remove("is-in", "is-out"); busy = false; }, 750);
    }, 620);
  });

  /* ------------------------------------------------------------------------
     Gold edition countdown
     ------------------------------------------------------------------------ */
  const DROP = new Date("2026-11-27T10:00:00+01:00").getTime();
  const cd = $("#countdown");
  if (cd) {
    const cells = Object.fromEntries($$("[data-cd]", cd).map((el) => [el.dataset.cd, el]));
    const pad = (n) => String(n).padStart(2, "0");
    let prev = {};
    const tickCd = () => {
      const left = Math.max(0, DROP - Date.now());
      if (!left) {
        cd.classList.add("is-live");
        $("#goldDate").textContent = "Disponible maintenant — en quantité limitée";
        $("#goldNotify span").textContent = "Découvrir l'édition Gold";
        return;
      }
      const v = {
        d: Math.floor(left / 864e5), h: Math.floor(left / 36e5) % 24,
        m: Math.floor(left / 6e4) % 60, s: Math.floor(left / 1e3) % 60,
      };
      for (const k in v) {
        if (prev[k] !== v[k]) {
          cells[k].textContent = pad(v[k]);
          cells[k].classList.remove("flip"); void cells[k].offsetWidth; cells[k].classList.add("flip");
        }
      }
      prev = v;
      setTimeout(tickCd, 1000 - (Date.now() % 1000));
    };
    tickCd();
  }
  const notify = $("#goldNotify");
  if (notify) {
    notify.addEventListener("click", () => {
      const input = $("#newsletter input");
      window.scrollTo({ top: $("#newsletter").getBoundingClientRect().top + window.scrollY - innerHeight / 2, behavior: NS.reduceMotion ? "instant" : "smooth" });
      setTimeout(() => input && input.focus({ preventScroll: true }), 700);
      NS.toast("Inscris-toi à la newsletter : tu seras prévenu(e) dès l'ouverture du drop Gold.");
    });
  }
})();

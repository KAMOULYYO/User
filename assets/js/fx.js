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
    if (id.length < 2 || id.startsWith("#/")) return; // "#/p/…" links are product pages
    let target = null;
    try { target = document.querySelector(id); } catch (_) { return; }
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
        $("#goldDate").textContent = NS.t("Disponible maintenant — en quantité limitée");
        $("#goldNotify span").textContent = NS.t("Découvrir l'édition Gold");
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
      NS.toast(NS.t("Inscris-toi à la newsletter : tu seras prévenu(e) dès l'ouverture du drop Gold."));
    });
  }

  /* ------------------------------------------------------------------------
     Scramble titles: letters decode left to right when a title appears
     ------------------------------------------------------------------------ */
  const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&@$";
  function scramble(el) {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) if (walker.currentNode.nodeValue.trim()) nodes.push(walker.currentNode);
    const originals = nodes.map((n) => n.nodeValue);
    const total = originals.reduce((n, s) => n + s.length, 0);
    const dur = Math.min(1100, 380 + total * 22);
    const t0 = performance.now();
    el.classList.add("is-scrambling");
    function step(now) {
      const k = Math.min(1, (now - t0) / dur);
      let offset = 0;
      nodes.forEach((n, i) => {
        const src = originals[i];
        let out = "";
        for (let j = 0; j < src.length; j++) {
          const ch = src[j];
          const pos = (offset + j) / total;
          // characters resolve progressively; spaces and punctuation stay put
          out += k >= pos + 0.12 || !/[A-Za-zÀ-ÿ0-9]/.test(ch) ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0];
        }
        n.nodeValue = out;
        offset += src.length;
      });
      if (k < 1) requestAnimationFrame(step);
      else { nodes.forEach((n, i) => { n.nodeValue = originals[i]; }); el.classList.remove("is-scrambling"); }
    }
    requestAnimationFrame(step);
  }
  if (!NS.reduceMotion) {
    const sio = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (!en.isIntersecting) return;
      sio.unobserve(en.target);
      setTimeout(() => scramble(en.target), 180);
    }), { threshold: .6 });
    $$(".section-title, .gold-title, .cta h2, .story-cap h3").forEach((el) => sio.observe(el));
  }

  /* ------------------------------------------------------------------------
     Velocity marquee: speeds up and leans with the scroll speed
     ------------------------------------------------------------------------ */
  const mTrack = $(".marquee-track");
  if (mTrack && !NS.reduceMotion) {
    mTrack.style.animation = "none";
    let x = 0, vel = 0, lastY = window.scrollY, half = 0, mVisible = true;
    const measure = () => { half = mTrack.scrollWidth / 2; };
    measure();
    window.addEventListener("resize", measure);
    new IntersectionObserver(([en]) => { mVisible = en.isIntersecting; }).observe(mTrack);
    (function loop() {
      requestAnimationFrame(loop);
      const y = window.scrollY;
      vel += ((y - lastY) - vel) * 0.12;
      lastY = y;
      if (!mVisible) return;
      const dir = vel < -0.5 ? -1 : 1;
      x -= (0.9 + Math.min(18, Math.abs(vel) * 0.35)) * dir;
      if (half) { if (x <= -half) x += half; if (x > 0) x -= half; }
      const skew = Math.max(-14, Math.min(14, -vel * 0.35));
      mTrack.style.transform = `translate3d(${x}px, 0, 0) skewX(${skew}deg)`;
    })();
  }
})();

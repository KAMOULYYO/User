/* ==========================================================================
   NUTRISPORT — scroll story
   The lid unscrews, the powder bursts into particles, the particles form
   "25G", then pour into a shaker that fills up. Fully scroll-driven and
   reversible (every frame is a pure function of the scroll progress).
   ========================================================================== */
(() => {
  "use strict";
  const NS = window.NS;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeOut = (x) => 1 - Math.pow(1 - x, 3);
  const easeInOut = (x) => (x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const easeIn = (x) => x * x;

  const section = $("#formule");
  if (!section) return;
  const sticky = $(".story-sticky", section);
  const canvas = $("#storyCanvas");
  const ctx = canvas.getContext("2d");
  const jar = $("#storyJar");
  const lid = $("#storyLid");
  const shaker = $("#storyShaker");
  const liquid = $("#shLiquid");
  const caps = $$(".story-cap", section);
  const bar = $("#storyBar");
  const hint = $(".story-hint", section);
  const isMobile = () => innerWidth <= 900;

  const PALETTE = ["#f4e6c4", "#e2c88f", "#c9a45c", "#9a7234"];
  let N = 0;
  let parts = [];
  let W = 0, H = 0, dpr = 1;
  let mouth = { x: 0, y: 0 };
  let shakerMouth = { x: 0, y: 0 };

  function sampleText(text, w, h) {
    const off = document.createElement("canvas");
    off.width = w; off.height = h;
    const o = off.getContext("2d");
    const fs = Math.min(w * (isMobile() ? .5 : .34), h * .42);
    o.font = `${fs}px Anton, Impact, sans-serif`;
    o.textAlign = "center";
    o.textBaseline = "middle";
    o.fillStyle = "#fff";
    o.fillText(text, w / 2, h * .42);
    const data = o.getImageData(0, 0, w, h).data;
    const step = Math.max(3, Math.round(fs / 52));
    const pts = [];
    for (let y = 0; y < h; y += step) {
      for (let x = 0; x < w; x += step) {
        if (data[(y * w + x) * 4 + 3] > 128) pts.push({ x, y });
      }
    }
    // shuffle so particles fly to random spots of the glyphs
    for (let i = pts.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [pts[i], pts[j]] = [pts[j], pts[i]]; }
    return pts;
  }

  // measure an element as it is laid out at rest (mover reset to its base transform)
  function measure(el, anchorY, mover) {
    const prev = mover.style.transform;
    mover.style.transform = "translate(-50%, 0)";
    const r = el.getBoundingClientRect();
    const s = sticky.getBoundingClientRect();
    mover.style.transform = prev;
    return { x: r.left - s.left + r.width / 2, y: r.top - s.top + r.height * anchorY };
  }

  function layout() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = sticky.clientWidth; H = sticky.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    mouth = measure($(".story-body", jar), 0.05, jar);
    shakerMouth = measure(shaker, 0.26, shaker);

    N = isMobile() ? 700 : 1600;
    const pts = sampleText("25G", Math.round(W), Math.round(H));
    const cx = W / 2, cy = H * .42, R = Math.min(W, H);
    parts = Array.from({ length: N }, (_, i) => {
      const a = Math.random() * Math.PI * 2;
      const rad = (.12 + Math.pow(Math.random(), .7) * .38) * R;
      const tp = pts.length ? pts[i % pts.length] : { x: cx, y: cy };
      return {
        s: Math.random() * .12,                       // per-particle stagger
        sx: cx + Math.cos(a) * rad * (W > H ? 1.25 : .9), // scatter cloud
        sy: cy + Math.sin(a) * rad * .75 - R * .05,
        tx: tp.x + (Math.random() - .5) * 2,           // "25G" target
        ty: tp.y + (Math.random() - .5) * 2,
        ox: (Math.random() - .5) * 26,                 // offset in the jar mouth / shaker
        r: .9 + Math.random() * 1.6,
        c: (Math.random() * PALETTE.length) | 0,
        ph: Math.random() * Math.PI * 2,
      };
    });
  }

  let visible = false;
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; }, { rootMargin: "200px" }).observe(section);

  const fired = {};
  function cue(name, p, at) {
    if (p >= at && !fired[name]) { fired[name] = true; NS.sfx && NS.sfx.play(name); }
    if (p < at - .02) fired[name] = false;
  }

  let lastP = -1;
  function frame(t) {
    requestAnimationFrame(frame);
    if (!visible) return;
    const rect = section.getBoundingClientRect();
    const total = section.offsetHeight - innerHeight;
    const p = clamp(-rect.top / total, 0, 1);
    const shimmer = p > .5 && p < .7; // keep animating while the text is held
    if (p === lastP && !shimmer) return;
    lastP = p;

    bar.style.transform = `scaleX(${p})`;
    hint.style.visibility = p > .03 ? "hidden" : "visible";

    // ---- lid unscrews and flies off
    const lt = easeInOut(clamp((p - .02) / .14, 0, 1));
    lid.style.transform = `translate(${lt * 70}%, ${-lt * 320}%) rotate(${-lt * 38}deg)`;
    lid.style.opacity = 1 - clamp((p - .18) / .06, 0, 1);

    // ---- jar slides away, shaker comes in
    const jt = easeInOut(clamp((p - .6) / .12, 0, 1));
    jar.style.transform = `translate(calc(-50% - ${jt * (isMobile() ? 60 : 32)}vw), 0) rotate(${-jt * 12}deg)`;
    // dim the jar while the particles spell "25G" above it
    const dim = clamp((p - .32) / .08, 0, 1) * .7;
    jar.style.opacity = (1 - jt) * (1 - dim);
    const st = easeOut(clamp((p - .6) / .12, 0, 1));
    shaker.style.transform = `translate(-50%, ${(1 - st) * 60}px) scale(${.85 + st * .15})`;
    shaker.style.opacity = st;
    const level = clamp((p - .7) / .24, 0, 1);
    liquid.setAttribute("y", 296 - easeOut(level) * 196);
    liquid.setAttribute("fill", NS.flavorColor(NS.heroFlavor || "Chocolat Belge"));

    // ---- captions
    const ci = p < .12 ? 0 : p < .36 ? 1 : p < .64 ? 2 : 3;
    caps.forEach((c, i) => c.classList.toggle("is-on", i === ci));

    cue("twist", p, .03);
    cue("whoosh", p, .13);
    cue("pour", p, .7);

    // ---- particles
    ctx.clearRect(0, 0, W, H);
    const time = t / 1000;
    for (let pass = 0; pass < PALETTE.length; pass++) {
      ctx.fillStyle = PALETTE[pass];
      for (let i = 0; i < N; i++) {
        const q = parts[i];
        if (q.c !== pass) continue;
        const bp = clamp((p - .1 - q.s) / .18, 0, 1);
        if (bp <= 0) continue;
        const tp = clamp((p - .36 - q.s * .5) / .18, 0, 1);
        const fp = clamp((p - .64 - q.s) / .22, 0, 1);
        if (fp >= 1) continue; // absorbed by the shaker

        // burst: from the jar mouth, arcing upwards into the cloud
        const be = easeOut(bp);
        let x = lerp(mouth.x + q.ox, q.sx, be);
        let y = lerp(mouth.y, q.sy, be) - Math.sin(be * Math.PI) * H * .12;
        // form the text
        if (tp > 0) {
          const te = easeInOut(tp);
          x = lerp(x, q.tx, te);
          y = lerp(y, q.ty, te);
          if (tp >= 1 && fp === 0) { x += Math.sin(time * 2 + q.ph) * .8; y += Math.cos(time * 2.4 + q.ph) * .8; }
        }
        // pour into the shaker (gravity-like curve)
        if (fp > 0) {
          x = lerp(x, shakerMouth.x + q.ox * .6, easeInOut(fp));
          y = lerp(y, shakerMouth.y, easeIn(fp));
        }
        const a = Math.min(1, bp * 3) * (1 - fp * fp);
        ctx.globalAlpha = a;
        const r = q.r * (tp >= 1 ? 1.1 : 1);
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
      }
    }
    ctx.globalAlpha = 1;
  }

  let resizeT;
  window.addEventListener("resize", () => { clearTimeout(resizeT); resizeT = setTimeout(() => { layout(); lastP = -1; }, 150); });
  const start = () => { layout(); requestAnimationFrame(frame); };
  // wait for Anton so the "25G" particles take the right shape
  if (document.fonts) Promise.race([document.fonts.load("200px Anton"), new Promise((r) => setTimeout(r, 2500))]).then(start);
  else start();
  NS.bus && NS.bus.addEventListener("loaded", () => { layout(); lastP = -1; });
})();

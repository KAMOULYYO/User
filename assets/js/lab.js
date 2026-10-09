/* ==========================================================================
   NUTRISPORT — interactive tools
   - "Trouve ton stack" quiz with -15 % pack
   - protein calculator
   - shaker simulator
   ========================================================================== */
(() => {
  "use strict";
  const NS = window.NS;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const play = (n) => NS.sfx && NS.sfx.play(n);
  const t = NS.t, tf = NS.tf;

  function tweenNumber(el, to, { dur = 900, dec = 0, from = parseFloat(el.dataset.v || "0") } = {}) {
    el.dataset.v = to;
    const fmt = (v) => NS.num(v, dec);
    if (NS.reduceMotion) { el.textContent = fmt(to); return; }
    const t0 = performance.now();
    const step = (t) => {
      const k = clamp((t - t0) / dur, 0, 1);
      el.textContent = fmt(from + (to - from) * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* ------------------------------------------------------------------------
     Stack finder quiz
     ------------------------------------------------------------------------ */
  const quiz = $("#quiz");
  if (quiz) {
    const PACK_DISCOUNT = 0.15;
    const GOALS = {
      masse: { label: "Prise de masse", factor: 2, base: ["gainer", "creatine"], extra: "whey", line: "Des calories de qualité et la force pour charger plus lourd." },
      seche: { label: "Sèche", factor: 2.2, base: ["isolate", "creatine"], extra: "preworkout", line: "Un maximum de protéines, un minimum de calories, et l'énergie pour tenir." },
      force: { label: "Force", factor: 1.8, base: ["creatine", "whey"], extra: "preworkout", line: "Le duo prouvé pour battre tes records, boosté pour tes grosses séances." },
      energie: { label: "Énergie", factor: 1.6, base: ["preworkout", "whey"], extra: "creatine", line: "Un focus laser à l'entraînement et une récupération rapide après." },
    };
    const state = { goal: null, freq: null, weight: 75 };
    const steps = $$(".quiz-step", quiz);
    const bar = $("#quizBar");
    const count = $("#quizCount");
    const back = $("#quizBack");
    let step = 0;

    function go(n) {
      const prev = step;
      step = n;
      steps.forEach((s, i) => {
        s.classList.toggle("is-active", i === n);
        s.classList.toggle("is-before", i < n);
      });
      bar.style.transform = `scaleX(${Math.min(n, 3) / 3})`;
      count.textContent = n < 3 ? `${n + 1} / 3` : t("Ton stack");
      back.style.visibility = n > 0 ? "visible" : "hidden";
      quiz.classList.toggle("is-result", n === 3);
      if (n !== prev) play("click");
    }

    quiz.addEventListener("click", (e) => {
      const opt = e.target.closest(".quiz-opt");
      if (!opt) return;
      const name = opt.dataset.name;
      state[name] = opt.dataset.value;
      $$(`.quiz-opt[data-name="${name}"]`, quiz).forEach((o) => o.classList.toggle("is-selected", o === opt));
      setTimeout(() => go(step + 1), NS.reduceMotion ? 0 : 320);
    });
    back.addEventListener("click", () => go(Math.max(0, step - 1)));

    const weight = $("#quizWeight");
    const weightVal = $("#quizWeightVal");
    const paintRange = (input) => input.style.setProperty("--pct", `${((input.value - input.min) / (input.max - input.min)) * 100}%`);
    weight.addEventListener("input", () => {
      state.weight = +weight.value;
      weightVal.innerHTML = `${weight.value}<small>kg</small>`;
      paintRange(weight);
    });
    paintRange(weight);

    $("#quizReveal").addEventListener("click", () => {
      renderResult();
      go(3);
      play("reveal");
    });

    function renderResult() {
      const g = GOALS[state.goal || "force"];
      const keys = [...g.base];
      if (+state.freq >= 2) keys.push(g.extra);
      const items = keys.map((k) => {
        const p = NS.PRODUCTS[k];
        return { key: k, flavor: p.flavors[0], size: p.defSize, price: p.sizes[p.defSize].p };
      });
      const total = items.reduce((n, it) => n + it.price, 0);
      // same per-item rounding as the cart so both totals always match
      const pack = items.reduce((n, it) => n + NS.packPrice(it.price, PACK_DISCOUNT), 0);
      const protein = Math.round(state.weight * g.factor);
      const res = $("#quizResult");
      res.innerHTML = `
        <div class="result-head">
          <span class="result-badge">${t("Stack {goal}", { goal: t(g.label) })}</span>
          <h3>${t("Ton stack sur-mesure")}</h3>
          <p>${t(g.line)} ${t("Objectif : <b>{p} g de protéines / jour</b> pour {w} kg.", { p: protein, w: state.weight })}</p>
        </div>
        <div class="result-items">
          ${items.map((it, i) => {
            const p = NS.PRODUCTS[it.key];
            return `<div class="result-item" style="--i:${i};--card-bg:${p.c.card}">
              <div class="result-jar">${NS.jarSVG(it.key)}</div>
              <b>${p.name}</b><span>${tf(it.flavor)} · ${p.sizes[it.size].l}</span><em>${NS.euro(it.price)}</em>
            </div>`;
          }).join('<span class="result-plus">+</span>')}
        </div>
        <div class="result-foot">
          <div class="result-price">
            <s>${NS.euro(total)}</s>
            <strong>${NS.euro(pack)}</strong>
            <span>${t("Tu économises {x} (-{d} %)", { x: NS.euro(total - pack), d: PACK_DISCOUNT * 100 })}</span>
          </div>
          <div class="result-actions">
            <button class="btn btn--dark" id="quizAdd"><span>${t("Ajouter le pack au panier")}</span><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></button>
            <button class="quiz-restart" id="quizRestart">${t("Recommencer le quiz")}</button>
          </div>
        </div>`;
      $("#quizAdd").addEventListener("click", () => {
        NS.addPack(items.map(({ key, flavor, size }) => ({ key, flavor, size })), PACK_DISCOUNT, $$(".result-jar svg", res));
      });
      $("#quizRestart").addEventListener("click", () => {
        state.goal = state.freq = null;
        $$(".quiz-opt", quiz).forEach((o) => o.classList.remove("is-selected"));
        go(0);
      });
    }
    go(0);
  }

  /* ------------------------------------------------------------------------
     Protein calculator
     ------------------------------------------------------------------------ */
  const calc = $("#calc");
  if (calc) {
    const w = $("#calcWeight");
    const seg = $("#calcGoal");
    const arc = $("#gaugeArc");
    let factor = 1.6;
    const paintRange = () => w.style.setProperty("--pct", `${((w.value - w.min) / (w.max - w.min)) * 100}%`);

    function update(animate = true) {
      const kg = +w.value;
      const protein = Math.round(kg * factor);
      $("#calcWeightVal").textContent = `${kg} kg`;
      arc.style.strokeDashoffset = 100 - clamp(protein / 300, 0, 1) * 100;
      const opts = animate ? {} : { dur: 0 };
      tweenNumber($("#calcProtein"), protein, opts);
      tweenNumber($("#calcDoses"), Math.max(1, Math.round((protein * 0.3) / 25)), opts);
      tweenNumber($("#calcCrea"), clamp(Math.round(kg * 0.05), 3, 5), opts);
      tweenNumber($("#calcWater"), Math.round((kg * 0.035 + 0.5) * 10) / 10, { ...opts, dec: 1 });
      paintRange();
    }
    w.addEventListener("input", () => update());
    seg.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      $$("button", seg).forEach((x) => x.classList.toggle("is-active", x === b));
      factor = +b.dataset.f;
      play("click");
      update();
    });
    // animate the gauge the first time it scrolls into view
    new IntersectionObserver(([en], obs) => {
      if (en.isIntersecting) { update(); obs.disconnect(); }
    }, { threshold: .4 }).observe(calc);
    paintRange();
  }

  /* ------------------------------------------------------------------------
     Shaker simulator
     ------------------------------------------------------------------------ */
  const lab = $("#shakerLab");
  if (lab) {
    const shaker = $("#shaker");
    const liquidG = $("#labLiquid");
    const status = $("#shakerStatus");
    const fillBtn = $("#shakerFill");
    const shakeBtn = $("#shakerShake");
    const flavorsEl = $("#shakerFlavors");
    const stage = $(".shaker-stage", lab);
    const WATER = "#cfe3ec";
    const flavors = [...new Set(["whey", "isolate", "gainer", "preworkout"].flatMap((k) => NS.PRODUCTS[k].flavors))];
    let flavor = "Chocolat Belge";
    let phase = "empty"; // empty → water → unmixed → ready
    let timers = [];

    // foam bubbles live at the top of the liquid
    const foam = document.createElementNS("http://www.w3.org/2000/svg", "g");
    foam.setAttribute("class", "shaker-foam-bubbles");
    for (let i = 0; i < 26; i++) {
      const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      c.setAttribute("cx", 20 + Math.random() * 120);
      c.setAttribute("cy", -2 + Math.random() * 8);
      c.setAttribute("r", 2 + Math.random() * 5);
      foam.appendChild(c);
    }
    liquidG.appendChild(foam);

    flavorsEl.innerHTML = flavors.map((f) => `<button class="chip chip--flavor ${f === flavor ? "is-active" : ""}" data-f="${f}" style="--c:${NS.flavorColor(f)}"><i></i>${tf(f)}</button>`).join("");
    flavorsEl.addEventListener("click", (e) => {
      const b = e.target.closest(".chip");
      if (!b) return;
      flavor = b.dataset.f;
      $$(".chip", flavorsEl).forEach((c) => c.classList.toggle("is-active", c === b));
      lab.style.setProperty("--flavor", NS.flavorColor(flavor));
      play("click");
      if (phase === "ready" || phase === "unmixed") paintLiquid();
      if (phase === "ready") status.textContent = t("{f} · prêt à boire 💪", { f: tf(flavor) });
      else if (phase === "empty") status.textContent = t("Clique sur « Préparer »");
    });
    lab.style.setProperty("--flavor", NS.flavorColor(flavor));

    function setLevel(level) {
      liquidG.style.transform = `translateY(${296 - level * 210}px)`;
    }
    function paintLiquid() {
      const c = NS.flavorColor(flavor);
      liquidG.style.setProperty("--liq", phase === "water" ? WATER : phase === "unmixed" ? `color-mix(in srgb, ${c} 45%, ${WATER})` : c);
    }
    function later(fn, ms) { timers.push(setTimeout(fn, NS.reduceMotion ? 0 : ms)); }
    function powderBurst() {
      const c = NS.flavorColor(flavor);
      for (let i = 0; i < 34; i++) {
        const s = document.createElement("span");
        s.className = "powder-grain";
        s.style.setProperty("--c", c);
        s.style.setProperty("--x", `${(Math.random() - .5) * 60}px`);
        s.style.setProperty("--d", `${Math.random() * .35}s`);
        s.style.setProperty("--s", `${3 + Math.random() * 5}px`);
        stage.appendChild(s);
        setTimeout(() => s.remove(), 1600);
      }
    }

    setLevel(0);
    paintLiquid();
    status.textContent = t("Clique sur « Préparer »");

    fillBtn.addEventListener("click", () => {
      timers.forEach(clearTimeout); timers = [];
      shaker.classList.remove("is-ready", "is-shaking");
      shakeBtn.disabled = true;
      phase = "water";
      paintLiquid();
      setLevel(0);
      status.textContent = t("Ajout de 300 ml d'eau…");
      play("pour");
      later(() => setLevel(0.62), 60);
      later(() => {
        phase = "unmixed";
        status.textContent = t("Ajout d'une dose · {f}", { f: tf(flavor) });
        powderBurst();
        play("scoop");
        later(() => { paintLiquid(); setLevel(0.7); }, 650);
        later(() => {
          shakeBtn.disabled = false;
          status.textContent = t("À toi de secouer !");
          fillBtn.querySelector("span").textContent = t("Recommencer");
        }, 1300);
      }, 1300);
    });

    shakeBtn.addEventListener("click", () => {
      if (phase !== "unmixed" && phase !== "ready") return;
      shaker.classList.remove("is-shaking"); void shaker.offsetWidth;
      shaker.classList.add("is-shaking");
      status.textContent = t("Ça secoue…");
      play("shake");
      later(() => {
        phase = "ready";
        paintLiquid();
        setLevel(0.76);
        shaker.classList.add("is-ready");
        status.textContent = t("{f} · prêt à boire 💪", { f: tf(flavor) });
      }, 1150);
    });
  }
})();

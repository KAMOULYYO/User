/* ==========================================================================
   NUTRISPORT — French / English
   French is the source language: every French string is its own key and
   EN maps it to English. Static HTML text is translated in place at load;
   scripts call I18N.t("texte français", { vars }).
   ========================================================================== */
(() => {
  "use strict";
  const KEY = "nutrisport-lang";
  const params = new URLSearchParams(location.search);
  let stored = null;
  try { stored = localStorage.getItem(KEY); } catch (_) { /* storage unavailable */ }
  const fromUrl = params.get("lang");
  const lang = ["fr", "en"].includes(fromUrl) ? fromUrl
    : ["fr", "en"].includes(stored) ? stored
    : (navigator.language || "fr").toLowerCase().startsWith("fr") ? "fr" : "en";

  const EN = window.NS_EN || {};
  const norm = (s) => s.replace(/\s+/g, " ").trim();

  function t(s, vars) {
    let out = lang === "en" && EN[s] !== undefined ? EN[s] : s;
    if (vars) out = out.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? vars[k] : `{${k}}`));
    return out;
  }

  // translate static text nodes and a few attributes
  function applyStatic(root = document.body) {
    document.documentElement.lang = lang;
    if (lang !== "en") return;
    document.title = t(document.title);
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.content = t(meta.content);
    // elements whose markup changes between languages
    root.querySelectorAll("[data-i18n-html]").forEach((el) => {
      const k = el.getAttribute("data-i18n-html");
      if (EN[k] !== undefined) el.innerHTML = EN[k];
    });
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => (n.parentElement && /^(SCRIPT|STYLE|NOSCRIPT)$/.test(n.parentElement.tagName) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((n) => {
      const k = norm(n.nodeValue);
      if (!k || EN[k] === undefined) return;
      const lead = n.nodeValue.match(/^\s*/)[0];
      const trail = n.nodeValue.match(/\s*$/)[0];
      n.nodeValue = lead + EN[k] + trail;
    });
    ["placeholder", "aria-label", "title", "alt"].forEach((attr) => {
      root.querySelectorAll(`[${attr}]`).forEach((el) => {
        const k = norm(el.getAttribute(attr));
        if (EN[k] !== undefined) el.setAttribute(attr, EN[k]);
      });
    });
  }

  function setLang(next) {
    if (next === lang) return;
    try { localStorage.setItem(KEY, next); } catch (_) { /* storage unavailable */ }
    const url = new URL(location.href);
    url.searchParams.delete("lang");
    const go = () => location.replace(url.toString());
    const curtain = document.querySelector(".curtain");
    if (curtain && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      curtain.classList.remove("is-out");
      curtain.classList.add("is-in");
      setTimeout(go, 600);
    } else go();
  }

  window.I18N = {
    lang, t, setLang, applyStatic,
    locale: lang === "en" ? "en-IE" : "fr-FR",
    tf: (flavor) => t(flavor), // flavour names are stored in French
  };

  applyStatic();
  const btn = document.getElementById("langBtn");
  if (btn) {
    btn.textContent = lang === "en" ? "FR" : "EN";
    btn.setAttribute("aria-label", lang === "en" ? "Passer le site en français" : "Switch the site to English");
    btn.addEventListener("click", () => setLang(lang === "en" ? "fr" : "en"));
  }
})();

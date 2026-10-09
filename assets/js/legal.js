/* ==========================================================================
   NUTRISPORT — legal pages
   Picks the language (same setting as the shop), fills in the company
   details from company.js and warns while some of them are still missing.
   ========================================================================== */
(() => {
  "use strict";
  const KEY = "nutrisport-lang";
  const C = window.COMPANY || {};
  const params = new URLSearchParams(location.search);
  let stored = null;
  try { stored = localStorage.getItem(KEY); } catch (_) { /* storage unavailable */ }
  const fromUrl = params.get("lang");
  const lang = ["fr", "en"].includes(fromUrl) ? fromUrl
    : ["fr", "en"].includes(stored) ? stored
    : (navigator.language || "fr").toLowerCase().startsWith("fr") ? "fr" : "en";
  document.documentElement.lang = lang;

  document.querySelectorAll("[data-lang]").forEach((el) => { el.hidden = el.dataset.lang !== lang; });
  const title = document.querySelector(`meta[name="title-${lang}"]`);
  if (title) document.title = title.content;

  // company details
  const missing = new Set();
  document.querySelectorAll("[data-co]").forEach((el) => {
    const v = C[el.dataset.co];
    if (C.isMissing && C.isMissing(v)) { missing.add(el.dataset.co); el.classList.add("is-missing"); }
    el.textContent = v || "—";
  });
  document.querySelectorAll("[data-co-mail]").forEach((el) => {
    if (C.isMissing && !C.isMissing(C.email)) { el.href = `mailto:${C.email}`; el.textContent = C.email; }
    else { el.removeAttribute("href"); el.textContent = C.email; el.classList.add("is-missing"); }
  });
  document.querySelectorAll("[data-co-url]").forEach((el) => {
    const v = C[el.dataset.coUrl];
    if (C.isMissing && !C.isMissing(v)) { el.href = v; el.textContent = v.replace(/^https?:\/\//, ""); }
    else { el.removeAttribute("href"); el.textContent = v; el.classList.add("is-missing"); }
  });
  const banner = document.getElementById("legalDraft");
  if (banner) banner.hidden = missing.size === 0;

  // language switch (reload so the shop and these pages stay in sync)
  const btn = document.getElementById("langBtn");
  if (btn) {
    btn.textContent = lang === "en" ? "FR" : "EN";
    btn.addEventListener("click", () => {
      try { localStorage.setItem(KEY, lang === "en" ? "fr" : "en"); } catch (_) { /* storage unavailable */ }
      const url = new URL(location.href);
      url.searchParams.delete("lang");
      if (url.toString() === location.href) location.reload(); else location.replace(url.toString());
    });
  }
})();

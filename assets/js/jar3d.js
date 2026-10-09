/* ==========================================================================
   NUTRISPORT — real-time 3D jars (Three.js)
   Hero jar: 360° drag-to-rotate with inertia, swaps product & flavour live.
   Gold jar: metallic limited edition.
   Falls back silently to the SVG jars when WebGL is unavailable.
   ========================================================================== */
import * as THREE from "three";
import { RoomEnvironment } from "../vendor/three/RoomEnvironment.js";

const NS = window.NS;
const isMobile = window.matchMedia("(max-width: 900px)").matches;

const NUTRITION = {
  whey: [["Énergie", "118 kcal"], ["Protéines", "25 g"], ["Glucides", "1,9 g"], ["dont sucres", "1,2 g"], ["Lipides", "1,4 g"]],
  isolate: [["Énergie", "110 kcal"], ["Protéines", "27 g"], ["Glucides", "0,6 g"], ["Lactose", "0 g"], ["Lipides", "0,3 g"]],
  creatine: [["Créatine", "5 g"], ["Pureté", "99,9 %"], ["Énergie", "0 kcal"], ["Sucres", "0 g"], ["Additifs", "0"]],
  preworkout: [["Caféine", "200 mg"], ["Citrulline", "6 g"], ["Bêta-alanine", "3,2 g"], ["Taurine", "1 g"], ["Sucres", "0 g"]],
  gainer: [["Énergie", "1 250 kcal"], ["Protéines", "50 g"], ["Glucides", "230 g"], ["Lipides", "12 g"], ["Fibres", "6 g"]],
  gold: [["Énergie", "112 kcal"], ["Protéines", "27 g"], ["Glucides", "0,8 g"], ["Lactose", "0 g"], ["Lipides", "0,3 g"]],
};
const USAGE = {
  creatine: ["1 dose (5 g) par jour,", "avec un verre d'eau", "ou votre shaker."],
  preworkout: ["1 dose dans 300 ml d'eau,", "20 min avant l'effort.", "Max. 1 dose / jour."],
  gainer: ["3 doses (325 g) dans", "600 ml de lait ou d'eau,", "entre les repas."],
};

/* ---------- label texture (drawn on a 2D canvas, wrapped around the jar) ---------- */
const LABEL_W = 2048;
const LABEL_H = 408;

function drawLabel(ctx, key, flavor) {
  const p = NS.PRODUCTS[key];
  const c = p.c;
  const fc = NS.flavorColor(flavor);
  const W = LABEL_W, H = LABEL_H, cx = W / 2;
  const accentText = c.accent === "#161616" ? c.ink : c.accent;

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = c.label;
  ctx.fillRect(0, 0, W, H);

  // accent bands top & bottom
  ctx.fillStyle = c.accent;
  ctx.fillRect(0, 0, W, 10);
  ctx.fillRect(0, H - 10, W, 10);

  // flavour stripe on the back seam (wraps from right edge to left edge)
  ctx.fillStyle = fc;
  ctx.fillRect(0, 10, 70, H - 20);
  ctx.fillRect(W - 70, 10, 70, H - 20);

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  // ---- front panel
  ctx.fillStyle = accentText;
  ctx.font = "800 30px Inter, Arial, sans-serif";
  ctx.letterSpacing = "14px";
  ctx.fillText("NUTRISPORT", cx + 7, 70);

  ctx.fillStyle = c.ink;
  ctx.letterSpacing = "4px";
  const l1Size = p.l1.length > 6 ? 118 : 150;
  ctx.font = `${l1Size}px Anton, Impact, sans-serif`;
  ctx.fillText(p.l1, cx + 2, 70 + l1Size + 8);
  const l2Size = p.l2.length > 8 ? 46 : 58;
  ctx.letterSpacing = "12px";
  ctx.font = `${l2Size}px Anton, Impact, sans-serif`;
  ctx.fillText(p.l2, cx + 6, 70 + l1Size + 22 + l2Size);

  // flavour pill (changes colour with the selected flavour)
  const fy = 70 + l1Size + l2Size + 50;
  ctx.font = "700 24px Inter, Arial, sans-serif";
  ctx.letterSpacing = "4px";
  const label = flavor.toUpperCase();
  const tw = ctx.measureText(label).width + 56;
  roundRect(ctx, cx - tw / 2, fy, tw, 44, 22);
  ctx.fillStyle = fc;
  ctx.fill();
  ctx.fillStyle = isLight(fc) ? "#111" : "#fff";
  ctx.fillText(label, cx + 2, fy + 31);

  // ---- left side panel: nutrition facts
  const lx = W * 0.25;
  const sub = isLight(c.label) ? "rgba(0,0,0,.6)" : "rgba(255,255,255,.65)";
  const rule = isLight(c.label) ? "rgba(0,0,0,.25)" : "rgba(255,255,255,.25)";
  ctx.textAlign = "left";
  ctx.fillStyle = c.ink;
  ctx.letterSpacing = "1px";
  ctx.font = "800 21px Inter, Arial, sans-serif";
  ctx.fillText("VALEURS NUTRITIONNELLES", lx - 170, 80);
  ctx.fillStyle = sub;
  ctx.font = "600 18px Inter, Arial, sans-serif";
  ctx.letterSpacing = "1px";
  ctx.fillText("Pour 1 dose", lx - 170, 110);
  (NUTRITION[key] || NUTRITION.whey).forEach(([k, v], i) => {
    const y = 160 + i * 46;
    ctx.fillStyle = rule;
    ctx.fillRect(lx - 170, y - 32, 340, 2);
    ctx.fillStyle = c.ink;
    ctx.font = "600 22px Inter, Arial, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(k, lx - 170, y);
    ctx.textAlign = "right";
    ctx.font = "800 22px Inter, Arial, sans-serif";
    ctx.fillText(v, lx + 170, y);
  });

  // ---- right side panel: usage + barcode
  const rx = W * 0.75;
  ctx.textAlign = "left";
  ctx.fillStyle = c.ink;
  ctx.font = "800 21px Inter, Arial, sans-serif";
  ctx.letterSpacing = "1px";
  ctx.fillText("CONSEILS D'UTILISATION", rx - 170, 80);
  ctx.fillStyle = sub;
  ctx.font = "500 20px Inter, Arial, sans-serif";
  ctx.letterSpacing = "0px";
  (USAGE[key] || ["1 dose (30 g) dans 250 ml", "d'eau ou de lait,", "après l'entraînement."]).forEach((t, i) => ctx.fillText(t, rx - 170, 122 + i * 30));
  // barcode (deterministic)
  let seed = key.length * 97 + 13;
  let bx = rx - 170;
  ctx.fillStyle = c.ink;
  while (bx < rx + 60) {
    seed = (seed * 9301 + 49297) % 233280;
    const w = 2 + (seed % 5);
    ctx.fillRect(bx, 240, w, 92);
    bx += w + 2 + (seed % 3);
  }
  ctx.fillStyle = accentText;
  ctx.font = "800 17px Inter, Arial, sans-serif";
  ctx.letterSpacing = "3px";
  ctx.fillText("LOT TESTÉ EN LABO", rx - 170, 362);
  ctx.letterSpacing = "0px";
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function isLight(hex) {
  const n = parseInt(hex.slice(1), 16);
  return (((n >> 16) & 255) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000 > 150;
}

/* ---------- geometry (shared) ---------- */
function bodyGeometry() {
  const pts = [new THREE.Vector2(0, -1.2), new THREE.Vector2(0.86, -1.2)];
  for (let i = 1; i <= 8; i++) { const a = -Math.PI / 2 + (i / 8) * (Math.PI / 2); pts.push(new THREE.Vector2(0.86 + Math.cos(a) * 0.14, -1.06 + Math.sin(a) * 0.14)); }
  pts.push(new THREE.Vector2(1, 0.98));
  for (let i = 1; i <= 8; i++) { const a = (i / 8) * (Math.PI / 2); pts.push(new THREE.Vector2(0.86 + Math.cos(a) * 0.14, 0.98 + Math.sin(a) * 0.14)); }
  pts.push(new THREE.Vector2(0.84, 1.12), new THREE.Vector2(0.84, 1.24));
  return new THREE.LatheGeometry(pts, 96);
}
function lidGeometry() {
  const g = new THREE.CylinderGeometry(0.93, 0.93, 0.6, 360, 1, true);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const a = Math.atan2(x, z);
    const k = 1 + 0.012 * Math.cos(a * 120); // knurled grip ridges
    pos.setX(i, x * k);
    pos.setZ(i, z * k);
  }
  g.computeVertexNormals();
  return g;
}

/* ---------- jar factory ---------- */
function createJar(container, opts = {}) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  } catch (_) {
    return null;
  }
  if (!renderer.getContext()) return null;

  const dprMax = isMobile ? 1.5 : 2;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, dprMax));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = opts.exposure || 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 50);
  camera.position.set(0, 0.25, 8.4);
  camera.lookAt(0, 0.1, 0);

  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(3, 4, 5);
  const rim = new THREE.DirectionalLight(0xffffff, 2.2);
  rim.position.set(-4, 2, -3);
  const fill = new THREE.DirectionalLight(0xffffff, 0.5);
  fill.position.set(-3, -1, 4);
  scene.add(key, rim, fill);

  // ---- meshes
  const group = new THREE.Group();
  const spin = new THREE.Group();
  group.add(spin);
  scene.add(group);

  const bodyMat = new THREE.MeshPhysicalMaterial({ roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.12 });
  const body = new THREE.Mesh(bodyGeometry(), bodyMat);
  spin.add(body);

  const labelCanvas = document.createElement("canvas");
  labelCanvas.width = LABEL_W;
  labelCanvas.height = LABEL_H;
  const labelCtx = labelCanvas.getContext("2d");
  const labelTex = new THREE.CanvasTexture(labelCanvas);
  labelTex.colorSpace = THREE.SRGBColorSpace;
  labelTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const labelMat = new THREE.MeshPhysicalMaterial({ map: labelTex, roughness: 0.42, clearcoat: 0.7, clearcoatRoughness: 0.2 });
  const label = new THREE.Mesh(new THREE.CylinderGeometry(1.004, 1.004, 1.25, 160, 1, true, -Math.PI, Math.PI * 2), labelMat);
  label.position.y = -0.04;
  spin.add(label);

  const lidMat = new THREE.MeshPhysicalMaterial({ roughness: 0.35, clearcoat: 0.6 });
  const lidSide = new THREE.Mesh(lidGeometry(), lidMat);
  lidSide.position.y = 1.5;
  const lidTop = new THREE.Mesh(new THREE.CircleGeometry(0.9, 96), lidMat);
  lidTop.rotation.x = -Math.PI / 2;
  lidTop.position.y = 1.825;
  const lidBevel = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.04, 16, 120), lidMat);
  lidBevel.rotation.x = Math.PI / 2;
  lidBevel.position.y = 1.79;
  const lidRing = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.05, 96, 1, true), new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.6 }));
  lidRing.position.y = 1.215;
  spin.add(lidSide, lidTop, lidBevel, lidRing);
  group.position.y = -0.28;

  // ---- materials per product / flavour
  let state = { key: opts.product || "whey", flavor: null };
  function applyProduct(k, flavor) {
    const p = NS.PRODUCTS[k];
    state = { key: k, flavor: flavor || p.flavors[0] };
    const c = p.c;
    bodyMat.color.set(c.jar);
    bodyMat.metalness = p.metal ? 1 : 0;
    bodyMat.roughness = p.metal ? 0.22 : 0.3;
    const metallicLid = c.lid === "#c9a45c";
    lidMat.color.set(c.lid);
    lidMat.metalness = metallicLid ? 1 : 0;
    lidMat.roughness = metallicLid ? 0.28 : 0.38;
    lidMat.emissive.set(c.lid === "#c6ff3d" ? "#3a5a00" : "#000000");
    rim.color.set(opts.rimColor || (c.accent === "#161616" ? "#ffe9c4" : c.accent));
    paintLabel();
  }
  function paintLabel() {
    drawLabel(labelCtx, state.key, state.flavor);
    labelTex.needsUpdate = true;
  }

  // ---- size
  function resize() {
    const w = container.clientWidth, h = container.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // keep the whole jar in frame whatever the aspect ratio
    camera.fov = w / h < 0.62 ? 34 : 28;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(container);
  resize();

  // ---- interaction: drag to rotate (inertia) + pointer tilt
  let rotY = opts.startAngle || 0;
  let vel = 0;
  const autoSpeed = opts.autoSpeed ?? 0.0045;
  let dragging = false, lastX = 0, lastT = 0, tiltX = 0, dragTilt = 0;
  const el = renderer.domElement;
  el.style.touchAction = "pan-y";
  el.addEventListener("pointerdown", (e) => {
    dragging = true; lastX = e.clientX; lastT = performance.now();
    el.setPointerCapture(e.pointerId);
    container.classList.add("is-dragging");
    container.dispatchEvent(new CustomEvent("jar:grab"));
  });
  el.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const now = performance.now();
    const dx = e.clientX - lastX;
    rotY += dx * 0.012;
    vel = (dx * 0.012) / Math.max(1, (now - lastT) / 16.7);
    dragTilt = clamp(dragTilt + e.movementY * 0.004, -0.35, 0.35);
    lastX = e.clientX; lastT = now;
  });
  const release = () => { dragging = false; container.classList.remove("is-dragging"); };
  el.addEventListener("pointerup", release);
  el.addEventListener("pointercancel", release);

  // ---- product change transition
  let trans = null; // { start, nextKey, nextFlavor, swapped }
  function setProduct(k, flavor, animate = true) {
    if (!animate || NS.reduceMotion) return applyProduct(k, flavor);
    trans = { start: performance.now(), nextKey: k, nextFlavor: flavor, swapped: false };
    vel += 0.28;
  }
  function setFlavor(f) {
    state.flavor = f;
    paintLabel();
    vel += 0.12; // little spin so the change is felt
  }

  // ---- render loop (only while visible)
  let visible = true;
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; }, { rootMargin: "100px" }).observe(container);
  const clock = new THREE.Clock();
  function loop() {
    requestAnimationFrame(loop);
    if (!visible || document.hidden) return;
    const t = clock.getElapsedTime();

    if (!dragging) {
      vel = lerp(vel, NS.reduceMotion ? 0 : autoSpeed, 0.03);
      rotY += vel;
      dragTilt = lerp(dragTilt, 0, 0.05);
    }
    const ptr = NS.pointer || { x: 0, y: 0 };
    tiltX = lerp(tiltX, ptr.y * 0.18 + dragTilt, 0.08);
    spin.rotation.y = rotY;
    group.rotation.x = tiltX;
    group.rotation.z = Math.sin(t * 0.8) * 0.03 - ptr.x * 0.05;

    let scale = 1;
    if (trans) {
      const k = (performance.now() - trans.start) / 900;
      if (k < 0.4) scale = 1 - easeInCubic(k / 0.4) * 0.45;
      else {
        if (!trans.swapped) { applyProduct(trans.nextKey, trans.nextFlavor); trans.swapped = true; }
        scale = 0.55 + easeOutBack(Math.min(1, (k - 0.4) / 0.6)) * 0.45;
      }
      if (k >= 1) { trans = null; scale = 1; }
    }
    group.scale.setScalar(scale);
    group.position.y = -0.28 + (NS.reduceMotion ? 0 : Math.sin(t * 1.05) * 0.07);

    renderer.render(scene, camera);
  }

  applyProduct(state.key, opts.flavor);
  // re-paint once the display font is ready so the label uses Anton
  if (document.fonts) {
    Promise.race([document.fonts.load("120px Anton"), new Promise((r) => setTimeout(r, 2500))]).then(paintLabel);
    document.fonts.ready.then(paintLabel);
  }
  loop();
  container.classList.add("is-3d");
  return { setProduct, setFlavor, el };
}

function lerp(a, b, t) { return a + (b - a) * t; }
function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
function easeInCubic(x) { return x * x * x; }
function easeOutBack(x) { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); }

/* ---------- mount ---------- */
const heroMount = document.getElementById("heroJar3d");
const heroJar = heroMount && createJar(heroMount, { product: NS.SLIDES[Math.max(0, NS.currentSlide)].key });
if (heroJar) {
  NS.has3D = true;
  document.body.classList.add("has-3d");
  NS.bus.addEventListener("slide", (e) => heroJar.setProduct(e.detail.key, e.detail.flavor, !e.detail.first));
  NS.bus.addEventListener("flavor", (e) => heroJar.setFlavor(e.detail.flavor));
  // grabbing the jar pauses the hero autoplay
  heroMount.addEventListener("jar:grab", () => document.querySelector(".hero").classList.add("is-paused"));
  heroMount.addEventListener("pointerleave", () => document.querySelector(".hero").classList.remove("is-paused"));
  heroMount.addEventListener("pointerdown", () => NS.sfx && NS.sfx.play("twist"));
}

const goldMount = document.getElementById("goldJar");
if (goldMount) {
  const gold = createJar(goldMount, { product: "gold", autoSpeed: 0.006, startAngle: 0.4, exposure: 1.15, rimColor: "#ffd88a" });
  if (!gold) {
    const fb = document.getElementById("goldJarFallback");
    if (fb) fb.innerHTML = NS.jarSVG("gold");
  }
}

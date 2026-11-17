// ===== Personalize here =====
const NAME   = "";   // e.g. "Sarah"  (adds "I love you, Sarah")
const PHOTOS = [];   // e.g. ["img/1.jpg","img/2.jpg","img/3.jpg","img/4.jpg","img/5.jpg"]
// ============================

const LABELS = ["You are my universe 💫", "Love of my life ✨", "Precious", "My favorite place",
                "I love you", "Forever yours", "My everything"];
if (NAME) LABELS[4] = "I love you, " + NAME;
const CARDS = [
  { cap: "My favorite person", emoji: "❤️" },
  { cap: "You and me under the stars", emoji: "✨" },
  { cap: "My favorite place", emoji: "🌹" },
  { cap: "Always together", emoji: "💞" },
  { cap: "Love of my life", emoji: "💖" }
];

const cv = document.getElementById("sky"), ctx = cv.getContext("2d");
const box = document.getElementById("items");
let W, H, DPR, base;
function resize() {
  DPR = Math.min(devicePixelRatio || 1, 2);
  W = innerWidth; H = innerHeight;
  cv.width = W * DPR; cv.height = H * DPR;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  base = Math.min(W, H * 0.8) / 520;
}
addEventListener("resize", resize); resize();

const R = () => Math.random();
const gauss = () => (R() + R() + R() + R() - 2) / 2;

// ---- background stars
const stars = Array.from({ length: 220 }, () => ({ x: R(), y: R(), r: R() * 1.2 + .2, p: R() * 6 }));

// ---- warp intro stars
const warp = Array.from({ length: 380 }, () => ({ a: R() * 6.283, d: R() * 40 + 5, v: R() * 2 + 1 }));

// ---- galaxy particles
const N = 9000, ARMS = 4, RAD = 270;
const gal = [];
for (let i = 0; i < N; i++) {
  const r = Math.pow(R(), .65) * RAD + 18;
  const arm = i % ARMS;
  const th = arm * (Math.PI * 2 / ARMS) + r * 0.024 + gauss() * .45 * (1.2 - r / RAD);
  const tone = R();
  gal.push({
    r, th, y: gauss() * 7 * (1.1 - r / RAD), w: 0.55 / (1 + r * .012),
    s: R() * 1.5 + .5,
    c: tone < .55 ? "255,95,185" : tone < .85 ? "255,150,215" : "255,225,240"
  });
}

// ---- hearts column
const hearts = Array.from({ length: 150 }, () => ({
  t: R(), v: .1 + R() * .2, x: gauss() * 22, z: gauss() * 22, s: 3 + R() * 7
}));
function heart(x, y, s) {
  ctx.beginPath();
  ctx.moveTo(x, y + s / 4);
  ctx.bezierCurveTo(x, y - s / 2, x - s, y - s / 2, x - s, y + s / 4);
  ctx.bezierCurveTo(x - s, y + s, x, y + s * 1.2, x, y + s * 1.5);
  ctx.bezierCurveTo(x, y + s * 1.2, x + s, y + s, x + s, y + s / 4);
  ctx.bezierCurveTo(x + s, y - s / 2, x, y - s / 2, x, y + s / 4);
  ctx.fill();
}

// ---- floating items (HTML so the text stays crisp)
const items = [];
LABELS.forEach((t, i) => {
  const el = document.createElement("div");
  el.className = "label"; el.textContent = t; box.appendChild(el);
  items.push({ el, a: R() * 6.283, rad: 150 + R() * 160, y: -90 + R() * 160, w: (R() < .5 ? -1 : 1) * (.08 + R() * .1) });
});
CARDS.forEach((c, i) => {
  const el = document.createElement("div");
  el.className = "card";
  const pic = document.createElement("div"); pic.className = "pic";
  if (PHOTOS[i]) pic.style.backgroundImage = `url(${PHOTOS[i]})`; else pic.textContent = c.emoji;
  const cap = document.createElement("small"); cap.textContent = c.cap;
  el.append(pic, cap); box.appendChild(el);
  items.push({ el, a: (i / CARDS.length) * 6.283 + R(), rad: 170 + R() * 130, y: -110 + R() * 190, w: .1 + R() * .06 });
});

// ---- camera
let yaw = 0, pitch = 1.0, drag = false, lx = 0, ly = 0;
cv.addEventListener("pointerdown", e => { drag = true; lx = e.clientX; ly = e.clientY; cv.setPointerCapture(e.pointerId); });
addEventListener("pointerup", () => drag = false);
addEventListener("pointermove", e => {
  if (!drag) return;
  yaw += (e.clientX - lx) * .006;
  pitch = Math.min(1.35, Math.max(.2, pitch + (e.clientY - ly) * .004));
  lx = e.clientX; ly = e.clientY;
});
function proj(x, y, z) {
  const cy = Math.cos(yaw), sy = Math.sin(yaw);
  const x1 = x * cy - z * sy, z1 = x * sy + z * cy;
  const cp = Math.cos(pitch), sp = Math.sin(pitch);
  const y2 = y * cp - z1 * sp, z2 = y * sp + z1 * cp;
  const s = 700 / (700 + z2 * base) * base;
  return { x: W / 2 + x1 * s, y: H * .5 + y2 * s, s, z: z2 };
}

// ---- main loop
let t0 = performance.now(), last = t0, shown = false;
function frame(now) {
  const t = (now - t0) / 1000, dt = Math.min(.05, (now - last) / 1000); last = now;
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "#02000a"; ctx.fillRect(0, 0, W, H);

  const g = Math.min(1, Math.max(0, (t - 1.8) / 1.4));      // galaxy fade-in 0..1
  if (!drag) yaw += dt * .09;

  // twinkling stars
  for (const s of stars) {
    ctx.fillStyle = `rgba(255,255,255,${.35 + .35 * Math.sin(t * 1.5 + s.p)})`;
    ctx.fillRect(s.x * W, s.y * H, s.r, s.r);
  }

  // warp intro
  if (g < 1) {
    ctx.globalAlpha = 1 - g;
    const cx = W / 2, cy = H / 2, k = Math.min(W, H) / 380;
    ctx.strokeStyle = "rgba(255,255,255,.85)"; ctx.lineWidth = 1;
    for (const w of warp) {
      const prev = w.d * (1 - Math.min(.45, .08 + t * .1));
      w.d += w.v * (1 + t * 2.6) * k * 60 * dt * (1 + w.d / 120);
      if (w.d > Math.max(W, H)) { w.d = R() * 30 + 5; w.a = R() * 6.283; }
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(w.a) * prev, cy + Math.sin(w.a) * prev);
      ctx.lineTo(cx + Math.cos(w.a) * w.d, cy + Math.sin(w.a) * w.d);
      ctx.stroke();
    }
    ctx.strokeStyle = "rgba(255,70,140,.8)"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(cx, cy, Math.min(W, H) * (.2 + t * .12), 0, 7); ctx.stroke();
    ctx.globalAlpha = 1;
  }

  if (g > 0) {
    ctx.globalAlpha = g;
    ctx.globalCompositeOperation = "lighter";

    // galaxy particles
    for (const p of gal) {
      p.th += p.w * dt;
      const q = proj(Math.cos(p.th) * p.r, p.y, Math.sin(p.th) * p.r);
      ctx.fillStyle = `rgba(${p.c},${p.r < 60 ? .95 : .8})`;
      const sz = p.s * q.s * 1.5;
      ctx.fillRect(q.x, q.y, sz, sz);
    }

    // glowing disk + black hole
    const c = proj(0, 0, 0), flat = Math.max(.15, Math.sin(pitch));
    const gr = ctx.createRadialGradient(c.x, c.y, 8 * c.s, c.x, c.y, 62 * c.s);
    gr.addColorStop(0, "rgba(255,170,215,.95)"); gr.addColorStop(1, "rgba(255,60,150,0)");
    ctx.fillStyle = gr;
    ctx.beginPath(); ctx.ellipse(c.x, c.y, 62 * c.s, 62 * c.s * flat, 0, 0, 7); ctx.fill();
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#000";
    ctx.beginPath(); ctx.ellipse(c.x, c.y, 17 * c.s, 17 * c.s * flat, 0, 0, 7); ctx.fill();

    // rising hearts
    ctx.globalCompositeOperation = "lighter";
    for (const h of hearts) {
      h.t += h.v * dt; if (h.t > 1) { h.t = 0; h.x = gauss() * 22; h.z = gauss() * 22; }
      const q = proj(h.x * (1 + h.t), -h.t * 330, h.z * (1 + h.t));
      ctx.fillStyle = `rgba(255,100,190,${Math.sin(h.t * Math.PI) * .85})`;
      heart(q.x, q.y, h.s * q.s * 1.2);
    }
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;

    // floating labels & cards
    if (!shown && g > .7) {
      shown = true; box.classList.add("show");
      setTimeout(() => document.getElementById("hint").classList.add("show-hint"), 1500);
      setTimeout(() => document.getElementById("hint").classList.remove("show-hint"), 6500);
    }
    for (const it of items) {
      it.a += it.w * dt;
      const q = proj(Math.cos(it.a) * it.rad, it.y, Math.sin(it.a) * it.rad);
      const depth = Math.min(1, Math.max(.25, 1 - q.z / 700));
      it.el.style.transform = `translate(${q.x}px,${q.y}px) translate(-50%,-50%) scale(${q.s * 1.05})`;
      it.el.style.setProperty("--o", depth.toFixed(2));
      it.el.style.zIndex = Math.round(1000 - q.z);
    }
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
"""
VERAXIS AI — Thinking Orb Particle Engine (Canvas 2D Neuform Runtime)
Self-contained zero-dependency 2D particle simulation engine based on DesignCode / Jakub Antalik's Thinking Orbs.
Supports variants: 'neuform', 'gemini', 'claude', 'sphere', 'codex', 'openai' in 56px and 20px sizes.
"""

ORB_CANVAS_JS = """
(function() {
  if (window.__VERAXIS_ORB_INITIALIZED) {
    if (window.__bootAllOrbs) window.__bootAllOrbs();
    return;
  }
  window.__VERAXIS_ORB_INITIALIZED = true;

  const TAU = Math.PI * 2;
  const clamp01 = v => v < 0 ? 0 : v > 1 ? 1 : v;
  const smooth = v => { v = clamp01(v); return v * v * (3 - 2 * v); };
  const lerp = (a, b, m) => a + (b - a) * m;

  const hash = (x, y) => { const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453; return n - Math.floor(n); };

  const proj = (yaw, tilt, cx, cy, s) => {
    const st = Math.sin(tilt), ct = Math.cos(tilt);
    const sy = Math.sin(yaw), cyw = Math.cos(yaw);
    return (x, y, z) => {
      const px = x * cyw + z * sy, pz = -x * sy + z * cyw;
      const py = y * ct - pz * st, z2 = y * st + pz * ct;
      return [cx + px * s, cy - py * s, z2];
    };
  };

  const rscale = S => Math.pow(S / 300, 0.6);

  function paint(ctx, dots, accent, sat, rMin) {
    dots.sort((a, b) => a.z - b.z);
    for (const d of dots) {
      const al = d.a ?? 1;
      if (al < 0.02) continue;
      const v = clamp01(d.v);
      const g = v * 255;
      const acc = d.c || accent;
      const st = d.c ? 0.95 : sat;
      let r = g, gg = g, b = g;
      if (acc && st) {
        const lift = Math.min(1, v * 1.12);
        r = g * (1 - st) + acc[0] * lift * st;
        gg = g * (1 - st) + acc[1] * lift * st;
        b = g * (1 - st) + acc[2] * lift * st;
      }
      if (v > 0.85) { const w = (v - 0.85) / 0.15 * 0.45; r += (255 - r) * w; gg += (255 - gg) * w; b += (255 - b) * w; }
      ctx.fillStyle = `rgba(${r | 0},${gg | 0},${b | 0},${al})`;
      ctx.beginPath();
      ctx.arc(d.x, d.y, Math.max(rMin, d.r), 0, TAU);
      ctx.fill();
    }
  }

  const NEUFORM_PATH = "M111.571 49.9795L84 64.7156L112.332 77.9309 M107.889 87.5876L77.9727 78.5118L88.6616 107.89 M78.6897 111.575L63.9536 84.0035L50.7383 112.335 M41.0796 107.89L50.1554 77.9739L20.7773 88.6627 M17.0924 78.6912L44.6636 63.9551L16.332 50.7398 M20.7812 41.0833L50.697 50.1591L40.0081 20.781 M49.9766 17.0959L64.7127 44.6672L77.928 16.3356 M87.5875 20.7808L78.5117 50.6965L107.89 40.0077";
  
  const walkCache = new Map();
  function pathWalk(d, spacing, ox, oy, sc) {
    const ck = "nf-" + spacing;
    if (walkCache.has(ck)) return walkCache.get(ck);
    const NS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("width", "0");
    svg.setAttribute("height", "0");
    svg.style.cssText = "position:absolute;left:-9999px;top:0";
    document.body.appendChild(svg);
    const pts = [];
    for (const sub of d.split(/(?=M)/)) {
      if (!sub.trim()) continue;
      const el = document.createElementNS(NS, "path");
      el.setAttribute("d", sub);
      svg.appendChild(el);
      const L = el.getTotalLength();
      if (!L) continue;
      const n = Math.max(2, Math.round(L / spacing));
      for (let i = 0; i < n; i++) {
        const q = el.getPointAtLength((i + 0.5) / n * L);
        pts.push([(q.x - ox) * sc, (q.y - oy) * sc]);
      }
    }
    svg.remove();
    walkCache.set(ck, pts);
    return pts;
  }

  function drawNeuform(ctx, S, t, o) {
    const cx = S / 2, cy = S / 2, R = S / 2 * 0.88;
    const rs = rscale(S) * (o.mini ? 1.8 : 1);
    const p = proj(0.13 * Math.sin(t * 0.36), 0.12 * Math.sin(t * 0.28), cx, cy, R);
    const pts = pathWalk(NEUFORM_PATH, o.mini ? 6.5 : 2.9, 64, 64, 1 / 64);
    const spin = t * 0.12, cs = Math.cos(spin), sn = Math.sin(spin);
    const wave = (((t * 0.34) % 1 + 1) % 1) * 1.55 - 0.1;
    const dots = [];
    for (const [gx0, gy0] of pts) {
      const gx = gx0 * cs - gy0 * sn, gy = gx0 * sn + gy0 * cs;
      const rr = Math.hypot(gx, gy);
      const crest = Math.exp(-Math.pow(rr - wave, 2) / 0.035);
      const [x, y, z] = p(gx, -gy, 0);
      const dep = (z + 1) / 2;
      dots.push({ x, y, z, r: (0.8 + 0.7 * dep + 0.55 * crest) * rs, v: 0.48 + 0.14 * dep + 0.34 * crest });
    }
    paint(ctx, dots, [56, 189, 248], 0.85, 0.3);
  }

  function drawClaude(ctx, S, t, o) {
    const cx = S / 2, cy = S / 2, R = S / 2 * 0.84;
    const rs = rscale(S) * (o.mini ? 1.8 : 1);
    const yaw = 0.32 * Math.sin(t * 0.5), tilt = 0.3 + 0.17 * Math.sin(t * 0.33);
    const p = proj(yaw, tilt, cx, cy, R);
    const spin = t * 0.17;
    const rays = o.mini ? 8 : 11;
    const perRay = o.mini ? 4 : 6;
    const dots = [];
    const gh = o.mini ? 10 : 22;
    for (let i = 0; i < gh; i++) {
      const a = i / gh * TAU + t * 0.05;
      const [x, y, z] = p(Math.cos(a), Math.sin(a), 0);
      dots.push({ x, y, z, r: 0.8 * rs, v: 0.22, a: 0.1 + 0.1 * ((z + 1) / 2) });
    }
    for (let k = 0; k < rays; k++) {
      const baseA = k / rays * TAU + (hash(k, 3.1) - 0.5) * 0.3 + spin;
      const baseL = 0.62 + 0.38 * hash(k, 7.7);
      const pulse = 0.5 + 0.5 * Math.sin(t * 1.7 - k * 1.13);
      const L = baseL * (0.8 + 0.28 * pulse * pulse);
      for (let j = 0; j < perRay; j++) {
        const f = (j + 0.8) / perRay;
        const rr = 0.14 + f * (L - 0.14);
        const [x, y, z] = p(Math.cos(baseA) * rr, Math.sin(baseA) * rr, 0);
        const dep = (z + 1) / 2;
        dots.push({
          x, y, z,
          r: (0.75 + 1.35 * (1 - f * 0.45) + 0.5 * dep) * rs,
          v: 0.38 + 0.38 * f + 0.22 * pulse * f,
          a: 0.55 + 0.45 * f
        });
      }
    }
    const [x0, y0, z0] = p(0, 0, 0);
    dots.push({ x: x0, y: y0, z: z0 + 0.01, r: 1.5 * rs, v: 0.92 });
    paint(ctx, dots, [217, 119, 87], 0.85, 0.3);
  }

  function drawGemini(ctx, S, t, o) {
    const cx = S / 2, cy = S / 2, R = S / 2 * 0.84;
    const rs = rscale(S) * (o.mini ? 1.8 : 1);
    const yaw = 0.3 * Math.sin(t * 0.45), tilt = 0.32 + 0.14 * Math.sin(t * 0.28);
    const p = proj(yaw, tilt, cx, cy, R);
    const rotW = 0.14 * Math.sin(t * 0.9);
    const scale = 0.88 + 0.12 * Math.sin(t * 1.8);
    const N = o.mini ? 22 : 54;
    const dots = [];
    const cBlue = [64, 148, 255], cPurple = [176, 118, 240], cPink = [225, 118, 178];
    const grad = py => {
      const gpos = clamp01((1 - py) / 2);
      return gpos < 0.5
        ? [lerp(cBlue[0], cPurple[0], gpos * 2), lerp(cBlue[1], cPurple[1], gpos * 2), lerp(cBlue[2], cPurple[2], gpos * 2)]
        : [lerp(cPurple[0], cPink[0], gpos * 2 - 1), lerp(cPurple[1], cPink[1], gpos * 2 - 1), lerp(cPurple[2], cPink[2], gpos * 2 - 1)];
    };
    for (let i = 0; i < N; i++) {
      const th = i / N * TAU + rotW;
      const c3 = Math.cos(th), s3 = Math.sin(th);
      const px = c3 * c3 * c3 * scale, py = s3 * s3 * s3 * scale;
      const [x, y, z] = p(px, py, 0);
      const dep = (z + 1) / 2;
      const tip = Math.pow(Math.abs(px) + Math.abs(py), 1.6);
      dots.push({
        x, y, z,
        r: (0.7 + 1.1 * dep + 0.9 * tip) * rs,
        v: 0.48 + 0.32 * tip + 0.2 * dep,
        c: grad(py)
      });
    }
    paint(ctx, dots, null, 0, 0.3);
  }

  const MODES = {
    neuform: { draw: drawNeuform, speed: 1 },
    claude: { draw: drawClaude, speed: 1 },
    gemini: { draw: drawGemini, speed: 1 }
  };

  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const anims = [];

  function boot(canvas) {
    if (canvas.__booted) return;
    canvas.__booted = true;
    const modeKey = canvas.dataset.mode || 'neuform';
    const mode = MODES[modeKey] || MODES.neuform;
    const S = +canvas.dataset.size || 56;
    canvas.width = Math.round(S * dpr);
    canvas.height = Math.round(S * dpr);
    const ctx = canvas.getContext("2d");
    const o = { mini: S < 32 };
    const frame = t => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, S, S);
      mode.draw(ctx, S, t * mode.speed * (o.mini ? 1.25 : 1), o);
    };
    anims.push({ canvas, frame });
  }

  window.__bootAllOrbs = function() {
    document.querySelectorAll("canvas[data-mode]").forEach(boot);
  };

  function tick() {
    const t = performance.now() / 1000;
    for (const a of anims) a.frame(t);
    requestAnimationFrame(tick);
  }

  setTimeout(() => {
    window.__bootAllOrbs();
    requestAnimationFrame(tick);
  }, 50);
})();
"""

def generate_orb_pill_html(label: str, mode: str = "neuform", size: int = 24) -> str:
    """
    Renders a Thinking Orb Pill with shimmering text.
    Uses mini size (24px) for Perplexity-style search steps, or standard (56px) for brand hero.
    """
    return f"""
    <div class="veraxis-orb-pill" style="
        display: inline-flex;
        align-items: center;
        gap: 10px;
        height: 38px;
        padding: 0 16px 0 8px;
        border-radius: 9999px;
        background: var(--pill-surface);
        border: 1px solid var(--pill-border);
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
        color: var(--text-primary);
        font-family: 'Comfortaa', sans-serif;
        font-size: 15px;
        margin: 4px 6px 4px 0;
    ">
        <canvas data-mode="{mode}" data-size="{size}" style="width: {size}px; height: {size}px; display: block; border-radius: 9999px;"></canvas>
        <span class="t-shimmer" data-text="{label}">{label}</span>
    </div>
    """

/**
 * VERAXIS AI — Ambient Neuform Particle Canvas Engine
 * Renders an ethereal, subtle full-screen ambient particle background based on the Neuform geometry.
 * Tuned with low opacity (0.18 - 0.22) and subtle mouse parallax so text and input remain razor-sharp.
 */

(function () {
  const canvas = document.createElement("canvas");
  canvas.id = "ambient-neuform-canvas";
  canvas.style.position = "fixed";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.width = "100vw";
  canvas.style.height = "100vh";
  canvas.style.zIndex = "0";
  canvas.style.pointerEvents = "none";
  canvas.style.transition = "filter 0.5s ease, opacity 0.5s ease";
  document.body.prepend(canvas);

  const ctx = canvas.getContext("2d");
  let dpr = Math.min(2, window.devicePixelRatio || 1);
  let W = window.innerWidth;
  let H = window.innerHeight;

  let currentTheme = document.documentElement.getAttribute("data-theme") || "dark";

  // Mouse Parallax coordinates
  let mouseX = 0;
  let mouseY = 0;
  let targetX = 0;
  let targetY = 0;

  window.addEventListener("mousemove", (e) => {
    targetX = (e.clientX / W - 0.5) * 40;
    targetY = (e.clientY / H - 0.5) * 40;
  });

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener("resize", resize);
  resize();

  // Neuform Eight-Chevron Path Walker
  const NEUFORM_PATH = "M111.571 49.9795L84 64.7156L112.332 77.9309 M107.889 87.5876L77.9727 78.5118L88.6616 107.89 M78.6897 111.575L63.9536 84.0035L50.7383 112.335 M41.0796 107.89L50.1554 77.9739L20.7773 88.6627 M17.0924 78.6912L44.6636 63.9551L16.332 50.7398 M20.7812 41.0833L50.697 50.1591L40.0081 20.781 M49.9766 17.0959L64.7127 44.6672L77.928 16.3356 M87.5875 20.7808L78.5117 50.6965L107.89 40.0077";

  function extractPoints(d, spacing) {
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
      const n = Math.max(3, Math.round(L / spacing));
      for (let i = 0; i < n; i++) {
        const q = el.getPointAtLength((i + 0.5) / n * L);
        pts.push([(q.x - 64) / 64, (q.y - 64) / 64]);
      }
    }
    svg.remove();
    return pts;
  }

  const rawPts = extractPoints(NEUFORM_PATH, 1.8);

  // Background Ambient Dust Particles
  const DUST_COUNT = 45;
  const dustParticles = [];
  for (let i = 0; i < DUST_COUNT; i++) {
    dustParticles.push({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 2 + 1,
      alpha: Math.random() * 0.4 + 0.1,
    });
  }

  window.setCanvasTheme = function (mode) {
    currentTheme = mode;
    if (mode === "light") {
      canvas.style.filter = "invert(0.92) sepia(0.25) hue-rotate(185deg) saturate(0.60) blur(0.6px)";
      canvas.style.opacity = "0.06";
    } else {
      canvas.style.filter = "blur(0.6px)";
      canvas.style.opacity = "0.07";
    }
  };
  window.setCanvasTheme(currentTheme);

  const TAU = Math.PI * 2;
  let startTime = performance.now();

  function animate(now) {
    const t = (now - startTime) / 1000;

    // Smooth mouse lerp
    mouseX += (targetX - mouseX) * 0.03;
    mouseY += (targetY - mouseY) * 0.03;

    ctx.clearRect(0, 0, W, H);

    // 1. Subtle Ambient Dust Particles (Barely Visible)
    for (const d of dustParticles) {
      d.x += d.vx;
      d.y += d.vy;
      if (d.x < 0) d.x = W;
      if (d.x > W) d.x = 0;
      if (d.y < 0) d.y = H;
      if (d.y > H) d.y = 0;

      ctx.fillStyle = `rgba(56, 189, 248, ${d.alpha * 0.08})`;
      ctx.beginPath();
      ctx.arc(d.x + mouseX * 0.2, d.y + mouseY * 0.2, d.r * 0.7, 0, TAU);
      ctx.fill();
    }

    // 2. Neuform Ambient Orb — Shifted to the Far Right Side (Off-Center)
    const isMobile = W < 800;
    const cx = (isMobile ? W * 0.88 : W * 0.84) + mouseX;
    const cy = (isMobile ? H * 0.28 : H * 0.38) + mouseY;
    const scale = Math.min(W, H) * (isMobile ? 0.26 : 0.34);

    const spin = t * 0.05;
    const cs = Math.cos(spin);
    const sn = Math.sin(spin);

    const wave = (((t * 0.22) % 1 + 1) % 1) * 1.6 - 0.1;

    for (let i = 0; i < rawPts.length; i++) {
      const [gx0, gy0] = rawPts[i];
      const gx = gx0 * cs - gy0 * sn;
      const gy = gx0 * sn + gy0 * cs;

      const dist = Math.hypot(gx, gy);
      const crest = Math.exp(-Math.pow(dist - wave, 2) / 0.04);

      const px = cx + gx * scale;
      const py = cy + gy * scale;

      const ptRadius = 0.8 + crest * 0.9;
      const brightness = 0.15 + crest * 0.35;

      // Soft Electric Cyan to Royal Violet Tint
      const isViolet = i % 2 === 0;
      const r = isViolet ? 168 : 56;
      const g = isViolet ? 85 : 189;
      const b = isViolet ? 247 : 248;

      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${brightness * 0.4})`;
      ctx.beginPath();
      ctx.arc(px, py, ptRadius, 0, TAU);
      ctx.fill();
    }

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
})();

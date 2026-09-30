import { useEffect, useRef } from "react";

export default function NeuformCanvas({ theme }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let W = window.innerWidth;
    let H = window.innerHeight;
    let dpr = Math.min(2, window.devicePixelRatio || 1);

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

    // Mouse coordinates
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const onMouseMove = (e) => {
      targetX = (e.clientX / W - 0.5) * 40;
      targetY = (e.clientY / H - 0.5) * 40;
    };
    window.addEventListener("mousemove", onMouseMove);

    // Neuform geometry walker path
    const NEUFORM_PATH = "M111.571 49.9795L84 64.7156L112.332 77.9309 M107.889 87.5876L77.9727 78.5118L88.6616 107.89 M78.6897 111.575L63.9536 84.0035L50.7383 112.335 M41.0796 107.89L50.1554 77.9739L20.7773 88.6627 M17.0924 78.6912L44.6636 63.9551L16.332 50.7398 M20.7812 41.0833L50.697 50.1591L40.0081 20.781 M49.9766 17.0959L64.7127 44.6672L77.928 16.3356 M87.5875 20.7808L78.5117 50.6965L107.89 40.0077";

    function extractPoints(d, spacing) {
      const NS = "http://www.w3.org/2000/svg";
      const svg = document.createElementNS(NS, "svg");
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
          const q = el.getPointAtLength(((i + 0.5) / n) * L);
          pts.push([(q.x - 64) / 64, (q.y - 64) / 64]);
        }
      }
      svg.remove();
      return pts;
    }

    const rawPts = extractPoints(NEUFORM_PATH, 1.6);

    // Subtle ambient dust particles
    const DUST_COUNT = 45;
    const dustParticles = [];
    for (let i = 0; i < DUST_COUNT; i++) {
      dustParticles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        r: Math.random() * 1.8 + 0.8,
        alpha: Math.random() * 0.5 + 0.2,
      });
    }

    const TAU = Math.PI * 2;
    let animId = null;
    let startTime = performance.now();

    function animate(now) {
      const t = (now - startTime) / 1000;
      mouseX += (targetX - mouseX) * 0.04;
      mouseY += (targetY - mouseY) * 0.04;

      ctx.clearRect(0, 0, W, H);

      const isLight = theme === "light";

      // Dust
      for (const d of dustParticles) {
        d.x += d.vx;
        d.y += d.vy;
        if (d.x < 0) d.x = W;
        if (d.x > W) d.x = 0;
        if (d.y < 0) d.y = H;
        if (d.y > H) d.y = 0;

        ctx.fillStyle = isLight
          ? `rgba(2, 132, 199, ${d.alpha * 0.22})`
          : `rgba(56, 189, 248, ${d.alpha * 0.28})`;
        ctx.beginPath();
        ctx.arc(d.x + mouseX * 0.15, d.y + mouseY * 0.15, d.r, 0, TAU);
        ctx.fill();
      }

      // Neuform geometry: Center-Right placement with clear visibility
      const isMobile = W < 768;
      const cx = (isMobile ? W * 0.5 : W * 0.64) + mouseX;
      const cy = (isMobile ? H * 0.38 : H * 0.44) + mouseY;
      const scale = Math.min(W, H) * (isMobile ? 0.38 : 0.42);

      const spin = t * 0.07;
      const cs = Math.cos(spin);
      const sn = Math.sin(spin);
      const wave = (((t * 0.25) % 1 + 1) % 1) * 1.6 - 0.1;

      // Draw subtle orbital paths
      for (let i = 0; i < rawPts.length; i++) {
        const [gx0, gy0] = rawPts[i];
        const gx = gx0 * cs - gy0 * sn;
        const gy = gx0 * sn + gy0 * cs;

        const dist = Math.hypot(gx, gy);
        const crest = Math.exp(-Math.pow(dist - wave, 2) / 0.05);

        const px = cx + gx * scale;
        const py = cy + gy * scale;
        const ptRadius = 1.2 + crest * 1.6;
        const brightness = 0.35 + crest * 0.65;

        const isViolet = i % 2 === 0;

        if (isLight) {
          // Elegant sapphire / slate in light mode
          const r = isViolet ? 37 : 2;
          const g = isViolet ? 99 : 132;
          const b = isViolet ? 235 : 199;
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${brightness * 0.55})`;
        } else {
          // Cyan / violet in dark mode
          const r = isViolet ? 168 : 56;
          const g = isViolet ? 85 : 189;
          const b = isViolet ? 247 : 248;
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${brightness * 0.70})`;
        }

        ctx.beginPath();
        ctx.arc(px, py, ptRadius, 0, TAU);
        ctx.fill();
      }

      animId = requestAnimationFrame(animate);
    }

    animId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      if (animId) cancelAnimationFrame(animId);
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-screen h-screen pointer-events-none z-0 transition-opacity duration-500"
      style={{
        opacity: theme === "light" ? 0.40 : 0.55,
      }}
    />
  );
}

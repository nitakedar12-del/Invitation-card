"use client";
import { useEffect, useRef, useState, useCallback, forwardRef } from "react";
import AOS from "aos";
import "aos/dist/aos.css";

/* ═══════════════════════════════════════════════════════════════════════════
   ASSETS
   CRITICAL → blocks the loader (only what the envelope screen needs)
   DEFERRED → downloaded + decoded in the background while the guest looks at
              the envelope, so nothing pops in while scrolling.
   ═══════════════════════════════════════════════════════════════════════════ */
const CRITICAL_ASSETS = [
  "/1st bg imjage.svg", "/openbottom.svg", "/Envelop (2).png",
  "/Gold Monogram.png", "/1st gate.png", "/AK Logo.png",
];
const DEFERRED_ASSETS = [
  "/Opening FG.svg", "/Screen 2 BG.png", "/Archeas.png", "/Balcony_1.png",
  "/Wall2.png", "/Chandelier.png", "/Sofa2.png", "/AK Invite Website.svg.svg",
  "/Location BG.png", "/location palace.png", "/location car.png", "/End.png",
];

const preloadImage = (src, timeout = 6000) =>
  new Promise((resolve) => {
    const img = new window.Image();
    const t = setTimeout(resolve, timeout);
    img.onload = () => {
      clearTimeout(t);
      (img.decode ? img.decode().catch(() => {}) : Promise.resolve()).then(resolve);
    };
    img.onerror = () => { clearTimeout(t); resolve(); };
    img.decoding = "async";
    img.src = src;
  });

/* Lazy + async-decoded by default; `eager` for above-the-fold images. */
const Img = forwardRef(function Img({ src, eager = false, alt = "", ...rest }, ref) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img ref={ref} src={src} alt={alt} loading={eager ? "eager" : "lazy"} decoding="async" draggable={false} {...rest} />;
});

const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
const setT = (el, v) => { if (el) el.style.transform = v; };

const INK = "text-[#3B2507]";
const ALICE = { fontFamily: "'Alice', serif" };
const BRUSH = { fontFamily: "'Alex Brush', cursive" };
const WEDDING_DATE = "23/11/26";
const TARGET = new Date("2026-11-23T00:00:00").getTime();

/* ═══════════════════════════════════════════════════════════════════════════
   CONFETTI
   ═══════════════════════════════════════════════════════════════════════════ */
const CONFETTI_COLORS = ["#FFD700", "#FF6B6B", "#4ECDC4", "#A78BFA", "#F97316", "#22D3EE", "#EC4899", "#84CC16", "#FFF", "#C9A96E"];

function ConfettiBurst({ active }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const cx = canvas.width / 2, cy = canvas.height * 0.52;

    const parts = Array.from({ length: 110 }, () => ({
      x: cx + (Math.random() - 0.5) * 60, y: cy,
      vx: (Math.random() - 0.5) * 20, vy: -(Math.random() * 16 + 5),
      color: CONFETTI_COLORS[(Math.random() * CONFETTI_COLORS.length) | 0],
      w: Math.random() * 16 + 6,
      h: Math.random() > 0.7 ? Math.random() * 16 + 6 : Math.random() * 8 + 3,
      rot: Math.random() * 360, rs: (Math.random() - 0.5) * 14,
      life: 1, decay: Math.random() * 0.013 + 0.007, circle: Math.random() > 0.7,
    }));

    let raf;
    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      for (const p of parts) {
        if (p.life <= 0) continue;
        alive = true;
        p.x += p.vx; p.y += p.vy; p.vy += 0.5; p.vx *= 0.985; p.rot += p.rs; p.life -= p.decay;
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        if (p.circle) { ctx.beginPath(); ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2); ctx.fill(); }
        else ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      if (alive) raf = requestAnimationFrame(tick);
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active]);

  return (
    <canvas ref={canvasRef}
      style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9999, display: active ? "block" : "none" }} />
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SCRATCH CARD
   Progress is tracked on a coarse grid — no more full-canvas getImageData().
   ═══════════════════════════════════════════════════════════════════════════ */
const CW = 640, CH = 320, CELL = 20, COLS = CW / CELL, ROWS = CH / CELL, BRUSH_R = 38;

function buildOverlay() {
  const oc = document.createElement("canvas");
  oc.width = CW; oc.height = CH;
  const ctx = oc.getContext("2d");

  const g = ctx.createLinearGradient(0, 0, CW, CH);
  [[0, "#7a5400"], [0.12, "#e6c231"], [0.28, "#c9940a"], [0.45, "#fff0a0"], [0.6, "#b8860b"], [0.78, "#f5d060"], [1, "#7a5400"]]
    .forEach(([s, c]) => g.addColorStop(s, c));
  ctx.fillStyle = g; ctx.fillRect(0, 0, CW, CH);

  for (let y = 0; y < CH; y += 2) {
    ctx.strokeStyle = `rgba(255,255,255,${Math.random() * 0.06})`;
    ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CW, y); ctx.stroke();
  }
  for (let i = 0; i < 80; i++) {
    const x = Math.random() * CW, y = Math.random() * CH;
    const len = Math.random() * 40 + 10, a = (Math.random() - 0.5) * 0.4;
    ctx.strokeStyle = `rgba(255,255,255,${Math.random() * 0.12})`;
    ctx.lineWidth = Math.random() * 1.5 + 0.5;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len); ctx.stroke();
  }
  const glare = ctx.createLinearGradient(0, 0, CW * 0.6, CH);
  [[0, 0], [0.4, 0.18], [0.5, 0.35], [0.6, 0.18], [1, 0]].forEach(([s, a]) => glare.addColorStop(s, `rgba(255,255,255,${a})`));
  ctx.fillStyle = glare; ctx.fillRect(0, 0, CW, CH);

  ctx.strokeStyle = "rgba(255,220,80,0.7)"; ctx.lineWidth = 4; ctx.strokeRect(6, 6, CW - 12, CH - 12);
  ctx.strokeStyle = "rgba(100,60,0,0.25)"; ctx.lineWidth = 1.5; ctx.strokeRect(12, 12, CW - 24, CH - 24);
  return oc;
}

function drawScratch(ctx, x, y) {
  ctx.globalCompositeOperation = "destination-out";
  const rg = ctx.createRadialGradient(x, y, 0, x, y, BRUSH_R);
  rg.addColorStop(0, "rgba(0,0,0,1)"); rg.addColorStop(0.5, "rgba(0,0,0,0.85)");
  rg.addColorStop(0.8, "rgba(0,0,0,0.4)"); rg.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = rg;
  ctx.beginPath(); ctx.arc(x, y, BRUSH_R, 0, Math.PI * 2); ctx.fill();

  ctx.lineCap = "round";
  for (let i = 0; i < 5; i++) {
    const a = Math.random() * Math.PI * 2, l = Math.random() * 28 + 12;
    const x2 = x + Math.cos(a) * l, y2 = y + Math.sin(a) * l;
    ctx.strokeStyle = "rgba(0,0,0,0.7)"; ctx.lineWidth = Math.random() * 6 + 3;
    ctx.beginPath(); ctx.moveTo(x, y);
    ctx.quadraticCurveTo((x + x2) / 2 + (Math.random() - 0.5) * 12, (y + y2) / 2 + (Math.random() - 0.5) * 12, x2, y2);
    ctx.stroke();
  }
  ctx.globalCompositeOperation = "source-over";
}

function ScratchCard({ weddingDate, onFullReveal }) {
  const canvasRef = useRef(null);
  const overlayRef = useRef(null);
  const queue = useRef([]);
  const last = useRef(null);
  const drawing = useRef(false);
  const done = useRef(false);
  const raf = useRef(0);
  const grid = useRef(new Uint8Array(COLS * ROWS));
  const marked = useRef(0);
  const [showDate, setShowDate] = useState(false);

  useEffect(() => {
    overlayRef.current = buildOverlay();
    canvasRef.current?.getContext("2d")?.drawImage(overlayRef.current, 0, 0);
    return () => cancelAnimationFrame(raf.current);
  }, []);

  const getPoint = useCallback((e) => {
    const c = canvasRef.current;
    if (!c) return null;
    const r = c.getBoundingClientRect();
    const t = e.touches?.[0] ?? e;
    return { x: ((t.clientX - r.left) / r.width) * CW, y: ((t.clientY - r.top) / r.height) * CH };
  }, []);

  const mark = (x, y) => {
    const g = grid.current;
    for (let cx = clamp(((x - 30) / CELL) | 0, 0, COLS - 1); cx <= clamp(((x + 30) / CELL) | 0, 0, COLS - 1); cx++)
      for (let cy = clamp(((y - 30) / CELL) | 0, 0, ROWS - 1); cy <= clamp(((y + 30) / CELL) | 0, 0, ROWS - 1); cy++) {
        const i = cy * COLS + cx;
        if (!g[i]) { g[i] = 1; marked.current++; }
      }
  };

  const flush = useCallback(() => {
    raf.current = 0;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx || done.current) return;
    for (const p of queue.current.splice(0)) { drawScratch(ctx, p.x, p.y); mark(p.x, p.y); }

    if (marked.current / (COLS * ROWS) > 0.55) {
      done.current = true;
      let alpha = 1;
      const wipe = () => {
        alpha -= 0.055;
        ctx.clearRect(0, 0, CW, CH);
        if (alpha <= 0) { setShowDate(true); onFullReveal?.(); return; }
        ctx.globalAlpha = alpha; ctx.drawImage(overlayRef.current, 0, 0); ctx.globalAlpha = 1;
        requestAnimationFrame(wipe);
      };
      requestAnimationFrame(wipe);
    }
  }, [onFullReveal]);

  const onStart = (e) => { e.preventDefault(); drawing.current = true; last.current = getPoint(e); };
  const onMove = (e) => {
    if (!drawing.current || done.current) return;
    e.preventDefault();
    const pt = getPoint(e);
    if (!pt) return;
    const a = last.current ?? pt;
    const steps = Math.max(1, Math.ceil(Math.hypot(pt.x - a.x, pt.y - a.y) / 3));
    for (let i = 1; i <= steps; i++)
      queue.current.push({ x: a.x + ((pt.x - a.x) * i) / steps, y: a.y + ((pt.y - a.y) * i) / steps });
    last.current = pt;
    if (!raf.current) raf.current = requestAnimationFrame(flush);
  };
  const onEnd = () => { drawing.current = false; last.current = null; };

  return (
    <div style={{ position: "relative", width: "92%", maxWidth: 380, margin: "0 auto", userSelect: "none", WebkitUserSelect: "none" }}>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1, pointerEvents: "none" }}>
        <Img src="/AK Invite Website.svg.svg" style={{ position: "absolute", width: 141, objectFit: "contain", top: -106 }} />
        <span style={{
          fontFamily: "Georgia,'Times New Roman',serif", fontSize: "1.2rem", fontWeight: 700,
          position: "absolute", top: 3, color: "#f4ead9", letterSpacing: "0.15em",
          textShadow: "0 2px 16px rgba(0,0,0,0.6)",
          transform: showDate ? "scale(1) translateY(0)" : "scale(0.75) translateY(10px)",
          transition: "transform 0.7s cubic-bezier(0.34,1.56,0.64,1)",
        }}>{weddingDate}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
        <canvas
          ref={canvasRef} width={CW} height={CH}
          style={{
            display: "block", width: "80%", height: 48, position: "relative", top: -3, zIndex: 2,
            borderRadius: 14, touchAction: "none", cursor: showDate ? "default" : "crosshair",
            opacity: showDate ? 0 : 1, transition: "opacity 0.4s ease",
            boxShadow: showDate ? "none" : "0 8px 32px rgba(0,0,0,0.14),0 2px 8px rgba(0,0,0,0.18),inset 0 1px 0 rgba(255,220,80,0.3)",
          }}
          onMouseDown={onStart} onMouseMove={onMove} onMouseUp={onEnd} onMouseLeave={onEnd}
          onTouchStart={onStart} onTouchMove={onMove} onTouchEnd={onEnd} onTouchCancel={onEnd}
        />
      </div>
    </div>
  );
}

const NameRow = ({ name }) => (
  <div className={`mt-3 flex justify-center items-center ${INK}`} data-aos="fade-up">
    <span className="mt-3 text-2xl tracking-wide" style={{ ...BRUSH, paddingRight: "0.5rem" }}>Dr.</span>
    <h1 className="mt-3 text-5xl tracking-wide" style={BRUSH}>{name}</h1>
  </div>
);

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   Scroll-driven motion is applied through refs in a single rAF-throttled
   listener, so the page no longer re-renders on every scroll event.
   ═══════════════════════════════════════════════════════════════════════════ */
function Open() {
  const sectionRef = useRef(null);
  const section3Ref = useRef(null);
  const venueRef = useRef(null);
  const gateImgRef = useRef(null);
  const logoLayerRef = useRef(null);
  const topOverlayRef = useRef(null);
  const botOverlayRef = useRef(null);
  const chandelierRef = useRef(null);
  const carRef = useRef(null);
  const metrics = useRef({ wh: 0, s3: 0, venue: 0, doc: 0 });
  const isLastRef = useRef(false);

  const [open, setOpen] = useState(false);
  const [envelopeAnimDone, setEnvelopeAnimDone] = useState(false);
  const [section2Loaded, setSection2Loaded] = useState(false);
  const [confettiActive, setConfettiActive] = useState(false);
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isLast, setIsLast] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0 });

  /* Countdown — client-only, 30 s tick (only minutes are shown) */
  useEffect(() => {
    const calc = () => {
      const d = TARGET - Date.now();
      setTimeLeft({
        days: Math.max(0, Math.floor(d / 86400000)),
        hours: Math.max(0, Math.floor((d % 86400000) / 3600000)),
        minutes: Math.max(0, Math.floor((d % 3600000) / 60000)),
      });
    };
    calc();
    const t = setInterval(calc, 30000);
    return () => clearInterval(t);
  }, []);

  /* Preload: critical first (loader), the rest in the background */
  useEffect(() => {
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    let cancelled = false, loaded = 0;

    Promise.all(
      CRITICAL_ASSETS.map((src) =>
        preloadImage(src).then(() => {
          loaded++;
          if (!cancelled) setProgress(Math.round((loaded / CRITICAL_ASSETS.length) * 100));
        })
      )
    ).then(() => {
      if (cancelled) return;
      setProgress(100);
      setTimeout(() => !cancelled && setAssetsLoaded(true), 250);

      const queue = [...DEFERRED_ASSETS];
      const worker = async () => { while (queue.length && !cancelled) await preloadImage(queue.shift(), 15000); };
      worker(); worker(); worker();
    });

    return () => { cancelled = true; document.documentElement.style.overflow = ""; document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    AOS.init({ duration: 800, once: true, disable: () => window.matchMedia("(prefers-reduced-motion: reduce)").matches });
  }, []);

  /* Measure on resize / unlock only — never on scroll */
  const measure = useCallback(() => {
    metrics.current = {
      wh: sectionRef.current?.offsetHeight || window.innerHeight,
      s3: section3Ref.current?.offsetTop || 0,
      venue: venueRef.current?.offsetTop || 0,
      doc: document.documentElement.scrollHeight,
    };
  }, []);

  const update = useCallback(() => {
    const y = window.scrollY;
    const { wh, s3, venue, doc } = metrics.current;
    if (!wh) return;

    const first = Math.min(y, wh);
    setT(gateImgRef.current, `translate3d(0,${-first}px,0)`);
    setT(logoLayerRef.current, `translate3d(0,${-first}px,0)`);

    const top = clamp((y - wh) / (wh * 0.9), 0, 1);
    setT(topOverlayRef.current, `translate3d(0,${-(top * top) * 200}px,0)`);

    const bot = clamp((y - wh) / Math.max(1, s3 + wh * 0.4 - wh), 0, 1);
    setT(botOverlayRef.current, `translate3d(0,${-(bot * bot) * 120}px,0)`);

    const s3p = clamp((y - s3) / wh, 0, 1);
    setT(chandelierRef.current, y < s3 ? "translate3d(0,0,0)" : `translate3d(0,${-s3p * wh}px,0)`);

    let carX = 110;
    if (y >= venue) carX = 10 - Math.min((y - venue) / (wh * 0.6), 1) ** 2 * 130;
    else if (y >= venue - wh) carX = 110 - (1 - (1 - Math.min((y - (venue - wh)) / (wh * 0.5), 1)) ** 3) * 100;
    setT(carRef.current, `translate3d(${carX}vw,0,0)`);

    // hide the hint when the user is within 0.3 screen of the very end
    const last = y > doc - wh - wh * 0.3;
    if (last !== isLastRef.current) { isLastRef.current = last; setIsLast(last); }
  }, []);

  useEffect(() => {
    if (!envelopeAnimDone) return;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { update(); ticking = false; });
    };
    const onResize = () => { measure(); update(); };
    measure(); update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [envelopeAnimDone, measure, update]);

  const handleOpen = useCallback(() => {
    if (open) return;
    setOpen(true);
    setTimeout(() => {
      setEnvelopeAnimDone(true);
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "auto";
    }, 1700);
  }, [open]);

  const handleScratchReveal = useCallback(() => {
    setConfettiActive(true);
    setTimeout(() => setConfettiActive(false), 3500);
  }, []);

  const fadeUp = (delay) => ({
    opacity: open ? 1 : 0,
    transform: open ? "translateY(0)" : "translateY(40px)",
    transition: "opacity 1s ease, transform 1s ease",
    transitionDelay: `${delay}s`,
  });

  /* ── LOADER ── */
  if (!assetsLoaded) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center z-[9999]"
        style={{ background: "linear-gradient(160deg,#fff8f0,#fdecd8,#f9dfc8)" }}>
        <p className="text-[#b68d33] font-bold text-2xl mb-8 tracking-[4px] uppercase">Wedding Loading</p>
        <div className="w-64 h-1.5 bg-[#f8e4d0] rounded-full overflow-hidden">
          <div className="h-full rounded-full"
            style={{ width: `${progress}%`, background: "linear-gradient(90deg,#b68d33,#e8b56d)", transition: "width 0.3s ease-out" }} />
        </div>
        <p className="mt-3 text-[#b68d33] font-medium text-lg">{progress}%</p>
        <p className="absolute bottom-10 text-[#c4a06a] text-xs tracking-widest uppercase">Please Wait…</p>
      </div>
    );
  }

  const unlocked = open && envelopeAnimDone;

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        html { -webkit-text-size-adjust: 100%; }
        body { background: #fff8f0; overscroll-behavior-y: none; }
        * { -webkit-tap-highlight-color: transparent; }
        img { -webkit-user-drag: none; pointer-events: none; user-select: none; }
        canvas, a, button, [role="button"] { pointer-events: auto !important; }

        .full-h { height: 100vh; height: 100svh; }
        .scroll-layer { will-change: transform; backface-visibility: hidden; }

        .env-stage { perspective: 1000px; perspective-origin: 50% 0%; transform-style: preserve-3d; }
        .env-flap {
          position: absolute; inset: 0; width: 100%; height: 100%;
          transform-origin: top center; transform: rotateX(0deg);
          transition: transform 2500ms cubic-bezier(0.4,0,0.2,1);
          backface-visibility: hidden; will-change: transform; cursor: pointer; z-index: 30;
        }
        .env-flap.opened { transform: rotateX(175deg); }
        .env-body {
          position: absolute; inset: 0; width: 100%; height: 100%;
          transform-origin: bottom center; transform: rotateX(0deg);
          transition: transform 3500ms cubic-bezier(0.4,0,0.2,1);
          backface-visibility: hidden; will-change: transform; z-index: 20; pointer-events: none;
        }
        .env-body.opened { transform: rotateX(-175deg); }
        .env-flap:not(.opened)::after {
          content: ""; position: absolute; inset: 0; pointer-events: none;
          background: linear-gradient(105deg,transparent 38%,rgba(255,255,255,0.22) 50%,transparent 62%);
          background-size: 220% 100%; animation: shimmer-move 3.2s linear infinite;
        }
        @keyframes shimmer-move { 0%,100% { background-position: 220% center; } }

        .tap-hint { position: absolute; top: 65%; left: 50%; transform: translateX(-50%); z-index: 40; pointer-events: none; text-align: center; width: max-content; }
        @media (max-height: 667px)                       { .tap-hint { top: 59%; } }
        @media (max-width: 320px)                        { .tap-hint { top: 60%; } }
        @media (min-width: 321px) and (max-width: 375px) { .tap-hint { top: 63%; } }
        @media (min-width: 376px) and (max-width: 425px) { .tap-hint { top: 64%; } }
        @media (min-width: 426px) and (max-width: 768px) { .tap-hint { top: 66%; } }
        .tap-hint-label { display: block; color: #b68d33; font-size: 10px; letter-spacing: 3.5px; font-weight: 900; text-transform: uppercase; white-space: nowrap; }

        .scratch-overlay { position: absolute; top: 55%; left: 50%; transform: translate(-50%,-50%); width: 100%; z-index: 20; display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 0 16px; }
        .scratch-title { font-family: 'Alex Brush', cursive; font-weight: 500; font-size: 4rem; color: #3B2507; }
        .scratch-subtitle { font-family: Georgia, serif; font-size: clamp(0.85rem, 2.4vw, 0.98rem); color: #671d02; text-align: center; letter-spacing: 0.03em; margin-bottom: 14px; line-height: 1.5; }

        .car-img { width: 294px; height: 531px; }
        .overlay-strip { position: relative; z-index: 30; pointer-events: none; margin-bottom: -332px; height: 320px; will-change: transform; transition: transform 0.1s linear; }

        @keyframes chevronFade { 0%,100% { opacity: 0.25; } 50% { opacity: 1; } }
        @keyframes scrollFadeIn { from { opacity: 0; transform: translateX(-50%) translateY(8px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
        @media (prefers-reduced-motion: reduce) { .env-flap::after { animation: none; } }
      `}</style>

      <ConfettiBurst active={confettiActive} />

      {envelopeAnimDone && !isLast && (
        <div style={{
          position: "fixed", bottom: "calc(24px + env(safe-area-inset-bottom, 0px))", left: "50%",
          transform: "translateX(-50%)", zIndex: 9998, pointerEvents: "none",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
          animation: "scrollFadeIn 0.8s ease both",
        }}>
          <span style={{ color: "#fff", fontSize: 11, letterSpacing: 3, fontWeight: 700, textTransform: "uppercase", fontFamily: "Georgia, serif", textShadow: "0 1px 8px rgba(0,0,0,0.7), 0 0 2px rgba(0,0,0,0.9)", whiteSpace: "nowrap" }}>
            Scroll Down
          </span>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            {[0, 1, 2].map((i) => (
              <svg key={i} width="14" height="8" viewBox="0 0 14 8" fill="none" style={{ animation: `chevronFade 1.6s ease-in-out ${i * 0.18}s infinite` }}>
                <path d="M1 1L7 7L13 1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.9))" }} />
              </svg>
            ))}
          </div>
        </div>
      )}

      <div className={`relative ${unlocked ? "min-h-[495vh]" : "full-h overflow-hidden"}`}>

        {/* ── SECTION 1 — Envelope ── */}
        <div ref={sectionRef} className="sticky top-0 w-full overflow-hidden full-h"
          style={{ background: "linear-gradient(160deg,#fff8f0 0%,#fdecd8 55%,#f5d5b8 100%)" }}>
          <Img eager src="/1st bg imjage.svg" className="absolute inset-0 w-full h-full object-cover" style={fadeUp(0)} />

          <div className="absolute inset-0 w-full h-full scroll-layer" style={{
            opacity: open ? 1 : 0,
            transform: open ? "translateY(-7px)" : "translateY(100%)",
            transition: open
              ? "opacity 0.9s cubic-bezier(0.22,1,0.36,1),transform 1.4s cubic-bezier(0.22,1,0.36,1)"
              : "transform 0.5s cubic-bezier(0.22,1,0.36,1),opacity 0.3s ease",
            transitionDelay: open ? "0.9s" : "0s",
          }}>
            <Img eager ref={gateImgRef} src="/1st gate.png" className="w-full h-full object-cover" />
          </div>

          <div ref={logoLayerRef} className="absolute inset-0 w-full h-full scroll-layer" style={{ opacity: open ? 1 : 0 }}>
            <Img eager src="/AK Logo.png" alt="Logo" className="absolute object-contain" style={{
              width: "clamp(112px,22vw,122px)", height: "auto", top: "50%", left: "50%",
              transform: `translate(-50%,-50%) translateY(${open ? 0 : 40}px)`,
              opacity: open ? 1 : 0,
              transition: "opacity 1.4s ease, transform 1.5s ease", transitionDelay: "1.5s",
            }} />
          </div>

          <div className="env-stage absolute inset-0 w-full h-full" style={{ pointerEvents: open ? "none" : "auto" }}>
            <div className={`env-body${open ? " opened" : ""}`}>
              <Img eager src="/openbottom.svg" className="w-full h-full object-cover" />
            </div>
            <div className={`env-flap${open ? " opened" : ""}`} onClick={handleOpen}
              role="button" aria-label="Open invitation" tabIndex={0}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleOpen()}>
              <Img eager src="/Envelop (2).png" className="w-full h-full object-cover" />
              {/* <Img eager src="/Gold Monogram.png" className="absolute inset-0 w-full h-full object-cover" /> */}
            </div>
          </div>

          {!open && <div className="tap-hint"><span className="tap-hint-label">Tap to Open</span></div>}
        </div>

        {unlocked && (
          <>
            <div className="relative">
              <Img src="/Opening FG.svg" className="absolute w-full object-cover scroll-layer" style={{ bottom: -14, ...fadeUp(1.8) }} />
            </div>

            {/* ── SECTION 2 — Names ── */}
            <div className="w-full relative overflow-hidden full-h">
              {["/Screen 2 BG.png", "/Archeas.png"].map((src, i) => (
                <Img key={src} src={src} onLoad={i === 0 ? () => setSection2Loaded(true) : undefined}
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${section2Loaded ? "opacity-100" : "opacity-0"}`} />
              ))}
              <div className="relative flex items-center justify-center h-full px-6 mt-[68px]" style={ALICE}>
                <div className="max-w-[340px] w-full text-center absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col justify-center items-center"
                  data-aos="fade-up" data-aos-duration="1200">
                  <p className={`text-[11px] leading-relaxed ${INK}`} style={{ ...ALICE, width: 220, marginTop: -91 }} data-aos="fade-up">
                    We warmly invite you to join us in celebrating our wedding and to be a part of the happiness, love, and unforgettable memories that make this occasion so special. ✨
                  </p>
                  <NameRow name="Tushar" />
                  <p className={`mt-3 text-[12px] ${INK}`} style={ALICE} data-aos="fade-up">with</p>
                  <NameRow name="Shweta" />
                </div>
              </div>
            </div>

            {/* Top overlay */}
            <div ref={topOverlayRef} className="overlay-strip" style={{ top: -82 }}>
              <Img src="/Balcony_1.png" className="w-full object-cover" style={{ height: 300, display: "block" }} />
            </div>

            {/* ── SECTION 3 — Scratch card ── */}
            <div ref={section3Ref} className="w-full relative overflow-hidden full-h" style={{ zIndex: 10 }}>
              <div className="sticky top-0 w-full overflow-hidden full-h">
                <Img src="/Wall2.png" className="absolute inset-0 w-full h-full object-cover" />
                <Img ref={chandelierRef} src="/Chandelier.png" className="absolute w-full h-full object-cover top-[40px] scroll-layer" />
                <div className="scratch-overlay">
                  <p className="scratch-title">Reveal</p>
                  <p className="scratch-subtitle">Scratch to discover<br />the wedding date</p>
                  <ScratchCard weddingDate={WEDDING_DATE} onFullReveal={handleScratchReveal} />
                </div>
              </div>
            </div>

            {/* Bottom overlay */}
            <div ref={botOverlayRef} className="overlay-strip" style={{ top: -105 }}>
              <Img src="/Sofa2.png" className="w-full object-cover" style={{ height: 300, display: "block" }} />
            </div>

            {/* ── SECTION 5 — Venue ── */}
            <div ref={venueRef} className="w-full relative flex flex-col items-center justify-center text-center full-h"
              style={{ fontFamily: "Georgia,'Times New Roman',serif", overflow: "clip", background: "#dfd4bc" }}>
              <Img src="/Location BG.png" className="absolute inset-0 w-full h-full object-cover" style={{ opacity: 0.7, zIndex: 0 }} />
              <Img src="/location palace.png" className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 1 }} />
              <Img ref={carRef} src="/location car.png" alt="Car" className="absolute object-contain scroll-layer car-img"
                style={{ transform: "translate3d(110vw,0,0)", zIndex: 2, bottom: "-2%" }} />

              <div className="relative flex flex-col items-center w-full px-4" style={{ marginTop: -381, zIndex: 10 }}>
                <h2 data-aos="fade-up" style={{ ...BRUSH, fontSize: "4rem", fontWeight: 500, marginBottom: "0.5rem", color: "#3B2507" }}>Venue</h2>

                <Img src="/AK Invite Website.svg.svg" className="absolute"
                  style={{ height: 402, top: -50, left: "50%", transform: "translateX(-50%)", zIndex: 3 }} />
                <a href="https://maps.app.goo.gl/QAfkdhVJVGWNLxFE9" target="_blank" rel="noopener noreferrer"
                  className="text-white px-8 py-3 rounded-full font-semibold active:scale-95 transition-transform"
                  style={{ position: "relative", top: 23, zIndex: 10, fontSize: 16, background: "transparent", ...ALICE }}
                  data-aos="fade-up">
                  Palash The Jungle Resort
                </a>
                <p style={{ position: "relative", top: 118, fontSize: 17, zIndex: 50, backgroundColor: "rgba(174,141,50,0.7)", padding: "4px 8px", boxShadow: "0 2px 4px rgba(0,0,0,0.3)", ...ALICE }}>
                  Time : 6.10 PM
                </p>
                <p style={{ position: "relative", top: 118, fontSize: 17, zIndex: 50, ...ALICE }}>
                  Tap the blue buttons to get directions on maps
                </p>
              </div>
            </div>

            {/* ── SECTION 6 — Countdown ── */}
            <div className="w-full relative flex items-center justify-center text-center overflow-hidden full-h"
              style={{ fontFamily: "Georgia,'Times New Roman',serif" }}>
              <Img src="/End.png" className="absolute inset-0 w-full h-full object-cover" />
              <div className="relative z-10 flex flex-col items-center px-2">
                <h2 className={`text-3xl md:text-4xl ${INK}`} data-aos="fade-up" style={BRUSH}>The<br />Countdown<br />Begins</h2>
                <div className="bg-[#0057d4] text-white px-3 py-1 rounded-full text-lg font-semibold shadow-lg mb-6 tracking-widest" data-aos="fade-up">
                  {timeLeft.days}D &nbsp;{timeLeft.hours}H &nbsp;{timeLeft.minutes}M
                </div>
                <p className={`text-[13px] max-w-xs leading-relaxed ${INK}`} style={{ width: 158 }} data-aos="fade-up">
                  With love and warm regards Bawankar Family! 💖<br />
                  We look forward to celebrating this beautiful beginning with you!
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}

export default Open;
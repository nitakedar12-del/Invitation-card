/* eslint-disable react-hooks/purity */
"use client";
/**
 * Section3Slide.jsx
 * Drop-in replacement / wrapper for your 3rd slide section.
 * Integrates the scratch-to-reveal functionality using /3rd slide3.svg as the gold foil.
 *
 * Usage:
 *   <Section3Slide
 *     section3Ref={section3Ref}
 *     getSection3Style={getSection3Style}
 *     visible={visible}
 *     scrollY={scrollY}
 *     section3Start={section3Start}
 *     section3Progress={section3Progress}
 *     windowHeight={windowHeight}
 *   />
 */

import { useEffect, useRef, useState, useCallback } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Confetti
// ─────────────────────────────────────────────────────────────────────────────
function ConfettiBurst({ active }) {
  const [particles, setParticles] = useState([]);
  const particlesRef = useRef([]);

  const COLORS = [
    "#FFD700", "#FF6B6B", "#4ECDC4", "#A78BFA",
    "#F97316", "#22D3EE", "#EC4899", "#84CC16",
    "#FFF", "#C9A96E",
  ];

  useEffect(() => {
    if (!active) return;

    const cx = window.innerWidth / 2;
    const cy = window.innerHeight * 0.52;
    const count = 140;

    particlesRef.current = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: cx + (Math.random() - 0.5) * 60,
      y: cy,
      vx: (Math.random() - 0.5) * 20,
      vy: -(Math.random() * 16 + 5),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: Math.random() * 16 + 6,
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 14,
      gravity: 0.5,
      life: 1,
      decay: Math.random() * 0.013 + 0.007,
      isCircle: Math.random() > 0.7,
    }));

    let frame;
    const tick = () => {
      particlesRef.current = particlesRef.current
        .map((p) => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          vy: p.vy + p.gravity,
          vx: p.vx * 0.985,
          rotation: p.rotation + p.rotSpeed,
          life: p.life - p.decay,
        }))
        .filter((p) => p.life > 0);

      setParticles([...particlesRef.current]);
      if (particlesRef.current.length > 0) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active]);

  if (!active && particles.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 9999,
        overflow: "hidden",
      }}
    >
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: "absolute",
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.isCircle ? p.size : p.size * 0.4,
            backgroundColor: p.color,
            borderRadius: p.isCircle ? "50%" : 2,
            transform: `rotate(${p.rotation}deg)`,
            opacity: p.life,
          }}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ScratchCard
// ─────────────────────────────────────────────────────────────────────────────
function ScratchCard({ weddingDate = "05/05/26", onFullReveal }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [hintVisible, setHintVisible] = useState(true);
  const hasTriggered = useRef(false);

  // Init canvas — draw the gold foil SVG (or gradient fallback)
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const img = new Image();
    img.src = "/3rd slide3.svg";

    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };

    img.onerror = () => {
      // Rich gold foil fallback
      const grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
      grad.addColorStop(0, "#8B6914");
      grad.addColorStop(0.15, "#F5D060");
      grad.addColorStop(0.3, "#C9940A");
      grad.addColorStop(0.5, "#FFF0A0");
      grad.addColorStop(0.7, "#B8860B");
      grad.addColorStop(0.85, "#E8C84A");
      grad.addColorStop(1, "#8B6914");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Brush stroke shimmer
      ctx.save();
      ctx.globalAlpha = 0.18;
      for (let i = 0; i < 40; i++) {
        ctx.beginPath();
        ctx.strokeStyle = i % 2 === 0 ? "#fff" : "#7A5C00";
        ctx.lineWidth = Math.random() * 8 + 1;
        const y = Math.random() * canvas.height;
        ctx.moveTo(Math.random() * 20, y);
        ctx.bezierCurveTo(
          canvas.width * 0.25, y - 15 + Math.random() * 30,
          canvas.width * 0.75, y - 15 + Math.random() * 30,
          canvas.width - Math.random() * 20, y + (Math.random() - 0.5) * 20
        );
        ctx.stroke();
      }
      ctx.restore();
    };
  }, []);

  useEffect(() => { initCanvas(); }, [initCanvas]);

  // ── Pointer helpers ──────────────────────────────────────────────────────
  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width / rect.width;
    const sy = canvas.height / rect.height;
    if (e.touches) {
      return {
        x: (e.touches[0].clientX - rect.left) * sx,
        y: (e.touches[0].clientY - rect.top) * sy,
      };
    }
    return {
      x: (e.clientX - rect.left) * sx,
      y: (e.clientY - rect.top) * sy,
    };
  };

  const doScratch = useCallback((e) => {
    if (!isDrawing || revealed) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const { x, y } = getPos(e, canvas);

    ctx.globalCompositeOperation = "destination-out";

    // Main erase circle
    ctx.beginPath();
    ctx.arc(x, y, 30, 0, Math.PI * 2);
    ctx.fill();

    // Slightly randomised smaller circles for natural feel
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(
        x + (Math.random() - 0.5) * 24,
        y + (Math.random() - 0.5) * 24,
        Math.random() * 14 + 6,
        0, Math.PI * 2
      );
      ctx.fill();
    }

    ctx.globalCompositeOperation = "source-over";
    setHintVisible(false);
    checkReveal(ctx, canvas);
  }, [isDrawing, revealed, getPos, checkReveal]);

  const checkReveal = (ctx, canvas) => {
    if (hasTriggered.current) return;
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let transparent = 0;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] < 128) transparent++;
    }
    const pct = (transparent / (canvas.width * canvas.height)) * 100;

    if (pct > 45) {
      hasTriggered.current = true;
      // Sweep clear remaining foil
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setRevealed(true);
      onFullReveal?.();
    }
  };

  return (
    <div
      style={{
        position: "relative",
        width: "75%",
        maxWidth: 360,
        margin: "0 auto",
        aspectRatio: "2.7 / 1",
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
    >
      {/* Date shown beneath foil */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1,
        }}
      >
        <span
          style={{
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: "clamp(1.3rem, 4.5vw, 1.9rem)",
            fontWeight: 700,
            color: "#fff",
            letterSpacing: "0.1em",
            background: "#7B1D3A",
            padding: "10px 30px",
            borderRadius: 8,
            border: "1.5px solid rgba(255,255,255,0.25)",
            boxShadow: "0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)",
            opacity: revealed ? 1 : 0,
            transform: revealed ? "scale(1) translateY(0)" : "scale(0.8) translateY(6px)",
            transition: "opacity 0.5s ease, transform 0.5s cubic-bezier(0.34,1.56,0.64,1)",
          }}
        >
          {weddingDate}
        </span>
      </div>

      {/* Scratch canvas */}
      <canvas
        ref={canvasRef}
        width={520}
        height={194}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          zIndex: 2,
          cursor: revealed ? "default" : "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Ccircle cx='12' cy='12' r='10' fill='rgba(255,215,0,0.6)' stroke='%23B8860B' stroke-width='2'/%3E%3C/svg%3E\") 12 12, crosshair",
          borderRadius: 6,
          touchAction: "none",
          opacity: revealed ? 0 : 1,
          transition: "opacity 0.6s ease",
        }}
        onMouseDown={() => setIsDrawing(true)}
        onMouseUp={() => setIsDrawing(false)}
        onMouseLeave={() => setIsDrawing(false)}
        onMouseMove={doScratch}
        onTouchStart={(e) => { setIsDrawing(true); doScratch(e); }}
        onTouchEnd={() => setIsDrawing(false)}
        onTouchMove={doScratch}
      />

      {/* Hint text */}
      {hintVisible && !revealed && (
        <div
          style={{
            position: "absolute",
            bottom: -32,
            left: "50%",
            transform: "translateX(-50%)",
            color: "#C9A96E",
            fontSize: "0.78rem",
            fontFamily: "Georgia, serif",
            letterSpacing: "0.07em",
            whiteSpace: "nowrap",
            textShadow: "0 1px 4px rgba(0,0,0,0.5)",
            animation: "scratchPulse 1.8s ease-in-out infinite",
          }}
        >
          ✦ &nbsp;Scratch to discover&nbsp; ✦
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 3 — main export
// ─────────────────────────────────────────────────────────────────────────────
export default function Section3Slide({
  section3Ref,
  getSection3Style,
  visible,
  scrollY,
  section3Start,
  section3Progress,
  windowHeight,
}) {
  const [confettiActive, setConfettiActive] = useState(false);

  const handleReveal = useCallback(() => {
    setConfettiActive(true);
    // Fire a second burst for extra drama
    setTimeout(() => setConfettiActive(false), 100);
    setTimeout(() => setConfettiActive(true), 200);
    setTimeout(() => setConfettiActive(false), 3500);
  }, []);

  return (
    <>
      <ConfettiBurst active={confettiActive} />

      <div
        ref={section3Ref}
        className="h-screen w-full relative overflow-hidden"
        style={{ zIndex: 10 }}
        data-aos="fade-up"
        data-aos-duration="500"
      >
        <div className="sticky top-0 h-screen w-full overflow-hidden">

          {/* Background */}
          <img
            src="/3rd slide bg.svg"
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover"
            alt=""
          />

          {/* Second layer */}
          <img
            src="/3rd slide second.svg"
            loading="lazy"
            className="absolute w-full h-full object-cover top-[40px] fade-up"
            style={getSection3Style(0)}
            alt=""
          />

          {/* Decorative layer 4 */}
          <img
            src="/3rd slide4.svg"
            loading="lazy"
            className={`absolute w-full h-full object-cover top-[100px] fade-up ${visible ? "show" : ""}`}
            style={{ transitionDelay: "0.3s" }}
            alt=""
          />

          {/* ── Scratch overlay layer (was /3rd slide3.svg full image) ────── */}
          {/* We now render a positioned scratch card in the centre instead   */}
          <div
            className={`absolute w-full fade-up ${visible ? "show" : ""}`}
            style={{
              top: "48%",
              transform: "translateY(-50%)",
              transitionDelay: "0.4s",
              zIndex: 20,
            }}
          >
            {/* "Reveal" heading */}
            <p
              style={{
                textAlign: "center",
                fontFamily: "'Georgia', serif",
                fontSize: "clamp(1.6rem, 5vw, 2.2rem)",
                color: "#C9A96E",
                fontWeight: 700,
                marginBottom: 6,
                letterSpacing: "0.04em",
                textShadow: "0 2px 8px rgba(0,0,0,0.4)",
              }}
            >
              Reveal
            </p>

            {/* Sub-text */}
            <p
              style={{
                textAlign: "center",
                fontFamily: "'Georgia', serif",
                fontSize: "clamp(0.85rem, 2.5vw, 1rem)",
                color: "#3B1A0E",
                marginBottom: 16,
                letterSpacing: "0.03em",
              }}
            >
              Scratch to discover<br />the wedding date
            </p>

            {/* The interactive scratch card */}
            <ScratchCard weddingDate="05/05/26" onFullReveal={handleReveal} />
          </div>

          {/* Bottom sofa / decorative */}
          <img
            src="/3rd slide bottom.svg"
            loading="lazy"
            className="absolute w-full h-full object-cover top-[276px]"
            style={{
              transform:
                scrollY < section3Start
                  ? "translateY(0px)"
                  : `translateY(${-section3Progress * windowHeight}px)`,
              opacity: scrollY < section3Start ? 1 : 1 - section3Progress,
              transition: "transform 0.1s linear, opacity 0.1s linear",
            }}
            alt=""
          />

        </div>
      </div>

      <style jsx global>{`
        @keyframes scratchPulse {
          0%, 100% { opacity: 1; transform: translateX(-50%) scale(1); }
          50%       { opacity: 0.4; transform: translateX(-50%) scale(0.97); }
        }
      `}</style>
    </>
  );
}
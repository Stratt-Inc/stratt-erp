"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Highlight } from "@/components/Highlight";
import { roadmapModules, modules, features, stats } from "./page-data";

// ─── NetworkViz ───────────────────────────────────────────────────────────────

const NODES: { x: number; y: number }[] = [
  { x: 60,   y: 80  }, { x: 160,  y: 40  }, { x: 260,  y: 100 }, { x: 360,  y: 60  },
  { x: 460,  y: 120 }, { x: 560,  y: 50  }, { x: 660,  y: 90  }, { x: 760,  y: 40  },
  { x: 860,  y: 110 }, { x: 960,  y: 60  }, { x: 1060, y: 100 }, { x: 1140, y: 70  },
  { x: 80,   y: 180 }, { x: 180,  y: 160 }, { x: 280,  y: 200 }, { x: 400,  y: 170 },
  { x: 500,  y: 210 }, { x: 600,  y: 160 }, { x: 700,  y: 200 }, { x: 800,  y: 150 },
  { x: 900,  y: 200 }, { x: 1000, y: 170 }, { x: 1100, y: 190 }, { x: 1150, y: 220 },
  { x: 50,   y: 290 }, { x: 150,  y: 270 }, { x: 250,  y: 310 }, { x: 370,  y: 280 },
  { x: 470,  y: 320 }, { x: 580,  y: 270 }, { x: 680,  y: 300 }, { x: 790,  y: 270 },
  { x: 880,  y: 310 }, { x: 980,  y: 280 }, { x: 1080, y: 300 }, { x: 1160, y: 310 },
  { x: 100,  y: 370 }, { x: 300,  y: 360 }, { x: 600,  y: 380 }, { x: 900,  y: 360 }, { x: 1100, y: 370 },
];

// Precompute connections (distance < 160)
const NET_CONNECTIONS: [number, number][] = (() => {
  const conns: [number, number][] = [];
  for (let i = 0; i < NODES.length; i++) {
    for (let j = i + 1; j < NODES.length; j++) {
      const dx = NODES[i].x - NODES[j].x;
      const dy = NODES[i].y - NODES[j].y;
      if (Math.sqrt(dx * dx + dy * dy) < 160) {
        conns.push([i, j]);
      }
    }
  }
  return conns;
})();

interface NetworkVizProps {
  activationLevel: number;
  height?: number;
  className?: string;
}

function NetworkViz({ activationLevel, height = 400, className = "" }: NetworkVizProps) {
  const activeCount = Math.floor(activationLevel * NODES.length);

  return (
    <svg
      width="100%"
      height={height}
      viewBox="0 0 1200 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Connections */}
      {NET_CONNECTIONS.map(([i, j], idx) => {
        const active = i < activeCount && j < activeCount;
        return (
          <line
            key={idx}
            x1={NODES[i].x} y1={NODES[i].y}
            x2={NODES[j].x} y2={NODES[j].y}
            stroke={active ? "rgba(36,221,184,0.45)" : "rgba(92,147,255,0.07)"}
            strokeWidth={active ? 1.2 : 0.8}
          />
        );
      })}

      {/* Nodes */}
      {NODES.map((node, i) => {
        const active = i < activeCount;
        return (
          <g key={i}>
            {active && (
              <circle cx={node.x} cy={node.y} r={8} fill="none" stroke="rgba(36,221,184,0.3)" strokeWidth={1}>
                <animate attributeName="r" values="8;16" dur={`${1.5 + (i % 5) * 0.3}s`} repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.4;0" dur={`${1.5 + (i % 5) * 0.3}s`} repeatCount="indefinite" />
              </circle>
            )}
            <circle
              cx={node.x} cy={node.y}
              r={active ? 4 : 2.5}
              fill={active ? "#24DDB8" : "rgba(92,147,255,0.25)"}
              style={{ transition: "fill 0.5s" }}
            />
          </g>
        );
      })}
    </svg>
  );
}

// ─── SVG Brand Components ─────────────────────────────────────────────────────

interface TTIconFilledProps {
  size: number;
  color: string;
  style?: React.CSSProperties;
  className?: string;
}

function TTIconFilled({ size, color, style, className }: TTIconFilledProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 180.61 180.61"
      fill={color}
      xmlns="http://www.w3.org/2000/svg"
      style={style}
      className={className}
      aria-hidden="true"
    >
      <path d="M171.61,0H9C4.03,0,0,4.03,0,9v162.61c0,4.97,4.03,9,9,9h162.61c4.97,0,9-4.03,9-9V9c0-4.97-4.03-9-9-9ZM138.01,78.32h-30.93v2.4l8.94,6.7c1.15.86,1.83,2.21,1.83,3.65v20.73c0,3.29.57,5.45,1.75,6.62,1.17,1.15,3.34,1.72,6.62,1.72,1.04,0,2.06-.05,3-.13.65-.05,1.3-.13,1.98-.26v12.78c-1.41.21-2.92.34-4.51.42-4.75.21-9.31.18-13.4-.44-2.43-.37-4.59-1.1-6.44-2.16-1.8-1.04-3.23-2.56-4.3-4.49-1.04-1.96-1.59-4.59-1.59-7.77v-36.4c0-1.85-1.51-3.36-3.36-3.36h-31.06v2.4l8.97,6.7c1.15.86,1.83,2.21,1.83,3.64v20.74c0,3.29.57,5.45,1.75,6.62,1.15,1.15,3.31,1.72,6.6,1.72,1.04,0,2.06-.05,3-.13.65-.05,1.3-.13,2.01-.26v12.78c-1.41.21-2.92.34-4.51.42-4.77.21-9.34.18-13.4-.44-2.45-.37-4.59-1.1-6.44-2.16-1.83-1.04-3.26-2.5-4.33-4.49-1.04-1.96-1.56-4.56-1.56-7.77v-36.38c0-1.86-1.53-3.39-3.39-3.39h-14.45v-10.87h21.33c1.44,0,2.61-1.17,2.61-2.61v-17.29h10.8v16.51c0,1.87,1.52,3.39,3.39,3.39h23.73c1.44,0,2.61-1.17,2.61-2.61v-17.29h10.8v16.51c0,1.87,1.52,3.39,3.39,3.39h16.77v10.87Z" />
    </svg>
  );
}

interface TTIconOutlineProps {
  size: number;
  color: string;
  style?: React.CSSProperties;
  className?: string;
}

function TTIconOutline({ size, color, style, className }: TTIconOutlineProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 180.61 180.61"
      fill={color}
      xmlns="http://www.w3.org/2000/svg"
      style={style}
      className={className}
      aria-hidden="true"
    >
      <path fillRule="evenodd" d="M171.61,3.41c3.08,0,5.59,2.51,5.59,5.59v162.61c0,3.08-2.51,5.59-5.59,5.59H9c-3.08,0-5.59-2.51-5.59-5.59V9c0-3.08,2.51-5.59,5.59-5.59h162.61M171.61,0H9C4.03,0,0,4.03,0,9v162.61c0,4.97,4.03,9,9,9h162.61c4.97,0,9-4.03,9-9V9c0-4.97-4.03-9-9-9h0Z" />
      <path d="M107.09,78.32v2.4l8.94,6.7c1.15.86,1.83,2.21,1.83,3.65v20.73c0,3.29.57,5.45,1.75,6.62,1.17,1.15,3.34,1.72,6.62,1.72,1.04,0,2.06-.05,3-.13.65-.05,1.3-.13,1.98-.26v12.78c-1.41.21-2.92.34-4.51.42-4.75.21-9.31.18-13.4-.44-2.43-.37-4.59-1.1-6.44-2.16-1.8-1.04-3.23-2.56-4.3-4.49-1.04-1.96-1.59-4.59-1.59-7.77v-36.4c0-1.85-1.51-3.36-3.36-3.36h-31.06v2.4l8.97,6.7c1.15.86,1.83,2.21,1.83,3.64v20.74c0,3.29.57,5.45,1.75,6.62,1.15,1.15,3.31,1.72,6.6,1.72,1.04,0,2.06-.05,3-.13.65-.05,1.3-.13,2.01-.26v12.78c-1.41.21-2.92.34-4.51.42-4.77.21-9.34.18-13.4-.44-2.45-.37-4.59-1.1-6.44-2.16-1.83-1.04-3.26-2.5-4.33-4.49-1.04-1.96-1.56-4.56-1.56-7.77v-36.38c0-1.86-1.53-3.39-3.39-3.39h-14.45v-10.87h21.33c1.44,0,2.61-1.17,2.61-2.61v-17.29h10.8v16.51c0,1.87,1.52,3.39,3.39,3.39h23.73c1.44,0,2.61-1.17,2.61-2.61v-17.29h10.8v16.51c0,1.87,1.52,3.39,3.39,3.39h16.77v10.87h-30.93Z" />
    </svg>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Mount flag
  useEffect(() => {
    setMounted(true);
  }, []);

  // Locomotive Scroll v5 (dynamic import)
  useEffect(() => {
    let ls: InstanceType<typeof import("locomotive-scroll").default> | null = null;
    import("locomotive-scroll").then(({ default: LocomotiveScroll }) => {
      ls = new LocomotiveScroll({
        lenisOptions: { lerp: 0.07, duration: 1.2, smoothWheel: true },
      });
    });
    return () => {
      ls?.destroy();
    };
  }, []);

  // Scroll progress
  useEffect(() => {
    const onScroll = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (maxScroll > 0) setScrollProgress(window.scrollY / maxScroll);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // IntersectionObserver for reveal animations
  useEffect(() => {
    if (!mounted) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            (e.target as HTMLElement).classList.add("in-view");
          }
        });
      },
      { threshold: 0.12 }
    );
    document.querySelectorAll("[data-reveal], [data-reveal-left]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [mounted]);

  // NetworkViz activation: scrollProgress 0→0.3 maps to 0→1
  const networkActivation = Math.min(1, scrollProgress / 0.3);

  return (
    <div
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#F7F9FF", overflowX: "clip" }}
      className="min-h-screen text-[#0F1F3D]"
    >
      {/* ── Global styles ── */}
      <style>{`
        html { scroll-behavior: smooth; }

        @keyframes fade-up {
          from { opacity: 0; transform: translateY(32px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-left {
          from { opacity: 0; transform: translateX(-30px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @keyframes pulse-node {
          0%, 100% { r: 6; opacity: 0.7; }
          50%       { r: 10; opacity: 0.3; }
        }
        @keyframes float-orb {
          0%, 100% { transform: translateY(0px) scale(1); }
          50%       { transform: translateY(-30px) scale(1.05); }
        }
        @keyframes chip-float {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-5px); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        [data-reveal] {
          opacity: 0;
          transform: translateY(28px);
          transition: opacity 0.8s ease, transform 0.8s ease;
        }
        [data-reveal].in-view {
          opacity: 1;
          transform: translateY(0);
        }
        [data-reveal-left] {
          opacity: 0;
          transform: translateX(-28px);
          transition: opacity 0.8s ease, transform 0.8s ease;
        }
        [data-reveal-left].in-view {
          opacity: 1;
          transform: translateX(0);
        }

        [data-reveal-delay="1"] { transition-delay: 0.1s; }
        [data-reveal-delay="2"] { transition-delay: 0.2s; }
        [data-reveal-delay="3"] { transition-delay: 0.3s; }
        [data-reveal-delay="4"] { transition-delay: 0.4s; }
        [data-reveal-delay="5"] { transition-delay: 0.5s; }
        [data-reveal-delay="6"] { transition-delay: 0.6s; }

        .orb-a { animation: float-orb  9s ease-in-out infinite; }
        .orb-b { animation: float-orb 12s ease-in-out infinite 2s; }
        .chip-1 { animation: chip-float 3.2s ease-in-out infinite; }
        .chip-2 { animation: chip-float 3.8s ease-in-out infinite 0.6s; }
        .chip-3 { animation: chip-float 2.9s ease-in-out infinite 1.2s; }

        /* Hover glow for module cards */
        .module-card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .module-card:hover { transform: translateY(-3px); box-shadow: 0 12px 40px rgba(92,147,255,0.1); }

        /* Feature card left accent */
        .feature-card { border-left: 2px solid rgba(36,221,184,0.4); }

        /* Nav link hover */
        .nav-link { transition: color 0.15s; }
        .nav-link:hover { color: #0F1F3D; }

        /* CTA button hover */
        .btn-primary { transition: filter 0.2s, transform 0.2s; }
        .btn-primary:hover { filter: brightness(1.08); transform: translateY(-1px); }

        .nav-blur {
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }

      `}</style>

      {/* ══════════════════════════════════════
          NAV
      ══════════════════════════════════════ */}
      <nav
        className="nav-blur fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-10 h-16"
        style={{ background: "rgba(247,249,255,0.92)", borderBottom: "1px solid rgba(92,147,255,0.12)" }}
      >
        {/* Logo */}
        <Link href="/" className="select-none">
          <span
            style={{
              color: "#5C93FF",
              fontWeight: 800,
              fontSize: "20px",
              fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
              letterSpacing: "-0.04em",
            }}
          >
            stratt
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          <Link
            href="#modules"
            className="nav-link text-sm font-medium"
            style={{ color: "#637089" }}
          >
            Modules
          </Link>
          <Link
            href="#features"
            className="nav-link text-sm font-medium"
            style={{ color: "#637089" }}
          >
            Fonctionnalités
          </Link>
          <Link
            href="/login"
            className="nav-link text-sm font-medium"
            style={{ color: "#637089" }}
          >
            Se connecter
          </Link>
        </div>

        {/* CTA */}
        <Link
          href="/signup"
          className="btn-primary hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
          style={{ background: "#24DDB8", color: "#09111E" }}
        >
          Essayer gratuitement
        </Link>
      </nav>

      {/* ══════════════════════════════════════
          HERO
      ══════════════════════════════════════ */}
      <section
        className="relative hero-grid flex flex-col items-center justify-center text-center overflow-hidden pt-32 pb-0"
        style={{ minHeight: "100vh", background: "#F7F9FF" }}
      >

        {/* TTIconOutline watermark — centered absolute */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            opacity: 0.045,
            zIndex: 1,
          }}
        >
          <TTIconOutline size={520} color="#00000" />
        </div>

        {/* Foreground content */}
        <div className="relative z-10 max-w-4xl mx-auto px-6 flex flex-col items-center gap-6">
          {/* Badge */}
          <div
            className="chip-1 inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold"
            style={{
              background: "rgba(36,221,184,0.1)",
              border: "1px solid rgba(36,221,184,0.35)",
              color: "#24DDB8",
              animation: "fade-in 0.6s ease both",
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#24DDB8", display: "inline-block" }} />
            Achat Public · Marchés Publics
          </div>

          {/* H1 */}
          <h1
            style={{
              fontSize: "clamp(2.4rem, 6vw, 4.2rem)",
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              animation: "fade-in 0.7s 0.1s ease both",
              opacity: 0,
            }}
          >
            La plateforme{" "}
            <Highlight variant="mark" color="blue">intelligente</Highlight>
            <br />
            pour l&apos;achat public.
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontSize: "clamp(1rem, 2vw, 1.2rem)",
              color: "#637089",
              maxWidth: "600px",
              lineHeight: 1.6,
              animation: "fade-in 0.7s 0.22s ease both",
              opacity: 0,
            }}
          >
            Centralisez vos achats, contrats et fournisseurs dans une plateforme
            unifiée alimentée par l&apos;IA Claude.
          </p>

          {/* CTAs */}
          <div
            className="flex flex-col sm:flex-row items-center gap-3"
            style={{ animation: "fade-in 0.7s 0.34s ease both", opacity: 0 }}
          >
            <Link
              href="/signup"
              className="btn-primary inline-flex items-center gap-2 px-6 py-3 rounded-xl text-base font-bold"
              style={{ background: "#24DDB8", color: "#09111E" }}
            >
              Démarrer gratuitement
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="16" height="16"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-base font-semibold transition-all hover:-translate-y-0.5"
              style={{ border: "1px solid rgba(92,147,255,0.35)", color: "#0F1F3D", background: "rgba(92,147,255,0.05)" }}
            >
              Voir la démo
            </Link>
          </div>

          {/* Demo credentials */}
          <div
            className="inline-flex items-center gap-3 px-4 py-2 rounded-lg text-xs"
            style={{
              background: "rgba(255,255,255,0.8)",
              border: "1px solid rgba(92,147,255,0.18)",
              color: "#637089",
              animation: "fade-in 0.7s 0.46s ease both",
              opacity: 0,
            }}
          >
            <span>Démo :</span>
            <code style={{ color: "#5C93FF", fontFamily: "monospace" }}>admin@stratt.io</code>
            <span style={{ color: "rgba(186,186,186,0.4)" }}>/</span>
            <code style={{ color: "#5C93FF", fontFamily: "monospace" }}>admin1234</code>
          </div>

          {/* Social proof */}
          <div
            className="flex items-center gap-3 text-xs"
            style={{
              color: "#637089",
              animation: "fade-in 0.7s 0.56s ease both",
              opacity: 0,
            }}
          >
            <div className="flex items-center gap-1">
              {["#5C93FF", "#24DDB8", "#5C93FF", "#F59E0B"].map((c, i) => (
                <span
                  key={i}
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: c,
                    display: "inline-block",
                    border: "1.5px solid rgba(247,249,255,0.9)",
                    marginLeft: i > 0 ? -3 : 0,
                  }}
                />
              ))}
            </div>
            <span>Rejoignez 500+ organisations</span>
          </div>
        </div>

        {/* NetworkViz — hero base visual */}
        <div className="relative z-10 w-full mt-12" style={{ height: 360 }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(247,249,255,0.4)",
              pointerEvents: "none",
              zIndex: 2,
            }}
          />
          {mounted && (
            <NetworkViz
              activationLevel={networkActivation}
              height={360}
              className="w-full"
            />
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════
          MARQUEE DIVIDER
      ══════════════════════════════════════ */}
      <div
        style={{
          background: "rgba(237,242,255,0.9)",
          borderTop: "1px solid rgba(92,147,255,0.12)",
          borderBottom: "1px solid rgba(92,147,255,0.12)",
          overflow: "hidden",
          padding: "14px 0",
        }}
      >
        <div
          style={{
            display: "flex",
            whiteSpace: "nowrap",
            animation: "marquee 28s linear infinite",
            width: "max-content",
          }}
        >
          {[0, 1].map((rep) => (
            <span key={rep} style={{ display: "inline-flex", alignItems: "center" }}>
              {[
                "stratt", "ERP", "CRM", "Achats", "Comptabilité",
                "Analytics", "RH", "Facturation",
              ].map((item, i) => (
                <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", marginRight: "2.5rem" }}>
                  {item === "stratt" ? (
                    <TTIconFilled size={12} color="#24DDB8" style={{ flexShrink: 0 }} />
                  ) : (
                    <span style={{ color: "#24DDB8", fontSize: "0.6rem" }}>◆</span>
                  )}
                  <span
                    style={{
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: item === "stratt" ? "#5C93FF" : "#637089",
                    }}
                  >
                    {item}
                  </span>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════
          STATS
      ══════════════════════════════════════ */}
      <section
        className="py-24 px-6"
        style={{
          background: "#F7F9FF",
          borderTop: "1px solid rgba(92,147,255,0.1)",
          borderBottom: "1px solid rgba(92,147,255,0.1)",
        }}
      >
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              data-reveal
              data-reveal-delay={String(i + 1)}
              className="flex flex-col items-center gap-2 text-center"
            >
              <span
                style={{
                  fontSize: "clamp(2.2rem, 5vw, 3.2rem)",
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                  color: "#5C93FF",
                }}
              >
                {stat.value}
              </span>
              <span
                style={{
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "#637089",
                }}
              >
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════
          MODULES
      ══════════════════════════════════════ */}
      <section id="modules" className="relative py-24 px-6" style={{ background: "#F7F9FF" }}>
        {/* Background TTIconOutline watermark */}
        <div
          className="absolute pointer-events-none"
          style={{ bottom: 0, right: 0, opacity: 0.03, zIndex: 0 }}
        >
          <TTIconOutline size={200} color="#5C93FF" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto">
          {/* Section header */}
          <div className="flex flex-col items-center text-center gap-4 mb-16">
            <div
              data-reveal
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold"
              style={{
                background: "rgba(92,147,255,0.1)",
                border: "1px solid rgba(92,147,255,0.3)",
                color: "#5C93FF",
              }}
            >
              7 modules intégrés
            </div>
            <h2
              data-reveal
              data-reveal-delay="1"
              style={{
                fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
                fontWeight: 800,
                letterSpacing: "-0.025em",
                lineHeight: 1.15,
              }}
            >
              Tout ce dont votre{" "}
              <Highlight variant="box" color="blue">organisation a besoin</Highlight>
            </h2>
            <p
              data-reveal
              data-reveal-delay="2"
              style={{ color: "#637089", maxWidth: "520px", lineHeight: 1.6 }}
            >
              Des modules pensés pour l&apos;achat public, intégrés nativement pour
              une expérience fluide et cohérente.
            </p>
          </div>

          {/* Cards grid — module instruments */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {modules.map((mod, i) => (
              <div
                key={mod.id}
                data-reveal
                data-reveal-delay={String((i % 6) + 1)}
                className="module-card rounded-2xl flex flex-col overflow-hidden relative"
                style={{
                  background: "#FFFFFF",
                  border: `1px solid rgba(92,147,255,0.12)`,
                  boxShadow: "0 1px 4px rgba(30,50,80,0.06)",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = `${mod.color}40`;
                  el.style.transform = "translateY(-3px)";
                  el.style.boxShadow = `0 12px 36px ${mod.color}18`;
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = "rgba(92,147,255,0.12)";
                  el.style.transform = "translateY(0)";
                  el.style.boxShadow = "0 1px 4px rgba(30,50,80,0.06)";
                }}
              >
                {/* Tinted header zone */}
                <div
                  className="px-5 pt-5 pb-4 relative overflow-hidden"
                  style={{ background: `${mod.color}08` }}
                >
                  {/* Card index watermark */}
                  <span style={{
                    position: "absolute", top: 10, right: 14,
                    fontSize: "0.65rem", fontFamily: "monospace", fontWeight: 700,
                    color: `${mod.color}30`, letterSpacing: "0.06em",
                  }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>

                  <div
                    className="flex items-center justify-center w-11 h-11 rounded-[12px]"
                    style={{ background: `${mod.color}1C`, border: `1px solid ${mod.color}28`, color: mod.color }}
                  >
                    {mod.icon}
                  </div>

                  {/* Ghost icon background */}
                  <div className="absolute right-0 bottom-0 pointer-events-none" style={{ color: mod.color, opacity: 0.07 }}>
                    <div style={{ transform: "translate(20%, 20%) scale(2.2)" }}>
                      {mod.icon}
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div style={{ height: 1, background: `${mod.color}30` }} />

                {/* Content */}
                <div className="px-5 py-4 flex flex-col gap-2 flex-1">
                  <p style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0F1F3D" }}>{mod.name}</p>
                  <p style={{ fontSize: "0.82rem", color: "#637089", lineHeight: 1.5 }}>{mod.description}</p>

                  <div className="mt-auto pt-2">
                    <span
                      className="inline-flex items-center gap-1 text-xs font-bold"
                      style={{ color: mod.color }}
                    >
                      Explorer →
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Roadmap — modules à venir ── */}
          <div className="mt-16">
            <div
              data-reveal
              className="flex flex-col items-center text-center gap-3 mb-8"
            >
              <div
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold"
                style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)", color: "#8B5CF6" }}
              >
                Roadmap produit
              </div>
              <h3
                style={{ fontSize: "clamp(1.2rem, 3vw, 1.6rem)", fontWeight: 800, letterSpacing: "-0.02em", color: "#0F1F3D" }}
              >
                Prochainement disponible
              </h3>
              <p style={{ color: "#637089", fontSize: "0.875rem", maxWidth: "440px", lineHeight: 1.6 }}>
                Stratt évolue en continu. Voici les modules en cours de développement.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
              {roadmapModules.map((mod, i) => (
                <div
                  key={mod.name}
                  data-reveal
                  data-reveal-delay={String((i % 5) + 1)}
                  className="rounded-xl px-4 py-4 flex items-center gap-3 relative overflow-hidden"
                  style={{
                    background: "rgba(255,255,255,0.6)",
                    border: "1px solid rgba(92,147,255,0.1)",
                    opacity: 0.85,
                  }}
                >
                  {/* Color dot */}
                  <div
                    className="w-8 h-8 rounded-[10px] flex items-center justify-center flex-shrink-0"
                    style={{ background: `${mod.color}10`, border: `1px solid ${mod.color}20` }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: mod.color, display: "inline-block" }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p style={{ fontSize: "0.82rem", fontWeight: 700, color: "#0F1F3D" }}>{mod.name}</p>
                    <p style={{ fontSize: "0.72rem", color: "#637089", marginTop: 2 }}>{mod.description}</p>
                  </div>

                  {/* ETA badge */}
                  <span
                    className="text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ background: `${mod.color}12`, color: mod.color, border: `1px solid ${mod.color}20` }}
                  >
                    {mod.eta}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          FEATURES
      ══════════════════════════════════════ */}
      <section id="features" className="py-24 px-6" style={{ background: "#EEF3FF" }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-16 items-start">
            {/* Left — sticky brand + tagline */}
            <div className="lg:w-5/12 flex flex-col gap-6 lg:sticky lg:top-24">
              {/* Prominent TTIconOutline brand element */}
              <div data-reveal-left>
                <TTIconOutline size={220} color="#24DDB8" style={{ opacity: 0.9 }} />
              </div>

              <div
                data-reveal-left
                data-reveal-delay="1"
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold w-fit"
                style={{
                  background: "rgba(36,221,184,0.08)",
                  border: "1px solid rgba(36,221,184,0.3)",
                  color: "#24DDB8",
                }}
              >
                Architecture
              </div>
              <h2
                data-reveal-left
                data-reveal-delay="2"
                style={{
                  fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
                  fontWeight: 800,
                  lineHeight: 1.15,
                  letterSpacing: "-0.025em",
                }}
              >
                Conçu pour{" "}
                <Highlight variant="mark" color="teal">la performance</Highlight>
              </h2>
              <p
                data-reveal-left
                data-reveal-delay="3"
                style={{ color: "#637089", lineHeight: 1.7, maxWidth: "440px" }}
              >
                Architecture cloud-native, sécurité enterprise et intégration IA
                pour que vos équipes se concentrent sur l&apos;essentiel.
              </p>

              {/* Stat pills */}
              <div
                data-reveal-left
                data-reveal-delay="4"
                className="flex flex-wrap gap-2"
              >
                {["99.9% uptime", "SOC2", "RGPD"].map((pill) => (
                  <span
                    key={pill}
                    className="px-3 py-1 rounded-full text-xs font-semibold"
                    style={{
                      border: "1px solid rgba(36,221,184,0.25)",
                      color: "#24DDB8",
                      background: "rgba(36,221,184,0.06)",
                    }}
                  >
                    {pill}
                  </span>
                ))}
              </div>
            </div>

            {/* Right — feature cards */}
            <div className="lg:w-7/12 flex flex-col gap-5">
              {features.map((feat, i) => (
                <div
                  key={feat.title}
                  data-reveal
                  data-reveal-delay={String(i + 1)}
                  className="feature-card rounded-2xl p-6 flex flex-col gap-3"
                  style={{
                    background: "rgba(255,255,255,0.85)",
                    border: "1px solid rgba(92,147,255,0.14)",
                    paddingLeft: "1.75rem",
                  }}
                >
                  <div
                    className="flex items-center justify-center w-9 h-9 rounded-lg"
                    style={{ background: "rgba(36,221,184,0.1)", color: "#24DDB8" }}
                  >
                    {feat.icon}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: "1rem" }}>{feat.title}</div>
                  <div style={{ color: "#637089", fontSize: "0.875rem", lineHeight: 1.6 }}>
                    {feat.description}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          TECH STACK
      ══════════════════════════════════════ */}
      <section className="py-16 px-6" style={{ background: "#F7F9FF" }}>
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-8">
          <p
            data-reveal
            style={{
              fontSize: "0.72rem",
              fontWeight: 600,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "#637089",
              fontFamily: "monospace",
            }}
          >
            Stack technique
          </p>
          <div
            data-reveal
            data-reveal-delay="1"
            className="flex flex-wrap justify-center gap-3"
          >
            {[
              { label: "Next.js 15", color: "#0F1F3D" },
              { label: "Go 1.24", color: "#5C93FF" },
              { label: "PostgreSQL 16", color: "#24DDB8" },
              { label: "Redis", color: "#5C93FF" },
              { label: "Claude AI", color: "#F59E0B" },
              { label: "Docker", color: "#5C93FF" },
            ].map((tech) => (
              <span
                key={tech.label}
                className="px-4 py-1.5 rounded-full text-sm font-semibold"
                style={{
                  border: `1px solid ${tech.color}33`,
                  color: tech.color,
                  background: `${tech.color}0D`,
                  letterSpacing: "0.02em",
                }}
              >
                {tech.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          CTA BANNER
      ══════════════════════════════════════ */}
      <section className="py-24 px-6" style={{ background: "#F7F9FF" }}>
        <div className="max-w-4xl mx-auto">
          <div
            data-reveal
            className="relative rounded-3xl p-12 md:p-16 flex flex-col items-center text-center gap-8 overflow-hidden cta-grid"
            style={{
              background: "#FFFFFF",
              border: "1px solid rgba(36,221,184,0.18)",
            }}
          >

            {/* TTIconFilled in glowing container */}
            <div
              className="relative z-10 flex items-center justify-center w-20 h-20 rounded-2xl"
              style={{
                background: "rgba(36,221,184,0.1)",
                border: "1px solid rgba(36,221,184,0.3)",
                boxShadow: "0 0 32px rgba(36,221,184,0.15)",
              }}
            >
              <span style={{ fontSize: "22px", fontWeight: 800, color: "#24DDB8", letterSpacing: "-0.03em" }}>tt</span>
            </div>

            {/* StrattWordmark */}
            <div className="relative z-10">
              <span style={{
                color: "#5C93FF",
                fontWeight: 800,
                fontSize: "36px",
                fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
                letterSpacing: "-0.04em",
              }}>stratt</span>
            </div>

            <h2
              className="relative z-10"
              style={{
                fontSize: "clamp(1.8rem, 4vw, 2.6rem)",
                fontWeight: 800,
                letterSpacing: "-0.025em",
                lineHeight: 1.2,
              }}
            >
              Prêt à transformer votre{" "}
              <Highlight variant="underline" color="teal">gestion&nbsp;?</Highlight>
            </h2>

            <p
              className="relative z-10"
              style={{ color: "#637089", maxWidth: "460px", lineHeight: 1.7 }}
            >
              Rejoignez plus de 500 organisations qui font confiance à Stratt
              pour piloter leurs achats publics avec efficacité et transparence.
            </p>

            <div className="relative z-10 flex flex-col sm:flex-row items-center gap-3">
              <Link
                href="/signup"
                className="btn-primary inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-base font-bold"
                style={{ background: "#24DDB8", color: "#09111E" }}
              >
                Démarrer gratuitement
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-base font-semibold transition-all hover:-translate-y-0.5"
                style={{ border: "1px solid rgba(15,31,61,0.2)", color: "#0F1F3D" }}
              >
                Compte démo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          FOOTER
      ══════════════════════════════════════ */}
      <footer
        className="py-10 px-6 flex flex-col md:flex-row items-center justify-between gap-6"
        style={{
          borderTop: "1px solid rgba(92,147,255,0.12)",
          background: "#EEF3FF",
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <span style={{
            color: "#5C93FF",
            fontWeight: 800,
            fontSize: "18px",
            letterSpacing: "-0.04em",
          }}>stratt</span>
        </div>

        {/* Links */}
        <nav className="flex items-center gap-6">
          {[
            { label: "Confidentialité", href: "#" },
            { label: "CGU", href: "#" },
            { label: "Documentation", href: "#" },
          ].map((l) => (
            <a
              key={l.label}
              href={l.href}
              style={{ color: "#637089", fontSize: "0.8rem" }}
              className="hover:text-[#0F1F3D] transition-colors"
            >
              {l.label}
            </a>
          ))}
        </nav>

        {/* Copyright */}
        <p style={{ color: "#637089", fontSize: "0.78rem" }}>
          © {new Date().getFullYear()} Stratt. Tous droits réservés.
        </p>
      </footer>
    </div>
  );
}

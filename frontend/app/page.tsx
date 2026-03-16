"use client";

import { useEffect, useState } from "react";

// ─── Data ────────────────────────────────────────────────────────────────────

const modules = [
  {
    id: "crm",
    name: "CRM",
    description: "Contacts, leads et opportunités",
    color: "#5C93FF",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    id: "accounting",
    name: "Comptabilité",
    description: "Comptes, transactions, rapports",
    color: "#10B981",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
        <rect x="4" y="2" width="16" height="20" rx="2" /><line x1="8" y1="6" x2="16" y2="6" /><line x1="8" y1="10" x2="16" y2="10" /><line x1="8" y1="14" x2="12" y2="14" />
      </svg>
    ),
  },
  {
    id: "billing",
    name: "Facturation",
    description: "Devis, factures, paiements",
    color: "#F59E0B",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    id: "inventory",
    name: "Inventaire",
    description: "Stocks, produits, mouvements",
    color: "#6366F1",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    ),
  },
  {
    id: "hr",
    name: "RH",
    description: "Employés, congés, paie",
    color: "#EC4899",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
        <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    ),
  },
  {
    id: "procurement",
    name: "Achats",
    description: "Commandes fournisseurs",
    color: "#8B5CF6",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
        <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
    ),
  },
  {
    id: "analytics",
    name: "Analytics",
    description: "Tableaux de bord temps réel",
    color: "#06B6D4",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
        <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
];

const features = [
  {
    title: "Multi-tenant sécurisé",
    description:
      "RBAC granulaire par organisation. Isolation des données garantie avec Row-Level Security PostgreSQL.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
  },
  {
    title: "IA intégrée",
    description:
      "Agents Claude pour automatiser vos workflows — analyse, génération documentaire et recommandations intelligentes.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
        <circle cx="12" cy="12" r="3" /><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
      </svg>
    ),
  },
  {
    title: "API-first",
    description:
      "Intégrez vos outils existants facilement. REST API complète avec authentification JWT et documentation OpenAPI.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
        <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
      </svg>
    ),
  },
];

const stats = [
  { value: "500+", label: "Organisations" },
  { value: "99.9%", label: "Disponibilité" },
  { value: "7", label: "Modules" },
  { value: "24/7", label: "Support" },
];

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
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#09111E", overflowX: "clip" }}
      className="min-h-screen text-[#F0F4FF]"
    >
      {/* ── Global styles ── */}
      <style>{`
        html { scroll-behavior: auto !important; }

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

        .text-gradient-hero {
          background: linear-gradient(135deg, #5C93FF, #24DDB8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .module-card {
          transition: transform 0.22s ease, box-shadow 0.22s ease;
        }
        .module-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 48px rgba(92,147,255,0.12);
        }

        .hero-grid {
          background-image:
            linear-gradient(rgba(92,147,255,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(92,147,255,0.05) 1px, transparent 1px);
          background-size: 60px 60px;
        }

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
        style={{ background: "rgba(9,17,30,0.8)", borderBottom: "1px solid rgba(92,147,255,0.08)" }}
      >
        {/* Logo — text mark */}
        <a href="/" className="flex items-center gap-2 select-none">
          <span
            style={{
              fontWeight: 800,
              fontSize: "1.25rem",
              letterSpacing: "-0.02em",
              background: "linear-gradient(135deg, #5C93FF, #24DDB8)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            stratt
          </span>
          <span
            style={{
              fontSize: "0.6rem",
              fontWeight: 600,
              letterSpacing: "0.12em",
              color: "#24DDB8",
              border: "1px solid rgba(36,221,184,0.4)",
              borderRadius: "4px",
              padding: "1px 5px",
              lineHeight: 1.6,
            }}
          >
            ERP
          </span>
        </a>

        {/* Links */}
        <div className="hidden md:flex items-center gap-8">
          {["Modules", "Fonctionnalités", "Se connecter"].map((l) => (
            <a
              key={l}
              href="#"
              style={{ color: "#BABABA", fontSize: "0.875rem", fontWeight: 500 }}
              className="hover:text-[#F0F4FF] transition-colors"
            >
              {l}
            </a>
          ))}
        </div>

        {/* CTA */}
        <a
          href="#"
          className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:brightness-110"
          style={{ background: "#24DDB8", color: "#09111E" }}
        >
          Essayer gratuitement
        </a>
      </nav>

      {/* ══════════════════════════════════════
          HERO
      ══════════════════════════════════════ */}
      <section
        className="relative hero-grid flex flex-col items-center justify-center text-center overflow-hidden pt-32 pb-0"
        style={{ minHeight: "100vh", background: "#09111E" }}
      >
        {/* Orbs */}
        <div
          className="orb-a absolute pointer-events-none"
          style={{
            top: "-10%",
            left: "-8%",
            width: "600px",
            height: "600px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(92,147,255,0.18) 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />
        <div
          className="orb-b absolute pointer-events-none"
          style={{
            bottom: "5%",
            right: "-5%",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(36,221,184,0.14) 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />

        {/* Content */}
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
            <span className="text-gradient-hero">intelligente</span>
            <br />
            pour l'achat public.
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontSize: "clamp(1rem, 2vw, 1.2rem)",
              color: "#BABABA",
              maxWidth: "600px",
              lineHeight: 1.6,
              animation: "fade-in 0.7s 0.22s ease both",
              opacity: 0,
            }}
          >
            Stratt ERP centralise vos achats, contrats, fournisseurs et
            dépenses dans une plateforme unifiée pensée pour les acheteurs
            publics.
          </p>

          {/* CTAs */}
          <div
            className="flex flex-col sm:flex-row items-center gap-3"
            style={{ animation: "fade-in 0.7s 0.34s ease both", opacity: 0 }}
          >
            <a
              href="#"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-base font-bold transition-all hover:brightness-110 hover:-translate-y-0.5"
              style={{ background: "#24DDB8", color: "#09111E" }}
            >
              Démarrer gratuitement
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="16" height="16"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </a>
            <a
              href="#"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-base font-semibold transition-all hover:-translate-y-0.5"
              style={{ border: "1px solid rgba(92,147,255,0.35)", color: "#F0F4FF", background: "rgba(92,147,255,0.05)" }}
            >
              Voir la démo
            </a>
          </div>

          {/* Demo credentials badge */}
          <div
            className="inline-flex items-center gap-3 px-4 py-2 rounded-lg text-xs"
            style={{
              background: "rgba(9,17,30,0.7)",
              border: "1px solid rgba(92,147,255,0.15)",
              color: "#BABABA",
              animation: "fade-in 0.7s 0.46s ease both",
              opacity: 0,
            }}
          >
            <span>Démo :</span>
            <code style={{ color: "#5C93FF", fontFamily: "monospace" }}>demo@stratt.fr</code>
            <span style={{ color: "rgba(186,186,186,0.4)" }}>/</span>
            <code style={{ color: "#5C93FF", fontFamily: "monospace" }}>demo1234</code>
          </div>
        </div>

        {/* NetworkViz — hero base visual */}
        <div className="relative z-10 w-full mt-12" style={{ height: 400 }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to bottom, transparent 0%, rgba(9,17,30,0.6) 100%)",
              pointerEvents: "none",
              zIndex: 2,
            }}
          />
          {mounted && (
            <NetworkViz
              activationLevel={networkActivation}
              height={400}
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
          background: "rgba(14,25,41,0.9)",
          borderTop: "1px solid rgba(92,147,255,0.08)",
          borderBottom: "1px solid rgba(92,147,255,0.08)",
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
                  <span style={{ color: "#24DDB8", fontSize: "0.6rem" }}>◆</span>
                  <span
                    style={{
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: item === "stratt" ? "#5C93FF" : "#BABABA",
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
      <section className="py-24 px-6" style={{ background: "#09111E" }}>
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
                  background: "linear-gradient(135deg, #5C93FF, #24DDB8)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
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
                  color: "#BABABA",
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
      <section className="py-24 px-6" style={{ background: "#09111E" }}>
        <div className="max-w-6xl mx-auto">
          {/* Header */}
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
              style={{
                fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
                fontWeight: 800,
                letterSpacing: "-0.025em",
                lineHeight: 1.15,
              }}
            >
              Tout ce dont votre{" "}
              <span className="text-gradient-hero">organisation a besoin</span>
            </h2>
            <p data-reveal style={{ color: "#BABABA", maxWidth: "520px", lineHeight: 1.6 }}>
              Des modules pensés pour l'achat public, intégrés nativement pour
              une expérience fluide et cohérente.
            </p>
          </div>

          {/* Cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {modules.map((mod, i) => (
              <div
                key={mod.id}
                data-reveal
                data-reveal-delay={String((i % 6) + 1)}
                className="module-card rounded-2xl p-6 flex flex-col gap-4"
                style={{
                  background: "#0E1929",
                  border: "1px solid rgba(92,147,255,0.1)",
                }}
              >
                <div
                  className="flex items-center justify-center w-10 h-10 rounded-xl"
                  style={{ background: `${mod.color}1A`, color: mod.color }}
                >
                  {mod.icon}
                </div>
                <div>
                  <div
                    style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "4px" }}
                  >
                    {mod.name}
                  </div>
                  <div style={{ fontSize: "0.875rem", color: "#BABABA", lineHeight: 1.5 }}>
                    {mod.description}
                  </div>
                </div>
                <div className="mt-auto">
                  <a
                    href="#"
                    className="inline-flex items-center gap-1 text-xs font-semibold transition-colors hover:opacity-80"
                    style={{ color: mod.color }}
                  >
                    En savoir plus
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          FEATURES
      ══════════════════════════════════════ */}
      <section className="py-24 px-6" style={{ background: "#0A1422" }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            {/* Left — tagline */}
            <div className="flex flex-col gap-6 lg:sticky lg:top-24">
              <div
                data-reveal-left
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold w-fit"
                style={{
                  background: "rgba(36,221,184,0.08)",
                  border: "1px solid rgba(36,221,184,0.3)",
                  color: "#24DDB8",
                }}
              >
                Plateforme
              </div>
              <h2
                data-reveal-left
                data-reveal-delay="1"
                style={{
                  fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
                  fontWeight: 800,
                  lineHeight: 1.15,
                  letterSpacing: "-0.025em",
                }}
              >
                Conçu pour{" "}
                <span className="text-gradient-hero">la performance</span>
                <br />
                à grande échelle.
              </h2>
              <p
                data-reveal-left
                data-reveal-delay="2"
                style={{ color: "#BABABA", lineHeight: 1.7, maxWidth: "440px" }}
              >
                Architecture cloud-native, sécurité enterprise et intégration IA
                pour que vos équipes se concentrent sur l'essentiel.
              </p>
            </div>

            {/* Right — feature cards */}
            <div className="flex flex-col gap-5">
              {features.map((feat, i) => (
                <div
                  key={feat.title}
                  data-reveal
                  data-reveal-delay={String(i + 1)}
                  className="rounded-2xl p-6 flex flex-col gap-3"
                  style={{
                    background: "rgba(14,25,41,0.8)",
                    border: "1px solid rgba(92,147,255,0.1)",
                    transition: "border-color 0.2s, box-shadow 0.2s",
                  }}
                >
                  <div
                    className="flex items-center justify-center w-9 h-9 rounded-lg"
                    style={{ background: "rgba(36,221,184,0.1)", color: "#24DDB8" }}
                  >
                    {feat.icon}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: "1rem" }}>{feat.title}</div>
                  <div style={{ color: "#BABABA", fontSize: "0.875rem", lineHeight: 1.6 }}>
                    {feat.description}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* NetworkViz mini */}
          <div className="mt-20" data-reveal>
            <div
              className="relative overflow-hidden rounded-2xl"
              style={{
                border: "1px solid rgba(36,221,184,0.12)",
                background: "rgba(9,17,30,0.6)",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(to right, rgba(9,17,30,0.7) 0%, transparent 30%, transparent 70%, rgba(9,17,30,0.7) 100%)",
                  pointerEvents: "none",
                  zIndex: 2,
                }}
              />
              {mounted && (
                <NetworkViz activationLevel={0.7} height={220} className="w-full" />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          TECH STACK
      ══════════════════════════════════════ */}
      <section className="py-20 px-6" style={{ background: "#09111E" }}>
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-8">
          <p
            data-reveal
            style={{
              fontSize: "0.72rem",
              fontWeight: 600,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "#BABABA",
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
              { label: "Next.js 15", color: "#F0F4FF" },
              { label: "Go 1.24", color: "#5C93FF" },
              { label: "PostgreSQL 16", color: "#24DDB8" },
              { label: "Redis", color: "#EC4899" },
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
      <section className="py-24 px-6" style={{ background: "#09111E" }}>
        <div className="max-w-4xl mx-auto">
          <div
            data-reveal
            className="relative rounded-3xl p-12 md:p-16 flex flex-col items-center text-center gap-8 overflow-hidden"
            style={{
              background: "#0E1929",
              border: "1px solid rgba(36,221,184,0.18)",
              backgroundImage:
                "linear-gradient(rgba(92,147,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(92,147,255,0.04) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          >
            {/* Green glow */}
            <div
              style={{
                position: "absolute",
                bottom: "-40%",
                left: "50%",
                transform: "translateX(-50%)",
                width: "500px",
                height: "300px",
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(36,221,184,0.12) 0%, transparent 70%)",
                filter: "blur(40px)",
                pointerEvents: "none",
              }}
            />

            {/* Logo mark */}
            <div
              className="relative z-10 flex items-center justify-center w-16 h-16 rounded-2xl"
              style={{ background: "rgba(36,221,184,0.12)", border: "1px solid rgba(36,221,184,0.3)" }}
            >
              <span
                style={{
                  fontWeight: 900,
                  fontSize: "1.4rem",
                  letterSpacing: "-0.03em",
                  background: "linear-gradient(135deg, #5C93FF, #24DDB8)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                tt
              </span>
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
              <span className="text-gradient-hero">gestion&nbsp;?</span>
            </h2>

            <p
              className="relative z-10"
              style={{ color: "#BABABA", maxWidth: "460px", lineHeight: 1.7 }}
            >
              Rejoignez plus de 500 organisations qui font confiance à Stratt
              pour piloter leurs achats publics avec efficacité et transparence.
            </p>

            <div className="relative z-10 flex flex-col sm:flex-row items-center gap-3">
              <a
                href="#"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-base font-bold transition-all hover:brightness-110 hover:-translate-y-0.5"
                style={{ background: "#24DDB8", color: "#09111E" }}
              >
                Démarrer gratuitement
              </a>
              <a
                href="#"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-base font-semibold transition-all hover:-translate-y-0.5"
                style={{ border: "1px solid rgba(240,244,255,0.15)", color: "#F0F4FF" }}
              >
                Contacter les ventes
              </a>
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
          borderTop: "1px solid rgba(92,147,255,0.08)",
          background: "#09111E",
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2">
          <span
            style={{
              fontWeight: 800,
              fontSize: "1.1rem",
              letterSpacing: "-0.02em",
              background: "linear-gradient(135deg, #5C93FF, #24DDB8)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            stratt
          </span>
          <span
            style={{
              fontSize: "0.58rem",
              fontWeight: 600,
              letterSpacing: "0.12em",
              color: "#BABABA",
              border: "1px solid rgba(186,186,186,0.25)",
              borderRadius: "4px",
              padding: "1px 4px",
            }}
          >
            ERP
          </span>
        </div>

        {/* Links */}
        <nav className="flex items-center gap-6">
          {["Confidentialité", "CGU", "Documentation"].map((l) => (
            <a
              key={l}
              href="#"
              style={{ color: "#BABABA", fontSize: "0.8rem" }}
              className="hover:text-[#F0F4FF] transition-colors"
            >
              {l}
            </a>
          ))}
        </nav>

        {/* Copyright */}
        <p style={{ color: "#BABABA", fontSize: "0.78rem" }}>
          © {new Date().getFullYear()} Stratt. Tous droits réservés.
        </p>
      </footer>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

// ─── Data ───────────────────────────────────────────────────────────────────

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

// ─── Globe Component ─────────────────────────────────────────────────────────

interface GlobeProps {
  rotation: number;
}

function WireframeGlobe({ rotation }: GlobeProps) {
  const cx = 260;
  const cy = 260;
  const r = 200;
  const baseLongitudes = [-75, -45, -15, 0, 15, 45, 75];
  const latitudes = [-60, -30, 0, 30, 60];

  // City dots: [lon, lat, label]
  const cities: [number, number, string][] = [
    [2, 48.8, "Paris"],
    [37.6, 55.7, "Moscow"],
    [-43.2, -22.9, "Rio"],
  ];

  function projectCity(lon: number, lat: number): { x: number; y: number; visible: boolean } {
    const effLon = ((lon + rotation) * Math.PI) / 180;
    const latRad = (lat * Math.PI) / 180;
    const cosLon = Math.cos(effLon);
    const sinLon = Math.sin(effLon);
    const cosLat = Math.cos(latRad);
    const sinLat = Math.sin(latRad);
    const x3d = cosLat * sinLon;
    const y3d = sinLat;
    const z3d = cosLat * cosLon;
    return {
      x: cx + r * x3d,
      y: cy - r * y3d,
      visible: z3d >= 0,
    };
  }

  return (
    <svg
      width="520"
      height="520"
      viewBox="0 0 520 520"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block" }}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="globeGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(92,147,255,0.08)" />
          <stop offset="60%" stopColor="rgba(9,17,30,0.6)" />
          <stop offset="100%" stopColor="rgba(9,17,30,0)" />
        </radialGradient>
        <radialGradient id="globeCoreBg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(36,221,184,0.04)" />
          <stop offset="100%" stopColor="rgba(9,17,30,0)" />
        </radialGradient>
        <clipPath id="globeClip">
          <circle cx={cx} cy={cy} r={r} />
        </clipPath>
      </defs>

      {/* Background glow */}
      <circle cx={cx} cy={cy} r={r + 60} fill="url(#globeGlow)" />
      <circle cx={cx} cy={cy} r={r} fill="url(#globeCoreBg)" />

      {/* Meridians */}
      {baseLongitudes.map((baseLon) => {
        const effLon = baseLon + rotation;
        const effLonRad = (effLon * Math.PI) / 180;
        const cosl = Math.cos(effLonRad);
        const rx = r * Math.abs(Math.sin(effLonRad));
        const ry = r;
        const isFront = cosl >= 0;
        return (
          <ellipse
            key={baseLon}
            cx={cx}
            cy={cy}
            rx={rx}
            ry={ry}
            stroke={isFront ? "rgba(92,147,255,0.3)" : "rgba(92,147,255,0.1)"}
            strokeWidth={isFront ? 0.9 : 0.6}
            strokeDasharray={isFront ? undefined : "3 6"}
            fill="none"
          />
        );
      })}

      {/* Parallels */}
      {latitudes.map((lat) => {
        const latRad = (lat * Math.PI) / 180;
        const cosLat = Math.cos(latRad);
        const sinLat = Math.sin(latRad);
        const ellipseRx = r * cosLat;
        const ellipseRy = ellipseRx * 0.18;
        const offsetY = -r * sinLat;
        return (
          <ellipse
            key={lat}
            cx={cx}
            cy={cy + offsetY}
            rx={ellipseRx}
            ry={ellipseRy}
            stroke="rgba(92,147,255,0.18)"
            strokeWidth="0.7"
            fill="none"
          />
        );
      })}

      {/* Globe outline */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        stroke="rgba(92,147,255,0.55)"
        strokeWidth="1.2"
        fill="none"
      />

      {/* SMIL scan line */}
      <line
        x1={cx - r * 0.85}
        y1={cy - r * 0.9}
        x2={cx + r * 0.85}
        y2={cy - r * 0.9}
        stroke="#24DDB8"
        strokeWidth="1"
        clipPath="url(#globeClip)"
      >
        <animate attributeName="y1" from={cy - r * 0.9} to={cy + r * 0.9} dur="5.5s" repeatCount="indefinite" />
        <animate attributeName="y2" from={cy - r * 0.9} to={cy + r * 0.9} dur="5.5s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0;0.6;0.6;0" keyTimes="0;0.1;0.9;1" dur="5.5s" repeatCount="indefinite" />
      </line>

      {/* City dots */}
      {cities.map(([lon, lat, label]) => {
        const pos = projectCity(lon, lat);
        if (!pos.visible) return null;
        return (
          <g key={label}>
            {/* Pulse ring */}
            <circle cx={pos.x} cy={pos.y} r={6} fill="none" stroke="#24DDB8" strokeWidth="1" opacity="0.5">
              <animate attributeName="r" values="6;14" dur="2.2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.5;0" dur="2.2s" repeatCount="indefinite" />
            </circle>
            <circle cx={pos.x} cy={pos.y} r={3.5} fill="#24DDB8" />
            {/* Label */}
            <text
              x={pos.x + 8}
              y={pos.y - 6}
              fill="rgba(240,244,255,0.8)"
              fontSize="9"
              fontFamily="'JetBrains Mono', monospace"
              fontWeight="500"
            >
              {label}
            </text>
          </g>
        );
      })}

      {/* Orbiting dot */}
      <circle r="4" fill="#24DDB8">
        <animateMotion dur="14s" repeatCount="indefinite">
          <mpath xlinkHref="#globeOrbitPath" />
        </animateMotion>
      </circle>
      <path
        id="globeOrbitPath"
        d={`M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r}`}
        fill="none"
        stroke="none"
      />

      {/* Crosshair */}
      <line x1={cx - 12} y1={cy} x2={cx + 12} y2={cy} stroke="rgba(36,221,184,0.5)" strokeWidth="0.8" />
      <line x1={cx} y1={cy - 12} x2={cx} y2={cy + 12} stroke="rgba(36,221,184,0.5)" strokeWidth="0.8" />
      <circle cx={cx} cy={cy} r={2.5} fill="#24DDB8" opacity="0.7" />

      {/* Coordinate text labels */}
      <text x={cx} y={cy - r - 10} textAnchor="middle" fill="rgba(92,147,255,0.35)" fontSize="9" fontFamily="'JetBrains Mono', monospace">90°N</text>
      <text x={cx} y={cy + r + 18} textAnchor="middle" fill="rgba(92,147,255,0.35)" fontSize="9" fontFamily="'JetBrains Mono', monospace">90°S</text>
      <text x={cx - r - 12} y={cy + 4} textAnchor="end" fill="rgba(92,147,255,0.35)" fontSize="9" fontFamily="'JetBrains Mono', monospace">180°</text>
      <text x={cx + r + 12} y={cy + 4} textAnchor="start" fill="rgba(92,147,255,0.35)" fontSize="9" fontFamily="'JetBrains Mono', monospace">0°</text>
    </svg>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [globeRotation, setGlobeRotation] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const heroHeight = window.innerHeight;
          const progress = Math.min(window.scrollY / heroHeight, 1);
          setGlobeRotation(progress * 35);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      className="min-h-screen bg-[#FAFAFD] text-[#0C1033] overflow-x-hidden"
    >
      {/* ── Global styles ── */}
      <style>{`
        html { scroll-behavior: smooth; }

        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-24px) scale(1.04); }
        }
        @keyframes float-slower {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-16px) scale(1.02); }
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(28px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(2.4); opacity: 0; }
        }
        @keyframes chip-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        @keyframes scroll-bounce {
          0%, 100% { transform: translateY(0) translateX(-50%); opacity: 0.5; }
          50% { transform: translateY(6px) translateX(-50%); opacity: 0.9; }
        }

        .anim-fade-up { animation: fade-up 0.7s ease both; }
        .anim-fade-up-d1 { animation: fade-up 0.7s 0.1s ease both; }
        .anim-fade-up-d2 { animation: fade-up 0.7s 0.22s ease both; }
        .anim-fade-up-d3 { animation: fade-up 0.7s 0.34s ease both; }
        .anim-fade-up-d4 { animation: fade-up 0.7s 0.46s ease both; }
        .anim-fade-up-d5 { animation: fade-up 0.7s 0.58s ease both; }

        .orb-1 { animation: float-slow 8s ease-in-out infinite; }
        .orb-2 { animation: float-slower 11s ease-in-out infinite 1.5s; }
        .orb-3 { animation: float-slow 9s ease-in-out infinite 3s; }

        .chip-1 { animation: chip-float 3.2s ease-in-out infinite; }
        .chip-2 { animation: chip-float 3.8s ease-in-out infinite 0.6s; }
        .chip-3 { animation: chip-float 2.9s ease-in-out infinite 1.2s; }
        .chip-4 { animation: chip-float 4.1s ease-in-out infinite 1.8s; }

        .module-card:hover { transform: translateY(-4px); box-shadow: 0 16px 48px rgba(92,147,255,0.14); }
        .module-card { transition: transform 0.22s ease, box-shadow 0.22s ease; }

        .feature-card:hover {
          border-color: rgba(92,147,255,0.3);
          box-shadow: 0 8px 32px rgba(92,147,255,0.08);
        }
        .feature-card { transition: border-color 0.2s, box-shadow 0.2s, background 0.2s; }

        .nav-cta:hover { opacity: 0.9; transform: translateY(-1px); box-shadow: 0 6px 24px rgba(36,221,184,0.3); }
        .nav-cta { transition: opacity 0.18s, transform 0.18s, box-shadow 0.18s; }

        .hero-cta-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(36,221,184,0.4); }
        .hero-cta-primary { transition: transform 0.2s, box-shadow 0.2s; }

        .hero-cta-secondary:hover { background: rgba(92,147,255,0.07); border-color: rgba(36,221,184,0.3); }
        .hero-cta-secondary { transition: background 0.2s, border-color 0.2s; }

        .globe-container { perspective: 1200px; }

        .cta-grid-bg {
          background-image:
            linear-gradient(rgba(92,147,255,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(92,147,255,0.06) 1px, transparent 1px);
          background-size: 40px 40px;
        }

        .stat-divider:not(:last-child) { border-right: 1px solid rgba(92,147,255,0.1); }

        .text-gradient-hero {
          background: linear-gradient(135deg, #5C93FF 0%, #24DDB8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .badge-pill {
          background: rgba(36,221,184,0.08);
          border: 1px solid rgba(36,221,184,0.22);
        }
        .badge-pill-blue {
          background: rgba(92,147,255,0.08);
          border: 1px solid rgba(92,147,255,0.18);
        }

        .scroll-indicator { animation: scroll-bounce 1.8s ease-in-out infinite; }

        .coord-card {
          background: rgba(9,17,30,0.75);
          border: 1px solid rgba(92,147,255,0.2);
          backdrop-filter: blur(10px);
        }
      `}</style>

      {/* ══════════════════════════════════════════
          NAVIGATION
      ══════════════════════════════════════════ */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-10 h-[62px]"
        style={{
          background: "rgba(9,17,30,0.88)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(92,147,255,0.12)",
        }}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <div
            style={{
              background: "#141F2E",
              border: "1.5px solid rgba(36,221,184,0.3)",
              boxShadow: "0 0 16px rgba(36,221,184,0.15)",
            }}
            className="w-8 h-8 rounded-[8px] flex items-center justify-center flex-shrink-0"
          >
            <span
              style={{
                color: "#24DDB8",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: 800,
                fontSize: "13px",
                letterSpacing: "-0.5px",
              }}
            >
              tt
            </span>
          </div>
          <span className="font-bold text-[17px] text-[#F0F4FF] tracking-tight">stratt</span>
        </Link>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-7">
          <a href="#modules" className="text-sm text-[rgba(240,244,255,0.55)] hover:text-[#F0F4FF] transition-colors no-underline">
            Modules
          </a>
          <a href="#features" className="text-sm text-[rgba(240,244,255,0.55)] hover:text-[#F0F4FF] transition-colors no-underline">
            Fonctionnalités
          </a>
          <Link href="/login" className="text-sm text-[rgba(240,244,255,0.55)] hover:text-[#F0F4FF] transition-colors no-underline font-medium">
            Se connecter
          </Link>
          <Link
            href="/signup"
            className="nav-cta px-4 py-2 rounded-lg text-sm font-semibold text-[#09111E] no-underline"
            style={{ background: "#24DDB8" }}
          >
            Essayer gratuitement
          </Link>
        </div>

        {/* Mobile CTA */}
        <Link
          href="/signup"
          className="md:hidden nav-cta px-3.5 py-1.5 rounded-lg text-sm font-semibold text-[#09111E] no-underline"
          style={{ background: "#24DDB8" }}
        >
          Essayer
        </Link>
      </nav>

      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <section
        className="relative pt-[62px] min-h-screen flex flex-col overflow-hidden"
        style={{ background: "#09111E" }}
      >
        {/* Subtle grid */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(92,147,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(92,147,255,0.035) 1px, transparent 1px)",
            backgroundSize: "52px 52px",
          }}
        />

        {/* Glow orbs */}
        <div
          className="orb-1 absolute top-[10%] left-[3%] w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(92,147,255,0.12) 0%, transparent 65%)", filter: "blur(2px)" }}
        />
        <div
          className="orb-2 absolute bottom-[5%] right-[2%] w-[420px] h-[420px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(36,221,184,0.08) 0%, transparent 65%)", filter: "blur(2px)" }}
        />

        {/* Main grid: text left, globe right */}
        <div className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto w-full px-6 md:px-10 py-16 items-center">

          {/* Left column */}
          <div className="flex flex-col gap-6">
            {/* Badge */}
            <div className="anim-fade-up">
              <div className="inline-flex items-center gap-2 badge-pill rounded-full px-4 py-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#24DDB8] inline-block" />
                <span style={{ color: "#24DDB8" }} className="text-xs font-semibold tracking-widest uppercase">
                  Achat Public · Marchés Publics
                </span>
              </div>
            </div>

            {/* Headline */}
            <h1 className="anim-fade-up-d1 text-[clamp(2.4rem,5.5vw,4rem)] font-extrabold leading-[1.08] tracking-[-0.03em]">
              <span className="text-[#F0F4FF]">La plateforme</span>
              <br />
              <span className="text-gradient-hero">intelligente</span>
              <br />
              <span className="text-[#F0F4FF]">pour l&apos;achat public.</span>
            </h1>

            {/* Subtitle */}
            <p className="anim-fade-up-d2 text-[clamp(0.95rem,1.8vw,1.1rem)] text-[rgba(240,244,255,0.5)] max-w-[480px] leading-relaxed">
              CRM, achats, comptabilité, facturation et analytics — unifiés dans une seule plateforme multi-tenant alimentée par l&apos;IA Claude.
            </p>

            {/* CTAs */}
            <div className="anim-fade-up-d3 flex flex-col sm:flex-row items-start gap-3">
              <Link
                href="/signup"
                className="hero-cta-primary inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-[15px] font-bold text-[#09111E] no-underline"
                style={{ background: "#24DDB8", boxShadow: "0 6px 28px rgba(36,221,184,0.3)" }}
              >
                Commencer gratuitement
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
              <Link
                href="/login"
                className="hero-cta-secondary inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-[15px] font-semibold text-[#F0F4FF] no-underline border"
                style={{ borderColor: "rgba(240,244,255,0.15)", background: "rgba(240,244,255,0.05)" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                Voir la démo
              </Link>
            </div>

            {/* Demo credentials */}
            <div className="anim-fade-up-d4">
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
                style={{ background: "rgba(92,147,255,0.06)", border: "1px solid rgba(92,147,255,0.14)" }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#5C93FF" }} />
                <span className="text-xs text-[rgba(240,244,255,0.45)]">Accès démo —</span>
                <code className="text-xs font-mono text-[#5C93FF] font-semibold">admin@stratt.io</code>
                <span className="text-xs text-[rgba(240,244,255,0.25)]">/</span>
                <code className="text-xs font-mono text-[#5C93FF] font-semibold">admin1234</code>
              </div>
            </div>

            {/* Floating chips */}
            <div className="anim-fade-up-d5 flex flex-wrap gap-2 mt-2">
              {[
                { label: "Multi-tenant", cls: "chip-1" },
                { label: "IA Claude", cls: "chip-2" },
                { label: "API REST", cls: "chip-3" },
                { label: "Open Source", cls: "chip-4" },
              ].map(({ label, cls }) => (
                <span
                  key={label}
                  className={`${cls} inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold`}
                  style={{
                    background: "rgba(92,147,255,0.08)",
                    border: "1px solid rgba(92,147,255,0.18)",
                    color: "rgba(240,244,255,0.7)",
                  }}
                >
                  <span className="w-1 h-1 rounded-full bg-[#24DDB8]" />
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* Right column: Globe */}
          <div className="relative flex items-center justify-center globe-container">
            {/* Coord label cards */}
            <div
              className="coord-card absolute top-[12%] right-[4%] flex items-center gap-2 px-3 py-2 rounded-xl z-20"
              style={{ fontSize: "11px" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#24DDB8] flex-shrink-0" />
              <span style={{ color: "rgba(240,244,255,0.7)", fontFamily: "'JetBrains Mono', monospace" }}>
                48°52′N / 2°21′E — Paris
              </span>
            </div>
            <div
              className="coord-card absolute bottom-[18%] left-[2%] flex items-center gap-2 px-3 py-2 rounded-xl z-20"
              style={{ fontSize: "11px" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#5C93FF] flex-shrink-0" />
              <span style={{ color: "rgba(240,244,255,0.7)", fontFamily: "'JetBrains Mono', monospace" }}>
                55°45′N / 37°37′E — Moscow
              </span>
            </div>
            <div
              className="coord-card absolute top-[52%] right-[1%] flex items-center gap-2 px-3 py-2 rounded-xl z-20"
              style={{ fontSize: "11px" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#24DDB8] flex-shrink-0" />
              <span style={{ color: "rgba(240,244,255,0.7)", fontFamily: "'JetBrains Mono', monospace" }}>
                22°54′S / 43°10′W — Rio
              </span>
            </div>

            {/* Globe SVG */}
            <div className="w-full max-w-[520px]">
              {mounted && <WireframeGlobe rotation={globeRotation} />}
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div
          className="scroll-indicator absolute bottom-8 left-1/2 flex flex-col items-center gap-1.5"
          style={{ transform: "translateX(-50%)" }}
        >
          <span
            className="text-[10px] tracking-[0.15em] uppercase"
            style={{ color: "rgba(240,244,255,0.3)" }}
          >
            scroll to explore
          </span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(240,244,255,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          STATS BAR
      ══════════════════════════════════════════ */}
      <section
        className="border-y"
        style={{ borderColor: "rgba(92,147,255,0.1)", background: "#FFFFFF" }}
      >
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="stat-divider flex flex-col items-center justify-center py-9 px-6 gap-1"
            >
              <span
                className="text-[2.1rem] font-extrabold tracking-tight"
                style={{
                  background: "linear-gradient(135deg, #5C93FF, #24DDB8)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {stat.value}
              </span>
              <span className="text-[11px] uppercase tracking-[0.1em] text-[#BABABA] font-medium">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          MODULES
      ══════════════════════════════════════════ */}
      <section id="modules" className="py-24 px-6" style={{ background: "#FAFAFD" }}>
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 badge-pill-blue rounded-full px-4 py-1.5 mb-4">
              <span style={{ color: "#5C93FF" }} className="text-xs font-semibold tracking-widest uppercase">
                7 Modules
              </span>
            </div>
            <h2 className="text-[clamp(1.8rem,4vw,2.8rem)] font-extrabold tracking-tight text-[#0C1033] mb-4 leading-tight">
              Tout ce dont votre
              <br />
              <span
                style={{
                  background: "linear-gradient(135deg, #5C93FF, #24DDB8)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                organisation a besoin
              </span>
            </h2>
            <p className="text-[#BABABA] max-w-md mx-auto text-[15px] leading-relaxed">
              Activez uniquement les modules dont vous avez besoin. Chaque module est indépendant et interconnecté.
            </p>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {modules.map((mod) => (
              <div
                key={mod.id}
                className="module-card bg-white rounded-2xl p-6 border border-[#E8EAF0] cursor-default"
              >
                <div className="flex items-start gap-4">
                  <div
                    className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center"
                    style={{ background: `${mod.color}14`, color: mod.color }}
                  >
                    {mod.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-[15px] text-[#0C1033] mb-1">{mod.name}</h3>
                    <p className="text-sm text-[#BABABA] leading-snug">{mod.description}</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-[#F0F1F8] flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: mod.color }} />
                  <span className="text-[11px] text-[#BABABA] uppercase tracking-[0.08em] font-medium">
                    Inclus dans tous les plans
                  </span>
                </div>
              </div>
            ))}

            {/* CTA card */}
            <div
              className="module-card rounded-2xl p-6 border border-dashed flex flex-col items-center justify-center text-center gap-3 cursor-default"
              style={{
                borderColor: "rgba(92,147,255,0.2)",
                background: "linear-gradient(135deg, rgba(92,147,255,0.04), rgba(36,221,184,0.03))",
              }}
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #5C93FF, #24DDB8)" }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </div>
              <div>
                <p className="font-bold text-[14px] text-[#0C1033]">D&apos;autres modules</p>
                <p className="text-[12px] text-[#BABABA] mt-0.5">à venir prochainement</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FEATURES
      ══════════════════════════════════════════ */}
      <section id="features" className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 badge-pill-blue rounded-full px-4 py-1.5 mb-4">
              <span style={{ color: "#5C93FF" }} className="text-xs font-semibold tracking-widest uppercase">
                Conçu pour l&apos;entreprise
              </span>
            </div>
            <h2 className="text-[clamp(1.8rem,4vw,2.8rem)] font-extrabold tracking-tight text-[#0C1033] mb-4 leading-tight">
              Une architecture
              <br />
              <span
                style={{
                  background: "linear-gradient(135deg, #5C93FF, #24DDB8)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                pensée pour la croissance
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feat, i) => (
              <div
                key={i}
                className="feature-card bg-white rounded-2xl p-7 border border-[#E8EAF0]"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-5"
                  style={{
                    background: "linear-gradient(135deg, rgba(92,147,255,0.12), rgba(36,221,184,0.08))",
                    color: "#5C93FF",
                  }}
                >
                  {feat.icon}
                </div>
                <h3 className="font-bold text-[16px] text-[#0C1033] mb-2">{feat.title}</h3>
                <p className="text-sm text-[#BABABA] leading-relaxed">{feat.description}</p>
              </div>
            ))}
          </div>

          {/* Tech stack pills */}
          <div className="mt-12 flex flex-wrap justify-center gap-3">
            {["Next.js 15", "Go 1.24", "PostgreSQL 16", "Redis", "Claude AI", "Docker"].map((tech) => (
              <span
                key={tech}
                className="px-3.5 py-1.5 rounded-full text-[12px] font-semibold text-[#5C93FF] border border-[rgba(92,147,255,0.2)]"
                style={{ background: "rgba(92,147,255,0.06)" }}
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          CTA BANNER
      ══════════════════════════════════════════ */}
      <section className="py-24 px-6" style={{ background: "#FAFAFD" }}>
        <div className="max-w-3xl mx-auto">
          <div
            className="rounded-3xl overflow-hidden relative text-center px-8 py-16 cta-grid-bg"
            style={{ background: "#09111E" }}
          >
            {/* Green glow top-left */}
            <div
              className="absolute top-[-30%] left-[-10%] w-[360px] h-[360px] rounded-full pointer-events-none"
              style={{ background: "radial-gradient(circle, rgba(36,221,184,0.12) 0%, transparent 65%)" }}
            />
            {/* Blue glow bottom-right */}
            <div
              className="absolute bottom-[-30%] right-[-10%] w-[320px] h-[320px] rounded-full pointer-events-none"
              style={{ background: "radial-gradient(circle, rgba(92,147,255,0.1) 0%, transparent 65%)" }}
            />

            <div className="relative z-10">
              {/* Green accent stripe */}
              <div
                className="w-10 h-0.5 mx-auto mb-6 rounded-full"
                style={{ background: "#24DDB8" }}
              />

              <div
                className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full badge-pill"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#24DDB8]" />
                <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "#24DDB8" }}>
                  Démarrez maintenant
                </span>
              </div>

              <h2 className="text-[clamp(1.8rem,4vw,2.8rem)] font-extrabold text-[#F0F4FF] tracking-tight mb-4 leading-tight">
                Prêt à transformer
                <br />votre gestion ?
              </h2>
              <p className="text-[rgba(240,244,255,0.5)] text-[15px] mb-10 max-w-sm mx-auto">
                Démarrez en 5 minutes, sans carte bancaire.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/signup"
                  className="hero-cta-primary inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-[15px] font-bold text-[#09111E] no-underline"
                  style={{ background: "#FFFFFF", boxShadow: "0 8px 28px rgba(0,0,0,0.25)" }}
                >
                  Commencer gratuitement
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                  </svg>
                </Link>
                <Link
                  href="/login"
                  className="hero-cta-secondary inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-[15px] font-semibold text-[#F0F4FF] no-underline"
                  style={{ border: "1px solid rgba(240,244,255,0.15)", background: "rgba(240,244,255,0.06)" }}
                >
                  Compte démo
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════ */}
      <footer
        className="py-10 px-6"
        style={{ background: "#09111E", borderTop: "1px solid rgba(92,147,255,0.1)" }}
      >
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo + wordmark */}
          <div className="flex items-center gap-3">
            <div
              style={{
                background: "#141F2E",
                border: "1.5px solid rgba(36,221,184,0.25)",
                boxShadow: "0 0 12px rgba(36,221,184,0.1)",
              }}
              className="w-7 h-7 rounded-[7px] flex items-center justify-center flex-shrink-0"
            >
              <span
                style={{
                  color: "#24DDB8",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontWeight: 800,
                  fontSize: "11px",
                  letterSpacing: "-0.5px",
                }}
              >
                tt
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-bold text-[15px] text-[#F0F4FF] tracking-tight">stratt</span>
              <span className="text-[11px] text-[rgba(240,244,255,0.3)]">ERP SaaS</span>
            </div>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6">
            <a href="#" className="text-[13px] text-[rgba(240,244,255,0.35)] hover:text-[#5C93FF] transition-colors no-underline">
              Confidentialité
            </a>
            <a href="#" className="text-[13px] text-[rgba(240,244,255,0.35)] hover:text-[#5C93FF] transition-colors no-underline">
              CGU
            </a>
            <a href="#" className="text-[13px] text-[rgba(240,244,255,0.35)] hover:text-[#5C93FF] transition-colors no-underline">
              Documentation
            </a>
          </div>

          {/* Copyright */}
          <p className="text-[12px] text-[rgba(240,244,255,0.25)]">
            © 2026 stratt. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  );
}

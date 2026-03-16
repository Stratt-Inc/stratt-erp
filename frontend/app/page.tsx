"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

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

// ─── Types ───────────────────────────────────────────────────────────────────

interface GlobeState {
  rotation: number;
  arcProgress: number;
  intensity: number;
}

interface ProjectedPoint {
  x: number;
  y: number;
  visible: boolean;
  depth: number;
}

// ─── Globe ───────────────────────────────────────────────────────────────────

const cx = 260;
const cy = 260;
const r = 195;

const cities = [
  { name: "Paris",  lon: 2.3,   lat: 48.9 },
  { name: "Moscow", lon: 37.6,  lat: 55.7 },
  { name: "Rio",    lon: -43.2, lat: -22.9 },
  { name: "Dubai",  lon: 55.3,  lat: 25.2 },
  { name: "Seoul",  lon: 126.9, lat: 37.6 },
];

const connections = [
  { from: 0, to: 1, startAt: 0.0 },
  { from: 1, to: 2, startAt: 0.2 },
  { from: 0, to: 3, startAt: 0.4 },
  { from: 3, to: 4, startAt: 0.6 },
  { from: 2, to: 4, startAt: 0.8 },
];

const meridianLons = [-80, -50, -20, 0, 20, 50, 80, 110];
const parallelLats = [-60, -30, 0, 30, 60];

function project(lon: number, lat: number, rotation: number): ProjectedPoint {
  const effLon = ((lon + rotation) * Math.PI) / 180;
  const latRad = (lat * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(latRad) * Math.sin(effLon),
    y: cy - r * Math.sin(latRad),
    visible: Math.cos(effLon) * Math.cos(latRad) >= -0.1,
    depth: Math.cos(effLon) * Math.cos(latRad),
  };
}

function buildArc(p1: ProjectedPoint, p2: ProjectedPoint): string {
  const mx = (p1.x + p2.x) / 2;
  const my = (p1.y + p2.y) / 2;
  const dx = cx - mx;
  const dy = cy - my;
  const cpx = mx - dx * 0.3;
  const cpy = my - dy * 0.3;
  return `M ${p1.x} ${p1.y} Q ${cpx} ${cpy} ${p2.x} ${p2.y}`;
}

function WireframeGlobe({ rotation, arcProgress, intensity }: GlobeState) {
  const glowAlpha = 0.06 + intensity * 0.14;
  const outlineAlpha = 0.4 + intensity * 0.35;

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
          <stop offset="0%" stopColor={`rgba(92,147,255,${glowAlpha})`} />
          <stop offset="60%" stopColor="rgba(9,17,30,0.5)" />
          <stop offset="100%" stopColor="rgba(9,17,30,0)" />
        </radialGradient>
        <radialGradient id="globeCoreBg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={`rgba(36,221,184,${0.03 + intensity * 0.05})`} />
          <stop offset="100%" stopColor="rgba(9,17,30,0)" />
        </radialGradient>
        <clipPath id="globeClip">
          <circle cx={cx} cy={cy} r={r} />
        </clipPath>
        <filter id="arcGlow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Background glow */}
      <circle cx={cx} cy={cy} r={r + 80} fill="url(#globeGlow)" />
      <circle cx={cx} cy={cy} r={r} fill="url(#globeCoreBg)" />

      {/* Meridians */}
      {meridianLons.map((baseLon) => {
        const effLon = baseLon + rotation;
        const effLonRad = (effLon * Math.PI) / 180;
        const sinL = Math.sin(effLonRad);
        const cosL = Math.cos(effLonRad);
        const rx = r * Math.abs(sinL);
        const isFront = cosL >= 0;
        return (
          <ellipse
            key={baseLon}
            cx={cx}
            cy={cy}
            rx={rx}
            ry={r}
            stroke={isFront ? `rgba(92,147,255,${0.18 + intensity * 0.18})` : `rgba(92,147,255,${0.07 + intensity * 0.05})`}
            strokeWidth={isFront ? 0.9 : 0.6}
            strokeDasharray={isFront ? undefined : "3 6"}
            fill="none"
          />
        );
      })}

      {/* Parallels */}
      {parallelLats.map((lat) => {
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
            stroke={`rgba(92,147,255,${0.1 + intensity * 0.1})`}
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
        stroke={`rgba(92,147,255,${outlineAlpha})`}
        strokeWidth="1.4"
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
        <animate attributeName="y1" from={cy - r * 0.9} to={cy + r * 0.9} dur="6s" repeatCount="indefinite" />
        <animate attributeName="y2" from={cy - r * 0.9} to={cy + r * 0.9} dur="6s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0;0.55;0.55;0" keyTimes="0;0.08;0.92;1" dur="6s" repeatCount="indefinite" />
      </line>

      {/* Connection arcs */}
      {connections.map((conn, i) => {
        const p1 = project(cities[conn.from].lon, cities[conn.from].lat, rotation);
        const p2 = project(cities[conn.to].lon, cities[conn.to].lat, rotation);
        if (!p1.visible || !p2.visible) return null;
        const rawProg = (arcProgress - conn.startAt) / 0.25;
        const progress = Math.max(0, Math.min(1, rawProg));
        if (progress <= 0) return null;
        const d = buildArc(p1, p2);
        return (
          <path
            key={i}
            d={d}
            stroke="#24DDB8"
            strokeWidth="1.4"
            fill="none"
            pathLength="1"
            strokeDasharray="1"
            strokeDashoffset={1 - progress}
            strokeLinecap="round"
            filter="url(#arcGlow)"
            opacity={0.5 + progress * 0.5}
          />
        );
      })}

      {/* City dots */}
      {cities.map((city) => {
        const pos = project(city.lon, city.lat, rotation);
        if (!pos.visible) return null;
        const depthFade = Math.max(0.3, pos.depth);
        return (
          <g key={city.name} opacity={depthFade}>
            {/* Pulse ring (SMIL) */}
            <circle cx={pos.x} cy={pos.y} r={5} fill="none" stroke="#24DDB8" strokeWidth="1" opacity="0.6">
              <animate attributeName="r" values="5;13" dur="2.4s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.6;0" dur="2.4s" repeatCount="indefinite" />
            </circle>
            {/* Dot */}
            <circle cx={pos.x} cy={pos.y} r={3.5} fill="#24DDB8" />
            {/* Label */}
            <text
              x={pos.x + 9}
              y={pos.y - 6}
              fill="rgba(240,244,255,0.75)"
              fontSize="9"
              fontFamily="'JetBrains Mono', monospace"
              fontWeight="500"
            >
              {city.name}
            </text>
          </g>
        );
      })}

      {/* Orbit path (hidden) */}
      <path
        id="globeOrbitPath"
        d={`M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r}`}
        fill="none"
        stroke="none"
      />

      {/* Orbiting dot */}
      <circle r="4" fill="#5C93FF" opacity="0.85">
        <animateMotion dur="14s" repeatCount="indefinite">
          <mpath href="#globeOrbitPath" />
        </animateMotion>
      </circle>

      {/* Crosshair */}
      <line x1={cx - 14} y1={cy} x2={cx + 14} y2={cy} stroke="rgba(36,221,184,0.4)" strokeWidth="0.8" />
      <line x1={cx} y1={cy - 14} x2={cx} y2={cy + 14} stroke="rgba(36,221,184,0.4)" strokeWidth="0.8" />
      <circle cx={cx} cy={cy} r={2.5} fill="#24DDB8" opacity={0.5 + intensity * 0.5} />

      {/* Cardinal labels */}
      <text x={cx} y={cy - r - 10} textAnchor="middle" fill="rgba(92,147,255,0.3)" fontSize="9" fontFamily="'JetBrains Mono', monospace">90°N</text>
      <text x={cx} y={cy + r + 18} textAnchor="middle" fill="rgba(92,147,255,0.3)" fontSize="9" fontFamily="'JetBrains Mono', monospace">90°S</text>
      <text x={cx - r - 10} y={cy + 4} textAnchor="end" fill="rgba(92,147,255,0.3)" fontSize="9" fontFamily="'JetBrains Mono', monospace">180°</text>
      <text x={cx + r + 10} y={cy + 4} textAnchor="start" fill="rgba(92,147,255,0.3)" fontSize="9" fontFamily="'JetBrains Mono', monospace">0°</text>
    </svg>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  const [globeState, setGlobeState] = useState<GlobeState>({
    rotation: 0,
    arcProgress: 0,
    intensity: 0,
  });
  const [sectionLabel, setSectionLabel] = useState("OVERVIEW");

  const targetProgress = useRef(0);
  const currentProgress = useRef(0);
  const rafId = useRef<number | null>(null);
  const lastGlobeState = useRef<GlobeState>({ rotation: 0, arcProgress: 0, intensity: 0 });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight > 0) {
        targetProgress.current = window.scrollY / scrollHeight;
      }
    };

    const tick = () => {
      currentProgress.current +=
        (targetProgress.current - currentProgress.current) * 0.06;

      const p = currentProgress.current;
      const rotation = p * 360;
      const arcProgress = Math.max(0, (p - 0.15) / 0.7);
      const intensity = p;

      const next: GlobeState = { rotation, arcProgress, intensity };
      const prev = lastGlobeState.current;

      // Only update state if values changed meaningfully
      if (
        Math.abs(next.rotation - prev.rotation) > 0.05 ||
        Math.abs(next.arcProgress - prev.arcProgress) > 0.005 ||
        Math.abs(next.intensity - prev.intensity) > 0.005
      ) {
        lastGlobeState.current = next;
        setGlobeState(next);

        // Section label
        if (p < 0.25) setSectionLabel("OVERVIEW");
        else if (p < 0.5) setSectionLabel("MODULES");
        else if (p < 0.75) setSectionLabel("PLATFORM");
        else setSectionLabel("READY");
      }

      rafId.current = requestAnimationFrame(tick);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    rafId.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafId.current !== null) cancelAnimationFrame(rafId.current);
    };
  }, []);

  const rotationDisplay = (globeState.rotation % 360).toFixed(1);
  const arcPct = Math.round(globeState.arcProgress * 100);
  const progressPct = Math.min(100, globeState.intensity * 100);

  return (
    <div
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#09111E", overflowX: "clip" }}
      className="min-h-screen text-[#F0F4FF]"
    >
      {/* ── Global styles ── */}
      <style>{`
        html { scroll-behavior: smooth; }

        @keyframes fade-up {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes chip-float {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-5px); }
        }
        @keyframes scroll-bounce {
          0%, 100% { transform: translateY(0) translateX(-50%); opacity: 0.45; }
          50%       { transform: translateY(6px) translateX(-50%); opacity: 0.9; }
        }
        @keyframes orb-drift {
          0%, 100% { transform: translateY(0) scale(1); }
          50%       { transform: translateY(-20px) scale(1.03); }
        }

        .anim-fade-up   { animation: fade-up 0.7s ease both; }
        .anim-fade-up-d1 { animation: fade-up 0.7s 0.10s ease both; }
        .anim-fade-up-d2 { animation: fade-up 0.7s 0.22s ease both; }
        .anim-fade-up-d3 { animation: fade-up 0.7s 0.34s ease both; }
        .anim-fade-up-d4 { animation: fade-up 0.7s 0.46s ease both; }
        .anim-fade-up-d5 { animation: fade-up 0.7s 0.58s ease both; }

        .chip-1 { animation: chip-float 3.2s ease-in-out infinite; }
        .chip-2 { animation: chip-float 3.8s ease-in-out infinite 0.6s; }
        .chip-3 { animation: chip-float 2.9s ease-in-out infinite 1.2s; }
        .chip-4 { animation: chip-float 4.1s ease-in-out infinite 1.8s; }

        .orb-a { animation: orb-drift  8s ease-in-out infinite; }
        .orb-b { animation: orb-drift 11s ease-in-out infinite 2s; }

        .module-card { transition: transform 0.22s ease, box-shadow 0.22s ease; }
        .module-card:hover { transform: translateY(-4px); box-shadow: 0 16px 48px rgba(92,147,255,0.12); }

        .feature-card { transition: border-color 0.2s, box-shadow 0.2s; }
        .feature-card:hover { border-color: rgba(92,147,255,0.28); box-shadow: 0 8px 32px rgba(92,147,255,0.08); }

        .nav-cta { transition: opacity 0.18s, transform 0.18s, box-shadow 0.18s; }
        .nav-cta:hover { opacity: 0.88; transform: translateY(-1px); box-shadow: 0 6px 24px rgba(36,221,184,0.28); }

        .hero-cta-primary { transition: transform 0.2s, box-shadow 0.2s; }
        .hero-cta-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(36,221,184,0.38); }

        .hero-cta-secondary { transition: background 0.2s, border-color 0.2s; }
        .hero-cta-secondary:hover { background: rgba(92,147,255,0.07) !important; border-color: rgba(36,221,184,0.28) !important; }

        .scroll-indicator { animation: scroll-bounce 1.8s ease-in-out infinite; }

        .text-gradient-hero {
          background: linear-gradient(135deg, #5C93FF 0%, #24DDB8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .text-gradient-section {
          background: linear-gradient(135deg, #5C93FF 0%, #24DDB8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .badge-green {
          background: rgba(36,221,184,0.08);
          border: 1px solid rgba(36,221,184,0.22);
        }
        .badge-blue {
          background: rgba(92,147,255,0.08);
          border: 1px solid rgba(92,147,255,0.18);
        }

        .cta-grid-bg {
          background-image:
            linear-gradient(rgba(92,147,255,0.055) 1px, transparent 1px),
            linear-gradient(90deg, rgba(92,147,255,0.055) 1px, transparent 1px);
          background-size: 40px 40px;
        }

        .stat-item:not(:last-child) {
          border-right: 1px solid rgba(92,147,255,0.1);
        }

        /* Right panel monospace */
        .mono { font-family: 'JetBrains Mono', 'Fira Code', monospace; }

        /* Scrollbar dark */
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #09111E; }
        ::-webkit-scrollbar-thumb { background: rgba(92,147,255,0.2); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(92,147,255,0.35); }
      `}</style>

      {/* ══════════════════════════════════════════
          NAVIGATION
      ══════════════════════════════════════════ */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-10 h-[62px]"
        style={{
          background: "rgba(9,17,30,0.9)",
          backdropFilter: "blur(18px)",
          borderBottom: "1px solid rgba(92,147,255,0.1)",
        }}
      >
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

        <div className="hidden md:flex items-center gap-7">
          <a href="#modules" className="text-sm text-[rgba(240,244,255,0.5)] hover:text-[#F0F4FF] transition-colors no-underline">
            Modules
          </a>
          <a href="#features" className="text-sm text-[rgba(240,244,255,0.5)] hover:text-[#F0F4FF] transition-colors no-underline">
            Fonctionnalités
          </a>
          <Link href="/login" className="text-sm text-[rgba(240,244,255,0.5)] hover:text-[#F0F4FF] transition-colors no-underline font-medium">
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

        <Link
          href="/signup"
          className="md:hidden nav-cta px-3.5 py-1.5 rounded-lg text-sm font-semibold text-[#09111E] no-underline"
          style={{ background: "#24DDB8" }}
        >
          Essayer
        </Link>
      </nav>

      {/* ══════════════════════════════════════════
          MAIN TWO-COLUMN LAYOUT
      ══════════════════════════════════════════ */}
      <div className="pt-[62px] flex flex-col lg:flex-row">

        {/* ── LEFT COLUMN (55%) ─────────────────── */}
        <div className="w-full lg:w-[55%]">

          {/* ── HERO ── */}
          <section
            className="relative min-h-screen lg:min-h-0 flex flex-col justify-center px-6 md:px-10 lg:px-12 py-20 overflow-hidden"
            style={{ background: "#09111E" }}
          >
            {/* Grid background */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(92,147,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(92,147,255,0.03) 1px, transparent 1px)",
                backgroundSize: "52px 52px",
              }}
            />
            {/* Glow orbs */}
            <div className="orb-a absolute top-[8%] left-[-4%] w-[480px] h-[480px] rounded-full pointer-events-none"
              style={{ background: "radial-gradient(circle, rgba(92,147,255,0.1) 0%, transparent 65%)" }} />
            <div className="orb-b absolute bottom-[4%] right-[-8%] w-[380px] h-[380px] rounded-full pointer-events-none"
              style={{ background: "radial-gradient(circle, rgba(36,221,184,0.07) 0%, transparent 65%)" }} />

            {/* Globe — mobile only (shown in hero on mobile) */}
            {mounted && (
              <div className="lg:hidden relative z-10 flex items-center justify-center mb-10">
                <div className="w-full max-w-[340px]">
                  <WireframeGlobe rotation={globeState.rotation} arcProgress={globeState.arcProgress} intensity={globeState.intensity} />
                </div>
              </div>
            )}

            {/* Hero content */}
            <div className="relative z-10 flex flex-col gap-7 max-w-[600px]">
              {/* Badge */}
              <div className="anim-fade-up">
                <div className="inline-flex items-center gap-2 badge-green rounded-full px-4 py-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#24DDB8] inline-block" />
                  <span style={{ color: "#24DDB8" }} className="text-xs font-semibold tracking-widest uppercase">
                    Achat Public · Marchés Publics
                  </span>
                </div>
              </div>

              {/* Headline */}
              <h1 className="anim-fade-up-d1 text-[clamp(2.4rem,5vw,3.8rem)] font-extrabold leading-[1.07] tracking-[-0.03em]">
                <span className="text-[#F0F4FF]">La plateforme</span>
                <br />
                <span className="text-gradient-hero">intelligente</span>
                <br />
                <span className="text-[#F0F4FF]">pour l&apos;achat public.</span>
              </h1>

              {/* Subtitle */}
              <p className="anim-fade-up-d2 text-[clamp(0.95rem,1.6vw,1.05rem)] text-[rgba(240,244,255,0.48)] max-w-[480px] leading-relaxed">
                CRM, achats, comptabilité, facturation et analytics — unifiés dans une seule plateforme multi-tenant alimentée par l&apos;IA Claude.
              </p>

              {/* CTAs */}
              <div className="anim-fade-up-d3 flex flex-col sm:flex-row items-start gap-3">
                <Link
                  href="/signup"
                  className="hero-cta-primary inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-[15px] font-bold text-[#09111E] no-underline"
                  style={{ background: "#24DDB8", boxShadow: "0 6px 28px rgba(36,221,184,0.28)" }}
                >
                  Commencer gratuitement
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                  </svg>
                </Link>
                <Link
                  href="/login"
                  className="hero-cta-secondary inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-[15px] font-semibold text-[#F0F4FF] no-underline"
                  style={{ borderColor: "rgba(240,244,255,0.14)", border: "1px solid rgba(240,244,255,0.14)", background: "rgba(240,244,255,0.04)" }}
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
                  <span className="w-1.5 h-1.5 rounded-full bg-[#5C93FF]" />
                  <span className="text-xs text-[rgba(240,244,255,0.4)]">Accès démo —</span>
                  <code className="text-xs mono text-[#5C93FF] font-semibold">admin@stratt.io</code>
                  <span className="text-xs text-[rgba(240,244,255,0.22)]">/</span>
                  <code className="text-xs mono text-[#5C93FF] font-semibold">admin1234</code>
                </div>
              </div>

              {/* Floating chips */}
              <div className="anim-fade-up-d5 flex flex-wrap gap-2">
                {[
                  { label: "Multi-tenant", cls: "chip-1" },
                  { label: "IA Claude",    cls: "chip-2" },
                  { label: "API REST",     cls: "chip-3" },
                  { label: "Open Source",  cls: "chip-4" },
                ].map(({ label, cls }) => (
                  <span
                    key={label}
                    className={`${cls} inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold`}
                    style={{
                      background: "rgba(92,147,255,0.08)",
                      border: "1px solid rgba(92,147,255,0.18)",
                      color: "rgba(240,244,255,0.65)",
                    }}
                  >
                    <span className="w-1 h-1 rounded-full bg-[#24DDB8]" />
                    {label}
                  </span>
                ))}
              </div>
            </div>

            {/* Scroll indicator */}
            <div
              className="scroll-indicator absolute bottom-8 left-1/2 flex flex-col items-center gap-1.5 lg:hidden"
            >
              <span className="text-[10px] tracking-[0.15em] uppercase text-[rgba(240,244,255,0.28)]">
                scroll
              </span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(240,244,255,0.28)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </section>

          {/* ── STATS BAR ── */}
          <section
            style={{
              background: "#0E1929",
              borderTop: "1px solid rgba(92,147,255,0.1)",
              borderBottom: "1px solid rgba(92,147,255,0.1)",
            }}
          >
            <div className="grid grid-cols-2 md:grid-cols-4">
              {stats.map((stat, i) => (
                <div
                  key={i}
                  className="stat-item flex flex-col items-center justify-center py-10 px-6 gap-1.5"
                >
                  <span
                    className="text-[2rem] font-extrabold tracking-tight"
                    style={{
                      background: "linear-gradient(135deg, #5C93FF, #24DDB8)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    {stat.value}
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.12em] text-[rgba(240,244,255,0.35)] font-medium">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* ── MODULES ── */}
          <section
            id="modules"
            className="px-6 md:px-10 lg:px-12 py-24"
            style={{ background: "#09111E" }}
          >
            {/* Header */}
            <div className="mb-12">
              <div className="inline-flex items-center gap-2 badge-blue rounded-full px-4 py-1.5 mb-4">
                <span style={{ color: "#5C93FF" }} className="text-xs font-semibold tracking-widest uppercase">
                  7 Modules
                </span>
              </div>
              <h2 className="text-[clamp(1.8rem,3.5vw,2.6rem)] font-extrabold tracking-tight leading-tight mb-4">
                <span className="text-[#F0F4FF]">Tout ce dont votre</span>
                <br />
                <span className="text-gradient-section">organisation a besoin</span>
              </h2>
              <p className="text-[rgba(240,244,255,0.4)] max-w-[420px] text-[15px] leading-relaxed">
                Activez uniquement les modules dont vous avez besoin. Chaque module est indépendant et interconnecté.
              </p>
            </div>

            {/* Grid — 2 columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {modules.map((mod) => (
                <div
                  key={mod.id}
                  className="module-card rounded-2xl p-5 border cursor-default"
                  style={{
                    background: "rgba(14,25,41,0.8)",
                    borderColor: "rgba(92,147,255,0.1)",
                  }}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center"
                      style={{ background: `${mod.color}18`, color: mod.color }}
                    >
                      {mod.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-[15px] text-[#F0F4FF] mb-1">{mod.name}</h3>
                      <p className="text-sm text-[rgba(240,244,255,0.38)] leading-snug">{mod.description}</p>
                    </div>
                  </div>
                  <div
                    className="mt-4 pt-4 flex items-center gap-1.5"
                    style={{ borderTop: "1px solid rgba(92,147,255,0.08)" }}
                  >
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: mod.color }} />
                    <span className="text-[10px] text-[rgba(240,244,255,0.3)] uppercase tracking-[0.08em] font-medium">
                      Inclus dans tous les plans
                    </span>
                  </div>
                </div>
              ))}

              {/* Placeholder card */}
              <div
                className="module-card rounded-2xl p-5 border border-dashed flex flex-col items-center justify-center text-center gap-3 cursor-default"
                style={{
                  borderColor: "rgba(92,147,255,0.18)",
                  background: "linear-gradient(135deg, rgba(92,147,255,0.04), rgba(36,221,184,0.025))",
                }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, rgba(92,147,255,0.2), rgba(36,221,184,0.15))" }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#24DDB8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-[14px] text-[rgba(240,244,255,0.7)]">D&apos;autres modules</p>
                  <p className="text-[12px] text-[rgba(240,244,255,0.3)] mt-0.5">à venir prochainement</p>
                </div>
              </div>
            </div>
          </section>

          {/* ── FEATURES ── */}
          <section
            id="features"
            className="px-6 md:px-10 lg:px-12 py-24"
            style={{ background: "#0E1929" }}
          >
            <div className="mb-12">
              <div className="inline-flex items-center gap-2 badge-blue rounded-full px-4 py-1.5 mb-4">
                <span style={{ color: "#5C93FF" }} className="text-xs font-semibold tracking-widest uppercase">
                  Conçu pour l&apos;entreprise
                </span>
              </div>
              <h2 className="text-[clamp(1.8rem,3.5vw,2.6rem)] font-extrabold tracking-tight leading-tight mb-4">
                <span className="text-[#F0F4FF]">Une architecture</span>
                <br />
                <span className="text-gradient-section">pensée pour la croissance</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {features.map((feat, i) => (
                <div
                  key={i}
                  className="feature-card rounded-2xl p-6 border"
                  style={{
                    background: "rgba(9,17,30,0.6)",
                    borderColor: "rgba(92,147,255,0.1)",
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-5"
                    style={{
                      background: "linear-gradient(135deg, rgba(92,147,255,0.14), rgba(36,221,184,0.08))",
                      color: "#5C93FF",
                    }}
                  >
                    {feat.icon}
                  </div>
                  <h3 className="font-bold text-[15px] text-[#F0F4FF] mb-2">{feat.title}</h3>
                  <p className="text-sm text-[rgba(240,244,255,0.38)] leading-relaxed">{feat.description}</p>
                </div>
              ))}
            </div>

            {/* Tech stack pills */}
            <div className="mt-10 flex flex-wrap gap-2.5">
              {["Next.js 15", "Go 1.24", "PostgreSQL 16", "Redis", "Claude AI", "Docker"].map((tech) => (
                <span
                  key={tech}
                  className="px-3.5 py-1.5 rounded-full text-[12px] font-semibold text-[#5C93FF]"
                  style={{
                    background: "rgba(92,147,255,0.07)",
                    border: "1px solid rgba(92,147,255,0.18)",
                  }}
                >
                  {tech}
                </span>
              ))}
            </div>
          </section>

          {/* ── CTA ── */}
          <section
            className="px-6 md:px-10 lg:px-12 py-24"
            style={{ background: "#09111E" }}
          >
            <div
              className="rounded-3xl overflow-hidden relative px-8 py-14 cta-grid-bg"
              style={{ background: "#0E1929", border: "1px solid rgba(92,147,255,0.12)" }}
            >
              {/* Accent stripe */}
              <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: "linear-gradient(90deg, transparent, #24DDB8, transparent)" }} />

              {/* Glows */}
              <div className="absolute top-[-25%] left-[-5%] w-[300px] h-[300px] rounded-full pointer-events-none"
                style={{ background: "radial-gradient(circle, rgba(36,221,184,0.1) 0%, transparent 65%)" }} />
              <div className="absolute bottom-[-25%] right-[-5%] w-[280px] h-[280px] rounded-full pointer-events-none"
                style={{ background: "radial-gradient(circle, rgba(92,147,255,0.08) 0%, transparent 65%)" }} />

              <div className="relative z-10 text-center">
                <div className="inline-flex items-center gap-2 badge-green rounded-full px-4 py-1.5 mb-6">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#24DDB8]" />
                  <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "#24DDB8" }}>
                    Démarrez maintenant
                  </span>
                </div>

                <h2 className="text-[clamp(1.7rem,3.5vw,2.5rem)] font-extrabold text-[#F0F4FF] tracking-tight mb-4 leading-tight">
                  Prêt à transformer
                  <br />votre gestion ?
                </h2>
                <p className="text-[rgba(240,244,255,0.45)] text-[15px] mb-10 max-w-sm mx-auto">
                  Démarrez en 5 minutes, sans carte bancaire.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link
                    href="/signup"
                    className="hero-cta-primary inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-[15px] font-bold text-[#09111E] no-underline"
                    style={{ background: "#24DDB8", boxShadow: "0 6px 28px rgba(36,221,184,0.28)" }}
                  >
                    Commencer gratuitement
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                    </svg>
                  </Link>
                  <Link
                    href="/login"
                    className="hero-cta-secondary inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-[15px] font-semibold text-[#F0F4FF] no-underline"
                    style={{ border: "1px solid rgba(240,244,255,0.14)", background: "rgba(240,244,255,0.05)" }}
                  >
                    Compte démo
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* ── FOOTER ── */}
          <footer
            className="px-6 md:px-10 lg:px-12 py-10"
            style={{ background: "#09111E", borderTop: "1px solid rgba(92,147,255,0.08)" }}
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              {/* Logo */}
              <div className="flex items-center gap-3">
                <div
                  style={{
                    background: "#141F2E",
                    border: "1.5px solid rgba(36,221,184,0.25)",
                    boxShadow: "0 0 12px rgba(36,221,184,0.1)",
                  }}
                  className="w-7 h-7 rounded-[7px] flex items-center justify-center flex-shrink-0"
                >
                  <span style={{ color: "#24DDB8", fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: "11px", letterSpacing: "-0.5px" }}>
                    tt
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-bold text-[15px] text-[#F0F4FF] tracking-tight">stratt</span>
                  <span className="text-[11px] text-[rgba(240,244,255,0.28)]">ERP SaaS</span>
                </div>
              </div>

              {/* Links */}
              <div className="flex items-center gap-6">
                {["Confidentialité", "CGU", "Documentation"].map((l) => (
                  <a key={l} href="#" className="text-[13px] text-[rgba(240,244,255,0.32)] hover:text-[#5C93FF] transition-colors no-underline">
                    {l}
                  </a>
                ))}
              </div>

              <p className="text-[12px] text-[rgba(240,244,255,0.22)]">
                © 2026 stratt. Tous droits réservés.
              </p>
            </div>
          </footer>
        </div>

        {/* ── RIGHT COLUMN (45%) — STICKY GLOBE ── */}
        <div className="hidden lg:block w-[45%] relative flex-shrink-0">
          <div
            style={{
              position: "sticky",
              top: "62px",
              height: "calc(100vh - 62px)",
              background: "#09111E",
              borderLeft: "1px solid rgba(92,147,255,0.08)",
              overflow: "hidden",
            }}
          >
            {/* Vertical progress bar — right edge */}
            <div
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                width: "2px",
                height: "100%",
                background: "rgba(92,147,255,0.08)",
                zIndex: 20,
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: `${progressPct}%`,
                  background: "#24DDB8",
                  transition: "height 0.1s ease",
                  boxShadow: "0 0 8px rgba(36,221,184,0.4)",
                }}
              />
            </div>

            {/* Top monospace data block */}
            <div
              className="mono absolute top-5 left-5 z-20 text-[11px] leading-[1.7]"
              style={{ color: "rgba(240,244,255,0.45)" }}
            >
              <span style={{ color: "#24DDB8" }}>[SYSTEM ONLINE]</span>
              <br />
              <span style={{ color: "rgba(240,244,255,0.3)" }}>SECTION:</span>{" "}
              <span style={{ color: "#F0F4FF", fontWeight: 700 }}>{sectionLabel}</span>
              <br />
              <span style={{ color: "rgba(240,244,255,0.3)" }}>LON:</span>{" "}
              <span style={{ color: "#5C93FF" }}>{rotationDisplay}°</span>
              <br />
              <span style={{ color: "rgba(240,244,255,0.3)" }}>ARC:</span>{" "}
              <span style={{ color: "#24DDB8" }}>{arcPct}% MAPPED</span>
            </div>

            {/* Globe — centered */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* Background subtle grid */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundImage:
                    "linear-gradient(rgba(92,147,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(92,147,255,0.025) 1px, transparent 1px)",
                  backgroundSize: "44px 44px",
                  pointerEvents: "none",
                }}
              />

              {/* Corner brackets */}
              {[
                { top: 12, left: 12, borderRight: "none", borderBottom: "none" },
                { top: 12, right: 16, borderLeft: "none", borderBottom: "none" },
                { bottom: 48, left: 12, borderRight: "none", borderTop: "none" },
                { bottom: 48, right: 16, borderLeft: "none", borderTop: "none" },
              ].map((style, i) => (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    width: 20,
                    height: 20,
                    border: "1.5px solid rgba(92,147,255,0.22)",
                    ...style,
                  }}
                />
              ))}

              {mounted && (
                <div style={{ width: "min(480px, 90%)" }}>
                  <WireframeGlobe
                    rotation={globeState.rotation}
                    arcProgress={globeState.arcProgress}
                    intensity={globeState.intensity}
                  />
                </div>
              )}
            </div>

            {/* Bottom coordinate readout */}
            <div
              className="mono absolute bottom-5 left-5 right-16 z-20 text-[10px] leading-[1.8]"
              style={{ color: "rgba(240,244,255,0.28)" }}
            >
              <span style={{ color: "rgba(240,244,255,0.45)" }}>LAT 48°52&apos;N&nbsp;&nbsp;LON 2°21&apos;E</span>
              <br />
              <span style={{ color: "#24DDB8", letterSpacing: "0.08em" }}>STRATT NETWORK</span>
              <span style={{ color: "rgba(240,244,255,0.28)" }}> — </span>
              <span style={{ color: "#24DDB8" }}>ONLINE</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

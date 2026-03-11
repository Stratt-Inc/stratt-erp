import Link from "next/link";

const modules = [
  {
    id: "crm",
    name: "CRM",
    description: "Contacts, leads et opportunités",
    color: "#5B6BF5",
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
    description: "RBAC granulaire par organisation. Isolation des données garantie avec Row-Level Security PostgreSQL.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
  },
  {
    title: "IA intégrée",
    description: "Agents Claude pour automatiser vos workflows — analyse, génération documentaire et recommandations intelligentes.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
  },
  {
    title: "API-first",
    description: "Intégrez vos outils existants facilement. REST API complète avec authentification JWT et documentation OpenAPI.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
        <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
      </svg>
    ),
  },
];

const stats = [
  { value: "500+", label: "Entreprises" },
  { value: "99.9%", label: "Disponibilité" },
  { value: "7", label: "Modules intégrés" },
  { value: "24/7", label: "Support" },
];

export default function LandingPage() {
  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }} className="min-h-screen bg-[#FAFAFD] text-[#0C1033] overflow-x-hidden">

      {/* ── Global styles injected via style tag ── */}
      <style>{`
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
        .anim-fade-up { animation: fade-up 0.7s ease both; }
        .anim-fade-up-d1 { animation: fade-up 0.7s 0.12s ease both; }
        .anim-fade-up-d2 { animation: fade-up 0.7s 0.24s ease both; }
        .anim-fade-up-d3 { animation: fade-up 0.7s 0.36s ease both; }
        .anim-fade-up-d4 { animation: fade-up 0.7s 0.48s ease both; }
        .orb-1 { animation: float-slow 8s ease-in-out infinite; }
        .orb-2 { animation: float-slower 11s ease-in-out infinite 1.5s; }
        .orb-3 { animation: float-slow 9s ease-in-out infinite 3s; }
        .module-card:hover { transform: translateY(-3px); box-shadow: 0 12px 40px rgba(91,107,245,0.13); }
        .module-card { transition: transform 0.22s ease, box-shadow 0.22s ease; }
        .feature-card:hover { border-color: rgba(91,107,245,0.35); background: rgba(91,107,245,0.03); }
        .feature-card { transition: border-color 0.2s, background 0.2s; }
        .nav-cta:hover { opacity: 0.92; transform: translateY(-1px); box-shadow: 0 6px 24px rgba(91,107,245,0.35); }
        .nav-cta { transition: opacity 0.18s, transform 0.18s, box-shadow 0.18s; }
        .hero-cta-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 36px rgba(91,107,245,0.42); }
        .hero-cta-primary { transition: transform 0.2s, box-shadow 0.2s; }
        .hero-cta-secondary:hover { background: rgba(91,107,245,0.07); border-color: rgba(91,107,245,0.4); }
        .hero-cta-secondary { transition: background 0.2s, border-color 0.2s; }
        .grid-bg {
          background-image: linear-gradient(rgba(91,107,245,0.045) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(91,107,245,0.045) 1px, transparent 1px);
          background-size: 48px 48px;
        }
        .demo-badge {
          background: linear-gradient(135deg, rgba(91,107,245,0.08), rgba(155,111,232,0.08));
          border: 1px solid rgba(91,107,245,0.18);
        }
        .stat-divider:not(:last-child) { border-right: 1px solid rgba(91,107,245,0.12); }
      `}</style>

      {/* ══════════════════════════════════════════
          NAVIGATION
      ══════════════════════════════════════════ */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-10 h-[62px]"
        style={{ background: "rgba(250,250,253,0.82)", backdropFilter: "blur(14px)", borderBottom: "1px solid rgba(91,107,245,0.1)" }}>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <div style={{ background: "linear-gradient(135deg,#5B6BF5,#9B6FE8)", boxShadow: "0 4px 14px rgba(91,107,245,0.4)" }}
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="2">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
          <span className="font-bold text-[17px] text-[#0C1033]">STRATT</span>
        </Link>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-7">
          <a href="#modules" className="text-sm text-[#6B7280] hover:text-[#0C1033] transition-colors no-underline">Modules</a>
          <a href="#features" className="text-sm text-[#6B7280] hover:text-[#0C1033] transition-colors no-underline">Fonctionnalités</a>
          <Link href="/login" className="text-sm text-[#6B7280] hover:text-[#0C1033] transition-colors no-underline font-medium">
            Se connecter
          </Link>
          <Link href="/signup"
            className="nav-cta px-4 py-2 rounded-lg text-sm font-semibold text-white no-underline"
            style={{ background: "linear-gradient(135deg,#5B6BF5,#7B5BE8)" }}>
            Essayer gratuitement
          </Link>
        </div>

        {/* Mobile CTA */}
        <Link href="/signup"
          className="md:hidden nav-cta px-3.5 py-1.5 rounded-lg text-sm font-semibold text-white no-underline"
          style={{ background: "linear-gradient(135deg,#5B6BF5,#7B5BE8)" }}>
          Essayer
        </Link>
      </nav>

      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <section className="relative pt-[62px] min-h-screen flex flex-col items-center justify-center px-6 text-center overflow-hidden grid-bg">

        {/* Orb backgrounds */}
        <div className="orb-1 absolute top-[12%] left-[8%] w-[440px] h-[440px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(91,107,245,0.18) 0%, transparent 70%)", filter: "blur(1px)" }} />
        <div className="orb-2 absolute bottom-[10%] right-[6%] w-[380px] h-[380px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(155,111,232,0.16) 0%, transparent 70%)", filter: "blur(1px)" }} />
        <div className="orb-3 absolute top-[45%] right-[20%] w-[260px] h-[260px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%)", filter: "blur(1px)" }} />

        {/* Content */}
        <div className="relative z-10 max-w-[820px] mx-auto">
          {/* Badge */}
          <div className="anim-fade-up inline-flex items-center gap-2 demo-badge rounded-full px-4 py-1.5 mb-8">
            <span style={{ color: "#5B6BF5" }} className="text-xs font-semibold tracking-wide">✦ NOUVEAU</span>
            <span className="text-xs text-[#6B7280]">Agents IA Claude intégrés pour vos workflows</span>
          </div>

          {/* Headline */}
          <h1 className="anim-fade-up-d1 text-[clamp(2.4rem,6vw,4.2rem)] font-extrabold leading-[1.1] tracking-[-0.03em] mb-6">
            <span className="text-gradient-primary">L&apos;ERP Moderne</span>
            <br />
            <span className="text-[#0C1033]">pour Entreprises</span>
            <br />
            <span className="text-[#0C1033]">Ambitieuses</span>
          </h1>

          {/* Subtext */}
          <p className="anim-fade-up-d2 text-[clamp(1rem,2vw,1.2rem)] text-[#6B7280] max-w-[560px] mx-auto mb-10 leading-relaxed">
            Gérez vos ventes, finances, stocks, RH et achats depuis une seule plateforme intelligente.
          </p>

          {/* CTAs */}
          <div className="anim-fade-up-d3 flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Link href="/signup"
              className="hero-cta-primary inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-[15px] font-bold text-white no-underline"
              style={{ background: "linear-gradient(135deg,#5B6BF5,#7B5BE8)", boxShadow: "0 6px 28px rgba(91,107,245,0.32)" }}>
              Commencer gratuitement
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
            <Link href="/login"
              className="hero-cta-secondary inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-[15px] font-semibold text-[#0C1033] no-underline border border-[#E2E4F0] bg-white">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              Voir la démo
            </Link>
          </div>

          {/* Demo credentials badge */}
          <div className="anim-fade-up-d4 inline-flex items-center gap-2 px-4 py-2 rounded-full demo-badge">
            <span style={{ color: "#5B6BF5" }} className="text-xs">✦</span>
            <span className="text-xs text-[#6B7280]">Accès démo immédiat —</span>
            <code className="text-xs font-mono text-[#5B6BF5] font-semibold">admin@stratt.io</code>
            <span className="text-xs text-[#9CA3AF]">/</span>
            <code className="text-xs font-mono text-[#5B6BF5] font-semibold">admin1234</code>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 opacity-40">
          <span className="text-[11px] tracking-[0.1em] uppercase text-[#6B7280]">Découvrir</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          STATS BAR
      ══════════════════════════════════════════ */}
      <section className="border-y border-[rgba(91,107,245,0.1)] bg-white">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4">
          {stats.map((stat, i) => (
            <div key={i} className={`stat-divider flex flex-col items-center justify-center py-8 px-6 gap-1`}>
              <span className="text-[2rem] font-extrabold tracking-tight text-gradient-primary" style={{ fontVariantNumeric: "tabular-nums" }}>
                {stat.value}
              </span>
              <span className="text-[11px] uppercase tracking-[0.1em] text-[#9CA3AF] font-medium">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          MODULES
      ══════════════════════════════════════════ */}
      <section id="modules" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 demo-badge rounded-full px-4 py-1.5 mb-4">
              <span style={{ color: "#5B6BF5" }} className="text-xs font-semibold tracking-wide">7 MODULES</span>
            </div>
            <h2 className="text-[clamp(1.8rem,4vw,2.8rem)] font-extrabold tracking-tight text-[#0C1033] mb-4">
              Tout ce dont votre<br />
              <span className="text-gradient-primary">entreprise a besoin</span>
            </h2>
            <p className="text-[#6B7280] max-w-md mx-auto text-[15px] leading-relaxed">
              Activez uniquement les modules dont vous avez besoin. Chaque module est indépendant et interconnecté.
            </p>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {modules.map((mod) => (
              <div key={mod.id} className="module-card bg-white rounded-2xl p-6 border border-[#E8EAF0] cursor-default">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center"
                    style={{ background: `${mod.color}14`, color: mod.color }}>
                    {mod.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-[15px] text-[#0C1033] mb-1">{mod.name}</h3>
                    <p className="text-sm text-[#6B7280] leading-snug">{mod.description}</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-[#F0F1F8] flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: mod.color }} />
                  <span className="text-[11px] text-[#9CA3AF] uppercase tracking-[0.08em] font-medium">Inclus dans tous les plans</span>
                </div>
              </div>
            ))}

            {/* CTA card */}
            <div className="module-card rounded-2xl p-6 border border-dashed border-[rgba(91,107,245,0.3)] flex flex-col items-center justify-center text-center gap-3 cursor-default"
              style={{ background: "linear-gradient(135deg, rgba(91,107,245,0.04), rgba(155,111,232,0.04))" }}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg,#5B6BF5,#9B6FE8)" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </div>
              <div>
                <p className="font-bold text-[14px] text-[#0C1033]">D&apos;autres modules</p>
                <p className="text-[12px] text-[#9CA3AF] mt-0.5">à venir prochainement</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FEATURES
      ══════════════════════════════════════════ */}
      <section id="features" className="py-24 px-6" style={{ background: "linear-gradient(180deg, #F4F5FE 0%, #FAFAFD 100%)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 demo-badge rounded-full px-4 py-1.5 mb-4">
              <span style={{ color: "#5B6BF5" }} className="text-xs font-semibold tracking-wide">CONÇU POUR L&apos;ENTREPRISE</span>
            </div>
            <h2 className="text-[clamp(1.8rem,4vw,2.8rem)] font-extrabold tracking-tight text-[#0C1033] mb-4">
              Une architecture<br />
              <span className="text-gradient-primary">pensée pour la croissance</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feat, i) => (
              <div key={i} className="feature-card bg-white rounded-2xl p-7 border border-[#E8EAF0]">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: "linear-gradient(135deg, rgba(91,107,245,0.12), rgba(155,111,232,0.12))", color: "#5B6BF5" }}>
                  {feat.icon}
                </div>
                <h3 className="font-bold text-[16px] text-[#0C1033] mb-2">{feat.title}</h3>
                <p className="text-sm text-[#6B7280] leading-relaxed">{feat.description}</p>
              </div>
            ))}
          </div>

          {/* Tech stack pills */}
          <div className="mt-12 flex flex-wrap justify-center gap-3">
            {["Next.js 15", "Go 1.24", "PostgreSQL 16", "Redis", "Claude AI", "Docker"].map((tech) => (
              <span key={tech} className="px-3.5 py-1.5 rounded-full text-[12px] font-semibold text-[#5B6BF5] border border-[rgba(91,107,245,0.2)]"
                style={{ background: "rgba(91,107,245,0.06)" }}>
                {tech}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FINAL CTA
      ══════════════════════════════════════════ */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-3xl overflow-hidden relative text-center px-8 py-16"
            style={{ background: "linear-gradient(135deg, #3D4FE8 0%, #6B3FD4 60%, #9B3FAD 100%)" }}>
            {/* BG orbs */}
            <div className="absolute top-[-20%] left-[-10%] w-[300px] h-[300px] rounded-full pointer-events-none"
              style={{ background: "radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)" }} />
            <div className="absolute bottom-[-20%] right-[-10%] w-[280px] h-[280px] rounded-full pointer-events-none"
              style={{ background: "radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)" }} />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full"
                style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)" }}>
                <span className="text-xs font-semibold text-white tracking-wide">DÉMARREZ MAINTENANT</span>
              </div>
              <h2 className="text-[clamp(1.8rem,4vw,2.8rem)] font-extrabold text-white tracking-tight mb-4 leading-tight">
                Prêt à transformer<br />votre gestion ?
              </h2>
              <p className="text-white/75 text-[15px] mb-10 max-w-sm mx-auto">
                Démarrez en 5 minutes, sans carte bancaire.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/signup"
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-[15px] font-bold text-[#3D4FE8] no-underline"
                  style={{ background: "#FFFFFF", boxShadow: "0 8px 28px rgba(0,0,0,0.18)" }}>
                  Commencer gratuitement
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                  </svg>
                </Link>
                <Link href="/login"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-[15px] font-semibold text-white no-underline"
                  style={{ border: "1px solid rgba(255,255,255,0.35)", background: "rgba(255,255,255,0.1)" }}>
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
      <footer className="border-t border-[#E8EAF0] py-10 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo + tagline */}
          <div className="flex items-center gap-3">
            <div style={{ background: "linear-gradient(135deg,#5B6BF5,#9B6FE8)", boxShadow: "0 4px 14px rgba(91,107,245,0.3)" }}
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="2">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>
            <div>
              <span className="font-bold text-[15px] text-[#0C1033]">STRATT</span>
              <span className="text-[11px] text-[#9CA3AF] ml-2">ERP SaaS</span>
            </div>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6">
            <a href="#" className="text-[13px] text-[#9CA3AF] hover:text-[#5B6BF5] transition-colors no-underline">Confidentialité</a>
            <a href="#" className="text-[13px] text-[#9CA3AF] hover:text-[#5B6BF5] transition-colors no-underline">CGU</a>
            <a href="#" className="text-[13px] text-[#9CA3AF] hover:text-[#5B6BF5] transition-colors no-underline">Documentation</a>
          </div>

          {/* Copyright */}
          <p className="text-[12px] text-[#9CA3AF]">
            © 2026 STRATT. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  );
}

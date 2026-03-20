"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { ApiError } from "@/lib/api";
import { StrattWordmark } from "@/components/BrandLogo";
import { Shield, Users, Calculator, Package, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);

  const demoAccounts = [
    {
      id: "admin",
      label: "Admin",
      desc: "Accès complet",
      email: "admin@stratt.io",
      password: "admin1234",
      icon: Shield,
      color: "#5C93FF",
      bg: "rgba(92,147,255,0.08)",
      border: "rgba(92,147,255,0.20)",
    },
    {
      id: "commercial",
      label: "Commercial",
      desc: "CRM · Facturation",
      email: "commercial@stratt.io",
      password: "demo1234",
      icon: Users,
      color: "#F59E0B",
      bg: "rgba(245,158,11,0.08)",
      border: "rgba(245,158,11,0.20)",
    },
    {
      id: "comptable",
      label: "Comptable",
      desc: "Comptabilité · Billing",
      email: "comptable@stratt.io",
      password: "demo1234",
      icon: Calculator,
      color: "#10B981",
      bg: "rgba(16,185,129,0.08)",
      border: "rgba(16,185,129,0.20)",
    },
    {
      id: "logistique",
      label: "Logisticien",
      desc: "Inventaire · Achats",
      email: "logistique@stratt.io",
      password: "demo1234",
      icon: Package,
      color: "#8B5CF6",
      bg: "rgba(139,92,246,0.08)",
      border: "rgba(139,92,246,0.20)",
    },
  ];

  async function handleDemoLogin(account: typeof demoAccounts[0]) {
    if (demoLoading) return;
    setDemoLoading(account.id);
    setError("");
    try {
      await login(account.email, account.password);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Une erreur est survenue");
    } finally {
      setDemoLoading(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative space-y-8">
      {/* StrattWordmark watermark */}
      <div
        className="absolute pointer-events-none select-none"
        style={{
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -52%)",
          opacity: 0.035,
          zIndex: 0,
        }}
      >
        <StrattWordmark width={480} color="#000000" />
      </div>
      <div className="relative z-10">
        <h2 className="text-2xl font-bold text-foreground">Connexion</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Bienvenue sur la démo STRATT ERP
        </p>
      </div>

      <form onSubmit={handleSubmit} className="relative z-10 space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium text-foreground">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vous@exemple.com"
            className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm font-medium text-foreground">
            Mot de passe
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
          />
        </div>

        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-xs text-muted-foreground hover:text-primary">
            Mot de passe oublié ?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: "hsl(var(--accent))", color: "hsl(var(--sidebar))" }}
        >
          {loading ? "Connexion…" : "Se connecter"}
        </button>
      </form>

      <div className="relative z-10 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
            Accès démo
          </span>
          <span
            className="flex-1 h-px"
            style={{ background: "rgba(92,147,255,0.12)" }}
          />
          <span className="text-[9px] text-muted-foreground/60 font-medium">
            1 clic pour se connecter
          </span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {demoAccounts.map((account) => {
            const Icon = account.icon;
            const isActive = demoLoading === account.id;
            return (
              <button
                key={account.id}
                type="button"
                onClick={() => handleDemoLogin(account)}
                disabled={!!demoLoading}
                className="group relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  background: isActive ? account.bg : "transparent",
                  border: `1px solid ${isActive ? account.color + "44" : account.border}`,
                }}
                onMouseEnter={(e) => {
                  if (!demoLoading) {
                    (e.currentTarget as HTMLButtonElement).style.background = account.bg;
                    (e.currentTarget as HTMLButtonElement).style.borderColor = account.color + "44";
                    (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                    (e.currentTarget as HTMLButtonElement).style.borderColor = account.border;
                    (e.currentTarget as HTMLButtonElement).style.transform = "";
                  }
                }}
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: account.bg, color: account.color }}
                >
                  {isActive
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <Icon className="w-3.5 h-3.5" strokeWidth={2} />
                  }
                </div>
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold text-foreground leading-none">
                    {account.label}
                  </p>
                  <p className="text-[10px] mt-0.5 truncate" style={{ color: account.color + "cc" }}>
                    {account.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

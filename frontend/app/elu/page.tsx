"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2, AlertTriangle, TrendingUp, TrendingDown,
  BarChart3, Clock, Loader2, ShieldCheck, Users,
} from "lucide-react";

interface EluStats {
  year: number;
  total_montant: number;
  total_marches: number;
  en_cours: number;
  termines: number;
  alertes: number;
  conformite: number;
  top_services: { name: string; total: number }[];
  generated_at: string;
}

function fmtEur(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)} M€`;
  if (v >= 1_000) return `${Math.round(v / 1_000)} k€`;
  return `${Math.round(v)} €`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function EluPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [stats, setStats] = useState<EluStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setError("Lien invalide — aucun token fourni.");
      setLoading(false);
      return;
    }

    const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
    fetch(`${base}/api/public/share/${token}/stats`)
      .then((r) => {
        if (!r.ok) throw new Error("Token invalide ou expiré");
        return r.json();
      })
      .then((res) => {
        setStats(res.data);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="font-medium">Chargement du tableau de bord…</span>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-8 max-w-md text-center">
          <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-slate-800 mb-2">Lien expiré ou invalide</h2>
          <p className="text-sm text-slate-500">{error ?? "Ce tableau de bord n'est plus accessible."}</p>
          <p className="text-xs text-slate-400 mt-3">Demandez un nouveau lien à votre service achats.</p>
        </div>
      </div>
    );
  }

  const conformiteColor = stats.conformite >= 80 ? "#059669" : stats.conformite >= 50 ? "#d97706" : "#dc2626";
  const maxService = Math.max(...stats.top_services.map((s) => s.total), 1);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Tableau de bord élu — Lecture seule
              </span>
            </div>
            <h1 className="text-xl font-extrabold text-slate-900" style={{ letterSpacing: "-0.025em" }}>
              Achats publics — Exercice {stats.year}
            </h1>
          </div>
          <div className="text-right hidden sm:block">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Dernière mise à jour</div>
            <div className="text-xs font-semibold text-slate-600">{fmtDate(stats.generated_at)}</div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: "Volume total",
              value: fmtEur(stats.total_montant),
              icon: BarChart3,
              color: "#1d4ed8",
              bg: "#eff6ff",
            },
            {
              label: "Marchés passés",
              value: stats.total_marches,
              icon: Users,
              color: "#7c3aed",
              bg: "#f5f3ff",
            },
            {
              label: "En cours",
              value: stats.en_cours,
              icon: Clock,
              color: "#d97706",
              bg: "#fffbeb",
            },
            {
              label: "Conformité procédures",
              value: `${Math.round(stats.conformite)}%`,
              icon: ShieldCheck,
              color: conformiteColor,
              bg: stats.conformite >= 80 ? "#f0fdf4" : "#fef9c3",
            },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
                <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: bg }}>
                  <Icon className="w-3.5 h-3.5" style={{ color }} />
                </div>
              </div>
              <div className="text-2xl font-extrabold" style={{ color, letterSpacing: "-0.03em" }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Statuts */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
            État des marchés
          </h2>
          <div className="flex flex-wrap gap-3">
            {[
              { label: "Terminés", count: stats.termines, color: "#059669", bg: "#d1fae5" },
              { label: "En cours", count: stats.en_cours, color: "#2563eb", bg: "#dbeafe" },
              { label: "En alerte", count: stats.alertes, color: "#dc2626", bg: "#fee2e2" },
            ].map(({ label, count, color, bg }) => (
              <div key={label}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: bg, color }}
              >
                {label === "Terminés" && <CheckCircle2 className="w-4 h-4" />}
                {label === "En cours" && <Clock className="w-4 h-4" />}
                {label === "En alerte" && <AlertTriangle className="w-4 h-4" />}
                <span>{count}</span>
                <span className="text-xs font-medium opacity-70">{label}</span>
              </div>
            ))}
          </div>

          {stats.alertes > 0 && (
            <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-100 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-red-700">
                <span className="font-semibold">{stats.alertes} marché(s) en alerte</span> —
                votre service achats a été informé. Aucune action requise de votre part.
              </div>
            </div>
          )}
        </div>

        {/* Top services */}
        {stats.top_services.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
              Répartition par direction / service
            </h2>
            <div className="space-y-3">
              {stats.top_services.map((s, i) => {
                const pct = (s.total / maxService) * 100;
                const colors = ["#1d4ed8", "#7c3aed", "#059669", "#d97706", "#dc2626"];
                return (
                  <div key={s.name}>
                    <div className="flex items-center justify-between mb-1.5 text-sm">
                      <span className="font-medium text-slate-700">{s.name}</span>
                      <span className="font-semibold text-slate-500 tabular-nums">{fmtEur(s.total)}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, background: colors[i % colors.length] }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Conformité */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
            Conformité des procédures
          </h2>
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20 flex-shrink-0">
              <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15.9" fill="none"
                  stroke={conformiteColor} strokeWidth="3"
                  strokeDasharray={`${stats.conformite} ${100 - stats.conformite}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-base font-extrabold" style={{ color: conformiteColor }}>
                  {Math.round(stats.conformite)}%
                </span>
              </div>
            </div>
            <div className="flex-1">
              {stats.conformite >= 80 ? (
                <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                  <CheckCircle2 className="w-4 h-4" /> Taux de conformité satisfaisant
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm font-semibold text-amber-700">
                  <TrendingDown className="w-4 h-4" /> Conformité à améliorer
                </div>
              )}
              <p className="text-xs text-slate-500 mt-1">
                {Math.round(stats.conformite)}% des marchés ont une procédure renseignée.
                Objectif : 90% minimum.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-4 border-t border-slate-200">
          <p className="text-xs text-slate-400">
            Tableau de bord en lecture seule · Données de l&apos;exercice {stats.year} ·{" "}
            Mis à jour automatiquement · <span className="font-medium">STRATT ERP</span>
          </p>
          <p className="text-[10px] text-slate-300 mt-1">
            Ce lien est partagé par votre service achats. Il expire automatiquement.
          </p>
        </div>

      </div>
    </div>
  );
}

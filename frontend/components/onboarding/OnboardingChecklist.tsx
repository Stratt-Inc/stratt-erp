"use client";

import { useState, useEffect } from "react";
import { CheckCircle, Circle, ChevronDown, ChevronUp, X } from "lucide-react";
import { restartTour } from "./OnboardingTour";

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  href?: string;
  storageKey: string;
}

const CHECKLIST: ChecklistItem[] = [
  {
    id: "org",
    label: "Créer votre organisation",
    description: "Renseignez le nom, le SIRET et les coordonnées de votre collectivité.",
    href: "/organizations",
    storageKey: "stratt_done_org",
  },
  {
    id: "members",
    label: "Inviter des collaborateurs",
    description: "Ajoutez vos agents acheteurs et définissez leurs rôles.",
    href: "/administration",
    storageKey: "stratt_done_members",
  },
  {
    id: "marche",
    label: "Créer votre premier marché",
    description: "Saisissez une procédure d'achat pour tester le module marchés.",
    href: "/marches",
    storageKey: "stratt_done_marche",
  },
  {
    id: "decp",
    label: "Exporter les DECP",
    description: "Vérifiez la conformité de vos données essentielles et exportez le JSON.",
    href: "/decp",
    storageKey: "stratt_done_decp",
  },
  {
    id: "tour",
    label: "Suivre le tour guidé",
    description: "Découvrez toutes les fonctionnalités en 2 minutes.",
    storageKey: "stratt_tour_completed",
  },
];

const DISMISS_KEY = "stratt_checklist_dismissed";

export function OnboardingChecklist() {
  const [items, setItems] = useState<Record<string, boolean>>({});
  const [collapsed, setCollapsed] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setDismissed(!!localStorage.getItem(DISMISS_KEY));
    const state: Record<string, boolean> = {};
    for (const item of CHECKLIST) {
      state[item.id] = !!localStorage.getItem(item.storageKey);
    }
    setItems(state);
  }, []);

  const toggle = (id: string, storageKey: string) => {
    const next = !items[id];
    setItems((prev) => ({ ...prev, [id]: next }));
    if (next) localStorage.setItem(storageKey, "1");
    else localStorage.removeItem(storageKey);
  };

  const completed = Object.values(items).filter(Boolean).length;
  const total = CHECKLIST.length;
  const pct = Math.round((completed / total) * 100);
  const allDone = completed === total;

  if (dismissed || allDone) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40 w-80 rounded-2xl overflow-hidden" style={{ background: "hsl(216 48% 8%)", border: "1px solid rgba(92,147,255,0.15)", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer"
        style={{ background: "linear-gradient(135deg, #5C93FF, #24DDB8)" }}
        onClick={() => setCollapsed((v) => !v)}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold">Démarrage rapide</p>
            <p className="text-white/70 text-xs">{completed}/{total} étapes — {pct}%</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {collapsed ? (
            <ChevronUp size={16} className="text-white/80" />
          ) : (
            <ChevronDown size={16} className="text-white/80" />
          )}
          <button
            onClick={(e) => { e.stopPropagation(); setDismissed(true); localStorage.setItem(DISMISS_KEY, "1"); }}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-muted">
        <div
          className="h-1 transition-all duration-500"
          style={{ width: `${pct}%`, background: "linear-gradient(90deg, #5C93FF, #24DDB8)" }}
        />
      </div>

      {/* Checklist */}
      {!collapsed && (
        <div className="divide-y divide-border">
          {CHECKLIST.map((item) => (
            <div key={item.id} className="flex items-start gap-3 px-4 py-3">
              <button
                onClick={() => toggle(item.id, item.storageKey)}
                className="mt-0.5 shrink-0 transition-colors"
              >
                {items[item.id] ? (
                  <CheckCircle size={18} style={{ color: "#10B981" }} />
                ) : (
                  <Circle size={18} className="text-muted-foreground/40" />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${items[item.id] ? "line-through text-muted-foreground" : "text-foreground"}`}>
                  {item.label}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  {item.description}
                </p>
                {item.id === "tour" && !items[item.id] && (
                  <button
                    onClick={() => restartTour()}
                    className="text-xs mt-1 hover:underline"
                    style={{ color: "#5C93FF" }}
                  >
                    Lancer le tour →
                  </button>
                )}
                {item.href && !items[item.id] && (
                  <a href={item.href} className="text-xs mt-1 block hover:underline" style={{ color: "#5C93FF" }}>
                    Aller → {item.href}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

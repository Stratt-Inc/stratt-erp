"use client";

import { useState, useEffect, useCallback } from "react";
import { X, ChevronRight, ChevronLeft, Zap } from "lucide-react";

export interface TourStep {
  target: string; // CSS selector
  title: string;
  content: string;
  position?: "top" | "bottom" | "left" | "right";
}

const TOUR_STEPS: TourStep[] = [
  {
    target: "[data-tour='dashboard']",
    title: "Tableau de bord",
    content: "Vue d'ensemble de votre activité : marchés en cours, alertes, indicateurs clés.",
    position: "right",
  },
  {
    target: "[data-tour='marches']",
    title: "Marchés publics",
    content: "Gérez vos procédures d'achat de A à Z — de la planification à la notification.",
    position: "right",
  },
  {
    target: "[data-tour='boamp']",
    title: "Veille BOAMP",
    content: "Surveillez les appels d'offres publiés au BOAMP. Configurez des alertes par CPV ou mot-clé.",
    position: "right",
  },
  {
    target: "[data-tour='decp']",
    title: "DECP — Données essentielles",
    content: "Exportez et publiez vos données essentielles sur data.gouv.fr en un clic (obligation réglementaire).",
    position: "right",
  },
  {
    target: "[data-tour='crm']",
    title: "Fournisseurs",
    content: "Gérez votre panel fournisseurs, enrichissez-les via SIRENE et suivez les relations commerciales.",
    position: "right",
  },
  {
    target: "[data-tour='settings']",
    title: "Paramètres",
    content: "Configurez votre organisation, les rôles utilisateurs et les modules activés.",
    position: "right",
  },
];

const STORAGE_KEY = "stratt_tour_completed";

function getElementRect(selector: string): DOMRect | null {
  const el = document.querySelector(selector);
  if (!el) return null;
  return el.getBoundingClientRect();
}

interface TooltipStyle {
  top: number;
  left: number;
  maxWidth: number;
}

function computePosition(rect: DOMRect, position: TourStep["position"] = "right"): TooltipStyle {
  const pad = 12;
  const w = 280;
  switch (position) {
    case "right":
      return { top: rect.top + rect.height / 2 - 80, left: rect.right + pad, maxWidth: w };
    case "left":
      return { top: rect.top + rect.height / 2 - 80, left: rect.left - w - pad, maxWidth: w };
    case "bottom":
      return { top: rect.bottom + pad, left: rect.left + rect.width / 2 - w / 2, maxWidth: w };
    case "top":
    default:
      return { top: rect.top - 170 - pad, left: rect.left + rect.width / 2 - w / 2, maxWidth: w };
  }
}

export function OnboardingTour() {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [tooltipStyle, setTooltipStyle] = useState<TooltipStyle | null>(null);
  const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties | null>(null);

  const currentStep = TOUR_STEPS[step];

  const updatePositions = useCallback(() => {
    const rect = getElementRect(currentStep.target);
    if (!rect) return;
    setTooltipStyle(computePosition(rect, currentStep.position));
    setHighlightStyle({
      top: rect.top - 4,
      left: rect.left - 4,
      width: rect.width + 8,
      height: rect.height + 8,
    });
  }, [currentStep]);

  useEffect(() => {
    if (!active) return;
    updatePositions();
    window.addEventListener("resize", updatePositions);
    return () => window.removeEventListener("resize", updatePositions);
  }, [active, updatePositions]);

  useEffect(() => {
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done) {
      const t = setTimeout(() => setActive(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  const finish = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setActive(false);
  };

  const next = () => {
    if (step < TOUR_STEPS.length - 1) setStep((s) => s + 1);
    else finish();
  };

  const prev = () => setStep((s) => Math.max(0, s - 1));

  if (!active) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9998]"
        style={{ background: "rgba(0,0,0,0.55)" }}
        onClick={finish}
      />

      {/* Highlight ring */}
      {highlightStyle && (
        <div
          className="fixed z-[9999] rounded-xl pointer-events-none"
          style={{
            ...highlightStyle,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.55), 0 0 0 2px #5B6BF5",
            transition: "all 0.2s ease",
          }}
        />
      )}

      {/* Tooltip */}
      {tooltipStyle && (
        <div
          className="fixed z-[10000] bg-white rounded-2xl shadow-2xl p-5"
          style={{
            top: tooltipStyle.top,
            left: tooltipStyle.left,
            width: tooltipStyle.maxWidth,
            transition: "all 0.2s ease",
          }}
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "linear-gradient(135deg, #5B6BF5, #9B6FE8)" }}
              >
                <Zap size={14} className="text-white fill-white" />
              </div>
              <p className="text-sm font-bold text-gray-900">{currentStep.title}</p>
            </div>
            <button
              onClick={finish}
              className="text-gray-400 hover:text-gray-600 p-0.5 rounded"
            >
              <X size={14} />
            </button>
          </div>

          <p className="text-sm text-gray-600 leading-relaxed mb-4">
            {currentStep.content}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              {TOUR_STEPS.map((_, i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full transition-colors"
                  style={{ background: i === step ? "#5B6BF5" : "#E5E7EB" }}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              {step > 0 && (
                <button
                  onClick={prev}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <ChevronLeft size={13} />
                  Précédent
                </button>
              )}
              <button
                onClick={next}
                className="flex items-center gap-1 px-3 py-1.5 text-xs text-white rounded-lg"
                style={{ background: "linear-gradient(135deg, #5B6BF5, #9B6FE8)" }}
              >
                {step < TOUR_STEPS.length - 1 ? (
                  <>Suivant <ChevronRight size={13} /></>
                ) : (
                  "Terminer"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function restartTour() {
  localStorage.removeItem(STORAGE_KEY);
  window.location.reload();
}

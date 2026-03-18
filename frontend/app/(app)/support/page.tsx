"use client";

import { DemoBanner } from "@/components/DemoBanner";
import { useDemoAction } from "@/store/toast";
import { LifeBuoy, BookOpen, Mail, Clock, PlayCircle, Award } from "lucide-react";

const modules = [
  { title: "Introduction à la plateforme", duration: "20 min", done: true },
  { title: "Gestion de la nomenclature", duration: "35 min", done: true },
  { title: "Planification des marchés publics", duration: "40 min", done: false },
  { title: "Cartographie des dépenses", duration: "25 min", done: false },
  { title: "Génération de documents", duration: "20 min", done: false },
  { title: "Conformité et alertes réglementaires", duration: "30 min", done: false },
];

const sessions = [
  { date: "18/03/2026", sujet: "Initiation planification marchés", places: "3 places" },
  { date: "25/03/2026", sujet: "Cartographie avancée", places: "5 places" },
  { date: "08/04/2026", sujet: "Conformité et réglementation", places: "8 places" },
];

export default function SupportPage() {
  const demo = useDemoAction();
  const doneDuration = 55;
  const totalDuration = 170;
  const pct = Math.round((doneDuration / totalDuration) * 100);

  return (
    <div className="space-y-6">
      <DemoBanner />

      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(36,221,184,0.1)" }}>
            <LifeBuoy className="w-3.5 h-3.5" style={{ color: "#24DDB8" }} />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Support & Formation</h1>
        </div>
        <p className="text-sm text-muted-foreground">Ressources pédagogiques et assistance technique</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formation */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-foreground">Parcours de formation</h2>
              <span className="text-xs text-muted-foreground">{pct}% complété</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${pct}%`, background: "#5C93FF" }}
              />
            </div>
          </div>
          <div className="divide-y divide-border">
            {modules.map((m, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                    m.done ? "" : "border-2 border-border"
                  }`}
                  style={m.done ? { background: "#5C93FF" } : {}}
                >
                  {m.done ? (
                    <Award className="w-3.5 h-3.5 text-white" />
                  ) : (
                    <PlayCircle className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${m.done ? "text-foreground" : "text-muted-foreground"}`}>
                    {m.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{m.duration}</p>
                </div>
                {m.done && (
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full font-semibold flex-shrink-0"
                    style={{ background: "rgba(92,147,255,0.1)", color: "#5C93FF" }}
                  >
                    Complété
                  </span>
                )}
              </div>
            ))}
          </div>
          <div className="px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">Durée totale : 2h50 · Inclus dans votre abonnement</p>
          </div>
        </div>

        {/* Assistance */}
        <div className="space-y-4">
          <div className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(92,147,255,0.1)" }}>
                <Mail className="w-4 h-4" style={{ color: "#5C93FF" }} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Assistance par email</h3>
                <p className="text-xs text-muted-foreground">support@stratt.io</p>
              </div>
            </div>
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Lun–Ven, 9h–18h (heure de Paris)</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Délai de réponse : moins de 4h ouvrées</span>
              </div>
            </div>
            <button
              onClick={demo}
              className="w-full py-2 rounded-lg text-sm font-semibold text-white"
              style={{ background: "#5C93FF" }}
            >
              Contacter le support
            </button>
          </div>

          <div className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(36,221,184,0.1)" }}>
                <BookOpen className="w-4 h-4" style={{ color: "#24DDB8" }} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Documentation</h3>
                <p className="text-xs text-muted-foreground">Base de connaissances en ligne</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Guides utilisateurs, FAQ, tutoriels vidéo et documentation réglementaire sur les achats publics français.
            </p>
            <button onClick={demo} className="w-full py-2 rounded-lg text-sm font-semibold border border-border text-foreground hover:bg-muted/50 transition-colors">
              Accéder à la documentation
            </button>
          </div>

          <div className="bg-card rounded-xl border border-border p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Sessions de formation à venir
            </h3>
            <div className="space-y-2">
              {sessions.map((s) => (
                <div key={s.date} className="flex items-center justify-between">
                  <div className="min-w-0">
                    <span className="text-xs font-mono font-semibold text-foreground">{s.date}</span>
                    <span className="text-xs text-muted-foreground ml-2">{s.sujet}</span>
                  </div>
                  <span className="text-xs font-medium flex-shrink-0 ml-2" style={{ color: "#5C93FF" }}>
                    {s.places}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

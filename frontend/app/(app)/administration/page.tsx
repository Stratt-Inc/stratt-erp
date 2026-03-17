"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { DemoBanner } from "@/components/DemoBanner";
import { useDemoAction } from "@/store/toast";
import {
  Shield, Users, Settings, ClipboardList, BookOpen, Plus,
  ChevronRight, Lock, Server, Calendar,
} from "lucide-react";

/* ── Static demo data ── */
const demoUsers = [
  { nom: "Martin Dupont", email: "m.dupont@metropole-lyon.fr", role: "Administrateur", service: "Direction Achats", connexion: "04/03/2026" },
  { nom: "Sophie Martin", email: "s.martin@metropole-lyon.fr", role: "Direction", service: "DGA Finances", connexion: "03/03/2026" },
  { nom: "Pierre Lefebvre", email: "p.lefebvre@metropole-lyon.fr", role: "Service achats", service: "DGA Infrastructures", connexion: "04/03/2026" },
  { nom: "Claire Moreau", email: "c.moreau@metropole-lyon.fr", role: "Service achats", service: "DGA Éducation", connexion: "02/03/2026" },
  { nom: "Jean Rousseau", email: "j.rousseau@metropole-lyon.fr", role: "Lecture seule", service: "DGA Environnement", connexion: "28/02/2026" },
  { nom: "Marie Bernard", email: "m.bernard@metropole-lyon.fr", role: "Service achats", service: "DGA Numérique", connexion: "04/03/2026" },
];

const roleConfig: Record<string, { bg: string; color: string; border: string }> = {
  "Administrateur": { bg: "rgba(92,147,255,0.1)", color: "#5C93FF", border: "rgba(92,147,255,0.2)" },
  "Direction": { bg: "rgba(16,185,129,0.08)", color: "#10B981", border: "rgba(16,185,129,0.2)" },
  "Service achats": { bg: "rgba(6,182,212,0.08)", color: "#06B6D4", border: "rgba(6,182,212,0.2)" },
  "Lecture seule": { bg: "rgba(107,114,128,0.08)", color: "#6B7280", border: "rgba(107,114,128,0.2)" },
};

const journalEntries = [
  { action: "Connexion", utilisateur: "M. Dupont", date: "04/03/2026 09:12", detail: "Accès tableau de bord stratégique" },
  { action: "Modification", utilisateur: "S. Martin", date: "03/03/2026 16:45", detail: "Mise à jour nomenclature v3.2" },
  { action: "Export", utilisateur: "P. Lefebvre", date: "03/03/2026 14:20", detail: "Génération document d'implémentation PDF" },
  { action: "Création", utilisateur: "M. Dupont", date: "03/03/2026 11:05", detail: "Nouveau marché M2026-055 — Mobilier scolaire" },
  { action: "Validation", utilisateur: "M. Bernard", date: "02/03/2026 15:30", detail: "Validation nomenclature PI/TIC par DGA Numérique" },
  { action: "Connexion", utilisateur: "C. Moreau", date: "02/03/2026 08:30", detail: "Accès module planification" },
];

const actionColors: Record<string, { bg: string; color: string }> = {
  "Connexion": { bg: "rgba(92,147,255,0.1)", color: "#5C93FF" },
  "Modification": { bg: "rgba(245,158,11,0.1)", color: "#F59E0B" },
  "Export": { bg: "rgba(6,182,212,0.1)", color: "#06B6D4" },
  "Création": { bg: "rgba(16,185,129,0.1)", color: "#10B981" },
  "Validation": { bg: "rgba(99,102,241,0.1)", color: "#6366F1" },
};

const tabs = [
  { id: "utilisateurs", label: "Utilisateurs", icon: Users },
  { id: "parametres", label: "Paramètres", icon: Settings },
  { id: "journal", label: "Journal", icon: ClipboardList },
  { id: "support", label: "Support", icon: BookOpen },
];

interface Member { id: string; user: { name: string; email: string }; status: string; }

export default function AdministrationPage() {
  const [activeTab, setActiveTab] = useState("utilisateurs");
  const demo = useDemoAction();
  const { accessToken, currentOrg } = useAuthStore();
  const opts = { token: accessToken ?? "", orgId: currentOrg?.id };

  const { data: members = [] } = useQuery<Member[]>({
    queryKey: ["org-members", currentOrg?.id],
    queryFn: () => api.get(`/api/v1/organizations/${currentOrg?.id}/members`, opts),
    enabled: !!accessToken && !!currentOrg && activeTab === "utilisateurs",
  });

  /* Merge API members into demo users for display */
  const displayUsers = members.length > 0
    ? members.map((m) => ({
        nom: m.user?.name ?? "—",
        email: m.user?.email ?? "—",
        role: "Service achats",
        service: "—",
        connexion: "—",
      }))
    : demoUsers;

  return (
    <div className="space-y-6">
      <DemoBanner />

      {/* Header */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-1">Administration</p>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(139,92,246,0.1)" }}>
            <Shield className="w-3.5 h-3.5" style={{ color: "#8B5CF6" }} />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Gestion de la plateforme</h1>
        </div>
        <p className="text-sm text-muted-foreground">Utilisateurs, rôles, paramètres et sécurité</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted/50 rounded-xl w-fit">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Utilisateurs */}
      {activeTab === "utilisateurs" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {displayUsers.length} utilisateurs actifs — Accès illimité
            </p>
            <button
              onClick={demo}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg text-white"
              style={{ background: "linear-gradient(135deg,#5C93FF,#24DDB8)" }}
            >
              <Plus className="w-3.5 h-3.5" /> Ajouter
            </button>
          </div>
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {["Nom", "Email", "Rôle", "Service / Direction", "Dernière connexion", ""].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {displayUsers.map((u) => {
                  const rc = roleConfig[u.role] ?? roleConfig["Lecture seule"];
                  return (
                    <tr key={u.email} className="hover:bg-muted/30 transition-colors cursor-pointer">
                      <td className="px-4 py-3 text-sm font-semibold text-foreground">{u.nom}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{u.email}</td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex px-2 py-0.5 rounded text-[11px] font-semibold border"
                          style={{ background: rc.bg, color: rc.color, borderColor: rc.border }}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{u.service}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground font-mono tabular-nums">{u.connexion}</td>
                      <td className="px-4 py-3">
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Paramètres */}
      {activeTab === "parametres" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Organisation */}
            <div className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-center gap-2 mb-4">
                <Settings className="w-4 h-4" style={{ color: "#5C93FF" }} />
                <h2 className="text-sm font-semibold text-foreground">Organisation</h2>
              </div>
              <div className="space-y-2 text-xs">
                {[
                  { label: "Collectivité", value: currentOrg?.name ?? "Métropole de Lyon" },
                  { label: "Identifiant", value: currentOrg?.slug ?? "metropole-lyon" },
                  { label: "Type", value: "Métropole" },
                  { label: "Plan", value: currentOrg?.plan ?? "Pro" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between p-2.5 rounded-lg bg-muted/30">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-semibold text-foreground">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Exercices budgétaires */}
            <div className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-4 h-4" style={{ color: "#5C93FF" }} />
                <h2 className="text-sm font-semibold text-foreground">Exercices budgétaires</h2>
              </div>
              <div className="space-y-2">
                {[
                  { year: "2026", status: "Actif", active: true },
                  { year: "2025", status: "Archivé", active: false },
                  { year: "2024", status: "Archivé", active: false },
                ].map((y) => (
                  <div key={y.year} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30">
                    <span className="text-sm font-semibold text-foreground">{y.year}</span>
                    <span
                      className="text-[11px] px-2 py-0.5 rounded-full font-semibold border"
                      style={y.active
                        ? { background: "rgba(16,185,129,0.08)", color: "#10B981", borderColor: "rgba(16,185,129,0.2)" }
                        : { background: "rgba(107,114,128,0.08)", color: "#6B7280", borderColor: "rgba(107,114,128,0.2)" }
                      }
                    >
                      {y.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sécurité */}
          <div className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-4 h-4" style={{ color: "#8B5CF6" }} />
              <h2 className="text-sm font-semibold text-foreground">Sécurité & Conformité</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Hébergement", value: "France — SecNumCloud", icon: Server },
                { label: "RGPD", value: "Conforme", icon: Shield },
                { label: "Chiffrement", value: "AES-256 / TLS 1.3", icon: Lock },
                { label: "Authentification", value: "SSO / 2FA", icon: Users },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="p-4 rounded-xl border border-border bg-card text-center hover:shadow-sm transition-shadow">
                  <Icon className="w-4 h-4 mx-auto mb-2" style={{ color: "#5C93FF" }} />
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">{label}</p>
                  <p className="text-xs font-semibold text-foreground">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Journal */}
      {activeTab === "journal" && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Journal d&apos;activité</h2>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {["Action", "Utilisateur", "Date & Heure", "Détail"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {journalEntries.map((j, i) => {
                const ac = actionColors[j.action] ?? { bg: "rgba(107,114,128,0.1)", color: "#6B7280" };
                return (
                  <tr key={i} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider"
                        style={{ background: ac.bg, color: ac.color }}
                      >
                        {j.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-foreground">{j.utilisateur}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{j.date}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{j.detail}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Support */}
      {activeTab === "support" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Formation incluse */}
          <div className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-4 h-4" style={{ color: "#5C93FF" }} />
              <h2 className="text-sm font-semibold text-foreground">Formation incluse</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-3">2 heures de formation incluses dans votre abonnement.</p>
            <div className="space-y-2 mb-4">
              {[
                { label: "Prise en main de la plateforme", duree: "45 min" },
                { label: "Élaboration de nomenclature", duree: "30 min" },
                { label: "Cartographie et analyse avancée", duree: "45 min" },
              ].map((f) => (
                <div key={f.label} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 text-xs">
                  <span className="text-foreground">{f.label}</span>
                  <span className="text-muted-foreground font-mono">{f.duree}</span>
                </div>
              ))}
            </div>
            <button onClick={demo} className="w-full py-2 rounded-lg text-xs font-semibold border border-border text-foreground hover:bg-muted/50 transition-colors">
              Planifier une session
            </button>
          </div>

          {/* Assistance technique */}
          <div className="bg-card rounded-xl border border-border p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">Assistance technique</h2>
            <div className="space-y-2 mb-4">
              {[
                { label: "Support prioritaire", value: "Lundi — Vendredi, 9h — 18h" },
                { label: "Contact", value: "support@stratt.io" },
                { label: "Documentation", value: "docs.stratt.io" },
              ].map(({ label, value }) => (
                <div key={label} className="p-2.5 rounded-lg bg-muted/30">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
                  <p className="text-xs font-semibold text-foreground mt-0.5">{value}</p>
                </div>
              ))}
            </div>
            <button
              onClick={demo}
              className="w-full py-2 rounded-lg text-xs font-semibold text-white"
              style={{ background: "linear-gradient(135deg,#5C93FF,#24DDB8)" }}
            >
              Ouvrir un ticket
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { MODULE } from "@/lib/colors";
import { useAuthStore } from "@/store/auth";
import { DemoBanner } from "@/components/DemoBanner";
import { useDemoAction } from "@/store/toast";
import {
  Shield, Users, Settings, ClipboardList, BookOpen, Plus,
  ChevronRight, Lock, Server, Calendar, Download, ChevronLeft,
  Filter, Webhook, Trash2, Play, CheckCircle2, XCircle, Circle,
} from "lucide-react";

/* ── Audit types ── */
interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string;
  ip_address: string;
  metadata: unknown;
  created_at: string;
}
interface AuditPage {
  logs: AuditLog[];
  total: number;
  page: number;
  pages: number;
}

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
  "Administrateur": { bg: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))", border: "hsl(var(--primary) / 0.2)" },
  "Direction": { bg: "hsl(var(--accent) / 0.08)", color: "hsl(var(--accent))", border: "hsl(var(--accent) / 0.2)" },
  "Service achats": { bg: "hsl(var(--accent) / 0.08)", color: "hsl(var(--accent))", border: "hsl(var(--accent) / 0.2)" },
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
  "Connexion": { bg: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))" },
  "Modification": { bg: "hsl(var(--warning) / 0.1)", color: "hsl(var(--warning))" },
  "Export": { bg: "hsl(var(--accent) / 0.1)", color: "hsl(var(--accent))" },
  "Création": { bg: "hsl(var(--accent) / 0.1)", color: "hsl(var(--accent))" },
  "Validation": { bg: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))" },
};

const tabs = [
  { id: "utilisateurs", label: "Utilisateurs",  icon: Users },
  { id: "parametres",   label: "Paramètres",    icon: Settings },
  { id: "journal",      label: "Journal",        icon: ClipboardList },
  { id: "webhooks",     label: "Webhooks",       icon: Webhook },
  { id: "support",      label: "Support",        icon: BookOpen },
];

/* ── Webhook types ── */
interface WebhookRow {
  id: string;
  url: string;
  events: string[];
  is_active: boolean;
  last_status: string;
  fail_count: number;
  created_at: string;
}

const KNOWN_EVENTS = [
  "marche.created", "marche.updated", "marche.deleted", "marche.seuil_depasse",
  "import.completed", "alerte.echeance", "alerte.delai_paiement",
  "user.joined", "user.removed",
];

interface Member {
  id: string;
  user: { name: string; email: string; last_login_at?: string | null };
  status: string;
  role?: { name: string } | null;
  department?: string;
}

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

  /* ── Audit journal state ── */
  const [auditPage,      setAuditPage]      = useState(1);
  const [auditAction,    setAuditAction]    = useState("");
  const [auditResource,  setAuditResource]  = useState("");
  const [auditFrom,      setAuditFrom]      = useState("");
  const [auditTo,        setAuditTo]        = useState("");

  const auditParams = new URLSearchParams({ page: String(auditPage), limit: "50" });
  if (auditAction)   auditParams.set("action", auditAction);
  if (auditResource) auditParams.set("resource_type", auditResource);
  if (auditFrom)     auditParams.set("from", auditFrom);
  if (auditTo)       auditParams.set("to", auditTo);

  const { data: auditData } = useQuery<AuditPage>({
    queryKey: ["audit", currentOrg?.id, auditPage, auditAction, auditResource, auditFrom, auditTo],
    queryFn: () => api.get(`/api/v1/audit?${auditParams.toString()}`, opts),
    enabled: !!accessToken && !!currentOrg && activeTab === "journal",
  });

  const auditLogs   = auditData?.logs  ?? [];
  const auditTotal  = auditData?.total ?? 0;
  const auditPages  = auditData?.pages ?? 1;

  /* ── Webhook state ── */
  const qc = useQueryClient();
  const [whForm, setWhForm]     = useState(false);
  const [whUrl, setWhUrl]       = useState("");
  const [whSecret, setWhSecret] = useState("");
  const [whEvents, setWhEvents] = useState<string[]>([]);
  const [newHookSecret, setNewHookSecret] = useState("");

  const { data: webhooksData = [] } = useQuery<WebhookRow[]>({
    queryKey: ["webhooks", currentOrg?.id],
    queryFn: () => api.get("/api/v1/webhooks", opts),
    enabled: !!accessToken && !!currentOrg && activeTab === "webhooks",
  });

  const createWebhook = useMutation<{ secret: string }, Error, void>({
    mutationFn: () => api.post("/api/v1/webhooks", { url: whUrl, events: whEvents, secret: whSecret || undefined }, opts) as Promise<{ secret: string }>,
    onSuccess: (res) => {
      setNewHookSecret(res.secret ?? "");
      setWhForm(false);
      setWhUrl(""); setWhSecret(""); setWhEvents([]);
      qc.invalidateQueries({ queryKey: ["webhooks", currentOrg?.id] });
    },
  });

  const deleteWebhook = useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/webhooks/${id}`, opts),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["webhooks", currentOrg?.id] }),
  });

  const testWebhook = useMutation({
    mutationFn: (id: string) => api.post(`/api/v1/webhooks/${id}/test`, {}, opts),
  });

  const toggleEvent = (ev: string) =>
    setWhEvents(evs => evs.includes(ev) ? evs.filter(e => e !== ev) : [...evs, ev]);

  function exportAuditCSV() {
    const base = process.env.NEXT_PUBLIC_API_URL ?? "";
    const params = new URLSearchParams();
    if (auditFrom)     params.set("from", auditFrom);
    if (auditTo)       params.set("to", auditTo);
    if (auditAction)   params.set("action", auditAction);
    if (auditResource) params.set("resource_type", auditResource);
    window.open(
      `${base}/api/v1/audit/export.csv?${params}&token=${accessToken}&org_id=${currentOrg?.id}`,
      "_blank"
    );
  }

  /* Merge API members into demo users for display */
  const displayUsers = members.length > 0
    ? members.map((m) => ({
        nom: m.user?.name ?? "—",
        email: m.user?.email ?? "—",
        role: m.role?.name ?? "—",
        service: m.department || "—",
        connexion: m.user?.last_login_at
          ? new Date(m.user.last_login_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })
          : "—",
      }))
    : demoUsers;

  return (
    <div className="space-y-6">
      <DemoBanner />

      {/* Header */}
      <div className="flex items-center justify-between pb-3" style={{ borderBottom: "1px solid hsl(var(--destructive) / 0.08)" }}>
        <div>
          <div className="section-header" style={{ marginBottom: 4 }}>
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: MODULE.administration, boxShadow: `0 0 6px ${MODULE.administration}` }} />
            <span className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "hsl(var(--foreground) / 0.4)" }}>Système</span>
          </div>
          <h1 className="text-[20px] font-extrabold text-foreground" style={{ letterSpacing: "-0.02em" }}>Gestion de la plateforme</h1>
          <p className="text-[12px] mt-0.5 text-muted-foreground">Utilisateurs, rôles, paramètres et sécurité</p>
        </div>
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
              style={{ background: "hsl(var(--primary))" }}
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
                <Settings className="w-4 h-4" style={{ color: "hsl(var(--primary))" }} />
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
                <Calendar className="w-4 h-4" style={{ color: "hsl(var(--primary))" }} />
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
                        ? { background: "hsl(var(--accent) / 0.08)", color: "hsl(var(--accent))", borderColor: "hsl(var(--accent) / 0.2)" }
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
              <Shield className="w-4 h-4" style={{ color: "hsl(var(--violet))" }} />
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
                  <Icon className="w-4 h-4 mx-auto mb-2" style={{ color: "hsl(var(--primary))" }} />
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
        <div className="space-y-3">
          {/* Filter bar */}
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            <input
              type="text"
              placeholder="Action (ex: create, login…)"
              value={auditAction}
              onChange={(e) => { setAuditAction(e.target.value); setAuditPage(1); }}
              className="text-xs px-3 py-1.5 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground w-44"
            />
            <select
              value={auditResource}
              onChange={(e) => { setAuditResource(e.target.value); setAuditPage(1); }}
              className="text-xs px-3 py-1.5 rounded-lg border border-border bg-background text-foreground"
            >
              <option value="">Toutes ressources</option>
              {["marche", "nomenclature", "user", "role", "module", "organization"].map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <input
              type="date"
              value={auditFrom}
              onChange={(e) => { setAuditFrom(e.target.value); setAuditPage(1); }}
              className="text-xs px-3 py-1.5 rounded-lg border border-border bg-background text-foreground"
            />
            <span className="text-xs text-muted-foreground">→</span>
            <input
              type="date"
              value={auditTo}
              onChange={(e) => { setAuditTo(e.target.value); setAuditPage(1); }}
              className="text-xs px-3 py-1.5 rounded-lg border border-border bg-background text-foreground"
            />
            <div className="flex-1" />
            <button
              onClick={exportAuditCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-border text-foreground hover:bg-muted/50 transition-colors"
            >
              <Download className="w-3 h-3" /> Exporter CSV
            </button>
          </div>

          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">
                Journal d&apos;audit
                {auditTotal > 0 && <span className="ml-2 text-xs font-normal text-muted-foreground">({auditTotal} entrée{auditTotal > 1 ? "s" : ""})</span>}
              </h2>
              <span className="text-[10px] text-muted-foreground font-mono">
                Conservation 10 ans · Append-only
              </span>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {["Action", "Ressource", "ID", "Date & Heure", "IP"].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {auditLogs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-xs text-muted-foreground">
                      {auditTotal === 0 ? "Aucune entrée dans le journal pour cette période." : "Chargement…"}
                    </td>
                  </tr>
                )}
                {auditLogs.map((log) => {
                  const actionVerb = log.action.split(".")[1] ?? log.action;
                  const actionColor = actionVerb === "create"
                    ? { bg: "hsl(var(--accent) / 0.1)", color: "hsl(var(--accent))" }
                    : actionVerb === "delete"
                    ? { bg: "hsl(var(--destructive) / 0.1)", color: "hsl(var(--destructive))" }
                    : actionVerb === "login" || actionVerb === "logout"
                    ? { bg: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))" }
                    : { bg: "hsl(var(--warning) / 0.1)", color: "hsl(var(--warning))" };
                  return (
                    <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-2.5">
                        <span
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider"
                          style={{ background: actionColor.bg, color: actionColor.color }}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-foreground font-medium">{log.resource_type || "—"}</td>
                      <td className="px-4 py-2.5 text-[11px] text-muted-foreground font-mono truncate max-w-[120px]">
                        {log.resource_id ? log.resource_id.slice(0, 8) + "…" : "—"}
                      </td>
                      <td className="px-4 py-2.5 text-[11px] text-muted-foreground font-mono">
                        {new Date(log.created_at).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="px-4 py-2.5 text-[11px] text-muted-foreground font-mono">{log.ip_address || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {/* Pagination */}
            {auditPages > 1 && (
              <div className="px-4 py-3 border-t border-border flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Page {auditPage} / {auditPages}</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setAuditPage(p => Math.max(1, p - 1))}
                    disabled={auditPage <= 1}
                    className="p-1.5 rounded-lg border border-border hover:bg-muted/50 disabled:opacity-40 transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setAuditPage(p => Math.min(auditPages, p + 1))}
                    disabled={auditPage >= auditPages}
                    className="p-1.5 rounded-lg border border-border hover:bg-muted/50 disabled:opacity-40 transition-colors"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Webhooks */}
      {activeTab === "webhooks" && (
        <div className="space-y-4">
          {/* New secret revealed */}
          {newHookSecret && (
            <div className="rounded-xl border border-accent/30 bg-accent/5 p-4 space-y-2">
              <p className="text-xs font-bold text-accent uppercase tracking-widest">Secret de signature (affiché une seule fois)</p>
              <code className="block text-xs font-mono bg-background border border-border rounded-lg px-3 py-2 break-all">{newHookSecret}</code>
              <button onClick={() => setNewHookSecret("")} className="text-xs text-muted-foreground underline">Fermer</button>
            </div>
          )}

          {/* Header */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Les webhooks envoient une requête HTTPS signée (HMAC-SHA256) à votre URL lors d&apos;un événement.
              Retry automatique 3× (1 min, 5 min, 30 min).
            </p>
            <button
              onClick={() => { setWhForm(true); setWhUrl(""); setWhSecret(""); setWhEvents([]); }}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-xl text-white flex-shrink-0"
              style={{ background: MODULE.administration }}
            >
              <Plus className="w-3.5 h-3.5" /> Nouveau webhook
            </button>
          </div>

          {/* Create form */}
          {whForm && (
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Configurer un endpoint</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1">URL de destination *</label>
                  <input
                    type="url"
                    value={whUrl}
                    onChange={(e) => setWhUrl(e.target.value)}
                    placeholder="https://votre-serveur.fr/webhook"
                    className="w-full text-sm px-3 py-2 rounded-lg border border-border bg-background text-foreground"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1">Secret HMAC (optionnel — auto-généré si vide)</label>
                  <input
                    type="text"
                    value={whSecret}
                    onChange={(e) => setWhSecret(e.target.value)}
                    placeholder="Laisser vide pour générer automatiquement"
                    className="w-full text-sm px-3 py-2 rounded-lg border border-border bg-background text-foreground font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-2">Événements à écouter *</label>
                  <div className="flex flex-wrap gap-2">
                    {KNOWN_EVENTS.map((ev) => (
                      <button
                        key={ev}
                        onClick={() => toggleEvent(ev)}
                        className={`px-2.5 py-1 text-[11px] font-semibold rounded-full border transition-colors ${
                          whEvents.includes(ev)
                            ? "border-transparent text-white"
                            : "border-border text-muted-foreground hover:text-foreground"
                        }`}
                        style={whEvents.includes(ev) ? { background: MODULE.administration } : {}}
                      >
                        {ev}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setWhForm(false)} className="px-4 py-2 text-xs rounded-lg border border-border text-foreground hover:bg-muted/50 transition-colors">
                  Annuler
                </button>
                <button
                  onClick={() => createWebhook.mutate()}
                  disabled={!whUrl || whEvents.length === 0 || createWebhook.isPending}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-white disabled:opacity-50"
                  style={{ background: MODULE.administration }}
                >
                  {createWebhook.isPending ? "Création…" : "Créer le webhook"}
                </button>
              </div>
            </div>
          )}

          {/* Webhook list */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            {webhooksData.length === 0 && !whForm && (
              <div className="px-4 py-10 text-center text-xs text-muted-foreground">
                Aucun webhook configuré. Créez-en un pour connecter Axiora à vos outils.
              </div>
            )}
            {webhooksData.length > 0 && (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {["Statut", "URL", "Événements", "Erreurs", "Créé le", "Actions"].map((h) => (
                      <th key={h} className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {webhooksData.map((wh) => (
                    <tr key={wh.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        {wh.last_status === "success"
                          ? <CheckCircle2 className="w-4 h-4 text-accent" />
                          : wh.last_status === "failure"
                          ? <XCircle className="w-4 h-4 text-destructive" />
                          : <Circle className="w-4 h-4 text-muted-foreground" />}
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-foreground max-w-[220px] truncate">{wh.url}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {(wh.events ?? []).slice(0, 3).map((ev: string) => (
                            <span key={ev} className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-mono">{ev}</span>
                          ))}
                          {(wh.events ?? []).length > 3 && (
                            <span className="text-[10px] text-muted-foreground">+{(wh.events ?? []).length - 3}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{wh.fail_count || "—"}</td>
                      <td className="px-4 py-3 text-[11px] text-muted-foreground font-mono">
                        {new Date(wh.created_at).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            title="Tester"
                            onClick={() => testWebhook.mutate(wh.id)}
                            className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground hover:text-accent"
                          >
                            <Play className="w-3.5 h-3.5" />
                          </button>
                          <button
                            title="Supprimer"
                            onClick={() => { if (confirm("Supprimer ce webhook ?")) deleteWebhook.mutate(wh.id); }}
                            className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Support */}
      {activeTab === "support" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Formation incluse */}
          <div className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-4 h-4" style={{ color: "hsl(var(--primary))" }} />
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
              style={{ background: "hsl(var(--primary))" }}
            >
              Ouvrir un ticket
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

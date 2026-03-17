"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { DemoBanner } from "@/components/DemoBanner";
import {
  FileJson, ShieldCheck, Upload, Clock, AlertTriangle, CheckCircle,
  XCircle, Download, RefreshCw, ChevronRight, FileText, Info,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

interface ValidationError {
  marche_uid: string;
  reference: string;
  field: string;
  message: string;
}

interface ComplianceRow {
  reference: string;
  objet: string;
  valid: boolean;
  errors: ValidationError[];
}

interface ComplianceReport {
  total: number;
  valid: number;
  invalid: number;
  conformity_rate: number;
  report: ComplianceRow[];
}

interface PublicationHistory {
  id: string;
  status: string;
  marches_count: number;
  errors_json: string;
  data_gouv_id: string;
  published_at: string;
  created_at: string;
}

interface ExportPayload {
  marches: {
    uid: string;
    objet: string;
    procedure: string;
    montant: number;
    dateNotification: string;
    datePublicationDonnees: string;
  }[];
}

// ── Status helpers ─────────────────────────────────────────────────────────

const statusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  success:                 { label: "Publié",          color: "#10B981", icon: CheckCircle },
  generated:               { label: "Généré",          color: "#5C93FF", icon: FileJson },
  published_with_warnings: { label: "Publié (alertes)", color: "#F59E0B", icon: AlertTriangle },
  failed:                  { label: "Échec",           color: "#EF4444", icon: XCircle },
};

// ── Page ───────────────────────────────────────────────────────────────────

export default function DECPPage() {
  const { accessToken, currentOrg } = useAuthStore();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"compliance" | "export" | "history">("compliance");
  const [dataGouvKey, setDataGouvKey] = useState("");
  const [datasetID, setDatasetID] = useState("");
  const opts = { token: accessToken ?? "", orgId: currentOrg?.id };

  // ── Queries ──────────────────────────────────────────────────────────────

  const { data: compliance, isLoading: loadingCompliance, refetch: refetchCompliance } =
    useQuery<ComplianceReport>({
      queryKey: ["decp", "compliance", currentOrg?.id],
      queryFn: () => api.get("/api/v1/decp/compliance", opts),
      enabled: !!accessToken && !!currentOrg,
    });

  const { data: exportData, isLoading: loadingExport } = useQuery<{ marches: ExportPayload["marches"] }>({
    queryKey: ["decp", "export", currentOrg?.id],
    queryFn: () => api.get("/api/v1/decp/export", opts) as Promise<{ marches: ExportPayload["marches"] }>,
    enabled: !!accessToken && !!currentOrg && tab === "export",
  });

  const { data: history, isLoading: loadingHistory } = useQuery<PublicationHistory[]>({
    queryKey: ["decp", "history", currentOrg?.id],
    queryFn: () => api.get("/api/v1/decp/history", opts),
    enabled: !!accessToken && !!currentOrg && tab === "history",
  });

  // ── Mutations ────────────────────────────────────────────────────────────

  const publishMutation = useMutation({
    mutationFn: () =>
      api.post("/api/v1/decp/publish", {
        api_key: dataGouvKey || undefined,
        dataset_id: datasetID || undefined,
      }, opts),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["decp", "history"] });
    },
  });

  // ── Helpers ──────────────────────────────────────────────────────────────

  function downloadJSON() {
    if (!exportData) return;
    const blob = new Blob([JSON.stringify({ marches: exportData.marches }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `decp-${currentOrg?.id ?? "export"}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const rate = compliance?.conformity_rate ?? 0;
  const rateColor = rate >= 90 ? "#10B981" : rate >= 60 ? "#F59E0B" : "#EF4444";

  const TABS = [
    { id: "compliance" as const, label: "Conformité DECP", icon: ShieldCheck },
    { id: "export" as const,     label: "Export JSON v2",  icon: FileJson },
    { id: "history" as const,    label: "Historique",      icon: Clock },
  ];

  return (
    <div className="space-y-5">
      <DemoBanner />

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-1">
            Conformité réglementaire
          </p>
          <h1 className="text-2xl font-bold text-foreground">
            Export DECP automatique
          </h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            Données Essentielles de la Commande Publique · Décret n°2016-360 · Format JSON v2 data.gouv.fr
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="https://schema.data.gouv.fr/139bertin/decp-json/latest/documentation.html"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <Info className="w-3.5 h-3.5" /> Schéma officiel
          </a>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-3.5 h-3.5" style={{ color: rateColor }} />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Taux conformité</span>
          </div>
          <span className="text-2xl font-bold" style={{ color: rateColor }}>
            {rate.toFixed(0)}%
          </span>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Marchés valides</span>
          </div>
          <span className="text-2xl font-bold text-foreground">{compliance?.valid ?? 0}</span>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="w-3.5 h-3.5 text-red-500" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">À corriger</span>
          </div>
          <span className="text-2xl font-bold text-foreground">{compliance?.invalid ?? 0}</span>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Total marchés</span>
          </div>
          <span className="text-2xl font-bold text-foreground">{compliance?.total ?? 0}</span>
        </div>
      </div>

      {/* Regulatory notice */}
      <div className="flex items-start gap-3 p-3 rounded-xl border text-[12px]"
        style={{ background: "rgba(92,147,255,0.06)", borderColor: "rgba(92,147,255,0.2)" }}>
        <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
        <div className="text-muted-foreground leading-relaxed">
          <span className="font-semibold text-foreground">Obligation légale</span> — La publication des DECP est obligatoire pour tous les acheteurs publics
          (décret n°2016-360, art. 107). Les données doivent être publiées en open data au format JSON v2
          sur <span className="font-medium text-foreground">data.gouv.fr</span> dans les 2 mois suivant la notification du marché.
          Non-conformité = risque juridique et rejet de l&apos;acte par la préfecture.
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 p-0.5 bg-muted/50 rounded-xl w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${
              tab === id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* ── COMPLIANCE TAB ── */}
      {tab === "compliance" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[13px] font-semibold text-foreground">Rapport de conformité par marché</h2>
            <button
              onClick={() => refetchCompliance()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <RefreshCw className="w-3 h-3" /> Actualiser
            </button>
          </div>

          {loadingCompliance ? (
            <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-muted rounded-xl animate-pulse" />)}</div>
          ) : (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {["Statut", "Référence", "Objet", "Erreurs DECP"].map((h) => (
                      <th key={h} className="text-left px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(compliance?.report ?? []).map((row) => (
                    <tr key={row.reference} className="hover:bg-muted/20 transition-colors">
                      <td className="px-3 py-2.5">
                        {row.valid
                          ? <CheckCircle className="w-4 h-4 text-emerald-500" />
                          : <XCircle className="w-4 h-4 text-red-500" />
                        }
                      </td>
                      <td className="px-3 py-2.5 font-mono text-[11px] text-muted-foreground">{row.reference}</td>
                      <td className="px-3 py-2.5 text-[12px] text-foreground max-w-[240px] truncate">{row.objet}</td>
                      <td className="px-3 py-2.5">
                        {row.errors.length === 0 ? (
                          <span className="text-[11px] text-emerald-600">Conforme</span>
                        ) : (
                          <div className="space-y-0.5">
                            {row.errors.map((e, i) => (
                              <div key={i} className="flex items-start gap-1.5 text-[11px] text-red-500">
                                <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                                <span><span className="font-mono text-[10px]">{e.field}</span> — {e.message}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {(compliance?.report ?? []).length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-3 py-8 text-center text-[12px] text-muted-foreground">
                        Aucun marché trouvé. Créez des marchés dans le module Planification.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── EXPORT TAB ── */}
      {tab === "export" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Download */}
            <div className="bg-card border border-border rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4 text-indigo-500" />
                <h2 className="text-[13px] font-semibold text-foreground">Télécharger le fichier DECP</h2>
              </div>
              <p className="text-[12px] text-muted-foreground leading-relaxed">
                Génère le fichier JSON v2 conforme au schéma data.gouv.fr pour l&apos;ensemble des marchés non annulés.
                {exportData && (
                  <span className="block mt-1 text-foreground font-medium">
                    {exportData.marches?.length ?? 0} marchés inclus.
                  </span>
                )}
              </p>
              <button
                onClick={downloadJSON}
                disabled={loadingExport || !exportData}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold text-white disabled:opacity-50 transition-colors"
                style={{ background: "#5C93FF" }}
              >
                <FileJson className="w-4 h-4" />
                {loadingExport ? "Génération…" : "Télécharger DECP.json"}
              </button>
            </div>

            {/* Publish to data.gouv.fr */}
            <div className="bg-card border border-border rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-emerald-500" />
                <h2 className="text-[13px] font-semibold text-foreground">Publier sur data.gouv.fr</h2>
              </div>
              <div className="space-y-2">
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground block mb-1">Clé API data.gouv.fr</label>
                  <input
                    type="password"
                    value={dataGouvKey}
                    onChange={(e) => setDataGouvKey(e.target.value)}
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    className="w-full px-3 py-1.5 text-[12px] rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground block mb-1">ID du dataset</label>
                  <input
                    type="text"
                    value={datasetID}
                    onChange={(e) => setDatasetID(e.target.value)}
                    placeholder="ex: 5a16df56c751df5c06e55e67"
                    className="w-full px-3 py-1.5 text-[12px] rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
              <button
                onClick={() => publishMutation.mutate()}
                disabled={publishMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold text-white disabled:opacity-50 transition-colors"
                style={{ background: "#10B981" }}
              >
                <Upload className="w-4 h-4" />
                {publishMutation.isPending ? "Publication…" : "Publier sur data.gouv.fr"}
              </button>
              {!dataGouvKey && (
                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  Sans clé API, le fichier sera généré localement sans envoi.
                </p>
              )}
              {publishMutation.isSuccess && (
                <div className="flex items-center gap-2 text-[12px] text-emerald-600 font-medium">
                  <CheckCircle className="w-4 h-4" /> Publication enregistrée avec succès.
                </div>
              )}
              {publishMutation.isError && (
                <div className="flex items-center gap-2 text-[12px] text-red-500">
                  <XCircle className="w-4 h-4" /> Erreur lors de la publication.
                </div>
              )}
            </div>
          </div>

          {/* Preview */}
          {exportData && exportData.marches && exportData.marches.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="text-[12px] font-semibold text-foreground mb-3 flex items-center gap-2">
                <FileJson className="w-3.5 h-3.5 text-muted-foreground" />
                Aperçu JSON ({exportData.marches.length} marchés)
              </h3>
              <pre className="text-[11px] text-muted-foreground bg-muted/30 rounded-lg p-3 overflow-x-auto max-h-64 overflow-y-auto font-mono leading-relaxed">
                {JSON.stringify({ marches: exportData.marches.slice(0, 2) }, null, 2)}
                {exportData.marches.length > 2 && `\n  // … ${exportData.marches.length - 2} autres marchés`}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* ── HISTORY TAB ── */}
      {tab === "history" && (
        <div className="space-y-3">
          <h2 className="text-[13px] font-semibold text-foreground">Historique des publications</h2>

          {loadingHistory ? (
            <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-14 bg-muted rounded-xl animate-pulse" />)}</div>
          ) : (history ?? []).length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-8 text-center text-[12px] text-muted-foreground">
              Aucune publication effectuée. Utilisez l&apos;onglet &quot;Export JSON v2&quot; pour générer ou publier votre premier fichier DECP.
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {["Statut", "Date", "Marchés", "ID data.gouv.fr", "Erreurs", ""].map((h) => (
                      <th key={h} className="text-left px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(history ?? []).map((pub) => {
                    const cfg = statusConfig[pub.status] ?? statusConfig.generated;
                    const Icon = cfg.icon;
                    const errCount = (() => { try { return JSON.parse(pub.errors_json || "[]").length; } catch { return 0; } })();
                    return (
                      <tr key={pub.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-3 py-3">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold"
                            style={{ background: `${cfg.color}15`, color: cfg.color }}>
                            <Icon className="w-3 h-3" />
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-[12px] text-muted-foreground tabular-nums">
                          {pub.published_at
                            ? new Date(pub.published_at).toLocaleString("fr-FR")
                            : new Date(pub.created_at).toLocaleString("fr-FR")}
                        </td>
                        <td className="px-3 py-3 text-[12px] font-medium text-foreground">{pub.marches_count}</td>
                        <td className="px-3 py-3 font-mono text-[11px] text-muted-foreground">
                          {pub.data_gouv_id || <span className="italic">—</span>}
                        </td>
                        <td className="px-3 py-3">
                          {errCount > 0
                            ? <span className="text-[11px] text-amber-500">{errCount} alerte{errCount > 1 ? "s" : ""}</span>
                            : <span className="text-[11px] text-emerald-600">Aucune</span>
                          }
                        </td>
                        <td className="px-3 py-3">
                          <ChevronRight className="w-3 h-3 text-muted-foreground" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

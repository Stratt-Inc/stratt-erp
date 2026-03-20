"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import {
  Building2,
  Search,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface SIRENEEnrichment {
  id: string;
  contact_id: string;
  siret: string;
  siren: string;
  denomination_sociale: string;
  adresse: string;
  code_postal: string;
  commune: string;
  code_naf: string;
  forme_juridique: string;
  tranche_effectifs: string;
  etat_administratif: string;
  date_creation: string;
  date_cessation: string;
  fetched_at: string;
  expires_at: string;
  api_error: string;
}

interface SIRENEData {
  siret: string;
  siren: string;
  denomination_sociale: string;
  adresse: string;
  code_postal: string;
  commune: string;
  code_naf: string;
  forme_juridique: string;
  tranche_effectifs: string;
  etat_administratif: string;
  date_creation: string;
  date_cessation: string;
}

interface LookupResult {
  data: SIRENEData | null;
  cached: boolean;
  error?: string;
}

interface AlertsResult {
  count: number;
  alerts: SIRENEEnrichment[];
}

const tabs = [
  { id: "lookup", label: "Recherche SIRET" },
  { id: "enrichments", label: "Enrichissements" },
  { id: "alerts", label: "Alertes fournisseurs" },
];

function EtatBadge({ etat }: { etat: string }) {
  if (etat === "A") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
        style={{ background: "hsl(var(--accent) / 0.12)", color: "hsl(var(--accent))" }}>
        <CheckCircle size={12} />
        Actif
      </span>
    );
  }
  if (etat === "C") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
        style={{ background: "hsl(var(--destructive) / 0.12)", color: "hsl(var(--destructive))" }}>
        <XCircle size={12} />
        Cessé
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ background: "hsl(var(--foreground) / 0.07)", color: "hsl(var(--foreground) / 0.5)" }}>
      {etat || "—"}
    </span>
  );
}

function SIRENECard({ data }: { data: SIRENEData | SIRENEEnrichment }) {
  return (
    <div className="bg-card border border-border rounded-xl p-3 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-base font-semibold text-foreground">
            {data.denomination_sociale || "—"}
          </p>
          <p className="text-sm text-muted-foreground font-mono">
            SIRET {data.siret} · SIREN {data.siren}
          </p>
        </div>
        <EtatBadge etat={data.etat_administratif} />
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <p className="text-muted-foreground text-xs mb-0.5">Adresse</p>
          <p className="text-foreground">
            {[data.adresse, data.code_postal, data.commune]
              .filter(Boolean)
              .join(", ") || "—"}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs mb-0.5">Forme juridique</p>
          <p className="text-foreground">{data.forme_juridique || "—"}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs mb-0.5">Code NAF</p>
          <p className="text-foreground">{data.code_naf || "—"}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs mb-0.5">Effectifs</p>
          <p className="text-foreground">{data.tranche_effectifs || "—"}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs mb-0.5">Date de création</p>
          <p className="text-foreground">{data.date_creation || "—"}</p>
        </div>
        {data.date_cessation && (
          <div>
            <p className="text-muted-foreground text-xs mb-0.5">Date de cessation</p>
            <p className="font-medium" style={{ color: "#F87171" }}>{data.date_cessation}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SirenePage() {
  const { accessToken, currentOrg } = useAuthStore();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState("lookup");
  const [siretInput, setSiretInput] = useState("");
  const [lookupSiret, setLookupSiret] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const opts = { token: accessToken ?? undefined, orgId: currentOrg?.id };

  const { data: lookupResult, isFetching: lookupFetching } =
    useQuery<LookupResult>({
      queryKey: ["sirene-lookup", lookupSiret],
      queryFn: () =>
        api.get<LookupResult>(`/sirene/lookup?siret=${lookupSiret}`, opts),
      enabled: !!lookupSiret,
    });

  const { data: enrichments = [], isFetching: enrichFetching } = useQuery<
    SIRENEEnrichment[]
  >({
    queryKey: ["sirene-enrichments", currentOrg?.id],
    queryFn: () => api.get<SIRENEEnrichment[]>("/sirene/enrichments", opts),
    enabled: activeTab === "enrichments",
  });

  const { data: alertsResult, isFetching: alertsFetching } =
    useQuery<AlertsResult>({
      queryKey: ["sirene-alerts", currentOrg?.id],
      queryFn: () => api.get<AlertsResult>("/sirene/alerts", opts),
      enabled: activeTab === "alerts",
    });

  const clearCache = useMutation({
    mutationFn: (contactId: string) =>
      api.delete(`/sirene/enrichments/${contactId}`, opts),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sirene-enrichments"] });
    },
  });

  const handleLookup = () => {
    const cleaned = siretInput.replace(/\s/g, "");
    if (cleaned.length === 14) {
      setLookupSiret(cleaned);
    }
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg" style={{ background: "hsl(var(--primary) / 0.12)", border: "1px solid hsl(var(--primary) / 0.2)" }}>
          <Building2 size={20} style={{ color: "hsl(var(--primary))" }} />
        </div>
        <div>
          <h1 className="text-[20px] font-bold text-foreground">
            Qualification SIRENE
          </h1>
          <p className="text-sm text-muted-foreground">
            Enrichissement des fournisseurs via l&apos;API INSEE SIRENE
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border gap-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === t.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Lookup tab */}
      {activeTab === "lookup" && (
        <div className="space-y-3">
          <div className="bg-card border border-border rounded-xl p-3">
            <p className="text-sm font-medium text-foreground mb-2">
              Rechercher un établissement par SIRET (14 chiffres)
            </p>
            <div className="flex gap-3">
              <input
                type="text"
                value={siretInput}
                onChange={(e) => setSiretInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLookup()}
                placeholder="Ex : 73282932000074"
                maxLength={17}
                className="flex-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono"
              />
              <button
                onClick={handleLookup}
                disabled={lookupFetching}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg disabled:opacity-50 transition-colors"
                style={{ background: "hsl(var(--primary))" }}
              >
                {lookupFetching ? (
                  <RefreshCw size={15} className="animate-spin" />
                ) : (
                  <Search size={15} />
                )}
                Rechercher
              </button>
            </div>
          </div>

          {lookupResult && (
            <>
              {lookupResult.error ? (
                <div className="rounded-xl p-3 flex items-center gap-3"
                  style={{ background: "hsl(var(--destructive) / 0.06)", border: "1px solid hsl(var(--destructive) / 0.2)" }}>
                  <XCircle size={18} style={{ color: "hsl(var(--destructive))" }} className="shrink-0" />
                  <p className="text-sm" style={{ color: "#F87171" }}>{lookupResult.error}</p>
                </div>
              ) : lookupResult.data ? (
                <div className="space-y-2">
                  {lookupResult.cached && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <RefreshCw size={11} />
                      Résultat depuis le cache local
                    </p>
                  )}
                  <SIRENECard data={lookupResult.data} />
                </div>
              ) : null}
            </>
          )}
        </div>
      )}

      {/* Enrichments tab */}
      {activeTab === "enrichments" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {enrichments.length} enrichissement(s) en cache
            </p>
            {enrichFetching && (
              <RefreshCw size={14} className="animate-spin text-muted-foreground" />
            )}
          </div>

          {enrichments.length === 0 && !enrichFetching ? (
            <div className="bg-card border border-border rounded-xl p-8 text-center">
              <Building2 size={28} className="text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Aucun enrichissement pour le moment. Utilisez{" "}
                <code className="text-xs px-1 py-0.5 rounded border border-border" style={{ color: "hsl(var(--primary))" }}>
                  POST /sirene/enrich/:contact_id
                </code>{" "}
                pour enrichir un contact.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[calc(100vh-260px)] overflow-y-auto">
              {enrichments.map((e) => (
                <div
                  key={e.id}
                  className="bg-card border border-border rounded-xl overflow-hidden"
                >
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <EtatBadge etat={e.etat_administratif} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {e.denomination_sociale || e.siret}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                          SIRET {e.siret}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() =>
                          setExpandedId(expandedId === e.id ? null : e.id)
                        }
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                      >
                        {expandedId === e.id ? (
                          <ChevronUp size={15} />
                        ) : (
                          <ChevronDown size={15} />
                        )}
                      </button>
                      <button
                        onClick={() => clearCache.mutate(e.contact_id)}
                        disabled={clearCache.isPending}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Vider le cache"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                  {expandedId === e.id && (
                    <div className="border-t border-border px-4 py-3">
                      <SIRENECard data={e} />
                      <p className="text-xs text-muted-foreground mt-2">
                        Mis à jour le{" "}
                        {new Date(e.fetched_at).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })}{" "}
                        · Expire le{" "}
                        {new Date(e.expires_at).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Alerts tab */}
      {activeTab === "alerts" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {alertsResult?.count ?? 0} fournisseur(s) avec statut cessé
            </p>
            {alertsFetching && (
              <RefreshCw size={14} className="animate-spin text-muted-foreground" />
            )}
          </div>

          {(alertsResult?.count ?? 0) > 0 && (
            <div className="rounded-xl p-3 flex items-start gap-3"
              style={{ background: "hsl(var(--warning) / 0.06)", border: "1px solid hsl(var(--warning) / 0.2)" }}>
              <AlertTriangle size={18} className="shrink-0 mt-0.5" style={{ color: "hsl(var(--warning))" }} />
              <p className="text-sm" style={{ color: "#FCD34D" }}>
                <strong>{alertsResult?.count} fournisseur(s)</strong> ont un
                statut &laquo;&nbsp;Cessé&nbsp;&raquo; dans la base SIRENE.
                Vérifiez leur situation avant de passer de nouvelles commandes.
              </p>
            </div>
          )}

          {!alertsFetching && (alertsResult?.count ?? 0) === 0 ? (
            <div className="bg-card border border-border rounded-xl p-8 text-center">
              <CheckCircle size={28} className="mx-auto mb-2" style={{ color: "hsl(var(--accent))" }} />
              <p className="text-sm font-medium" style={{ color: "#6EE7B7" }}>
                Aucune alerte — tous vos fournisseurs enrichis sont actifs.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[calc(100vh-260px)] overflow-y-auto">
              {alertsResult?.alerts.map((e) => (
                <SIRENECard key={e.id} data={e} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

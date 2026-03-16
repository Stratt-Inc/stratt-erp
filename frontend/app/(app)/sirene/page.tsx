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
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
        <CheckCircle size={12} />
        Actif
      </span>
    );
  }
  if (etat === "C") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
        <XCircle size={12} />
        Cessé
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
      {etat || "—"}
    </span>
  );
}

function SIRENECard({ data }: { data: SIRENEData | SIRENEEnrichment }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-lg font-semibold text-gray-900">
            {data.denomination_sociale || "—"}
          </p>
          <p className="text-sm text-gray-500 font-mono">
            SIRET {data.siret} · SIREN {data.siren}
          </p>
        </div>
        <EtatBadge etat={data.etat_administratif} />
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-gray-500">Adresse</p>
          <p className="text-gray-800">
            {[data.adresse, data.code_postal, data.commune]
              .filter(Boolean)
              .join(", ") || "—"}
          </p>
        </div>
        <div>
          <p className="text-gray-500">Forme juridique</p>
          <p className="text-gray-800">{data.forme_juridique || "—"}</p>
        </div>
        <div>
          <p className="text-gray-500">Code NAF</p>
          <p className="text-gray-800">{data.code_naf || "—"}</p>
        </div>
        <div>
          <p className="text-gray-500">Effectifs</p>
          <p className="text-gray-800">{data.tranche_effectifs || "—"}</p>
        </div>
        <div>
          <p className="text-gray-500">Date de création</p>
          <p className="text-gray-800">{data.date_creation || "—"}</p>
        </div>
        {data.date_cessation && (
          <div>
            <p className="text-gray-500">Date de cessation</p>
            <p className="text-red-600 font-medium">{data.date_cessation}</p>
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
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-50 rounded-lg">
          <Building2 size={24} className="text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Qualification SIRENE
          </h1>
          <p className="text-sm text-gray-500">
            Enrichissement des fournisseurs via l&apos;API INSEE SIRENE
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
              activeTab === t.id
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Lookup tab */}
      {activeTab === "lookup" && (
        <div className="space-y-5">
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-sm font-medium text-gray-700 mb-3">
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
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
              <button
                onClick={handleLookup}
                disabled={lookupFetching}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
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
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                  <XCircle size={18} className="text-red-500 shrink-0" />
                  <p className="text-sm text-red-700">{lookupResult.error}</p>
                </div>
              ) : lookupResult.data ? (
                <div className="space-y-2">
                  {lookupResult.cached && (
                    <p className="text-xs text-gray-400 flex items-center gap-1">
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
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {enrichments.length} enrichissement(s) en cache
            </p>
            {enrichFetching && (
              <RefreshCw size={14} className="animate-spin text-gray-400" />
            )}
          </div>

          {enrichments.length === 0 && !enrichFetching ? (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-10 text-center">
              <Building2 size={32} className="text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">
                Aucun enrichissement pour le moment. Utilisez{" "}
                <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">
                  POST /sirene/enrich/:contact_id
                </code>{" "}
                pour enrichir un contact.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {enrichments.map((e) => (
                <div
                  key={e.id}
                  className="bg-white border border-gray-200 rounded-xl overflow-hidden"
                >
                  <div className="flex items-center justify-between px-5 py-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <EtatBadge etat={e.etat_administratif} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {e.denomination_sociale || e.siret}
                        </p>
                        <p className="text-xs text-gray-400 font-mono">
                          SIRET {e.siret}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() =>
                          setExpandedId(expandedId === e.id ? null : e.id)
                        }
                        className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
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
                        className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50"
                        title="Vider le cache"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                  {expandedId === e.id && (
                    <div className="border-t border-gray-100 px-5 py-4">
                      <SIRENECard data={e} />
                      <p className="text-xs text-gray-400 mt-3">
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
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {alertsResult?.count ?? 0} fournisseur(s) avec statut cessé
            </p>
            {alertsFetching && (
              <RefreshCw size={14} className="animate-spin text-gray-400" />
            )}
          </div>

          {(alertsResult?.count ?? 0) > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle
                size={18}
                className="text-orange-500 shrink-0 mt-0.5"
              />
              <p className="text-sm text-orange-700">
                <strong>{alertsResult?.count} fournisseur(s)</strong> ont un
                statut &laquo;&nbsp;Cessé&nbsp;&raquo; dans la base SIRENE.
                Vérifiez leur situation avant de passer de nouvelles commandes.
              </p>
            </div>
          )}

          {!alertsFetching && (alertsResult?.count ?? 0) === 0 ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-10 text-center">
              <CheckCircle
                size={32}
                className="text-green-400 mx-auto mb-3"
              />
              <p className="text-sm text-green-700 font-medium">
                Aucune alerte — tous vos fournisseurs enrichis sont actifs.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
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

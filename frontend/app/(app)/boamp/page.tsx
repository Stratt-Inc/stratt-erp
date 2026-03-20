"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { DemoBanner } from "@/components/DemoBanner";
import {
  Search, Bell, Play, Trash2, Plus, ExternalLink, ChevronRight,
  AlertTriangle, Calendar, Building2, Tag, Filter, RefreshCw, X,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

interface BOAMPAvis {
  reference: string;
  titre: string;
  objet: string;
  acheteur: string;
  departement: string;
  code_cpv: string;
  procedure: string;
  date_publication: string;
  date_limite: string;
  montant: number;
  type_avis: string;
  url: string;
}

interface BOAMPSearchResult {
  avis: BOAMPAvis[];
  total: number;
  page: number;
  page_size: number;
  error?: string;
}

interface BOAMPVeille {
  id: string;
  nom: string;
  codes_cpv: string;
  departement: string;
  mots_cles: string;
  montant_min: number;
  montant_max: number;
  active: boolean;
  created_at: string;
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function BOAMPPage() {
  const { accessToken, currentOrg } = useAuthStore();
  const qc = useQueryClient();
  const opts = { token: accessToken ?? "", orgId: currentOrg?.id };

  const [tab, setTab] = useState<"search" | "veille">("search");
  const [q, setQ] = useState("");
  const [cpv, setCpv] = useState("");
  const [dept, setDept] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchParams, setSearchParams] = useState({ q: "", cpv: "", dept: "" });

  const [showNewVeille, setShowNewVeille] = useState(false);
  const [newVeille, setNewVeille] = useState({ nom: "", mots_cles: "", codes_cpv: "", departement: "" });
  const [runningVeille, setRunningVeille] = useState<string | null>(null);
  const [veilleResults, setVeilleResults] = useState<{ id: string; avis: BOAMPAvis[]; total: number } | null>(null);

  // ── Queries ──────────────────────────────────────────────────────────────

  const { data: searchResult, isLoading: loadingSearch, refetch: runSearch } =
    useQuery<BOAMPSearchResult>({
      queryKey: ["boamp", "search", searchParams],
      queryFn: () => {
        const p = new URLSearchParams();
        if (searchParams.q) p.set("q", searchParams.q);
        if (searchParams.cpv) p.set("cpv", searchParams.cpv);
        if (searchParams.dept) p.set("dept", searchParams.dept);
        return api.get(`/api/v1/boamp/search?${p.toString()}`, opts);
      },
      enabled: !!accessToken && !!currentOrg && searching,
    });

  const { data: veilles = [], isLoading: loadingVeilles } = useQuery<BOAMPVeille[]>({
    queryKey: ["boamp", "veille", currentOrg?.id],
    queryFn: () => api.get("/api/v1/boamp/veille", opts),
    enabled: !!accessToken && !!currentOrg,
  });

  // ── Mutations ────────────────────────────────────────────────────────────

  const createVeilleMutation = useMutation({
    mutationFn: () => api.post("/api/v1/boamp/veille", newVeille, opts),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["boamp", "veille"] });
      setShowNewVeille(false);
      setNewVeille({ nom: "", mots_cles: "", codes_cpv: "", departement: "" });
    },
  });

  const deleteVeilleMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/boamp/veille/${id}`, opts),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["boamp", "veille"] }),
  });

  // ── Helpers ──────────────────────────────────────────────────────────────

  function handleSearch() {
    setSearchParams({ q, cpv, dept });
    setSearching(true);
    setTimeout(() => runSearch(), 0);
  }

  async function runVeille(id: string) {
    setRunningVeille(id);
    try {
      const res = await api.get(`/api/v1/boamp/veille/${id}/run`, opts) as { avis: BOAMPAvis[]; total: number };
      setVeilleResults({ id, avis: res.avis ?? [], total: res.total ?? 0 });
      setTab("search");
    } finally {
      setRunningVeille(null);
    }
  }

  const avis = veilleResults ? veilleResults.avis : (searchResult?.avis ?? []);
  const total = veilleResults ? veilleResults.total : (searchResult?.total ?? 0);
  const apiError = searchResult?.error;

  const TABS = [
    { id: "search" as const, label: "Recherche AOs", icon: Search },
    { id: "veille" as const, label: `Veille (${veilles.length})`, icon: Bell },
  ];

  return (
    <div className="space-y-5">
      <DemoBanner />

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-1">
            Intégration réglementaire
          </p>
          <h1 className="text-2xl font-bold text-foreground">BOAMP — Appels d&apos;offres</h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            Bulletin Officiel des Annonces des Marchés Publics · Veille concurrentielle et publication
          </p>
        </div>
        <a
          href="https://www.boamp.fr"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" /> boamp.fr
        </a>
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 p-0.5 bg-muted/50 rounded-xl w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => { setTab(id); setVeilleResults(null); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${
              tab === id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* ── SEARCH TAB ── */}
      {tab === "search" && (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
              <div className="lg:col-span-2 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="Mots-clés (ex: travaux, informatique, nettoyage…)"
                  className="w-full pl-9 pr-3 py-2 text-[12px] rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  value={cpv}
                  onChange={(e) => setCpv(e.target.value)}
                  placeholder="Code CPV (ex: 72000000)"
                  className="w-full pl-9 pr-3 py-2 text-[12px] rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  value={dept}
                  onChange={(e) => setDept(e.target.value)}
                  placeholder="Département (ex: 75, 69)"
                  className="w-full pl-9 pr-3 py-2 text-[12px] rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={handleSearch}
                disabled={loadingSearch}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-semibold text-white disabled:opacity-50 transition-colors"
                style={{ background: "#5C93FF" }}
              >
                <Search className="w-3.5 h-3.5" />
                {loadingSearch ? "Recherche…" : "Rechercher sur BOAMP"}
              </button>
              {veilleResults && (
                <button
                  onClick={() => setVeilleResults(null)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] border border-border text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-3 h-3" /> Effacer résultats veille
                </button>
              )}
              {total > 0 && (
                <span className="text-[12px] text-muted-foreground ml-auto">
                  {total} résultat{total > 1 ? "s" : ""}
                  {veilleResults && <span className="ml-1 text-indigo-500 font-medium">(veille)</span>}
                </span>
              )}
            </div>
          </div>

          {/* API warning */}
          {apiError && (
            <div className="flex items-start gap-2 p-3 rounded-xl border text-[12px]"
              style={{ background: "rgba(245,158,11,0.05)", borderColor: "rgba(245,158,11,0.2)" }}>
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <span className="text-amber-700 dark:text-amber-400">
                API BOAMP inaccessible : {apiError}. Les résultats sont indisponibles temporairement.
              </span>
            </div>
          )}

          {/* Results */}
          {loadingSearch ? (
            <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}</div>
          ) : avis.length > 0 ? (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {["Type", "Référence", "Objet", "Acheteur", "Dépt.", "CPV", "Date limite", ""].map((h) => (
                      <th key={h} className="text-left px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {avis.map((a) => (
                    <tr key={a.reference} className="hover:bg-muted/20 transition-colors">
                      <td className="px-3 py-2.5">
                        <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold"
                          style={{ background: "rgba(92,147,255,0.1)", color: "#5C93FF" }}>
                          {a.type_avis || "AO"}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-[11px] text-muted-foreground">{a.reference}</td>
                      <td className="px-3 py-2.5 text-[12px] text-foreground max-w-[200px]">
                        <div className="truncate font-medium">{a.objet || a.titre}</div>
                        {a.procedure && <div className="text-[10px] text-muted-foreground">{a.procedure}</div>}
                      </td>
                      <td className="px-3 py-2.5 text-[11px] text-muted-foreground max-w-[140px] truncate">{a.acheteur}</td>
                      <td className="px-3 py-2.5 text-[11px] text-muted-foreground">{a.departement || "—"}</td>
                      <td className="px-3 py-2.5 font-mono text-[10px] text-muted-foreground">{a.code_cpv || "—"}</td>
                      <td className="px-3 py-2.5 text-[11px] tabular-nums text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {a.date_limite ? new Date(a.date_limite).toLocaleDateString("fr-FR") : "—"}
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        {a.url ? (
                          <a href={a.url} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[11px] text-indigo-500 hover:text-indigo-600">
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <ChevronRight className="w-3 h-3 text-muted-foreground" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : searching && !loadingSearch ? (
            <div className="bg-card border border-border rounded-xl p-8 text-center text-[12px] text-muted-foreground">
              Aucun appel d&apos;offres trouvé pour ces critères.
            </div>
          ) : !searching ? (
            <div className="bg-card border border-border rounded-xl p-10 text-center space-y-2">
              <Search className="w-8 h-8 text-muted-foreground mx-auto" />
              <p className="text-[13px] font-medium text-foreground">Recherchez des appels d&apos;offres</p>
              <p className="text-[12px] text-muted-foreground">Filtrez par mots-clés, code CPV ou département.</p>
            </div>
          ) : null}
        </div>
      )}

      {/* ── VEILLE TAB ── */}
      {tab === "veille" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[13px] font-semibold text-foreground">Alertes de veille configurées</h2>
            <button
              onClick={() => setShowNewVeille(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white transition-colors"
              style={{ background: "#5C93FF" }}
            >
              <Plus className="w-3.5 h-3.5" /> Nouvelle veille
            </button>
          </div>

          {/* New veille form */}
          {showNewVeille && (
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <h3 className="text-[13px] font-semibold text-foreground">Configurer une alerte de veille</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {[
                  { key: "nom", label: "Nom de la veille *", placeholder: "ex: Marchés IT Île-de-France" },
                  { key: "mots_cles", label: "Mots-clés", placeholder: "ex: informatique logiciel" },
                  { key: "codes_cpv", label: "Codes CPV", placeholder: "ex: 72000000,48000000" },
                  { key: "departement", label: "Département", placeholder: "ex: 75" },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="text-[11px] font-medium text-muted-foreground block mb-1">{label}</label>
                    <input
                      value={newVeille[key as keyof typeof newVeille]}
                      onChange={(e) => setNewVeille(v => ({ ...v, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className="w-full px-3 py-1.5 text-[12px] rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => createVeilleMutation.mutate()}
                  disabled={!newVeille.nom || createVeilleMutation.isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white disabled:opacity-50"
                  style={{ background: "#5C93FF" }}
                >
                  {createVeilleMutation.isPending ? "Enregistrement…" : "Enregistrer"}
                </button>
                <button
                  onClick={() => setShowNewVeille(false)}
                  className="px-3 py-1.5 rounded-lg text-[12px] border border-border text-muted-foreground hover:text-foreground transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}

          {/* Veille list */}
          {loadingVeilles ? (
            <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-14 bg-muted rounded-xl animate-pulse" />)}</div>
          ) : veilles.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-8 text-center text-[12px] text-muted-foreground">
              Aucune veille configurée. Créez votre première alerte pour surveiller automatiquement les AOs pertinents.
            </div>
          ) : (
            <div className="space-y-2">
              {veilles.map((v) => (
                <div key={v.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[13px] font-semibold text-foreground">{v.nom}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${v.active ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-950" : "text-muted-foreground bg-muted"}`}>
                        {v.active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      {v.mots_cles && (
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Search className="w-3 h-3" /> {v.mots_cles}
                        </span>
                      )}
                      {v.codes_cpv && (
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Tag className="w-3 h-3" /> {v.codes_cpv}
                        </span>
                      )}
                      {v.departement && (
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Building2 className="w-3 h-3" /> Dépt. {v.departement}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => runVeille(v.id)}
                      disabled={runningVeille === v.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium border border-border text-foreground hover:bg-muted/50 transition-colors disabled:opacity-50"
                    >
                      {runningVeille === v.id
                        ? <><RefreshCw className="w-3 h-3 animate-spin" /> Exécution…</>
                        : <><Play className="w-3 h-3" /> Exécuter</>
                      }
                    </button>
                    <button
                      onClick={() => deleteVeilleMutation.mutate(v.id)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { useIsDemo } from "@/components/DemoBanner";
import { Shield, Puzzle, Users, Key, Copy, Trash2, Plus, ExternalLink } from "lucide-react";
import { useState } from "react";
import { MODULE } from "@/lib/colors";

interface ModuleView {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  enabled: boolean;
}

interface APIKeyRow {
  id: string;
  label: string;
  key_prefix: string;
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string;
}

function Toggle({ enabled, onToggle, disabled }: { enabled: boolean; onToggle: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={onToggle}
      disabled={disabled}
      className="relative flex-shrink-0 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-full disabled:opacity-40 disabled:cursor-not-allowed"
      style={{
        width: 40,
        height: 22,
        background: enabled ? "hsl(var(--primary))" : "hsl(var(--muted))",
      }}
    >
      <span
        className="absolute top-[2px] w-[18px] h-[18px] bg-white rounded-full shadow-sm transition-transform duration-200"
        style={{ transform: enabled ? "translateX(20px)" : "translateX(2px)" }}
      />
    </button>
  );
}

export default function SettingsPage() {
  const { accessToken, currentOrg } = useAuthStore();
  const isDemo = useIsDemo();
  const qc = useQueryClient();

  const opts = { token: accessToken ?? "", orgId: currentOrg?.id };

  // API Keys state
  const [keyFormOpen, setKeyFormOpen] = useState(false);
  const [keyLabel, setKeyLabel] = useState("");
  const [newKeyRevealed, setNewKeyRevealed] = useState<{ key: string; label: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  const { data: modules = [] } = useQuery<ModuleView[]>({
    queryKey: ["modules", currentOrg?.id],
    queryFn: () => api.get("/api/v1/modules", opts),
    enabled: !!accessToken && !!currentOrg,
  });

  const toggle = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) => {
      const path = enabled ? "disable" : "enable";
      return api.post(`/api/v1/modules/${id}/${path}`, undefined, opts);
    },
    onMutate: async ({ id, enabled }) => {
      await qc.cancelQueries({ queryKey: ["modules", currentOrg?.id] });
      const prev = qc.getQueryData<ModuleView[]>(["modules", currentOrg?.id]);
      qc.setQueryData<ModuleView[]>(["modules", currentOrg?.id], (old) =>
        (old ?? []).map((m) => (m.id === id ? { ...m, enabled: !enabled } : m))
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(["modules", currentOrg?.id], ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["modules", currentOrg?.id] });
    },
  });

  // API Keys queries/mutations
  const { data: apiKeys = [] } = useQuery<APIKeyRow[]>({
    queryKey: ["api-keys", currentOrg?.id],
    queryFn: () => api.get("/api/v1/api-keys", opts),
    enabled: !!accessToken && !!currentOrg,
  });

  const createKey = useMutation<{ key: string; label: string }, Error, string>({
    mutationFn: (label: string) =>
      api.post("/api/v1/api-keys", { label }, opts) as Promise<{ key: string; label: string }>,
    onSuccess: (res) => {
      setNewKeyRevealed({ key: res.key, label: res.label });
      setKeyLabel("");
      setKeyFormOpen(false);
      qc.invalidateQueries({ queryKey: ["api-keys", currentOrg?.id] });
    },
  });

  const deleteKey = useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/api-keys/${id}`, opts),
    onSettled: () => qc.invalidateQueries({ queryKey: ["api-keys", currentOrg?.id] }),
  });

  function copyKey(key: string) {
    navigator.clipboard.writeText(key);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  }

  return (
    <div className="space-y-3 max-w-2xl mx-auto">
      {/* Header */}
      <div className="pb-3 flex-shrink-0" style={{ borderBottom: "1px solid hsl(var(--muted-foreground) / 0.08)" }}>
        <div className="section-header" style={{ marginBottom: 4 }}>
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: MODULE.settings, boxShadow: `0 0 6px ${MODULE.settings}` }} />
          <span className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "hsl(var(--foreground) / 0.4)" }}>Configuration</span>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-[22px] font-extrabold text-foreground" style={{ letterSpacing: "-0.025em" }}>
              Paramètres
            </h1>
            <p className="text-[12px] mt-0.5 text-muted-foreground">
              {currentOrg?.name ?? "Chargement…"}
            </p>
          </div>
          {isDemo && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: "hsl(var(--warning) / 0.1)", color: "#D97706" }}>
              Lecture seule
            </span>
          )}
        </div>
      </div>

      {/* Modules ERP */}
      <div className="space-y-2">
        <div className="section-header">
          <Puzzle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "hsl(var(--primary))" }} />
          <span className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "hsl(var(--foreground) / 0.4)" }}>Modules ERP</span>
        </div>
        <div className="bg-card rounded-xl border border-border overflow-hidden divide-y divide-border">
          {modules.length === 0 && (
            <div className="py-6 text-center text-xs text-muted-foreground">Chargement…</div>
          )}
          {modules.map((m) => (
            <div key={m.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `${m.color}15`, color: m.color }}
                >
                  <Puzzle className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground leading-none">{m.name}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{m.description}</p>
                </div>
              </div>
              <Toggle
                enabled={m.enabled}
                onToggle={() => toggle.mutate({ id: m.id, enabled: m.enabled })}
                disabled={isDemo || toggle.isPending}
              />
            </div>
          ))}
        </div>
      </div>

      {/* API Keys */}
      <div className="space-y-2">
        <div className="section-header">
          <Key className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "hsl(var(--primary))" }} />
          <span className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "hsl(var(--foreground) / 0.4)" }}>API REST</span>
          <a
            href="/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto flex items-center gap-1 text-[10px] font-semibold"
            style={{ color: "hsl(var(--primary))" }}
          >
            <ExternalLink className="w-3 h-3" />
            Documentation Swagger
          </a>
        </div>

        {/* Revealed key banner */}
        {newKeyRevealed && (
          <div className="rounded-xl border px-4 py-3 space-y-1"
            style={{ background: "hsl(var(--primary) / 0.06)", borderColor: "hsl(var(--primary) / 0.2)" }}>
            <p className="text-[11px] font-semibold" style={{ color: "hsl(var(--primary))" }}>
              Copiez cette clé maintenant — elle ne sera plus affichée.
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-[11px] font-mono truncate text-foreground bg-background rounded px-2 py-1 border border-border">
                {newKeyRevealed.key}
              </code>
              <button
                type="button"
                onClick={() => copyKey(newKeyRevealed.key)}
                className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-colors"
                style={{ background: "hsl(var(--primary))", color: "white" }}
              >
                <Copy className="w-3 h-3" />
                {copiedKey ? "Copié !" : "Copier"}
              </button>
              <button
                type="button"
                onClick={() => setNewKeyRevealed(null)}
                className="text-[11px] text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        <div className="bg-card rounded-xl border border-border overflow-hidden divide-y divide-border">
          {apiKeys.length === 0 && !keyFormOpen && (
            <div className="py-6 text-center text-xs text-muted-foreground">Aucune clé API créée.</div>
          )}
          {apiKeys.map((k) => (
            <div key={k.id} className="flex items-center justify-between px-4 py-3 gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "hsl(var(--primary) / 0.08)", color: "hsl(var(--primary))" }}>
                  <Key className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground leading-none">{k.label}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 font-mono">
                    {k.key_prefix}••••••••
                    {k.last_used_at && (
                      <span className="ml-2 non-mono font-sans">
                        · utilisée {new Date(k.last_used_at).toLocaleDateString("fr-FR")}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {k.expires_at && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full"
                    style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}>
                    exp. {new Date(k.expires_at).toLocaleDateString("fr-FR")}
                  </span>
                )}
                <button
                  type="button"
                  disabled={isDemo || deleteKey.isPending}
                  onClick={() => deleteKey.mutate(k.id)}
                  className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-40"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {keyFormOpen ? (
            <form
              className="px-4 py-3 flex items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (keyLabel.trim()) createKey.mutate(keyLabel.trim());
              }}
            >
              <input
                autoFocus
                type="text"
                placeholder="Nom de la clé (ex: Intégration ERP)"
                value={keyLabel}
                onChange={(e) => setKeyLabel(e.target.value)}
                className="flex-1 text-sm bg-background border border-border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary/40"
              />
              <button
                type="submit"
                disabled={!keyLabel.trim() || createKey.isPending}
                className="text-[11px] font-semibold px-3 py-1.5 rounded-lg disabled:opacity-40 transition-colors"
                style={{ background: "hsl(var(--primary))", color: "white" }}
              >
                {createKey.isPending ? "…" : "Créer"}
              </button>
              <button
                type="button"
                onClick={() => { setKeyFormOpen(false); setKeyLabel(""); }}
                className="text-[11px] text-muted-foreground hover:text-foreground"
              >
                Annuler
              </button>
            </form>
          ) : (
            <button
              type="button"
              disabled={isDemo}
              onClick={() => setKeyFormOpen(true)}
              className="w-full flex items-center gap-2 px-4 py-3 text-[12px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors disabled:opacity-40"
            >
              <Plus className="w-3.5 h-3.5" />
              Nouvelle clé API
            </button>
          )}
        </div>
      </div>

      {/* Sections à venir */}
      {[
        { icon: Users, label: "Membres & rôles", desc: "Gérez les membres de l'organisation et leurs permissions.", color: "hsl(var(--accent))" },
        { icon: Shield, label: "Sécurité", desc: "Authentification à deux facteurs, sessions actives.", color: "hsl(var(--accent))" },
      ].map(({ icon: Icon, label, desc, color }) => (
        <div key={label} className="space-y-2">
          <div className="section-header">
            <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color }} />
            <span className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "hsl(var(--foreground) / 0.4)" }}>{label}</span>
          </div>
          <div className="rounded-xl border border-dashed border-border px-4 py-5 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{desc}</p>
            <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ml-4"
              style={{ background: "hsl(var(--primary) / 0.08)", color: "hsl(var(--primary))" }}>
              Bientôt
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

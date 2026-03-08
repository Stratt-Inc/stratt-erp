"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { useIsDemo } from "@/components/DemoBanner";
import { Shield, Puzzle, Users } from "lucide-react";

interface ModuleView {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  enabled: boolean;
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
        width: 44,
        height: 24,
        background: enabled ? "#5B6BF5" : "hsl(var(--muted))",
      }}
    >
      <span
        className="absolute top-[2px] w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200"
        style={{ transform: enabled ? "translateX(22px)" : "translateX(2px)" }}
      />
    </button>
  );
}

export default function SettingsPage() {
  const { accessToken, currentOrg } = useAuthStore();
  const isDemo = useIsDemo();
  const qc = useQueryClient();

  const opts = { token: accessToken ?? "", orgId: currentOrg?.id };

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
    // Optimistic update — flip the toggle instantly, revert on error
    onMutate: async ({ id, enabled }) => {
      await qc.cancelQueries({ queryKey: ["modules", currentOrg?.id] });
      const prev = qc.getQueryData<ModuleView[]>(["modules", currentOrg?.id]);
      qc.setQueryData<ModuleView[]>(["modules", currentOrg?.id], (old) =>
        (old ?? []).map((m) => (m.id === id ? { ...m, enabled: !enabled } : m))
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) {
        qc.setQueryData(["modules", currentOrg?.id], ctx.prev);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["modules", currentOrg?.id] });
    },
  });

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Paramètres</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Configuration de{" "}
          <span className="font-semibold text-foreground">{currentOrg?.name}</span>
        </p>
      </div>

      {/* Modules */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Puzzle className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-foreground">Modules ERP</h2>
          {isDemo && (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full ml-auto"
              style={{ background: "rgba(245,158,11,0.1)", color: "#D97706" }}>
              Lecture seule en mode démo
            </span>
          )}
        </div>
        <div className="space-y-2">
          {modules.map((m) => (
            <div key={m.id}
              className="flex items-center justify-between p-4 rounded-xl border border-border bg-card hover:shadow-sm transition-shadow">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ background: `${m.color}15`, color: m.color }}>
                  <Puzzle className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">{m.name}</p>
                  <p className="text-xs text-muted-foreground">{m.description}</p>
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
      </section>

      {/* Sections à venir */}
      {[
        { icon: Users, label: "Membres & rôles", desc: "Gérez les membres de l'organisation et leurs permissions." },
        { icon: Shield, label: "Sécurité", desc: "Authentification à deux facteurs, sessions actives." },
      ].map(({ icon: Icon, label, desc }) => (
        <section key={label} className="space-y-4">
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-foreground">{label}</h2>
          </div>
          <div className="rounded-xl border border-dashed border-border p-8 text-center">
            <p className="text-sm text-muted-foreground">{desc}</p>
            <span className="inline-flex mt-3 text-xs font-semibold px-3 py-1 rounded-full"
              style={{ background: "rgba(91,107,245,0.1)", color: "#5B6BF5" }}>
              Bientôt disponible
            </span>
          </div>
        </section>
      ))}
    </div>
  );
}

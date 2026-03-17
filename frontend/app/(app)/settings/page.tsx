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
        width: 40,
        height: 22,
        background: enabled ? "#5C93FF" : "hsl(var(--muted))",
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

  return (
    <div className="space-y-3 max-w-2xl mx-auto">
      {/* Header */}
      <div className="pb-3 flex-shrink-0" style={{ borderBottom: "1px solid rgba(92,147,255,0.08)" }}>
        <div className="section-header" style={{ marginBottom: 4 }}>
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#8B5CF6", boxShadow: "0 0 6px #8B5CF6" }} />
          <span className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "rgba(30,50,80,0.4)" }}>Configuration</span>
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
              style={{ background: "rgba(245,158,11,0.1)", color: "#D97706" }}>
              Lecture seule
            </span>
          )}
        </div>
      </div>

      {/* Modules ERP */}
      <div className="space-y-2">
        <div className="section-header">
          <Puzzle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#5C93FF" }} />
          <span className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "rgba(30,50,80,0.4)" }}>Modules ERP</span>
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

      {/* Sections à venir */}
      {[
        { icon: Users, label: "Membres & rôles", desc: "Gérez les membres de l'organisation et leurs permissions.", color: "#06B6D4" },
        { icon: Shield, label: "Sécurité", desc: "Authentification à deux facteurs, sessions actives.", color: "#10B981" },
      ].map(({ icon: Icon, label, desc, color }) => (
        <div key={label} className="space-y-2">
          <div className="section-header">
            <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color }} />
            <span className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "rgba(30,50,80,0.4)" }}>{label}</span>
          </div>
          <div className="rounded-xl border border-dashed border-border px-4 py-5 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{desc}</p>
            <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ml-4"
              style={{ background: "rgba(92,147,255,0.08)", color: "#5C93FF" }}>
              Bientôt
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

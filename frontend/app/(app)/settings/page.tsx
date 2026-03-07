"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { Shield, Puzzle, Users } from "lucide-react";

interface ModuleView {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  enabled: boolean;
}

export default function SettingsPage() {
  const { accessToken, currentOrg } = useAuthStore();

  const { data: modules = [], refetch } = useQuery<ModuleView[]>({
    queryKey: ["modules", currentOrg?.id],
    queryFn: () => api.get("/api/v1/modules", { token: accessToken ?? "", orgId: currentOrg?.id }),
    enabled: !!accessToken && !!currentOrg,
  });

  async function toggleModule(id: string, enabled: boolean) {
    const path = enabled ? "disable" : "enable";
    await api.post(`/api/v1/modules/${id}/${path}`, undefined, {
      token: accessToken ?? "",
      orgId: currentOrg?.id,
    });
    refetch();
  }

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
        </div>
        <div className="space-y-2">
          {modules.map((m) => (
            <div key={m.id}
              className="flex items-center justify-between p-4 rounded-xl border border-border bg-card hover:shadow-sm transition-shadow">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm"
                  style={{ background: `${m.color}15`, color: m.color }}>
                  <Puzzle className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">{m.name}</p>
                  <p className="text-xs text-muted-foreground">{m.description}</p>
                </div>
              </div>
              <button
                onClick={() => toggleModule(m.id, m.enabled)}
                className={[
                  "relative w-11 h-6 rounded-full transition-colors",
                  m.enabled ? "bg-primary" : "bg-muted",
                ].join(" ")}
              >
                <span className={[
                  "absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform",
                  m.enabled ? "translate-x-5" : "translate-x-0.5",
                ].join(" ")} />
              </button>
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

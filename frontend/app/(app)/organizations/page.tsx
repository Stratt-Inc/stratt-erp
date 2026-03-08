"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore, type Organization } from "@/store/auth";
import { useIsDemo } from "@/components/DemoBanner";
import { Building2, Plus, Users, Check, Lock } from "lucide-react";

export default function OrganizationsPage() {
  const { accessToken, currentOrg, setCurrentOrg } = useAuthStore();
  const isDemo = useIsDemo();
  const qc = useQueryClient();

  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  const { data: orgs = [] } = useQuery<Organization[]>({
    queryKey: ["organizations"],
    queryFn: () => api.get("/api/v1/organizations", { token: accessToken ?? "" }),
    enabled: !!accessToken,
  });

  const create = useMutation({
    mutationFn: (body: { name: string; slug: string }) =>
      api.post("/api/v1/organizations", body, { token: accessToken ?? "" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["organizations"] });
      setShowCreate(false);
      setName("");
      setSlug("");
    },
  });

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Organisations</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gérez vos espaces de travail multi-tenant.
          </p>
        </div>
        {isDemo ? (
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-muted-foreground border border-border cursor-not-allowed select-none"
            title="Non disponible en mode démo">
            <Lock className="w-3.5 h-3.5" />
            Nouvelle organisation
          </div>
        ) : (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #5B6BF5, #7B5BE8)" }}
          >
            <Plus className="w-4 h-4" />
            Nouvelle organisation
          </button>
        )}
      </div>

      {/* Demo notice */}
      {isDemo && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
          style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)" }}>
          <Lock className="w-4 h-4 flex-shrink-0" style={{ color: "#D97706" }} />
          <span style={{ color: "#92400E" }}>
            En mode démo, la création d&apos;organisations est désactivée. Vous pouvez uniquement consulter les données existantes.
          </span>
        </div>
      )}

      {/* Create form */}
      {showCreate && !isDemo && (
        <div className="rounded-xl border border-primary/30 bg-card p-6 space-y-4">
          <h3 className="font-semibold text-foreground">Créer une organisation</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Nom</label>
              <input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""));
                }}
                placeholder="Mon entreprise"
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Slug</label>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="mon-entreprise"
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => create.mutate({ name, slug })}
              disabled={!name || create.isPending}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #5B6BF5, #7B5BE8)" }}
            >
              {create.isPending ? "Création…" : "Créer"}
            </button>
            <button
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-muted-foreground bg-secondary"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {orgs.map((org) => (
          <div key={org.id}
            className={[
              "flex items-center justify-between p-5 rounded-xl border bg-card transition-all hover:shadow-sm cursor-pointer",
              currentOrg?.id === org.id ? "border-primary/40" : "border-border",
            ].join(" ")}
            onClick={() => setCurrentOrg(org)}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white"
                style={{ background: "linear-gradient(135deg, #5B6BF5, #9B6FE8)" }}>
                {org.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-foreground">{org.name}</p>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
                    style={{ background: "rgba(91,107,245,0.1)", color: "#5B6BF5" }}>
                    {org.plan}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground font-mono">{org.slug}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Users className="w-3.5 h-3.5" />
                <span>Membres</span>
              </div>
              {currentOrg?.id === org.id && (
                <div className="w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ background: "#5B6BF5" }}>
                  <Check className="w-3.5 h-3.5 text-white" />
                </div>
              )}
            </div>
          </div>
        ))}

        {orgs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-dashed border-border">
            <Building2 className="w-10 h-10 text-muted-foreground/40 mb-3" />
            <p className="font-semibold text-foreground">Aucune organisation</p>
            <p className="text-sm text-muted-foreground mt-1">Créez votre première organisation pour commencer.</p>
          </div>
        )}
      </div>
    </div>
  );
}

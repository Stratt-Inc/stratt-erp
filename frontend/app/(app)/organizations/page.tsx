"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore, type Organization } from "@/store/auth";
import { useIsDemo } from "@/components/DemoBanner";
import { Building2, Plus, Users, Check, Lock, ChevronRight } from "lucide-react";

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
    <div className="space-y-3 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-end justify-between gap-8 pb-3" style={{ borderBottom: "1px solid rgba(92,147,255,0.08)" }}>
        <div>
          <div className="section-header" style={{ marginBottom: 4 }}>
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#5C93FF", boxShadow: "0 0 6px #5C93FF" }} />
            <span className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "rgba(30,50,80,0.4)" }}>Espace de travail</span>
          </div>
          <h1 className="text-[22px] font-extrabold text-foreground" style={{ letterSpacing: "-0.025em" }}>
            Organisations
          </h1>
          <p className="text-[12px] mt-0.5 text-muted-foreground">Gérez vos espaces de travail multi-tenant</p>
        </div>
        {isDemo ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground border border-border cursor-not-allowed opacity-60 select-none">
            <Lock className="w-3.5 h-3.5" /> Nouvelle organisation
          </div>
        ) : (
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-white flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #5C93FF, #24DDB8)" }}
          >
            <Plus className="w-3.5 h-3.5" /> Nouvelle organisation
          </button>
        )}
      </div>

      {/* Demo notice */}
      {isDemo && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs"
          style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)" }}>
          <Lock className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#D97706" }} />
          <span style={{ color: "rgba(30,50,80,0.6)" }}>
            En mode démo, la création d&apos;organisations est désactivée.
          </span>
        </div>
      )}

      {/* Create form */}
      {showCreate && !isDemo && (
        <div className="rounded-xl border border-primary/20 bg-card p-4 space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Créer une organisation</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Nom</label>
              <input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""));
                }}
                placeholder="Mon entreprise"
                className="w-full px-3 py-1.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary/40"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Slug</label>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="mon-entreprise"
                className="w-full px-3 py-1.5 rounded-lg border border-input bg-background text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary/40"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => create.mutate({ name, slug })}
              disabled={!name || create.isPending}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #5C93FF, #24DDB8)" }}
            >
              {create.isPending ? "Création…" : "Créer"}
            </button>
            <button
              onClick={() => setShowCreate(false)}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground border border-border hover:bg-muted/50 transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="space-y-2">
        {orgs.map((org) => {
          const isActive = currentOrg?.id === org.id;
          return (
            <div
              key={org.id}
              onClick={() => setCurrentOrg(org)}
              className="flex items-center justify-between px-4 py-3 rounded-xl border bg-card cursor-pointer transition-all hover:shadow-sm group"
              style={{
                borderColor: isActive ? "rgba(92,147,255,0.35)" : undefined,
                background: isActive ? "rgba(92,147,255,0.03)" : undefined,
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #5C93FF, #24DDB8)" }}
                >
                  {org.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">{org.name}</p>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider"
                      style={{ background: "rgba(92,147,255,0.1)", color: "#5C93FF" }}>
                      {org.plan}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground font-mono mt-0.5">{org.slug}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="w-3 h-3" />
                  <span>Membres</span>
                </div>
                {isActive ? (
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: "#5C93FF" }}>
                    <Check className="w-3 h-3 text-white" />
                  </div>
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
                )}
              </div>
            </div>
          );
        })}

        {orgs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-center rounded-xl border border-dashed border-border">
            <Building2 className="w-8 h-8 text-muted-foreground/30 mb-2" />
            <p className="text-sm font-semibold text-foreground">Aucune organisation</p>
            <p className="text-xs text-muted-foreground mt-1">Créez votre première organisation pour commencer.</p>
          </div>
        )}
      </div>
    </div>
  );
}

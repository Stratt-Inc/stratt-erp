"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { DemoBanner, useIsDemo } from "@/components/DemoBanner";
import { Users, TrendingUp, Handshake, Plus, Search } from "lucide-react";

interface Contact {
  id: string;
  type: string;
  first_name: string;
  last_name: string;
  company: string;
  email: string;
  phone: string;
  tags: string;
}

interface Lead {
  id: string;
  title: string;
  status: string;
  value: number;
  source: string;
  contact?: { first_name: string; last_name: string; company: string };
}

interface Deal {
  id: string;
  title: string;
  stage: string;
  value: number;
  probability: number;
  contact?: { first_name: string; last_name: string; company: string };
}

interface PagedResponse<T> { items: T[]; total: number; }

const statusColors: Record<string, string> = {
  new: "hsl(var(--primary))", contacted: "hsl(var(--accent))", qualified: "hsl(var(--accent))", lost: "hsl(var(--destructive))",
};
const stageColors: Record<string, string> = {
  prospecting: "#6B7280", proposal: "hsl(var(--primary))", negotiation: "hsl(var(--warning))",
  closed_won: "hsl(var(--accent))", closed_lost: "hsl(var(--destructive))",
};
const stageLabels: Record<string, string> = {
  prospecting: "Prospection", proposal: "Proposition", negotiation: "Négociation",
  closed_won: "Gagné", closed_lost: "Perdu",
};
const statusLabels: Record<string, string> = {
  new: "Nouveau", contacted: "Contacté", qualified: "Qualifié", lost: "Perdu",
};

function StatusBadge({ label, color }: { label: string; color: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold"
      style={{ background: `${color}14`, color }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

type Tab = "contacts" | "leads" | "deals";

export default function CRMPage() {
  const { accessToken, currentOrg } = useAuthStore();
  const isDemo = useIsDemo();
  const [tab, setTab] = useState<Tab>("contacts");
  const [search, setSearch] = useState("");

  const opts = { token: accessToken ?? "", orgId: currentOrg?.id };

  const { data: contacts, isLoading: loadingC } = useQuery<PagedResponse<Contact>>({
    queryKey: ["crm", "contacts", currentOrg?.id, search],
    queryFn: () => api.get(`/api/v1/crm/contacts?limit=50${search ? `&search=${search}` : ""}`, opts),
    enabled: !!accessToken && !!currentOrg,
  });

  const { data: leads, isLoading: loadingL } = useQuery<PagedResponse<Lead>>({
    queryKey: ["crm", "leads", currentOrg?.id],
    queryFn: () => api.get("/api/v1/crm/leads?limit=50", opts),
    enabled: !!accessToken && !!currentOrg,
  });

  const { data: deals, isLoading: loadingD } = useQuery<PagedResponse<Deal>>({
    queryKey: ["crm", "deals", currentOrg?.id],
    queryFn: () => api.get("/api/v1/crm/deals?limit=50", opts),
    enabled: !!accessToken && !!currentOrg,
  });

  const stats = [
    { label: "Contacts", value: contacts?.total ?? 0, icon: Users, color: "hsl(var(--primary))" },
    { label: "Leads", value: leads?.total ?? 0, icon: TrendingUp, color: "hsl(var(--accent))" },
    { label: "Deals", value: deals?.total ?? 0, icon: Handshake, color: "hsl(var(--accent))" },
    {
      label: "Pipeline",
      value: `${((deals?.items ?? []).reduce((s, d) => s + d.value, 0)).toLocaleString("fr-FR")} €`,
      icon: TrendingUp,
      color: "hsl(var(--warning))",
    },
  ];

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "contacts", label: "Contacts", count: contacts?.total ?? 0 },
    { id: "leads", label: "Leads", count: leads?.total ?? 0 },
    { id: "deals", label: "Deals", count: deals?.total ?? 0 },
  ];

  const isLoading = loadingC || loadingL || loadingD;

  return (
    <div className="space-y-3">
      <DemoBanner />

      {/* Header */}
      <div className="flex items-center justify-between pb-3" style={{ borderBottom: "1px solid hsl(var(--primary) / 0.08)" }}>
        <div>
          <div className="section-header" style={{ marginBottom: 4 }}>
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: "hsl(var(--primary))", boxShadow: "0 0 6px hsl(var(--primary))" }} />
            <span className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "hsl(var(--foreground) / 0.4)" }}>Module CRM</span>
          </div>
          <h1 className="text-[20px] font-extrabold text-foreground" style={{ letterSpacing: "-0.02em" }}>Gestion commerciale</h1>
          <p className="text-[12px] mt-0.5 text-muted-foreground">Contacts, leads et opportunités</p>
        </div>
        {!isDemo && (
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ background: "hsl(var(--primary))" }}>
            <Plus className="w-4 h-4" /> Ajouter
          </button>
        )}
      </div>

      {/* Stats — signal tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="stat-tile" style={{ "--tile-color": color } as React.CSSProperties}>
            <p className="stat-number">{value}</p>
            <p className="stat-label">{label}</p>
            <Icon className="stat-tile-icon" />
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-border flex items-center gap-1">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}>
            {t.label}
            <span className="px-1.5 py-0.5 rounded-full text-[11px] font-bold"
              style={{ background: tab === t.id ? "hsl(var(--primary) / 0.1)" : "hsl(var(--foreground) / 0.07)", color: tab === t.id ? "hsl(var(--primary))" : "#9CA3AF" }}>
              {t.count}
            </span>
          </button>
        ))}
        {tab === "contacts" && (
          <div className="ml-auto flex items-center gap-2 pb-1">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher…"
                className="pl-8 pr-3 py-1.5 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 w-48"
              />
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : tab === "contacts" ? (
        <ContactsTable items={contacts?.items ?? []} />
      ) : tab === "leads" ? (
        <LeadsTable items={leads?.items ?? []} />
      ) : (
        <DealsTable items={deals?.items ?? []} />
      )}
    </div>
  );
}

function ContactsTable({ items }: { items: Contact[] }) {
  if (!items.length) return <EmptyState label="Aucun contact" />;
  return (
    <div className="data-table-wrap overflow-y-auto max-h-[calc(100vh-320px)]">
      <table className="w-full">
        <thead className="data-table-head">
          <tr>
            <th className="data-th">Nom</th>
            <th className="data-th hidden md:table-cell">Société</th>
            <th className="data-th hidden lg:table-cell">Email</th>
            <th className="data-th hidden lg:table-cell">Téléphone</th>
            <th className="data-th">Type</th>
          </tr>
        </thead>
        <tbody className="data-table-body">
          {items.map((c) => (
            <tr key={c.id} className="data-row">
              <td className="px-4 py-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
                    style={{ background: "hsl(var(--primary))" }}>
                    {c.first_name?.[0]?.toUpperCase() ?? "?"}
                  </div>
                  <span className="font-medium text-sm text-foreground">{c.first_name} {c.last_name}</span>
                </div>
              </td>
              <td className="px-4 py-2 text-sm text-muted-foreground hidden md:table-cell">{c.company || "—"}</td>
              <td className="px-4 py-2 text-sm text-muted-foreground hidden lg:table-cell">{c.email || "—"}</td>
              <td className="px-4 py-2 text-sm text-muted-foreground hidden lg:table-cell">{c.phone || "—"}</td>
              <td className="px-4 py-2">
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: c.type === "company" ? "hsl(var(--primary) / 0.1)" : "hsl(var(--accent) / 0.1)", color: c.type === "company" ? "hsl(var(--primary))" : "hsl(var(--accent))" }}>
                  {c.type === "company" ? "Société" : "Personne"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LeadsTable({ items }: { items: Lead[] }) {
  if (!items.length) return <EmptyState label="Aucun lead" />;
  return (
    <div className="data-table-wrap overflow-y-auto max-h-[calc(100vh-320px)]">
      <table className="w-full">
        <thead className="data-table-head">
          <tr>
            <th className="data-th">Lead</th>
            <th className="data-th hidden md:table-cell">Contact</th>
            <th className="data-th">Statut</th>
            <th className="data-th hidden lg:table-cell">Source</th>
            <th className="data-th data-th-r">Valeur</th>
          </tr>
        </thead>
        <tbody className="data-table-body">
          {items.map((l) => (
            <tr key={l.id} className="data-row">
              <td className="px-4 py-2 text-sm font-medium text-foreground">{l.title}</td>
              <td className="px-4 py-2 text-sm text-muted-foreground hidden md:table-cell">
                {l.contact ? `${l.contact.first_name} ${l.contact.last_name}` : "—"}
              </td>
              <td className="px-4 py-2">
                <StatusBadge label={statusLabels[l.status] ?? l.status} color={statusColors[l.status] ?? "#6B7280"} />
              </td>
              <td className="px-4 py-2 text-sm text-muted-foreground hidden lg:table-cell">{l.source || "—"}</td>
              <td className="px-4 py-2 text-right num text-[15px] font-semibold text-foreground">
                {l.value ? `${l.value.toLocaleString("fr-FR")} €` : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DealsTable({ items }: { items: Deal[] }) {
  if (!items.length) return <EmptyState label="Aucun deal" />;
  return (
    <div className="data-table-wrap overflow-y-auto max-h-[calc(100vh-320px)]">
      <table className="w-full">
        <thead className="data-table-head">
          <tr>
            <th className="data-th">Deal</th>
            <th className="data-th hidden md:table-cell">Contact</th>
            <th className="data-th">Étape</th>
            <th className="data-th hidden lg:table-cell">Probabilité</th>
            <th className="data-th data-th-r">Valeur</th>
          </tr>
        </thead>
        <tbody className="data-table-body">
          {items.map((d) => (
            <tr key={d.id} className="data-row">
              <td className="px-4 py-2 text-sm font-medium text-foreground">{d.title}</td>
              <td className="px-4 py-2 text-sm text-muted-foreground hidden md:table-cell">
                {d.contact ? `${d.contact.first_name} ${d.contact.last_name}` : "—"}
              </td>
              <td className="px-4 py-2">
                <StatusBadge label={stageLabels[d.stage] ?? d.stage} color={stageColors[d.stage] ?? "#6B7280"} />
              </td>
              <td className="px-4 py-2 hidden lg:table-cell">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${d.probability}%`, background: stageColors[d.stage] ?? "#6B7280" }} />
                  </div>
                  <span className="text-xs font-mono text-muted-foreground w-8">{d.probability}%</span>
                </div>
              </td>
              <td className="px-4 py-2 text-right num text-[15px] font-semibold text-foreground">
                {d.value.toLocaleString("fr-FR")} €
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center rounded-xl border border-dashed border-border">
      <Users className="w-8 h-8 text-muted-foreground/30 mb-2" />
      <p className="font-semibold text-foreground">{label}</p>
      <p className="text-sm text-muted-foreground mt-1">Aucune donnée disponible pour le moment.</p>
    </div>
  );
}

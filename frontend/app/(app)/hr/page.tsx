"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { DemoBanner, useIsDemo } from "@/components/DemoBanner";
import { Briefcase, Plus, UserCheck, Clock } from "lucide-react";

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  department: string;
  job_title: string;
  hire_date: string;
  salary: number;
  status: string;
}

interface LeaveRequest {
  id: string;
  employee_id: string;
  type: string;
  start_date: string;
  end_date: string;
  days: number;
  reason: string;
  status: string;
  employee?: { first_name: string; last_name: string };
}

const empStatusConfig: Record<string, { label: string; color: string }> = {
  active: { label: "Actif", color: "#10B981" },
  on_leave: { label: "En congé", color: "#F59E0B" },
  terminated: { label: "Terminé", color: "#EF4444" },
};
const leaveTypeLabels: Record<string, string> = {
  annual: "Congé annuel", sick: "Maladie", unpaid: "Sans solde",
};
const leaveStatusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "En attente", color: "#F59E0B" },
  approved: { label: "Approuvé", color: "#10B981" },
  rejected: { label: "Refusé", color: "#EF4444" },
};

type Tab = "employees" | "leaves";

export default function HRPage() {
  const { accessToken, currentOrg } = useAuthStore();
  const isDemo = useIsDemo();
  const [tab, setTab] = useState<Tab>("employees");
  const opts = { token: accessToken ?? "", orgId: currentOrg?.id };

  const { data: employees = [], isLoading: loadingE } = useQuery<Employee[]>({
    queryKey: ["hr", "employees", currentOrg?.id],
    queryFn: () => api.get("/api/v1/hr/employees", opts),
    enabled: !!accessToken && !!currentOrg,
  });

  const { data: leaves = [], isLoading: loadingL } = useQuery<LeaveRequest[]>({
    queryKey: ["hr", "leaves", currentOrg?.id],
    queryFn: () => api.get("/api/v1/hr/leave-requests", opts),
    enabled: !!accessToken && !!currentOrg,
  });
  const departments = new Set(employees.map(e => e.department).filter(Boolean));
  const totalSalary = employees.filter(e => e.status === "active").reduce((s, e) => s + e.salary, 0);

  return (
    <div className="space-y-6">
      <DemoBanner />

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(236,72,153,0.1)" }}>
              <Briefcase className="w-3.5 h-3.5" style={{ color: "#EC4899" }} />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Ressources Humaines</h1>
          </div>
          <p className="text-sm text-muted-foreground">Employés, congés et gestion de la paie</p>
        </div>
        {!isDemo && (
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ background: "linear-gradient(135deg,#5C93FF,#24DDB8)" }}>
            <Plus className="w-4 h-4" /> Nouvel employé
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Employés actifs", value: employees.filter(e => e.status === "active").length, icon: UserCheck, color: "#EC4899" },
          { label: "Départements", value: departments.size, icon: Briefcase, color: "#5C93FF" },
          { label: "Congés en attente", value: leaves.filter(l => l.status === "pending").length, icon: Clock, color: "#F59E0B" },
          { label: "Masse salariale", value: `${totalSalary.toLocaleString("fr-FR")} €`, icon: Briefcase, color: "#10B981" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-card rounded-xl border border-border p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{label}</p>
            <p className="text-2xl font-bold font-mono text-foreground">{value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-border flex gap-1">
        {([
          { id: "employees" as Tab, label: "Employés", count: employees.length },
          { id: "leaves" as Tab, label: "Congés", count: leaves.length },
        ]).map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}>
            {t.label}
            <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: tab === t.id ? "rgba(92,147,255,0.1)" : "rgba(0,0,0,0.05)", color: tab === t.id ? "#5C93FF" : "#9CA3AF" }}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {(loadingE || loadingL) ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 bg-muted rounded-xl animate-pulse" />)}</div>
      ) : tab === "employees" ? (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          {employees.length === 0 ? (
            <div className="py-16 text-center">
              <Briefcase className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="font-semibold text-foreground">Aucun employé</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Employé</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell">Poste</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden lg:table-cell">Département</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden lg:table-cell">Salaire</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {employees.map((e) => {
                  const cfg = empStatusConfig[e.status] ?? { label: e.status, color: "#6B7280" };
                  return (
                    <tr key={e.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold text-white flex-shrink-0"
                            style={{ background: "linear-gradient(135deg,#EC4899,#24DDB8)" }}>
                            {e.first_name?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{e.first_name} {e.last_name}</p>
                            <p className="text-xs text-muted-foreground">{e.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">{e.job_title || "—"}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground hidden lg:table-cell">{e.department || "—"}</td>
                      <td className="px-4 py-3 text-right text-sm font-mono text-foreground hidden lg:table-cell">
                        {e.salary ? `${e.salary.toLocaleString("fr-FR")} €` : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: `${cfg.color}14`, color: cfg.color }}>
                          {cfg.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          {leaves.length === 0 ? (
            <div className="py-16 text-center">
              <Clock className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="font-semibold text-foreground">Aucune demande de congé</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Employé</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell">Période</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden lg:table-cell">Jours</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {leaves.map((l) => {
                  const cfg = leaveStatusConfig[l.status] ?? { label: l.status, color: "#6B7280" };
                  return (
                    <tr key={l.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-foreground">
                        {l.employee ? `${l.employee.first_name} ${l.employee.last_name}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{leaveTypeLabels[l.type] ?? l.type}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">{l.start_date} → {l.end_date}</td>
                      <td className="px-4 py-3 text-sm font-mono text-foreground hidden lg:table-cell">{l.days}j</td>
                      <td className="px-4 py-3">
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: `${cfg.color}14`, color: cfg.color }}>
                          {cfg.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

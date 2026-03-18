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
  active: { label: "Actif", color: "#24DDB8" },
  on_leave: { label: "En congé", color: "#F59E0B" },
  terminated: { label: "Terminé", color: "#EF4444" },
};
const leaveTypeLabels: Record<string, string> = {
  annual: "Congé annuel", sick: "Maladie", unpaid: "Sans solde",
};
const leaveStatusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "En attente", color: "#F59E0B" },
  approved: { label: "Approuvé", color: "#24DDB8" },
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
    <div className="space-y-3">
      <DemoBanner />

      <div className="flex items-center justify-between pb-3" style={{ borderBottom: "1px solid rgba(92,147,255,0.08)" }}>
        <div>
          <div className="section-header" style={{ marginBottom: 4 }}>
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#5C93FF", boxShadow: "0 0 6px #5C93FF" }} />
            <span className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "rgba(30,50,80,0.4)" }}>Module RH</span>
          </div>
          <h1 className="text-[20px] font-extrabold text-foreground" style={{ letterSpacing: "-0.02em" }}>Ressources Humaines</h1>
          <p className="text-[12px] mt-0.5 text-muted-foreground">Employés, congés et gestion de la paie</p>
        </div>
        {!isDemo && (
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ background: "#5C93FF" }}>
            <Plus className="w-4 h-4" /> Nouvel employé
          </button>
        )}
      </div>

      {/* Stats — signal tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {[
          { label: "Employés actifs", value: employees.filter(e => e.status === "active").length, icon: UserCheck, color: "#5C93FF" },
          { label: "Départements", value: departments.size, icon: Briefcase, color: "#5C93FF" },
          { label: "Congés en attente", value: leaves.filter(l => l.status === "pending").length, icon: Clock, color: "#F59E0B" },
          { label: "Masse salariale", value: `${totalSalary.toLocaleString("fr-FR")} €`, icon: Briefcase, color: "#24DDB8" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="stat-tile" style={{ "--tile-color": color } as React.CSSProperties}>
            <p className="stat-number">{value}</p>
            <p className="stat-label">{label}</p>
            <Icon className="stat-tile-icon" />
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
              style={{ background: tab === t.id ? "rgba(92,147,255,0.1)" : "rgba(30,50,80,0.07)", color: tab === t.id ? "#5C93FF" : "#9CA3AF" }}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {(loadingE || loadingL) ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 bg-muted rounded-xl animate-pulse" />)}</div>
      ) : tab === "employees" ? (
        <div className="data-table-wrap overflow-y-auto max-h-[calc(100vh-320px)]">
          {employees.length === 0 ? (
            <div className="py-10 text-center">
              <Briefcase className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="font-semibold text-foreground">Aucun employé</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="data-table-head">
                <tr>
                  <th className="data-th">Employé</th>
                  <th className="data-th hidden md:table-cell">Poste</th>
                  <th className="data-th hidden lg:table-cell">Département</th>
                  <th className="data-th data-th-r hidden lg:table-cell">Salaire</th>
                  <th className="data-th">Statut</th>
                </tr>
              </thead>
              <tbody className="data-table-body">
                {employees.map((e) => {
                  const cfg = empStatusConfig[e.status] ?? { label: e.status, color: "#6B7280" };
                  return (
                    <tr key={e.id} className="data-row">
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
                            style={{ background: "#5C93FF" }}>
                            {e.first_name?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{e.first_name} {e.last_name}</p>
                            <p className="text-xs text-muted-foreground">{e.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-sm text-muted-foreground hidden md:table-cell">{e.job_title || "—"}</td>
                      <td className="px-4 py-2 text-sm text-muted-foreground hidden lg:table-cell">{e.department || "—"}</td>
                      <td className="px-4 py-2 text-right num text-[15px] text-foreground hidden lg:table-cell">
                        {e.salary ? `${e.salary.toLocaleString("fr-FR")} €` : "—"}
                      </td>
                      <td className="px-4 py-2">
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
        <div className="data-table-wrap overflow-y-auto max-h-[calc(100vh-320px)]">
          {leaves.length === 0 ? (
            <div className="py-10 text-center">
              <Clock className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="font-semibold text-foreground">Aucune demande de congé</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="data-table-head">
                <tr>
                  <th className="data-th">Employé</th>
                  <th className="data-th">Type</th>
                  <th className="data-th hidden md:table-cell">Période</th>
                  <th className="data-th hidden lg:table-cell">Jours</th>
                  <th className="data-th">Statut</th>
                </tr>
              </thead>
              <tbody className="data-table-body">
                {leaves.map((l) => {
                  const cfg = leaveStatusConfig[l.status] ?? { label: l.status, color: "#6B7280" };
                  return (
                    <tr key={l.id} className="data-row">
                      <td className="px-4 py-2 text-sm font-medium text-foreground">
                        {l.employee ? `${l.employee.first_name} ${l.employee.last_name}` : "—"}
                      </td>
                      <td className="px-4 py-2 text-sm text-muted-foreground">{leaveTypeLabels[l.type] ?? l.type}</td>
                      <td className="px-4 py-2 text-sm text-muted-foreground hidden md:table-cell">{l.start_date} → {l.end_date}</td>
                      <td className="px-4 py-2 num text-[15px] text-foreground hidden lg:table-cell">{l.days}j</td>
                      <td className="px-4 py-2">
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

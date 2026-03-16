"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Calculator,
  FileText,
  Package,
  Briefcase,
  ShoppingCart,
  BarChart2,
  Settings,
  LogOut,
  Building2,
  Calendar,
  Map,
  BookOpen,
  Download,
  LifeBuoy,
  Shield,
  HelpCircle,
  GraduationCap,
  MessageSquare,
} from "lucide-react";
import { useAuthStore } from "@/store/auth";

const pilotageNav = [
  { label: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard, tour: "dashboard" },
  { label: "Planification", href: "/planification", icon: Calendar },
  { label: "Cartographie", href: "/cartographie", icon: Map },
  { label: "Nomenclature", href: "/nomenclature", icon: BookOpen },
  { label: "Chatbot", href: "/chatbot", icon: MessageSquare },
  { label: "Documents", href: "/exports", icon: Download },
];

const erpNav = [
  { label: "CRM", href: "/crm", icon: Users, tour: "crm" },
  { label: "Comptabilité", href: "/accounting", icon: Calculator },
  { label: "Facturation", href: "/billing", icon: FileText },
  { label: "Inventaire", href: "/inventory", icon: Package },
  { label: "RH", href: "/hr", icon: Briefcase },
  { label: "Achats", href: "/procurement", icon: ShoppingCart },
  { label: "Analytics", href: "/analytics", icon: BarChart2 },
];

const systemeNav = [
  { label: "Organisations", href: "/organizations", icon: Building2 },
  { label: "Paramètres", href: "/settings", icon: Settings, tour: "settings" },
  { label: "Administration", href: "/administration", icon: Shield },
  { label: "Glossaire CCP", href: "/glossaire", icon: GraduationCap },
  { label: "Support", href: "/support", icon: LifeBuoy },
  { label: "Aide", href: "/help", icon: HelpCircle },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, currentOrg } = useAuthStore();

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const renderNav = (items: typeof pilotageNav) =>
    items.map(({ label, href, icon: Icon, tour }) => {
      const active = isActive(href);
      return (
        <Link
          key={href}
          href={href}
          {...(tour ? { "data-tour": tour } : {})}
          className={[
            "flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 relative",
            active
              ? "text-white"
              : "text-white/40 hover:text-white/75 hover:bg-white/5",
          ].join(" ")}
          style={active ? { background: "rgba(92,147,255,0.12)" } : undefined}
        >
          {active && (
            <span
              className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
              style={{ background: "#24DDB8" }}
            />
          )}
          <Icon
            className="w-4 h-4 flex-shrink-0"
            strokeWidth={active ? 2.5 : 1.75}
            style={active ? { color: "#5C93FF" } : undefined}
          />
          {label}
        </Link>
      );
    });

  return (
    <aside
      className="w-60 flex-shrink-0 flex flex-col h-full"
      style={{ background: "#09111E", borderRight: "1px solid #141F2E" }}
    >
      {/* Logo */}
      <div className="px-5 py-5" style={{ borderBottom: "1px solid #141F2E" }}>
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 select-none"
            style={{
              background: "#141F2E",
              border: "1px solid #1A2535",
              boxShadow: "0 0 0 1px rgba(36,221,184,0.12), 0 4px 12px rgba(0,0,0,0.4)",
            }}
          >
            <span
              className="text-[11px] font-bold tracking-tight leading-none"
              style={{ color: "#24DDB8" }}
            >
              tt
            </span>
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm leading-none tracking-tight" style={{ color: "#F0F4FF" }}>
              stratt
            </p>
            <p className="text-[10px] mt-0.5 truncate" style={{ color: "rgba(255,255,255,0.28)" }}>
              {currentOrg?.name ?? "Sélectionner une org"}
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto">
        <p className="px-3 pt-1 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.1em]"
          style={{ color: "rgba(255,255,255,0.22)" }}>
          Pilotage
        </p>
        <div className="space-y-0.5 mb-3">{renderNav(pilotageNav)}</div>

        <div className="my-3" style={{ borderTop: "1px solid #141F2E" }} />

        <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.1em]"
          style={{ color: "rgba(255,255,255,0.22)" }}>
          ERP
        </p>
        <div className="space-y-0.5 mb-3">{renderNav(erpNav)}</div>

        <div className="my-3" style={{ borderTop: "1px solid #141F2E" }} />

        <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.1em]"
          style={{ color: "rgba(255,255,255,0.22)" }}>
          Système
        </p>
        <div className="space-y-0.5">{renderNav(systemeNav)}</div>
      </nav>

      {/* User */}
      <div className="px-3 py-3" style={{ borderTop: "1px solid #141F2E" }}>
        <div className="flex items-center gap-3 px-2.5 py-2.5 rounded-lg transition-colors hover:bg-white/5 group cursor-default">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #5C93FF, #24DDB8)", color: "#09111E" }}
          >
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white/80 text-xs font-semibold truncate leading-none">{user?.name}</p>
            <p className="text-[10px] mt-0.5 truncate" style={{ color: "rgba(255,255,255,0.28)" }}>
              {user?.email}
            </p>
          </div>
          <button
            onClick={handleLogout}
            title="Déconnexion"
            className="p-1.5 rounded-md transition-all opacity-0 group-hover:opacity-100 hover:text-white/70"
            style={{ color: "rgba(255,255,255,0.35)" }}
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}

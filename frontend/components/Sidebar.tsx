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
  Zap,
  Building2,
  Calendar,
  Map,
  BookOpen,
  Download,
  LifeBuoy,
  Shield,
} from "lucide-react";
import { useAuthStore } from "@/store/auth";

const pilotageNav = [
  { label: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard },
  { label: "Planification", href: "/planification", icon: Calendar },
  { label: "Cartographie", href: "/cartographie", icon: Map },
  { label: "Nomenclature", href: "/nomenclature", icon: BookOpen },
  { label: "Documents", href: "/exports", icon: Download },
];

const erpNav = [
  { label: "CRM", href: "/crm", icon: Users },
  { label: "Comptabilité", href: "/accounting", icon: Calculator },
  { label: "Facturation", href: "/billing", icon: FileText },
  { label: "Inventaire", href: "/inventory", icon: Package },
  { label: "RH", href: "/hr", icon: Briefcase },
  { label: "Achats", href: "/procurement", icon: ShoppingCart },
  { label: "Analytics", href: "/analytics", icon: BarChart2 },
];

const systemeNav = [
  { label: "Organisations", href: "/organizations", icon: Building2 },
  { label: "Paramètres", href: "/settings", icon: Settings },
  { label: "Administration", href: "/administration", icon: Shield },
  { label: "Support", href: "/support", icon: LifeBuoy },
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

  const renderNav = (items: typeof pilotageNav, activeIndicator = true) =>
    items.map(({ label, href, icon: Icon }) => {
      const active = isActive(href);
      return (
        <Link
          key={href}
          href={href}
          className={[
            "flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors relative",
            active ? "text-white" : "text-white/50 hover:text-white/80 hover:bg-white/5",
          ].join(" ")}
          style={active ? { background: "rgba(91,107,245,0.15)" } : undefined}
        >
          {active && activeIndicator && (
            <span
              className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
              style={{ background: "#5B6BF5" }}
            />
          )}
          <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={active ? 2.5 : 2} />
          {label}
        </Link>
      );
    });

  return (
    <aside className="w-64 flex-shrink-0 flex flex-col h-full" style={{ background: "hsl(234 42% 7%)" }}>
      {/* Logo */}
      <div className="px-5 py-5 border-b" style={{ borderColor: "hsl(234 30% 14%)" }}>
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #5B6BF5, #9B6FE8)", boxShadow: "0 4px 14px rgba(91,107,245,0.4)" }}
          >
            <Zap className="w-4 h-4 text-white fill-white" />
          </div>
          <div className="min-w-0">
            <p className="text-white font-bold text-sm leading-none">Axiora</p>
            <p className="text-white/40 text-[10px] mt-0.5 truncate">
              {currentOrg?.name ?? "Sélectionner une org"}
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto">
        <p className="px-3 pt-1 pb-1 text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "hsl(234 30% 40%)" }}>
          Pilotage
        </p>
        <div className="space-y-0.5 mb-2">{renderNav(pilotageNav)}</div>

        <div className="border-t mb-2" style={{ borderColor: "hsl(234 30% 14%)" }} />

        <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "hsl(234 30% 40%)" }}>
          ERP
        </p>
        <div className="space-y-0.5 mb-2">{renderNav(erpNav)}</div>

        <div className="border-t mb-2" style={{ borderColor: "hsl(234 30% 14%)" }} />

        <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "hsl(234 30% 40%)" }}>
          Système
        </p>
        <div className="space-y-0.5">{renderNav(systemeNav)}</div>
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t" style={{ borderColor: "hsl(234 30% 14%)" }}>
        <div className="flex items-center gap-3 px-2 py-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #5B6BF5, #9B6FE8)" }}
          >
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-semibold truncate">{user?.name}</p>
            <p className="text-white/40 text-[10px] truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Déconnexion"
            className="p-1.5 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}

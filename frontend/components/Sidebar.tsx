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
  ChevronRight,
} from "lucide-react";
import { useAuthStore } from "@/store/auth";

// permission: null = visible par tous les utilisateurs authentifiés
// permission: "perm.name" = visible uniquement si l'utilisateur a cette permission
//             (les Admin ont toujours accès, même sans la permission explicite)
const pilotageNav = [
  { label: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard, tour: "dashboard", permission: null },
  { label: "Planification", href: "/planification", icon: Calendar, permission: null },
  { label: "Cartographie", href: "/cartographie", icon: Map, permission: null },
  { label: "Nomenclature", href: "/nomenclature", icon: BookOpen, permission: null },
  { label: "Chatbot IA", href: "/chatbot", icon: MessageSquare, permission: null },
  { label: "Documents", href: "/exports", icon: Download, permission: null },
];

const erpNav = [
  { label: "CRM", href: "/crm", icon: Users, tour: "crm", permission: "crm.read" },
  { label: "Comptabilité", href: "/accounting", icon: Calculator, permission: "accounting.read" },
  { label: "Facturation", href: "/billing", icon: FileText, permission: "billing.read" },
  { label: "Inventaire", href: "/inventory", icon: Package, permission: "inventory.read" },
  { label: "RH", href: "/hr", icon: Briefcase, permission: "hr.read" },
  { label: "Achats", href: "/procurement", icon: ShoppingCart, permission: "procurement.read" },
  { label: "Analytics", href: "/analytics", icon: BarChart2, permission: "analytics.read" },
];

const systemeNav = [
  { label: "Organisations", href: "/organizations", icon: Building2, permission: "admin.manage" },
  { label: "Paramètres", href: "/settings", icon: Settings, tour: "settings", permission: null },
  { label: "Administration", href: "/administration", icon: Shield, permission: "admin.manage" },
  { label: "Glossaire CCP", href: "/glossaire", icon: GraduationCap, permission: null },
  { label: "Support", href: "/support", icon: LifeBuoy, permission: null },
  { label: "Aide", href: "/help", icon: HelpCircle, permission: null },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, currentOrg, currentRole, hasPermission } = useAuthStore();

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() ?? "?";

  const canView = (permission: string | null) =>
    !permission || !currentRole || hasPermission(permission);

  const renderNav = (items: typeof pilotageNav) =>
    items.filter(({ permission }) => canView(permission)).map(({ label, href, icon: Icon, tour }) => {
      const active = isActive(href);
      return (
        <Link
          key={href}
          href={href}
          {...(tour ? { "data-tour": tour } : {})}
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 relative group"
          style={
            active
              ? {
                  color: "#FFFFFF",
                  background: "rgba(92,147,255,0.18)",
                  boxShadow: "inset 0 0 0 1px rgba(92,147,255,0.30)",
                }
              : { color: "rgba(255,255,255,0.45)" }
          }
        >
          {active && (
            <span
              className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[18px] rounded-r-full"
              style={{ background: "#5C93FF" }}
            />
          )}
          <Icon
            className="w-[15px] h-[15px] flex-shrink-0 transition-colors"
            strokeWidth={active ? 2.25 : 1.75}
            style={{ color: active ? "#5C93FF" : undefined }}
          />
          <span style={active ? {} : { transition: "color 0.15s" }}
            className={active ? "" : "group-hover:!text-white"}>
            {label}
          </span>
          {active && (
            <ChevronRight
              className="w-3 h-3 ml-auto opacity-40"
              style={{ color: "#5C93FF" }}
            />
          )}
        </Link>
      );
    });

  return (
    <aside
      className="w-[228px] flex-shrink-0 flex flex-col h-full relative"
      style={{
        background: "hsl(var(--sidebar))",
        borderRight: "1px solid hsl(var(--sidebar-border))",
      }}
    >
      {/* Logo */}
      <div
        className="px-5 py-4 flex-shrink-0"
        style={{ borderBottom: "1px solid hsl(var(--sidebar-border))" }}
      >
        <p
          className="font-extrabold text-[22px] leading-none tracking-[-0.04em]"
          style={{ color: "#5C93FF", fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
        >
          stratt
        </p>
        <p
          className="text-[10px] mt-[5px] truncate font-medium"
          style={{ color: "rgba(255,255,255,0.30)" }}
        >
          {currentOrg?.name ?? "—"}
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2.5 py-2.5 overflow-y-auto scrollbar-thin space-y-4">

        <div>
          <p
            className="px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] mb-1"
            style={{ color: "rgba(255,255,255,0.22)" }}
          >
            Pilotage
          </p>
          <div className="space-y-[2px]">{renderNav(pilotageNav)}</div>
        </div>

        {erpNav.some(({ permission }) => canView(permission)) && (
          <>
            <div
              className="mx-2"
              style={{ borderTop: "1px solid hsl(var(--sidebar-border))" }}
            />
            <div>
              <p
                className="px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] mb-1"
                style={{ color: "rgba(255,255,255,0.22)" }}
              >
                ERP
              </p>
              <div className="space-y-[2px]">{renderNav(erpNav)}</div>
            </div>
          </>
        )}

        {systemeNav.some(({ permission }) => canView(permission)) && (
          <>
            <div
              className="mx-2"
              style={{ borderTop: "1px solid hsl(var(--sidebar-border))" }}
            />
            <div>
              <p
                className="px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] mb-1"
                style={{ color: "rgba(255,255,255,0.22)" }}
              >
                Système
              </p>
              <div className="space-y-[2px]">{renderNav(systemeNav)}</div>
            </div>
          </>
        )}
      </nav>

      {/* User footer */}
      <div
        className="px-2.5 py-2.5 flex-shrink-0"
        style={{ borderTop: "1px solid hsl(var(--sidebar-border))" }}
      >
        <div
          className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg group cursor-default transition-all duration-150 hover:bg-white/[0.06]"
        >
          {/* Avatar */}
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
            style={{
              background: "#5C93FF",
              color: "#fff",
            }}
          >
            {initials}
          </div>

          <div className="flex-1 min-w-0">
            <p
              className="text-[12px] font-semibold truncate leading-none"
              style={{ color: "rgba(255,255,255,0.82)" }}
            >
              {user?.name}
            </p>
            <p
              className="text-[10px] mt-[3px] truncate"
              style={{ color: "rgba(255,255,255,0.38)" }}
            >
              {currentRole ?? user?.email}
            </p>
          </div>

          <button
            onClick={handleLogout}
            title="Déconnexion"
            className="p-1.5 rounded-md transition-all opacity-0 group-hover:opacity-100"
            style={{ color: "rgba(255,255,255,0.45)" }}
          >
            <LogOut className="w-3.5 h-3.5" style={{ transition: "color 0.15s" }} />
          </button>
        </div>
      </div>
    </aside>
  );
}

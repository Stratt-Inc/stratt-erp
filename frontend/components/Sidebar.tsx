"use client";

import React from "react";
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
  BellRing,
} from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { MODULE } from "@/lib/colors";

const pilotageNav: NavItem[] = [
  { label: "Tableau de bord", href: "/dashboard",     icon: LayoutDashboard, color: MODULE.dashboard,     permission: null,             tour: "dashboard" },
  { label: "Planification",   href: "/planification", icon: Calendar,        color: MODULE.planification, permission: null },
  { label: "Alertes délais",  href: "/alertes",       icon: BellRing,        color: MODULE.alertes,       permission: null },
  { label: "Cartographie",    href: "/cartographie",  icon: Map,             color: MODULE.cartographie,  permission: null },
  { label: "Nomenclature",    href: "/nomenclature",  icon: BookOpen,        color: MODULE.nomenclature,  permission: null },
  { label: "Chatbot IA",      href: "/chatbot",       icon: MessageSquare,   color: MODULE.chatbot,       permission: null },
  { label: "Documents",       href: "/exports",       icon: Download,        color: MODULE.exports,       permission: null },
];

const erpNav: NavItem[] = [
  { label: "CRM",          href: "/crm",         icon: Users,        color: MODULE.crm,         permission: "crm.read",         tour: "crm" },
  { label: "Comptabilité", href: "/accounting",   icon: Calculator,   color: MODULE.accounting,  permission: "accounting.read" },
  { label: "Facturation",  href: "/billing",      icon: FileText,     color: MODULE.billing,     permission: "billing.read" },
  { label: "Inventaire",   href: "/inventory",    icon: Package,      color: MODULE.inventory,   permission: "inventory.read" },
  { label: "RH",           href: "/hr",           icon: Briefcase,    color: MODULE.hr,          permission: "hr.read" },
  { label: "Achats",       href: "/procurement",  icon: ShoppingCart, color: MODULE.procurement, permission: "procurement.read" },
  { label: "Analytics",    href: "/analytics",    icon: BarChart2,    color: MODULE.analytics,   permission: "analytics.read" },
];

const systemeNav: NavItem[] = [
  { label: "Organisations",  href: "/organizations",  icon: Building2,    color: MODULE.organizations,  permission: "admin.manage" },
  { label: "Paramètres",     href: "/settings",       icon: Settings,     color: MODULE.settings,       permission: null,             tour: "settings" },
  { label: "Administration", href: "/administration", icon: Shield,       color: MODULE.administration, permission: "admin.manage" },
  { label: "Glossaire CCP",  href: "/glossaire",      icon: GraduationCap,color: MODULE.glossaire,      permission: null },
  { label: "Support",        href: "/support",        icon: LifeBuoy,     color: MODULE.support,        permission: null },
  { label: "Aide",           href: "/help",           icon: HelpCircle,   color: MODULE.help,           permission: null },
];

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  color: string;
  permission: string | null;
  tour?: string;
};

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

  const renderNav = (items: NavItem[]) =>
    items
      .filter(({ permission }) => canView(permission))
      .map(({ label, href, icon: Icon, color, tour }) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            {...(tour ? { "data-tour": tour } : {})}
            className={`sidebar-item${active ? " active" : ""}`}
            style={{ "--item-color": color } as React.CSSProperties}
          >
            <Icon className="item-icon" strokeWidth={active ? 2 : 1.75} />
            <span>{label}</span>
          </Link>
        );
      });

  return (
    <aside
      className="w-[220px] flex-shrink-0 flex flex-col h-full"
      style={{
        background: "hsl(var(--sidebar))",
        borderRight: "1px solid hsl(var(--sidebar-border))",
      }}
    >
      {/* Logo */}
      <div className="px-5 pt-5 pb-4 flex-shrink-0">
        <p
          className="font-extrabold text-[20px] leading-none tracking-[-0.04em] text-white"
          style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif' }}
        >
          stratt
        </p>
        <p
          className="text-[10px] mt-1.5 truncate font-medium"
          style={{ color: "rgba(255,255,255,0.28)" }}
        >
          {currentOrg?.name ?? "—"}
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto scrollbar-thin space-y-4">
        <div className="space-y-0.5">
          <p className="sidebar-section-label">Pilotage</p>
          {renderNav(pilotageNav)}
        </div>

        {erpNav.some(({ permission }) => canView(permission)) && (
          <div className="space-y-0.5">
            <p className="sidebar-section-label">ERP</p>
            {renderNav(erpNav)}
          </div>
        )}

        {systemeNav.some(({ permission }) => canView(permission)) && (
          <div className="space-y-0.5">
            <p className="sidebar-section-label">Système</p>
            {renderNav(systemeNav)}
          </div>
        )}
      </nav>

      {/* User footer */}
      <div
        className="px-3 py-3 flex-shrink-0"
        style={{ borderTop: "1px solid hsl(var(--sidebar-border))" }}
      >
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg group cursor-default transition-colors hover:bg-white/[0.05]">
          {/* Avatar */}
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 text-white flex-none"
            style={{ background: "rgba(255,255,255,0.12)" }}
          >
            {initials}
          </div>

          <div className="flex-1 min-w-0">
            <p
              className="text-[12px] font-semibold truncate leading-none"
              style={{ color: "rgba(255,255,255,0.80)" }}
            >
              {user?.name}
            </p>
            <p
              className="text-[10px] mt-[3px] truncate"
              style={{ color: "rgba(255,255,255,0.32)" }}
            >
              {currentRole ?? user?.email}
            </p>
          </div>

          <button
            onClick={handleLogout}
            title="Déconnexion"
            className="p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-all"
            style={{ color: "rgba(255,255,255,0.40)" }}
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}

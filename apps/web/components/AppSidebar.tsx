"use client";

import {
  LayoutDashboard,
  CalendarRange,
  Map,
  FolderTree,
  FileText,
  Settings,
  HelpCircle,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const mainNav = [
  { title: "Tableau de bord",     url: "/",              icon: LayoutDashboard },
  { title: "Planification",       url: "/planification", icon: CalendarRange   },
  { title: "Cartographie",        url: "/cartographie",  icon: Map             },
  { title: "Nomenclature",        url: "/nomenclature",  icon: FolderTree      },
  { title: "Documents & Exports", url: "/exports",       icon: FileText        },
];

const adminNav = [
  { title: "Administration",      url: "/administration", icon: Settings   },
  { title: "Support & Formation", url: "/support",        icon: HelpCircle },
];

const itemVariants = {
  initial: { opacity: 0, x: -6 },
  animate: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.22, delay: 0.04 + i * 0.04, ease: "easeOut" },
  }),
};

function NavItems({
  items,
  indexOffset = 0,
  collapsed,
  isActive,
}: {
  items: typeof mainNav;
  indexOffset?: number;
  collapsed: boolean;
  isActive: (path: string) => boolean;
}) {
  return (
    <SidebarMenu>
      {items.map((item, i) => {
        const active = isActive(item.url);
        return (
          <SidebarMenuItem key={item.url}>
            <motion.div
              custom={indexOffset + i}
              variants={itemVariants}
              initial="initial"
              animate="animate"
            >
              <SidebarMenuButton asChild isActive={active}>
                <Link
                  href={item.url}
                  className={[
                    "relative flex items-center gap-3 w-full",
                    "rounded-md px-3 py-2",
                    "text-sidebar-foreground transition-colors duration-150",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                      : "hover:bg-white/5 hover:text-sidebar-accent-foreground",
                  ].join(" ")}
                >
                  {active && (
                    <span
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                      style={{ background: "hsl(234 88% 70%)" }}
                    />
                  )}

                  <item.icon
                    className={[
                      "w-4 h-4 flex-shrink-0 transition-colors",
                      active
                        ? "text-sidebar-primary"
                        : "text-sidebar-muted",
                    ].join(" ")}
                    strokeWidth={active ? 2.5 : 2}
                  />

                  {!collapsed && (
                    <span className="text-[13px] truncate leading-none">
                      {item.title}
                    </span>
                  )}
                </Link>
              </SidebarMenuButton>
            </motion.div>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = usePathname();

  const isActive = (path: string) =>
    path === "/" ? pathname === "/" : pathname.startsWith(path);

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarContent className="pt-4 sm:pt-5">

        {/* Logo */}
        <div
          className={`px-3 mb-6 sm:mb-8 flex items-center ${
            collapsed ? "justify-center" : "gap-3"
          }`}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, #5B6BF5 0%, #9B6FE8 100%)",
              boxShadow: "0 4px 14px rgba(91, 107, 245, 0.40)",
            }}
          >
            <Zap className="w-4 h-4 text-white" strokeWidth={2.5} fill="white" />
          </div>

          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span
                className="text-[15px] font-bold leading-tight"
                style={{
                  background: "linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.70) 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Axiora
              </span>
              <span
                className="text-[9px] uppercase tracking-[0.2em] font-semibold"
                style={{ color: "hsl(234 12% 42%)" }}
              >
                Achats Publics
              </span>
            </div>
          )}
        </div>

        {/* Pilotage */}
        <SidebarGroup>
          <SidebarGroupLabel
            className="text-[9px] uppercase tracking-[0.2em] font-bold px-3 mb-1"
            style={{ color: "hsl(234 12% 36%)" }}
          >
            Pilotage
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <NavItems
              items={mainNav}
              indexOffset={0}
              collapsed={collapsed}
              isActive={isActive}
            />
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Système */}
        <SidebarGroup className="mt-2">
          <SidebarGroupLabel
            className="text-[9px] uppercase tracking-[0.2em] font-bold px-3 mb-1"
            style={{ color: "hsl(234 12% 36%)" }}
          >
            Système
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <NavItems
              items={adminNav}
              indexOffset={mainNav.length}
              collapsed={collapsed}
              isActive={isActive}
            />
          </SidebarGroupContent>
        </SidebarGroup>

      </SidebarContent>

      <SidebarFooter
        className="px-3 pb-5 pt-3 border-t"
        style={{ borderColor: "hsl(234 35% 13%)" }}
      >
        {!collapsed && (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{
                  background: "hsl(142 71% 50%)",
                  boxShadow: "0 0 5px hsl(142 71% 50% / 0.6)",
                }}
              />
              <p
                className="text-[9px] uppercase tracking-[0.15em] font-semibold"
                style={{ color: "hsl(234 12% 38%)" }}
              >
                RGPD · SecNumCloud
              </p>
            </div>
            <p className="text-[9px]" style={{ color: "hsl(234 12% 30%)" }}>
              © 2026 Axiora · v1.1
            </p>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

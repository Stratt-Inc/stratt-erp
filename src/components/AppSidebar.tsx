import {
  LayoutDashboard,
  CalendarRange,
  Map,
  FolderTree,
  FileText,
  Settings,
  HelpCircle,
  Target,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
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
  { title: "Tableau de bord", url: "/", icon: LayoutDashboard },
  { title: "Planification", url: "/planification", icon: CalendarRange },
  { title: "Cartographie", url: "/cartographie", icon: Map },
  { title: "Nomenclature", url: "/nomenclature", icon: FolderTree },
  { title: "Documents & Exports", url: "/exports", icon: FileText },
];

const adminNav = [
  { title: "Administration", url: "/administration", icon: Settings },
  { title: "Support & Formation", url: "/support", icon: HelpCircle },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarContent className="pt-4 sm:pt-6">
        {/* Logo Axiora */}
        <div className={`px-3 sm:px-4 mb-6 sm:mb-10 flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="w-8 sm:w-9 h-8 sm:h-9 rounded-lg bg-primary flex items-center justify-center flex-shrink-0 shadow-sm">
            <Target className="w-4 sm:w-5 h-4 sm:h-5 text-white" strokeWidth={2.5} />
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm sm:text-base font-bold text-sidebar-primary leading-tight">Axiora</span>
              <span className="text-[8px] sm:text-[9px] text-sidebar-muted uppercase tracking-widest font-semibold">Achats Publics</span>
            </div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-muted text-[9px] sm:text-[10px] uppercase tracking-[0.18em] font-bold px-3 sm:px-4">
            Pilotage
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="gap-2 sm:gap-3 text-sidebar-foreground hover:bg-sidebar-accent/70 transition-colors rounded-md px-2 sm:px-3 py-1.5 sm:py-2"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-sm"
                    >
                      <item.icon className="w-4 h-4 flex-shrink-0" strokeWidth={2} />
                      {!collapsed && <span className="text-[11px] sm:text-[13px] truncate">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-muted text-[9px] sm:text-[10px] uppercase tracking-[0.18em] font-bold px-3 sm:px-4">
            Système
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminNav.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink
                      to={item.url}
                      className="gap-2 sm:gap-3 text-sidebar-foreground hover:bg-sidebar-accent/70 transition-colors rounded-md px-2 sm:px-3 py-1.5 sm:py-2"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-sm"
                    >
                      <item.icon className="w-4 h-4 flex-shrink-0" strokeWidth={2} />
                      {!collapsed && <span className="text-[11px] sm:text-[13px] truncate">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-2 sm:px-4 pb-4 sm:pb-6 pt-3 sm:pt-4 border-t border-sidebar-border">
        {!collapsed && (
          <div className="space-y-1.5 sm:space-y-2">
            <p className="text-[9px] sm:text-[10px] text-sidebar-muted uppercase tracking-wider font-semibold leading-tight">
              Conforme RGPD · SecNumCloud
            </p>
            <p className="text-[8px] sm:text-[9px] text-sidebar-muted/70">© 2026 Axiora · v1.1</p>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

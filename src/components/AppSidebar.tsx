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
      <SidebarContent className="pt-6">
        {/* Logo Axiora */}
        <div className={`px-4 mb-10 flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center flex-shrink-0 shadow-sm">
            <Target className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-base font-bold text-sidebar-primary">Axiora</span>
              <span className="text-[9px] text-sidebar-muted uppercase tracking-widest font-semibold">Achats Publics</span>
            </div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-muted text-[10px] uppercase tracking-[0.18em] font-bold px-4">
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
                      className="gap-3 text-sidebar-foreground hover:bg-sidebar-accent/70 transition-colors rounded-md"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-sm"
                    >
                      <item.icon className="w-4 h-4 flex-shrink-0" strokeWidth={2} />
                      {!collapsed && <span className="text-[13px]">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-muted text-[10px] uppercase tracking-[0.18em] font-bold px-4">
            Système
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminNav.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink
                      to={item.url}
                      className="gap-3 text-sidebar-foreground hover:bg-sidebar-accent/70 transition-colors rounded-md"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-sm"
                    >
                      <item.icon className="w-4 h-4 flex-shrink-0" strokeWidth={2} />
                      {!collapsed && <span className="text-[13px]">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-4 pb-6 pt-4 border-t border-sidebar-border">
        {!collapsed && (
          <div className="space-y-2">
            <p className="text-[10px] text-sidebar-muted uppercase tracking-wider font-semibold">
              Conforme RGPD · SecNumCloud
            </p>
            <p className="text-[9px] text-sidebar-muted/70">© 2026 Axiora · v1.1</p>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

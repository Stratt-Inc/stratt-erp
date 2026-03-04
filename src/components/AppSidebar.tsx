import {
  LayoutDashboard,
  CalendarRange,
  Map,
  FolderTree,
  FileText,
  Settings,
  HelpCircle,
  Shield,
  Building2,
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
      <SidebarContent className="pt-5">
        {/* Logo */}
        <div className="px-4 mb-8 flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-sidebar-accent flex items-center justify-center flex-shrink-0">
            <Target className="w-4 h-4 text-sidebar-accent-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-[13px] font-bold text-sidebar-primary tracking-wide leading-none">CARTOAP</span>
              <span className="text-[9px] text-sidebar-muted leading-none mt-1 uppercase tracking-[0.15em]">Achats Publics</span>
            </div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-muted text-[9px] uppercase tracking-[0.18em] font-semibold">
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
                      className="gap-3 text-sidebar-foreground hover:bg-sidebar-accent/60 transition-colors"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <item.icon className="w-4 h-4 flex-shrink-0" />
                      {!collapsed && <span className="text-[13px]">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-muted text-[9px] uppercase tracking-[0.18em] font-semibold">
            Système
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminNav.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink
                      to={item.url}
                      className="gap-3 text-sidebar-foreground hover:bg-sidebar-accent/60 transition-colors"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <item.icon className="w-4 h-4 flex-shrink-0" />
                      {!collapsed && <span className="text-[13px]">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-4 pb-5">
        {!collapsed && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-[9px] text-sidebar-muted uppercase tracking-wider">
              <Shield className="w-3 h-3" />
              <span>Hébergement SecNumCloud</span>
            </div>
            <div className="flex items-center gap-1.5 text-[9px] text-sidebar-muted uppercase tracking-wider">
              <Shield className="w-3 h-3" />
              <span>Conforme RGPD</span>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

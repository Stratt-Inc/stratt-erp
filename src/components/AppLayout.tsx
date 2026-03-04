import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Shield, Target } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationsDropdown } from "@/components/NotificationsDropdown";
import { UserProfileDropdown } from "@/components/UserProfileDropdown";
import { MobileNav } from "@/components/MobileNav";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        {/* Desktop Sidebar - hidden on mobile/tablet */}
        <div className="hidden md:block">
          <AppSidebar />
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          {/* Header responsive */}
          <header className="h-12 sm:h-14 flex items-center justify-between border-b bg-card/80 backdrop-blur-xl px-3 sm:px-6 flex-shrink-0 sticky top-0 z-30 shadow-sm">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              {/* Desktop sidebar trigger */}
              <SidebarTrigger className="h-8 w-8 flex-shrink-0 hidden md:flex" />

              {/* Mobile: small logo mark */}
              <div className="md:hidden w-6 h-6 rounded-md bg-primary flex items-center justify-center flex-shrink-0">
                <Target className="w-3 h-3 text-primary-foreground" strokeWidth={2.5} />
              </div>

              <div className="h-4 w-px bg-border hidden sm:block" />
              <span className="text-[13px] sm:text-[14px] font-semibold text-foreground truncate">
                <span className="hidden sm:inline">Métropole de Lyon</span>
                <span className="sm:hidden">Axiora</span>
              </span>
              <span className="text-[10px] sm:text-[12px] text-muted-foreground bg-muted/50 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-md font-medium flex-shrink-0 hidden sm:inline-block">2026</span>
            </div>

            <div className="flex items-center gap-0.5 sm:gap-2 flex-shrink-0">
              <div className="badge-conforme mr-1 sm:mr-2 hidden lg:inline-flex">
                <Shield className="w-3.5 h-3.5" />
                Conforme
              </div>
              <div className="hidden sm:block"><ThemeToggle /></div>
              <NotificationsDropdown />
              <UserProfileDropdown
                userName="M. Dupont"
                userEmail="m.dupont@metropole-lyon.fr"
                userRole="Administrateur"
              />
            </div>
          </header>

          {/* Main content — extra bottom padding on mobile for tab bar */}
          <main className="flex-1 overflow-auto bg-background pb-14 md:pb-0">
            {children}
          </main>
        </div>

        {/* Mobile Bottom Tab Bar */}
        <MobileNav />
      </div>
    </SidebarProvider>
  );
}

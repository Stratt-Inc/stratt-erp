import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Search, Shield, Zap } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationsDropdown } from "@/components/NotificationsDropdown";
import { UserProfileDropdown } from "@/components/UserProfileDropdown";
import { MobileNav } from "@/components/MobileNav";
import { Button } from "@/components/ui/button";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <AppSidebar />
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="h-12 sm:h-14 flex items-center justify-between border-b border-border/60 bg-card/80 backdrop-blur-xl px-3 sm:px-5 flex-shrink-0 sticky top-0 z-30"
            style={{ boxShadow: "0 1px 0 hsl(var(--border))" }}>
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              {/* Desktop sidebar trigger */}
              <SidebarTrigger className="h-8 w-8 flex-shrink-0 hidden md:flex text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors" />

              {/* Mobile: logo mark */}
              <div
                className="md:hidden w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
                style={{
                  background: "linear-gradient(135deg, #5B6BF5, #9B6FE8)",
                  boxShadow: "0 2px 8px rgba(91,107,245,0.35)",
                }}
              >
                <Zap className="w-3 h-3 text-white" strokeWidth={2.5} fill="white" />
              </div>

              <div className="h-4 w-px bg-border hidden sm:block" />

              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[13px] sm:text-[14px] font-semibold text-foreground truncate">
                  <span className="hidden sm:inline">Métropole de Lyon</span>
                  <span className="sm:hidden">Axiora</span>
                </span>
                <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded font-medium flex-shrink-0 hidden sm:inline-block border border-border/60">
                  2026
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
              {/* Conformity badge */}
              <div className="badge-conforme mr-1 sm:mr-2 hidden lg:inline-flex">
                <Shield className="w-3 h-3" />
                Conforme
              </div>

              {/* Search hint — desktop only */}
              <Button
                variant="ghost"
                size="sm"
                className="hidden lg:flex h-8 gap-2 px-3 text-muted-foreground hover:text-foreground text-xs border border-border/60 bg-muted/30 hover:bg-muted/60 rounded-lg"
              >
                <Search className="w-3.5 h-3.5" />
                <span className="font-medium">Rechercher</span>
                <kbd className="ml-0.5 text-[10px] font-medium bg-border/80 px-1.5 py-0.5 rounded text-muted-foreground">
                  ⌘K
                </kbd>
              </Button>

              <div className="hidden sm:block">
                <ThemeToggle />
              </div>
              <NotificationsDropdown />
              <UserProfileDropdown
                userName="M. Dupont"
                userEmail="m.dupont@metropole-lyon.fr"
                userRole="Administrateur"
              />
            </div>
          </header>

          {/* Main content */}
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

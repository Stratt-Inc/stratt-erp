import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Shield } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationsDropdown } from "@/components/NotificationsDropdown";
import { UserProfileDropdown } from "@/components/UserProfileDropdown";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b bg-card/80 backdrop-blur-xl px-6 flex-shrink-0 sticky top-0 z-10 shadow-sm">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="h-8 w-8" />
              <div className="h-5 w-px bg-border" />
              <span className="text-[14px] font-semibold text-foreground">Métropole de Lyon</span>
              <span className="text-[12px] text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-md font-medium">2026</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="badge-conforme mr-2 hidden md:inline-flex">
                <Shield className="w-3.5 h-3.5" />
                Conforme
              </div>
              <ThemeToggle />
              <NotificationsDropdown />
              <div className="h-5 w-px bg-border mx-1" />
              <UserProfileDropdown
                userName="M. Dupont"
                userEmail="m.dupont@metropole-lyon.fr"
                userRole="Administrateur"
              />
            </div>
          </header>
          <main className="flex-1 overflow-auto bg-background">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

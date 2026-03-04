import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Bell, ChevronDown, User, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-12 flex items-center justify-between border-b bg-card px-4 flex-shrink-0">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="h-7 w-7" />
              <div className="h-4 w-px bg-border" />
              <span className="text-[13px] font-semibold text-foreground">Métropole de Lyon</span>
              <span className="text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded font-medium">2026</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="badge-conforme mr-2 hidden md:inline-flex">
                <Shield className="w-3 h-3" />
                Conforme
              </div>
              <ThemeToggle />
              <Button variant="ghost" size="sm" className="relative h-8 w-8 p-0">
                <Bell className="w-4 h-4" />
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-destructive" />
              </Button>
              <div className="h-4 w-px bg-border mx-1" />
              <Button variant="ghost" size="sm" className="gap-2 text-[13px] h-8 px-2">
                <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
                  <User className="w-3 h-3 text-primary-foreground" />
                </div>
                <span className="hidden md:inline text-foreground font-medium">M. Dupont</span>
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
              </Button>
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

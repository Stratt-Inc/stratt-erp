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
              <Button variant="ghost" size="sm" className="relative h-9 w-9 p-0 rounded-lg">
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive ring-2 ring-background" />
              </Button>
              <div className="h-5 w-px bg-border mx-1" />
              <Button variant="ghost" size="sm" className="gap-2.5 text-[14px] h-9 px-3 rounded-lg">
                <div className="w-7 h-7 rounded-lg bg-primary/90 flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-primary-foreground" />
                </div>
                <span className="hidden md:inline text-foreground font-medium">M. Dupont</span>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              </Button>
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

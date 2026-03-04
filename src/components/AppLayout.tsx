import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Bell, ChevronDown, User } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b bg-card px-4 flex-shrink-0">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <div className="h-5 w-px bg-border" />
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium text-foreground">Métropole de Lyon</span>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground">Exercice 2026</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="w-4 h-4" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-destructive" />
              </Button>
              <div className="h-5 w-px bg-border" />
              <Button variant="ghost" size="sm" className="gap-2 text-sm">
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <User className="w-3 h-3 text-primary-foreground" />
                </div>
                <span className="hidden md:inline text-foreground">M. Dupont</span>
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

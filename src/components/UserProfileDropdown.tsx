import { User, Settings, HelpCircle, LogOut, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UserProfileDropdownProps {
  userName?: string;
  userEmail?: string;
  userRole?: string;
}

export function UserProfileDropdown({
  userName = "M. Dupont",
  userEmail = "m.dupont@metropole-lyon.fr",
  userRole = "Administrateur",
}: UserProfileDropdownProps) {
  const handleLogout = () => {
    console.log("Déconnexion...");
    // Implémenter la logique de déconnexion
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2.5 text-[14px] h-9 px-3 rounded-lg">
          <div className="w-7 h-7 rounded-lg bg-primary/90 flex items-center justify-center">
            <User className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
          <span className="hidden md:inline text-foreground font-medium">{userName}</span>
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/90 flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-semibold text-foreground truncate">
                {userName}
              </p>
              <p className="text-[11px] text-muted-foreground truncate">
                {userEmail}
              </p>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer">
          <div className="flex items-center gap-3 w-full py-1">
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
              <User className="w-4 h-4 text-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-[13px] font-medium">Mon profil</p>
              <p className="text-[11px] text-muted-foreground">
                {userRole}
              </p>
            </div>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer">
          <div className="flex items-center gap-3 w-full py-1">
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
              <Settings className="w-4 h-4 text-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-[13px] font-medium">Paramètres</p>
              <p className="text-[11px] text-muted-foreground">
                Préférences et configuration
              </p>
            </div>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer">
          <div className="flex items-center gap-3 w-full py-1">
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
              <HelpCircle className="w-4 h-4 text-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-[13px] font-medium">Aide & Support</p>
              <p className="text-[11px] text-muted-foreground">
                Documentation et assistance
              </p>
            </div>
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer text-destructive focus:text-destructive"
          onClick={handleLogout}
        >
          <div className="flex items-center gap-3 w-full py-1">
            <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
              <LogOut className="w-4 h-4 text-destructive" />
            </div>
            <div className="flex-1">
              <p className="text-[13px] font-semibold">Se déconnecter</p>
              <p className="text-[11px] opacity-70">
                Fermer la session
              </p>
            </div>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


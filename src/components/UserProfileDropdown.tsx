import { User, Settings, HelpCircle, LogOut } from "lucide-react";
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
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg">
          <div className="w-7 h-7 rounded-full bg-primary/90 flex items-center justify-center">
            <User className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 sm:w-60">
        <DropdownMenuLabel className="py-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-primary/90 flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-foreground truncate">
                {userName}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">
                {userEmail}
              </p>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {[
          { icon: User, label: "Mon profil", sub: userRole },
          { icon: Settings, label: "Paramètres", sub: "Configuration" },
          { icon: HelpCircle, label: "Aide", sub: "Support" },
        ].map((item) => (
          <DropdownMenuItem
            key={item.label}
            className="cursor-pointer gap-2.5 py-2"
          >
            <item.icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-medium">{item.label}</p>
              <p className="text-[10px] text-muted-foreground">{item.sub}</p>
            </div>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive gap-2.5 py-2">
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span className="text-[12px] font-semibold">Se déconnecter</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

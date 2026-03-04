import { Bell, CheckCircle2, AlertTriangle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";

interface Notification {
  id: string;
  type: "success" | "warning" | "info";
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const initialNotifications: Notification[] = [
  {
    id: "1",
    type: "warning",
    title: "Alerte seuil",
    message: "Code 02.01 dépasse le seuil de 90k€",
    time: "Il y a 5 min",
    read: false,
  },
  {
    id: "2",
    type: "success",
    title: "Export terminé",
    message: "Document PDF généré avec succès",
    time: "Il y a 1h",
    read: false,
  },
  {
    id: "3",
    type: "info",
    title: "Nouveau marché",
    message: "M2026-055 — Mobilier scolaire ajouté",
    time: "Il y a 2h",
    read: true,
  },
  {
    id: "4",
    type: "warning",
    title: "Charge prévisionnelle",
    message: "Surcharge détectée en juin (68%)",
    time: "Hier",
    read: true,
  },
];

export function NotificationsDropdown() {
  const [notifications, setNotifications] = useState(initialNotifications);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="w-3.5 h-3.5 text-success flex-shrink-0" />;
      case "warning":
        return <AlertTriangle className="w-3.5 h-3.5 text-warning flex-shrink-0" />;
      default:
        return <Info className="w-3.5 h-3.5 text-info flex-shrink-0" />;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative h-8 w-8 p-0 rounded-lg">
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-destructive ring-2 ring-background" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} collisionPadding={12} className="w-72 sm:w-80">
        <DropdownMenuLabel className="flex items-center justify-between py-1.5 px-3">
          <span className="text-[12px] font-semibold">Notifications</span>
          {unreadCount > 0 && (
            <button className="text-[10px] text-primary font-medium hover:underline" onClick={markAllAsRead}>
              Tout lire
            </button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-[45vh] overflow-y-auto">
          {notifications.map((n) => (
            <DropdownMenuItem
              key={n.id}
              className={`flex items-start gap-2 px-3 py-2 cursor-pointer ${!n.read ? "bg-primary/5" : ""}`}
              onClick={() => markAsRead(n.id)}
            >
              <div className="mt-0.5">{getIcon(n.type)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <p className="text-[11px] font-semibold text-foreground truncate">{n.title}</p>
                  {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />}
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug line-clamp-1">{n.message}</p>
                <p className="text-[9px] text-muted-foreground/60 mt-0.5">{n.time}</p>
              </div>
            </DropdownMenuItem>
          ))}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="justify-center text-[10px] text-primary font-medium py-1.5">
          Voir tout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

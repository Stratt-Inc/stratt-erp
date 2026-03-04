import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface CalendarEvent {
  id: string;
  objet: string;
  date: string;
  type: "passation" | "echeance" | "formation";
  priorite: "haute" | "normale" | "critique";
}

interface CalendarViewProps {
  marches: Array<{
    id: string;
    objet: string;
    echeance: string;
    statut: string;
    priorite: string;
  }>;
  onSelectMarche: (id: string) => void;
}

const MONTHS = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export function CalendarView({ marches, onSelectMarche }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 2, 1)); // Mars 2026

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

    return { daysInMonth, startingDayOfWeek };
  };

  const getEventsForDay = (day: number) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    const dateStr = `${day.toString().padStart(2, "0")}/${month.toString().padStart(2, "0")}/${year}`;

    return marches.filter((m) => m.echeance === dateStr);
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const getPriorityColor = (priorite: string) => {
    switch (priorite.toLowerCase()) {
      case "critique":
        return "bg-destructive/10 border-destructive/30 text-destructive";
      case "haute":
        return "bg-warning/10 border-warning/30 text-warning";
      default:
        return "bg-primary/10 border-primary/30 text-primary";
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold">
            {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={prevMonth} className="h-9 w-9 p-0">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(new Date(2026, 2, 1))}
            className="h-9 px-4"
          >
            Aujourd'hui
          </Button>
          <Button variant="outline" size="sm" onClick={nextMonth} className="h-9 w-9 p-0">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <Card className="p-4">
        {/* Days Header */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {DAYS.map((day) => (
            <div
              key={day}
              className="text-center text-[11px] font-bold uppercase tracking-widest text-muted-foreground py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Empty cells before first day */}
          {Array.from({ length: startingDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}

          {/* Days of month */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const events = getEventsForDay(day);
            const isToday = day === 4 && currentDate.getMonth() === 2; // 4 mars 2026

            return (
              <div
                key={day}
                className={`aspect-square rounded-lg border-2 p-2 transition-all hover:shadow-md ${
                  isToday
                    ? "bg-primary/5 border-primary"
                    : "bg-card border-border hover:border-primary/30"
                }`}
              >
                <div
                  className={`text-[13px] font-semibold mb-1 ${
                    isToday ? "text-primary" : "text-foreground"
                  }`}
                >
                  {day}
                </div>
                <div className="space-y-1">
                  {events.slice(0, 2).map((event) => (
                    <button
                      key={event.id}
                      onClick={() => onSelectMarche(event.id)}
                      className={`w-full text-left text-[9px] font-semibold px-1.5 py-1 rounded border transition-colors hover:scale-105 ${getPriorityColor(
                        event.priorite
                      )}`}
                    >
                      <div className="truncate">{event.objet}</div>
                    </button>
                  ))}
                  {events.length > 2 && (
                    <div className="text-[8px] text-muted-foreground text-center">
                      +{events.length - 2} autre{events.length - 2 > 1 ? "s" : ""}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Legend */}
      <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded border-2 border-destructive/30 bg-destructive/10" />
          <span>Critique</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded border-2 border-warning/30 bg-warning/10" />
          <span>Haute priorité</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded border-2 border-primary/30 bg-primary/10" />
          <span>Normale</span>
        </div>
      </div>
    </div>
  );
}


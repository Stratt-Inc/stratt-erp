import { LucideIcon } from "lucide-react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

interface StatsGridProps {
  stats: Array<{
    label: string;
    value: string;
    icon: LucideIcon;
    trend?: {
      value: string;
      positive: boolean;
    };
    alert?: boolean;
  }>;
  columns?: "2" | "3" | "4" | "5";
}

export function StatsGrid({ stats, columns = "4" }: StatsGridProps) {
  const colsClass = {
    "2": "grid-cols-1 md:grid-cols-2",
    "3": "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    "4": "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
    "5": "grid-cols-2 lg:grid-cols-5",
  }[columns];

  return (
    <div className={`grid ${colsClass} gap-4 animate-fade-in`}>
      {stats.map((stat, index) => (
        <div
          key={stat.label}
          className="stat-card group"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center backdrop-blur-sm transition-transform group-hover:scale-110">
              <stat.icon className={`w-5 h-5 ${stat.alert ? "text-warning" : "text-primary"}`} />
            </div>
            {stat.trend && (
              <span
                className={`text-[11px] font-bold flex items-center gap-1 ${
                  stat.trend.positive ? "text-accent" : "text-destructive"
                }`}
              >
                {stat.trend.positive ? (
                  <ArrowUpRight className="w-3.5 h-3.5" />
                ) : (
                  <ArrowDownRight className="w-3.5 h-3.5" />
                )}
                {stat.trend.value}
              </span>
            )}
          </div>
          <div className="metric-block">
            <span className={`metric-value ${stat.alert ? "text-warning" : ""}`}>
              {stat.value}
            </span>
            <span className="metric-label mt-1">{stat.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}


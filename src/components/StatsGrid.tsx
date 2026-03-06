import { LucideIcon, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { motion } from "framer-motion";

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

const colsMap = {
  "2": "grid-cols-1 md:grid-cols-2",
  "3": "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  "4": "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  "5": "grid-cols-2 lg:grid-cols-5",
};

export function StatsGrid({ stats, columns = "4" }: StatsGridProps) {
  return (
    <div className={`grid ${colsMap[columns]} gap-3 sm:gap-4`}>
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.07, ease: "easeOut" }}
          whileHover={{ y: -1, transition: { duration: 0.15, ease: "easeOut" } }}
          className="stat-card group cursor-default"
        >
          <div className="flex items-start justify-between mb-4">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200 group-hover:scale-105"
              style={{
                background: stat.alert
                  ? "hsl(38 92% 50% / 0.10)"
                  : "hsl(var(--primary) / 0.09)",
                border: `1px solid ${stat.alert ? "hsl(38 92% 50% / 0.20)" : "hsl(var(--primary) / 0.18)"}`,
              }}
            >
              <stat.icon
                className="w-4 h-4"
                style={{
                  color: stat.alert ? "hsl(38 92% 50%)" : "hsl(var(--primary))",
                }}
                strokeWidth={2}
              />
            </div>

            {stat.trend && (
              <span
                className="text-[11px] font-semibold flex items-center gap-0.5 px-1.5 py-0.5 rounded-md"
                style={{
                  color: stat.trend.positive
                    ? "hsl(142 71% 40%)"
                    : "hsl(var(--destructive))",
                  background: stat.trend.positive
                    ? "hsl(142 71% 45% / 0.10)"
                    : "hsl(var(--destructive) / 0.09)",
                }}
              >
                {stat.trend.positive ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : (
                  <ArrowDownRight className="w-3 h-3" />
                )}
                {stat.trend.value}
              </span>
            )}
          </div>

          <div className="metric-block">
            <span
              className="metric-value"
              style={stat.alert ? { color: "hsl(38 92% 50%)" } : undefined}
            >
              {stat.value}
            </span>
            <span className="metric-label mt-0.5">{stat.label}</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

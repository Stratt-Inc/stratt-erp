"use client";

import * as React from "react";
import * as RechartsPrimitive from "recharts";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────

export type ChartConfig = Record<
  string,
  { label: string; color: string; icon?: React.ComponentType }
>;

interface ChartContextValue {
  config: ChartConfig;
}

const ChartContext = React.createContext<ChartContextValue>({ config: {} });

function useChart() {
  return React.useContext(ChartContext);
}

// ── ChartContainer ─────────────────────────────────────────────────────

export function ChartContainer({
  config,
  className,
  children,
}: {
  config: ChartConfig;
  className?: string;
  children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>["children"];
}) {
  const cssVars = Object.fromEntries(
    Object.entries(config).map(([key, { color }]) => [`--color-${key}`, color])
  ) as React.CSSProperties;

  return (
    <ChartContext.Provider value={{ config }}>
      <div className={cn("w-full", className)} style={cssVars}>
        <RechartsPrimitive.ResponsiveContainer width="100%" height="100%">
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

// ── ChartTooltip ───────────────────────────────────────────────────────

export const ChartTooltip = RechartsPrimitive.Tooltip;

export function ChartTooltipContent({
  active,
  payload,
  label,
  labelFormatter,
  formatter,
  hideLabel = false,
  hideIndicator = false,
  indicator = "dot",
  className,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; fill?: string; color?: string; dataKey?: string }>;
  label?: string;
  labelFormatter?: (value: string) => React.ReactNode;
  formatter?: (value: number, name: string) => React.ReactNode;
  hideLabel?: boolean;
  hideIndicator?: boolean;
  indicator?: "dot" | "line" | "dashed";
  className?: string;
}) {
  const { config } = useChart();

  if (!active || !payload?.length) return null;

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card px-3 py-2.5 shadow-md text-xs",
        className
      )}
    >
      {!hideLabel && label && (
        <p className="mb-2 font-semibold text-foreground">
          {labelFormatter ? labelFormatter(label) : label}
        </p>
      )}
      <div className="space-y-1">
        {payload.map((entry, i) => {
          const key = entry.dataKey as string;
          const itemConfig = config[key];
          const color = itemConfig?.color ?? entry.fill ?? entry.color ?? "currentColor";
          const displayName = itemConfig?.label ?? entry.name;
          const displayValue = formatter
            ? formatter(entry.value, entry.name)
            : entry.value;

          return (
            <div key={i} className="flex items-center gap-2">
              {!hideIndicator && (
                indicator === "dot" ? (
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                ) : indicator === "line" ? (
                  <div className="w-3 h-0.5 flex-shrink-0 rounded-full" style={{ background: color }} />
                ) : (
                  <div className="w-3 h-0.5 flex-shrink-0 rounded-full" style={{ background: color, opacity: 0.7 }} />
                )
              )}
              <span style={{ color: "rgba(30,50,80,0.55)" }}>{displayName}</span>
              <span className="ml-auto pl-4 font-bold num" style={{ color: "hsl(var(--foreground))" }}>
                {displayValue}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── ChartLegend ────────────────────────────────────────────────────────

export const ChartLegend = RechartsPrimitive.Legend;

export function ChartLegendContent({
  payload,
}: {
  payload?: Array<{ value: string; color?: string }>;
}) {
  const { config } = useChart();
  if (!payload?.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-4 pt-2">
      {payload.map((entry, i) => {
        const itemConfig = config[entry.value];
        const color = itemConfig?.color ?? entry.color ?? "currentColor";
        const label = itemConfig?.label ?? entry.value;
        return (
          <div key={i} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
            <span className="text-[11px]" style={{ color: "rgba(30,50,80,0.5)" }}>{label}</span>
          </div>
        );
      })}
    </div>
  );
}

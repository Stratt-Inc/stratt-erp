"use client";

import { useToastStore } from "@/store/toast";
import { X, Info, CheckCircle, AlertTriangle } from "lucide-react";

const icons = {
  info: <Info className="w-4 h-4 flex-shrink-0" style={{ color: "hsl(var(--primary))" }} />,
  success: <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: "hsl(var(--success))" }} />,
  warning: <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: "hsl(var(--warning))" }} />,
};

const accents = {
  info: "hsl(var(--primary) / 0.12)",
  success: "hsl(var(--success) / 0.12)",
  warning: "hsl(var(--warning) / 0.12)",
};

export function ToastContainer() {
  const { toasts, dismiss } = useToastStore();

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border border-border shadow-lg text-sm font-medium text-foreground"
          style={{ background: `hsl(var(--card))`, minWidth: "280px", maxWidth: "400px" }}
        >
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: accents[t.type] }}
          >
            {icons[t.type]}
          </div>
          <span className="flex-1 text-sm text-foreground">{t.message}</span>
          <button
            onClick={() => dismiss(t.id)}
            className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

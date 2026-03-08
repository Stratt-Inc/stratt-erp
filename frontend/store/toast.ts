"use client";

import { create } from "zustand";

interface Toast {
  id: number;
  message: string;
  type: "info" | "success" | "warning";
}

interface ToastStore {
  toasts: Toast[];
  show: (message: string, type?: Toast["type"]) => void;
  dismiss: (id: number) => void;
}

let _id = 0;

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  show: (message, type = "info") => {
    const id = ++_id;
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 3500);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

/** Convenience hook — returns a function that fires a "demo" toast */
export function useDemoAction(message = "Fonctionnalité disponible en version complète.") {
  const show = useToastStore((s) => s.show);
  return () => show(message, "info");
}

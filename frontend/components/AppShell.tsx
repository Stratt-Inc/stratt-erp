"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { Sidebar } from "./Sidebar";
import { ToastContainer } from "./ToastContainer";
import { OnboardingTour } from "./onboarding/OnboardingTour";
import { OnboardingChecklist } from "./onboarding/OnboardingChecklist";

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isLoading, _hasHydrated, currentOrg, accessToken, loadOrganizations } = useAuthStore();

  useEffect(() => {
    if (_hasHydrated && !isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, _hasHydrated, router]);

  // Always reload orgs on mount to validate/refresh currentOrg
  useEffect(() => {
    if (_hasHydrated && user && accessToken) {
      loadOrganizations();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_hasHydrated, user, accessToken]);

  if (!_hasHydrated || !user) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
      <ToastContainer />
      <OnboardingTour />
      <OnboardingChecklist />
    </div>
  );
}

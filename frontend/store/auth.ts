"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api } from "@/lib/api";

export interface User {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  email_verified: boolean;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  plan: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  currentOrg: Organization | null;
  organizations: Organization[];
  isLoading: boolean;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<boolean>;
  setCurrentOrg: (org: Organization) => void;
  loadOrganizations: () => Promise<void>;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      currentOrg: null,
      organizations: [],
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const data = await api.post<{ user: User; access_token: string }>(
            "/api/v1/auth/login",
            { email, password },
          );
          set({
            user: data.user,
            accessToken: data.access_token,
            isLoading: false,
          });
          // Load organizations after login
          await get().loadOrganizations();
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      signup: async (name, email, password) => {
        set({ isLoading: true });
        try {
          const data = await api.post<{ user: User; access_token: string }>(
            "/api/v1/auth/signup",
            { name, email, password },
          );
          set({
            user: data.user,
            accessToken: data.access_token,
            isLoading: false,
          });
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      logout: async () => {
        const { accessToken } = get();
        if (accessToken) {
          await api.post("/api/v1/auth/logout", undefined, { token: accessToken }).catch(() => {});
        }
        get().clear();
      },

      refresh: async () => {
        try {
          const data = await api.post<{ access_token: string }>("/api/v1/auth/refresh");
          set({ accessToken: data.access_token });
          return true;
        } catch {
          get().clear();
          return false;
        }
      },

      setCurrentOrg: (org) => set({ currentOrg: org }),

      loadOrganizations: async () => {
        const { accessToken } = get();
        if (!accessToken) return;
        try {
          const orgs = await api.get<Organization[]>("/api/v1/organizations", {
            token: accessToken,
          });
          set({ organizations: orgs });
          if (orgs.length > 0 && !get().currentOrg) {
            set({ currentOrg: orgs[0] });
          }
        } catch {
          // silently fail
        }
      },

      clear: () =>
        set({
          user: null,
          accessToken: null,
          currentOrg: null,
          organizations: [],
        }),
    }),
    {
      name: "axiora-auth",
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        currentOrg: state.currentOrg,
      }),
    },
  ),
);

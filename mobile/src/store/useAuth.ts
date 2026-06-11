import { useEffect } from "react";
import { create } from "zustand";
import { onAuthChanged, type AuthUser } from "@/src/firebase/auth";

interface AuthState {
  user: AuthUser | null;
  initializing: boolean;
  setUser: (user: AuthUser | null) => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  initializing: true,
  setUser: (user) => set({ user, initializing: false }),
}));

/** Wire Firebase auth state into the store. Mount once at the app root. */
export function useAuthListener(): void {
  const setUser = useAuth((s) => s.setUser);
  useEffect(() => onAuthChanged(setUser), [setUser]);
}

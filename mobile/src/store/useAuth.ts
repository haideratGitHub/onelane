import { useEffect } from "react";
import { create } from "zustand";
import type { FirebaseAuthTypes } from "@react-native-firebase/auth";
import { onAuthChanged } from "@/src/firebase/auth";

interface AuthState {
  user: FirebaseAuthTypes.User | null;
  initializing: boolean;
  setUser: (user: FirebaseAuthTypes.User | null) => void;
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

import { useEffect, useState } from "react";
import { AppState } from "react-native";
import { elapsedMs, isRunning, type Session } from "@/src/domain";

/**
 * Live elapsed ms for the active session. The 1s interval only drives the UI
 * refresh — the value itself is always recomputed from stored timestamps, so it
 * self-corrects after the app was backgrounded or killed.
 */
export function useElapsed(session: Session | null): number {
  const running = !!session && isRunning(session);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    setNow(Date.now());
    if (!running) return;

    const interval = setInterval(() => setNow(Date.now()), 1000);
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") setNow(Date.now());
    });
    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, [running, session?.id]);

  return session ? elapsedMs(session, now) : 0;
}

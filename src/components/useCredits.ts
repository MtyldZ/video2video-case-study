"use client";

import { useEffect, useState } from "react";
import { fetchCredits } from "@/lib/api";

const EVENT = "credits-changed";

// Call after anything that changes the balance (job submitted or finished).
export const notifyCreditsChanged = () => window.dispatchEvent(new Event(EVENT));

// Magic Hour credit balance; undefined while loading or if it can't be fetched.
export function useCredits() {
  const [credits, setCredits] = useState<number>();
  useEffect(() => {
    let cancelled = false;
    const load = () => fetchCredits().then((c) => !cancelled && setCredits(c), () => {});
    load();
    window.addEventListener(EVENT, load);
    return () => {
      cancelled = true;
      window.removeEventListener(EVENT, load);
    };
  }, []);
  return credits;
}

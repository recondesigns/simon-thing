"use client";

import { useEffect } from "react";
import { useGameStore } from "@/lib/store/gameStore";

/**
 * Triggers the game store's deferred rehydration once, on the client, after
 * mount. The store persists with `skipHydration`, so it starts empty on both
 * server and first client render — matching, no mismatch — and this pulls the
 * saved history in a tick later. Renders nothing.
 */
export default function StoreHydrator() {
  useEffect(() => {
    useGameStore.persist.rehydrate();
  }, []);

  return null;
}

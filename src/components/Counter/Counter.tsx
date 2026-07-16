"use client";

import { useCounterStore } from "@/stores/useCounterStore";
import styles from "./Counter.module.css";

export default function Counter() {
  const count = useCounterStore((state) => state.count);
  const increment = useCounterStore((state) => state.increment);
  const decrement = useCounterStore((state) => state.decrement);
  const reset = useCounterStore((state) => state.reset);

  return (
    <div className={styles.counter}>
      <button onClick={decrement} aria-label="Decrement">
        -
      </button>
      <span>{count}</span>
      <button onClick={increment} aria-label="Increment">
        +
      </button>
      <button onClick={reset}>Reset</button>
    </div>
  );
}

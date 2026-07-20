/** Bring the input grid back into view when a round or game (re)starts. */
export function scrollToTop(): void {
  if (typeof window !== "undefined") {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

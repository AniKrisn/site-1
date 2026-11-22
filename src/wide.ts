import { useSyncExternalStore } from "react";

/* Below this the site is text only: no scene, no flock, no drawings. */
const mq = window.matchMedia("(min-width: 1024px)");

const watch = (cb: () => void) => {
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};

export const useWide = () => useSyncExternalStore(watch, () => mq.matches);

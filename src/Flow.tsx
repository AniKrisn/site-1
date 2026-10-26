import { useEffect, useRef } from "react";
import { startField } from "./flow/field";

/* Where in the endless field the card looks: a stretch with a coast
   running through the sky. */
const ORIGIN = [0, 0];
// thinner islands than gen's 0.55, otherwise the sky reads as painted over
const COAST = 0.62;

/* The live flow field behind the card's drawing. The static painting stays
   underneath until the first drawing lands, and for good without WebGL2. */
export function Flow() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const stop = startField(cv, "/flow.webp", ORIGIN[0], ORIGIN[1], COAST, still);
    return () => stop?.();
  }, []);

  return (
    <div className="flow">
      <canvas ref={ref} />
    </div>
  );
}

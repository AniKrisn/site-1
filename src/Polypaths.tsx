import { useRef, useEffect } from "react";

interface PolypathsProps {
  followStrength?: number;
  friction?: number;
}

export function Polypaths({
  followStrength = 0.02,
  friction = 0.88,
}: PolypathsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const nodeRef = useRef({ x: 0, y: 0, vx: 0, vy: 0 });
  const trailRef = useRef<{ x: number; y: number }[]>([]);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.scale(dpr, dpr);
      // Initialize node at center
      nodeRef.current = {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        vx: 0,
        vy: 0,
      };
      trailRef.current = [];
    };

    resize();
    window.addEventListener("resize", resize);

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = {
        x: e.clientX,
        y: e.clientY,
      };
    };

    window.addEventListener("mousemove", handleMouseMove);

    const getComputedColors = () => {
      const style = getComputedStyle(document.documentElement);
      const bg = style.getPropertyValue("--color-bg").trim() || "#faf3e1";
      const text = style.getPropertyValue("--color-text").trim() || "#222222";
      return { bg, text };
    };

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const { bg, text } = getComputedColors();
      const node = nodeRef.current;
      const trail = trailRef.current;
      const mouse = mouseRef.current;

      // Clear
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, rect.width, rect.height);

      // Calculate target with slight offset animation
      const offsetRadius = 60 + Math.sin(Date.now() * 0.001);
      const targetX = mouse.x + Math.cos(Date.now() * 0.0005) * offsetRadius;
      const targetY = mouse.y + Math.sin(Date.now() * 0.0005) * offsetRadius;

      // Spring physics
      const dx = targetX - node.x;
      const dy = targetY - node.y;
      node.vx += dx * followStrength;
      node.vy += dy * followStrength;
      node.vx *= friction;
      node.vy *= friction;
      node.x += node.vx;
      node.y += node.vy;

      // Add to trail
      trail.unshift({ x: node.x, y: node.y });
      if (trail.length > 20) trail.pop();

      // Draw trail
      if (trail.length >= 2) {
        ctx.beginPath();
        ctx.moveTo(trail[0].x, trail[0].y);
        for (let j = 1; j < trail.length; j++) {
          ctx.lineTo(trail[j].x, trail[j].y);
        }
        ctx.strokeStyle = `${text}26`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Draw node
      ctx.beginPath();
      ctx.arc(node.x, node.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = "#00d26a";
      ctx.fill();

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationRef.current);
    };
  }, [followStrength, friction]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
      }}
    />
  );
}

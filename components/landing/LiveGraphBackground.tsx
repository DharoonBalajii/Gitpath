'use client';

import { useEffect, useRef } from 'react';

/**
 * Live, continuously-animating node network rendered on a canvas.
 * Nodes drift, edges fade by proximity, and packets travel along links —
 * an on-theme "repository coming alive" motion. Cheap (1 rAF, capped nodes),
 * DPR-aware, and disabled for users who prefer reduced motion.
 */
export function LiveGraphBackground({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const palette = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#ec4899'];

    type Node = { x: number; y: number; vx: number; vy: number; r: number; c: string };
    type Packet = { a: number; b: number; t: number; speed: number; c: string };

    let w = 0, h = 0, dpr = 1, raf = 0;
    let nodes: Node[] = [];
    let packets: Packet[] = [];
    const COUNT = 36;
    const MAXD = 150;

    const rand = (min: number, max: number) => min + Math.random() * (max - min);
    const pick = () => palette[Math.floor(Math.random() * palette.length)]!;

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.max(1, rect.width);
      h = Math.max(1, rect.height);
      canvas!.width = Math.floor(w * dpr);
      canvas!.height = Math.floor(h * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function init() {
      nodes = Array.from({ length: COUNT }, () => ({
        x: rand(0, w), y: rand(0, h),
        vx: rand(-0.22, 0.22), vy: rand(-0.22, 0.22),
        r: rand(1.6, 3.4), c: pick(),
      }));
      packets = Array.from({ length: 14 }, () => spawnPacket());
    }

    function spawnPacket(): Packet {
      const a = Math.floor(rand(0, nodes.length));
      let b = Math.floor(rand(0, nodes.length));
      if (b === a) b = (b + 1) % nodes.length;
      return { a, b, t: Math.random(), speed: rand(0.004, 0.011), c: pick() };
    }

    function frame() {
      ctx!.clearRect(0, 0, w, h);

      // edges
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i]!;
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j]!;
          const dx = a.x - b.x, dy = a.y - b.y;
          const d = Math.hypot(dx, dy);
          if (d < MAXD) {
            ctx!.strokeStyle = `rgba(99,102,241,${(1 - d / MAXD) * 0.16})`;
            ctx!.lineWidth = 1;
            ctx!.beginPath();
            ctx!.moveTo(a.x, a.y);
            ctx!.lineTo(b.x, b.y);
            ctx!.stroke();
          }
        }
      }

      // nodes
      for (const n of nodes) {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
        ctx!.globalAlpha = 0.6;
        ctx!.beginPath();
        ctx!.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx!.fillStyle = n.c;
        ctx!.fill();
        ctx!.globalAlpha = 1;
      }

      // packets travelling along (a → b)
      for (const p of packets) {
        const a = nodes[p.a], b = nodes[p.b];
        if (!a || !b) { Object.assign(p, spawnPacket()); continue; }
        p.t += p.speed;
        if (p.t >= 1) { Object.assign(p, spawnPacket()); continue; }
        const x = a.x + (b.x - a.x) * p.t;
        const y = a.y + (b.y - a.y) * p.t;
        ctx!.globalAlpha = 0.9;
        ctx!.beginPath();
        ctx!.arc(x, y, 1.8, 0, Math.PI * 2);
        ctx!.fillStyle = p.c;
        ctx!.shadowBlur = 8;
        ctx!.shadowColor = p.c;
        ctx!.fill();
        ctx!.shadowBlur = 0;
        ctx!.globalAlpha = 1;
      }

      raf = requestAnimationFrame(frame);
    }

    resize();
    init();
    if (reduce) {
      frame();
      cancelAnimationFrame(raf);
    } else {
      frame();
    }

    const onResize = () => { resize(); init(); };
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}

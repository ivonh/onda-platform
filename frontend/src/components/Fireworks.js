import { useState, useCallback, useRef, useEffect } from 'react';

const PARTICLE_COUNT = 12;
const COLORS = [
  'hsl(30, 100%, 70%)',
  'hsl(35, 100%, 65%)',
  'hsl(40, 100%, 60%)',
  'hsl(25, 100%, 75%)',
  'hsl(45, 90%, 70%)',
  'hsl(20, 100%, 80%)',
];

function createParticles(x, y) {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const angle = (360 / PARTICLE_COUNT) * i + (Math.random() * 30 - 15);
    const velocity = 40 + Math.random() * 60;
    const size = 3 + Math.random() * 4;
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const rad = (angle * Math.PI) / 180;

    return {
      id: `${Date.now()}-${i}`,
      x,
      y,
      dx: Math.cos(rad) * velocity,
      dy: Math.sin(rad) * velocity,
      size,
      color,
    };
  });
}

export function useFireworks() {
  const [bursts, setBursts] = useState([]);
  const mountedRef = useRef(true);
  const timeoutRefs = useRef([]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      timeoutRefs.current.forEach(clearTimeout);
    };
  }, []);

  const triggerFireworks = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newParticles = createParticles(x, y);
    const burstId = Date.now();

    setBursts((prev) => [...prev, { id: burstId, particles: newParticles }]);

    const tid = setTimeout(() => {
      if (mountedRef.current) {
        setBursts((prev) => prev.filter((b) => b.id !== burstId));
      }
    }, 700);
    timeoutRefs.current.push(tid);
  }, []);

  const FireworksOverlay = bursts.length > 0 ? (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', borderRadius: 'inherit' }}>
      {bursts.map((burst) =>
        burst.particles.map((p) => (
          <span
            key={p.id}
            className="firework-particle"
            style={{
              position: 'absolute',
              left: p.x,
              top: p.y,
              width: p.size,
              height: p.size,
              borderRadius: '50%',
              backgroundColor: p.color,
              boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
              '--dx': `${p.dx}px`,
              '--dy': `${p.dy}px`,
            }}
          />
        ))
      )}
    </div>
  ) : null;

  return { triggerFireworks, FireworksOverlay };
}

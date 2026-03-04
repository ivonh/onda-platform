import { useState, useEffect } from 'react';
import TextShimmer from './TextShimmer';

export function SplashScreen({ onFinish, duration = 3000 }) {
  const [fadeOut, setFadeOut] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFadeOut(true), duration - 600);
    const hideTimer = setTimeout(() => {
      setVisible(false);
      onFinish?.();
    }, duration);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, [duration, onFinish]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background transition-opacity duration-500 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="relative flex flex-col items-center gap-6">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-2"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--secondary)) 100%)',
            animation: 'splash-logo-pulse 2s ease-in-out infinite',
          }}
        >
          <span className="text-black font-cormorant text-3xl font-bold">O</span>
        </div>

        <TextShimmer
          as="h1"
          className="font-cormorant text-6xl md:text-7xl font-bold tracking-wide"
          duration="2s"
          shimmerColor="rgba(255, 255, 255, 0.9)"
        >
          Onda
        </TextShimmer>

        <p
          className="text-muted-foreground text-sm md:text-base font-montserrat tracking-[0.3em] uppercase"
          style={{
            animation: 'splash-tagline-fade 1.2s ease-out 0.5s both',
          }}
        >
          Beauty, Elevated
        </p>

        <div className="mt-8 flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-primary"
              style={{
                animation: `splash-dot-bounce 1.4s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default SplashScreen;

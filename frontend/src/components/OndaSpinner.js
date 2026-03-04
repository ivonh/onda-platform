export default function OndaSpinner({ size = 'md', text = '' }) {
  const sizes = {
    sm: { container: 'w-8 h-8', text: 'text-lg', ring: 28, stroke: 2.5 },
    md: { container: 'w-16 h-16', text: 'text-3xl', ring: 56, stroke: 2 },
    lg: { container: 'w-24 h-24', text: 'text-5xl', ring: 88, stroke: 2 },
  };

  const s = sizes[size] || sizes.md;
  const radius = (s.ring - s.stroke * 2) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className={`${s.container} relative`}>
        <svg
          className="onda-spinner absolute inset-0"
          viewBox={`0 0 ${s.ring} ${s.ring}`}
          fill="none"
        >
          <circle
            cx={s.ring / 2}
            cy={s.ring / 2}
            r={radius}
            stroke="rgba(255, 179, 102, 0.15)"
            strokeWidth={s.stroke}
          />
          <circle
            className="onda-spinner-ring"
            cx={s.ring / 2}
            cy={s.ring / 2}
            r={radius}
            stroke="url(#ondaGradient)"
            strokeWidth={s.stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * 0.75}
          />
          <defs>
            <linearGradient id="ondaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(30, 100%, 70%)" />
              <stop offset="100%" stopColor="hsl(30, 80%, 55%)" />
            </linearGradient>
          </defs>
        </svg>

        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-cormorant ${s.text} font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent leading-none`}>
            O
          </span>
        </div>
      </div>

      {text && (
        <p className="text-sm text-muted-foreground font-montserrat animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
}

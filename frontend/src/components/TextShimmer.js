export function TextShimmer({ 
  children, 
  className = '', 
  shimmerColor = 'rgba(255, 200, 120, 0.8)',
  duration = '2.5s',
  as: Tag = 'span'
}) {
  return (
    <Tag
      className={`inline-block bg-clip-text text-transparent ${className}`}
      style={{
        backgroundImage: `linear-gradient(
          110deg,
          hsl(var(--primary)) 35%,
          ${shimmerColor} 50%,
          hsl(var(--primary)) 65%
        )`,
        backgroundSize: '200% 100%',
        animation: `text-shimmer ${duration} ease-in-out infinite`,
      }}
    >
      {children}
    </Tag>
  );
}

export default TextShimmer;

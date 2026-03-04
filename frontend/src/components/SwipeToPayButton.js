import { useState, useRef, useEffect } from 'react';
import { ArrowRight, Check, Loader2, X } from 'lucide-react';

export default function SwipeToPayButton({ amount, onConfirm, disabled = false, isLoading = false, hasError = false }) {
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const containerRef = useRef(null);
  const startXRef = useRef(0);
  const threshold = 0.75;

  useEffect(() => {
    if (hasError && isConfirmed) {
      setIsConfirmed(false);
      setDragX(0);
    }
  }, [hasError, isConfirmed]);

  useEffect(() => {
    if (!isLoading && isConfirmed && !hasError) {
      const timer = setTimeout(() => {
        setIsConfirmed(false);
        setDragX(0);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isLoading, isConfirmed, hasError]);

  const handleStart = (clientX) => {
    if (disabled || isLoading || isConfirmed) return;
    setIsDragging(true);
    startXRef.current = clientX;
  };

  const handleMove = (clientX) => {
    if (!isDragging || !containerRef.current) return;
    const containerWidth = containerRef.current.offsetWidth - 64;
    const deltaX = clientX - startXRef.current;
    const newDragX = Math.max(0, Math.min(deltaX, containerWidth));
    setDragX(newDragX);
  };

  const handleEnd = async () => {
    if (!isDragging || !containerRef.current) return;
    setIsDragging(false);
    
    const containerWidth = containerRef.current.offsetWidth - 64;
    const progress = dragX / containerWidth;
    
    if (progress >= threshold) {
      setIsConfirmed(true);
      setDragX(containerWidth);
      if (onConfirm) {
        try {
          await onConfirm();
        } catch (error) {
          setIsConfirmed(false);
          setDragX(0);
        }
      }
    } else {
      setDragX(0);
    }
  };

  const handleMouseDown = (e) => handleStart(e.clientX);
  const handleMouseMove = (e) => handleMove(e.clientX);
  const handleMouseUp = () => handleEnd();
  const handleMouseLeave = () => {
    if (isDragging) handleEnd();
  };

  const handleTouchStart = (e) => handleStart(e.touches[0].clientX);
  const handleTouchMove = (e) => handleMove(e.touches[0].clientX);
  const handleTouchEnd = () => handleEnd();

  const containerWidth = containerRef.current?.offsetWidth - 64 || 200;
  const progress = Math.min(dragX / containerWidth, 1);

  return (
    <div
      ref={containerRef}
      className={`relative h-16 rounded-full overflow-hidden select-none ${
        disabled || isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-grab'
      } ${isDragging ? 'cursor-grabbing' : ''}`}
      style={{
        background: `linear-gradient(to right, 
          hsl(var(--primary) / ${0.3 + progress * 0.4}) ${progress * 100}%, 
          hsl(var(--muted)) ${progress * 100}%)`
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className={`text-muted-foreground font-medium transition-opacity duration-200 ${
          progress > 0.3 || isConfirmed ? 'opacity-0' : 'opacity-100'
        }`}>
          Swipe to Pay ${amount?.toFixed(2) || '0.00'}
        </span>
        <span className={`absolute text-primary font-semibold transition-opacity duration-200 ${
          isConfirmed ? 'opacity-100' : 'opacity-0'
        }`}>
          Payment Confirmed
        </span>
      </div>

      <div
        className={`absolute top-1 left-1 w-14 h-14 rounded-full flex items-center justify-center transition-transform duration-${isDragging ? '0' : '300'} ${
          isConfirmed 
            ? 'bg-green-500 text-white' 
            : 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground'
        }`}
        style={{
          transform: `translateX(${dragX}px)`,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {isLoading ? (
          <Loader2 className="w-6 h-6 animate-spin" />
        ) : hasError ? (
          <X className="w-6 h-6" />
        ) : isConfirmed ? (
          <Check className="w-6 h-6" />
        ) : (
          <ArrowRight className="w-6 h-6" />
        )}
      </div>

      <div 
        className="absolute bottom-0 left-0 h-1 bg-primary transition-all duration-100"
        style={{ width: `${progress * 100}%` }}
      />
    </div>
  );
}

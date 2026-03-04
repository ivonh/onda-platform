import { useState, useRef, useEffect, useCallback } from 'react';
import { Scissors } from 'lucide-react';
import { Card } from '@/components/ui/card';

export const SlideToConfirm = ({ onConfirm, text = "Slide to Complete" }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const containerRef = useRef(null);
  const startXRef = useRef(0);

  const handleStart = (clientX) => {
    setIsDragging(true);
    startXRef.current = clientX - position;
  };

  const handleMove = useCallback((clientX) => {
    if (!isDragging || isCompleted) return;

    const container = containerRef.current;
    if (!container) return;

    const newPosition = clientX - startXRef.current;
    const maxPosition = container.offsetWidth - 80;

    if (newPosition >= 0 && newPosition <= maxPosition) {
      setPosition(newPosition);
    }

    if (newPosition >= maxPosition * 0.95) {
      setIsCompleted(true);
      setIsDragging(false);
      setPosition(maxPosition);
      
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZSA0PVKzn77BdGAg+ltrywnAgBSuAyvPZii8IHGm97+OZRA0PVKzn77BdGAg+ltrywnAgBSuAyvPZii8IHGm97+OZRA0PVKzn77BdGAg+ltrywnAgBSuAyvPZii8IHGm97+OZRA0PVKzn77BdGAg+ltrywnAgBSuAyvPZii8IHGm97+OZRA0PVKzn77BdGAg+ltrywnAgBSuAyvPZii8IHGm97+OZRA0PVKzn77BdGAg+ltrywnAgBSuAyvPZii8IHGm97+OZRA0PVKzn77BdGAg+ltrywnAgBSuAyvPZii8IHGm97+OZRA0PVKzn77BdGAg+ltrywnAgBSuAyvPZii8IHGm97+OZRA0PVKzn77BdGAg+ltrywnAgBSuAyvPZii8IHGm97+OZRA0PVKzn77BdGAg+ltrywnAgBSuAyvPZii8IHGm97+OZRA0PVKzn77BdGAg+ltrywnAgBSuAyvPZii8IHGm97+OZRA0PVKzn77BdGAg+ltrywnAgBSuAyvPZii8IHGm97+OZRA0PVKzn77BdGAg+ltryw');
      audio.play().catch(err => console.log('Audio play failed:', err));
      
      setTimeout(() => {
        onConfirm?.();
      }, 300);
    }
  }, [isDragging, isCompleted, onConfirm]);

  const handleEnd = useCallback(() => {
    setIsDragging(false);
    if (!isCompleted) {
      setPosition(0);
    }
  }, [isCompleted]);

  useEffect(() => {
    const handleMouseMove = (e) => handleMove(e.clientX);
    const handleTouchMove = (e) => handleMove(e.touches[0].clientX);

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchend', handleEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, handleMove, handleEnd]);

  return (
    <div
      ref={containerRef}
      className="relative h-20 rounded-full overflow-hidden"
      style={{
        background: isCompleted 
          ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)'
          : 'linear-gradient(90deg, rgba(255, 179, 102, 0.1) 0%, rgba(255, 179, 102, 0.3) 100%)',
        border: '2px solid',
        borderColor: isCompleted ? '#10b981' : '#FFB366'
      }}
    >
      <div
        className="absolute top-0 left-0 h-full transition-all"
        style={{
          width: `${position}px`,
          background: 'linear-gradient(90deg, rgba(255, 179, 102, 0.3) 0%, rgba(255, 179, 102, 0.1) 100%)'
        }}
      />

      <div
        className={`absolute left-0 top-1/2 -translate-y-1/2 w-20 h-16 rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing transition-all ${
          isCompleted ? 'bg-green-500' : 'bg-primary'
        }`}
        style={{
          transform: `translate(${position}px, -50%)`,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
        }}
        onMouseDown={(e) => handleStart(e.clientX)}
        onTouchStart={(e) => handleStart(e.touches[0].clientX)}
      >
        <Scissors className={`h-8 w-8 text-black ${
          isDragging ? 'animate-pulse' : ''
        }`} />
      </div>

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <p className="font-montserrat font-semibold text-lg tracking-wide" style={{
          color: isCompleted ? '#fff' : '#FFB366'
        }}>
          {isCompleted ? '✓ Completed!' : text}
        </p>
      </div>
    </div>
  );
};

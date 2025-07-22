import { useState, useRef, useEffect, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface SwipeableCardProps {
  children: ReactNode;
  onDelete: () => void;
  onSwipeReset?: () => void;
  className?: string;
}

const SwipeableCard = ({ children, onDelete, onSwipeReset, className = "" }: SwipeableCardProps) => {
  const [translateX, setTranslateX] = useState(0);
  const [isSwipeActive, setIsSwipeActive] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const currentXRef = useRef(0);

  const SWIPE_THRESHOLD = 80; // Minimum distance to trigger delete button
  const MAX_SWIPE = 120; // Maximum swipe distance

  const handleStart = (clientX: number) => {
    setIsDragging(true);
    startXRef.current = clientX;
    currentXRef.current = translateX;
  };

  const handleMove = (clientX: number) => {
    if (!isDragging) return;

    const deltaX = clientX - startXRef.current;
    const newTranslateX = Math.max(0, Math.min(MAX_SWIPE, currentXRef.current + deltaX));
    setTranslateX(newTranslateX);
  };

  const handleEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    if (translateX >= SWIPE_THRESHOLD) {
      // Snap to show delete button
      setTranslateX(MAX_SWIPE);
      setIsSwipeActive(true);
    } else {
      // Snap back to original position
      resetSwipe();
    }
  };

  const resetSwipe = () => {
    setTranslateX(0);
    setIsSwipeActive(false);
    onSwipeReset?.();
  };

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleStart(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleMove(e.clientX);
  };

  const handleMouseUp = () => {
    handleEnd();
  };

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    handleStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    handleMove(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    handleEnd();
  };

  // Handle clicks outside to reset swipe
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isSwipeActive && cardRef.current && !cardRef.current.contains(event.target as Node)) {
        resetSwipe();
      }
    };

    if (isSwipeActive) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isSwipeActive]);

  // Handle global mouse events when dragging
  useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseMove = (e: MouseEvent) => {
        handleMove(e.clientX);
      };

      const handleGlobalMouseUp = () => {
        handleEnd();
      };

      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [isDragging, translateX]);

  return (
    <div className="relative overflow-hidden">
      {/* Delete button background */}
      <div 
        className="absolute inset-0 bg-destructive flex items-center justify-end pr-6 z-0"
        style={{
          opacity: translateX / MAX_SWIPE,
        }}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="text-destructive-foreground hover:text-destructive-foreground hover:bg-destructive/90 flex items-center gap-2"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
      </div>

      {/* Swipeable content */}
      <div
        ref={cardRef}
        className={`relative z-10 transition-transform duration-200 ease-out touch-pan-y select-none ${className}`}
        style={{
          transform: `translateX(${translateX}px)`,
          cursor: isDragging ? 'grabbing' : 'grab',
          transition: isDragging ? 'none' : 'transform 0.2s ease-out',
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
};

export default SwipeableCard;
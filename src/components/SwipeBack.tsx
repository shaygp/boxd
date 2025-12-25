import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

interface SwipeBackProps {
  onSwipeBack?: () => void;
}

export const SwipeBack = ({ onSwipeBack }: SwipeBackProps) => {
  const navigate = useNavigate();
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;

      const diffX = touchEndX - touchStartX.current;
      const diffY = touchEndY - touchStartY.current;

      // Swipe right: diffX > 80 and more horizontal than vertical
      if (diffX > 80 && Math.abs(diffX) > Math.abs(diffY)) {
        if (onSwipeBack) {
          onSwipeBack();
        } else {
          navigate(-1);
        }
      }

      touchStartX.current = 0;
      touchStartY.current = 0;
    };

    // Add event listeners
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [navigate, onSwipeBack]);

  return null; // This is a behavior component, no UI
};

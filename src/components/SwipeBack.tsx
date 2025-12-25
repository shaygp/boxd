import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

interface SwipeBackProps {
  onSwipeBack?: () => void;
}

export const SwipeBack = ({ onSwipeBack }: SwipeBackProps) => {
  const navigate = useNavigate();
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const isSwiping = useRef<boolean>(false);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
      isSwiping.current = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (touchStartX.current === 0) return;

      const touchCurrentX = e.touches[0].clientX;
      const touchCurrentY = e.touches[0].clientY;

      const diffX = touchCurrentX - touchStartX.current;
      const diffY = touchCurrentY - touchStartY.current;

      // Only track horizontal right swipes
      if (Math.abs(diffX) > Math.abs(diffY) && diffX > 20) {
        isSwiping.current = true;

        // Add slide effect - subtle translation
        const translateAmount = Math.min(diffX * 0.5, 150);
        document.body.style.transform = `translateX(${translateAmount}px)`;
        document.body.style.transition = 'none';
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;

      const diffX = touchEndX - touchStartX.current;
      const diffY = touchEndY - touchStartY.current;

      // Animate back
      document.body.style.transition = 'transform 0.2s ease-out';

      // Swipe right: diffX > 80 and more horizontal than vertical
      if (diffX > 80 && Math.abs(diffX) > Math.abs(diffY) && isSwiping.current) {
        // Slide out before navigating
        document.body.style.transform = 'translateX(100%)';

        setTimeout(() => {
          if (onSwipeBack) {
            onSwipeBack();
          } else {
            navigate(-1);
          }

          // Reset after navigation
          setTimeout(() => {
            document.body.style.transform = '';
            document.body.style.transition = '';
          }, 50);
        }, 200);
      } else {
        // Snap back if not enough swipe
        document.body.style.transform = '';
        setTimeout(() => {
          document.body.style.transition = '';
        }, 200);
      }

      touchStartX.current = 0;
      touchStartY.current = 0;
      isSwiping.current = false;
    };

    // Add event listeners
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);

      // Clean up styles
      document.body.style.transform = '';
      document.body.style.transition = '';
    };
  }, [navigate, onSwipeBack]);

  return null; // This is a behavior component, no UI
};

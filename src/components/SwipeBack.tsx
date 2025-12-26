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
    // Get the main app container
    const appContainer = document.getElementById('root');
    if (!appContainer) return;

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

        // Dampen the translation for a more natural feel
        const progress = Math.min(diffX / 300, 1);
        const translateAmount = diffX * (0.3 + progress * 0.2);

        // Slide the page with a subtle shadow
        appContainer.style.transform = `translateX(${translateAmount}px)`;
        appContainer.style.boxShadow = `-8px 0 24px rgba(0, 0, 0, ${0.5 * progress})`;
        appContainer.style.transition = 'none';
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;

      const diffX = touchEndX - touchStartX.current;
      const diffY = touchEndY - touchStartY.current;

      // Smooth spring animation
      appContainer.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94), box-shadow 0.3s ease';

      // Swipe right: diffX > 100 and more horizontal than vertical
      if (diffX > 100 && Math.abs(diffX) > Math.abs(diffY) && isSwiping.current) {
        // Complete the slide out
        appContainer.style.transform = 'translateX(100%)';
        appContainer.style.boxShadow = '-8px 0 24px rgba(0, 0, 0, 0.6)';

        setTimeout(() => {
          if (onSwipeBack) {
            onSwipeBack();
          } else {
            navigate(-1);
          }

          // Reset after navigation
          setTimeout(() => {
            appContainer.style.transform = '';
            appContainer.style.boxShadow = '';
            appContainer.style.transition = '';
          }, 50);
        }, 250);
      } else {
        // Spring back
        appContainer.style.transform = '';
        appContainer.style.boxShadow = '';
        setTimeout(() => {
          appContainer.style.transition = '';
        }, 300);
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
      appContainer.style.transform = '';
      appContainer.style.boxShadow = '';
      appContainer.style.transition = '';
    };
  }, [navigate, onSwipeBack]);

  return null;
};

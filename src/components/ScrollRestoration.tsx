import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const ScrollRestoration = () => {
  const location = useLocation();

  useEffect(() => {
    // Save scroll position and location when visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        sessionStorage.setItem('scrollPosition', window.scrollY.toString());
        sessionStorage.setItem('lastLocation', location.pathname + location.search);
      }
    };

    // Save before page unload
    const handleBeforeUnload = () => {
      sessionStorage.setItem('scrollPosition', window.scrollY.toString());
      sessionStorage.setItem('lastLocation', location.pathname + location.search);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [location]);

  useEffect(() => {
    // Restore scroll position if returning to the same page
    const savedLocation = sessionStorage.getItem('lastLocation');
    const savedScroll = sessionStorage.getItem('scrollPosition');

    if (savedLocation === location.pathname + location.search && savedScroll) {
      // Wait for content to load before scrolling
      const scrollPosition = parseInt(savedScroll, 10);

      // Try multiple times to ensure content is loaded
      const attempts = [0, 100, 300, 500];
      attempts.forEach(delay => {
        setTimeout(() => {
          window.scrollTo(0, scrollPosition);
        }, delay);
      });
    }
  }, [location]);

  return null;
};

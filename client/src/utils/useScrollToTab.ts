import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const useScrollToTab = (ready: boolean): void => {
  const location = useLocation();
  useEffect(() => {
    if (!ready) return;
    const tab = new URLSearchParams(location.search).get('tab');
    if (!tab) return;
    const el = document.getElementById(`tab-${tab}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [ready, location.search]);
};
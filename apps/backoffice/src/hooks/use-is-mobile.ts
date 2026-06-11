import { useEffect, useState } from 'react';

export function useIsMobile(query = '(max-width: 768px)') {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    const listener = () => setIsMobile(media.matches);
    listener();
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [query]);

  return isMobile;
}

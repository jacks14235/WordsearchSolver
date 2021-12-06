import { useState, useEffect } from 'react';


export const useHeight = () => {
  const [h, setH] = useState(window.innerHeight);

  useEffect(() => {
    window.addEventListener('resize', () => setH(window.innerHeight));
    return(() => window.removeEventListener('resize', () => setH(window.innerHeight)));
  }, [])

  return h;
}

export const useWidth = () => {
  const [w, setW] = useState(window.innerWidth);

  useEffect(() => {
    window.addEventListener('resize', () => setW(window.innerWidth));
    return(() => window.removeEventListener('resize', () => setW(window.innerWidth)));
  }, [])

  return w;
}
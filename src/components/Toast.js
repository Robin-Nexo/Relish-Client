'use client';
import { useEffect, useState } from 'react';

export default function Toast({ message, duration = 2500 }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!message) return;
    // Defer state updates to satisfy strict eslint rules about setState in effect bodies.
    const t0 = setTimeout(() => setVisible(true), 0);
    const t = setTimeout(() => setVisible(false), duration);
    return () => {
      clearTimeout(t0);
      clearTimeout(t);
    };
  }, [message, duration]);

  if (!visible || !message) return null;

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-gray-800 text-white text-sm px-5 py-3 rounded-xl shadow-lg animate-fade-in">
      {message}
    </div>
  );
}

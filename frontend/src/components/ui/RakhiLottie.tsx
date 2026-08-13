'use client';

import { useEffect, useState } from 'react';
import Lottie from 'lottie-react';

const RAKHI_LOTTIE_SRC = '/lottie/rakhi-raksha-bandhan.json';
// Matches the source file's own composition size (w/h in the Lottie JSON) —
// used to reserve the right aspect ratio before the animation data has
// loaded, so the layout doesn't jump once it arrives.
const ASPECT_RATIO = '360 / 200';

// Fetched at runtime rather than imported as a module so the ~70KB
// animation JSON is its own request instead of bloating the homepage's
// JS bundle.
export function RakhiLottie({ className = '' }: { className?: string }) {
  const [animationData, setAnimationData] = useState<object | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(RAKHI_LOTTIE_SRC)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setAnimationData(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className={className} style={{ aspectRatio: ASPECT_RATIO }}>
      {animationData && (
        <Lottie animationData={animationData} loop autoplay style={{ width: '100%', height: '100%' }} />
      )}
    </div>
  );
}

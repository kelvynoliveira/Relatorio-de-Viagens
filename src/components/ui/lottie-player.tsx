'use client';

import React, { useEffect, useState } from 'react';
import Lottie from 'lottie-react';

interface LottiePlayerProps {
  animationUrl?: string;
  animationData?: any;
  loop?: boolean;
  autoplay?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Universal Lottie Player that supports both remote URLs and local JSON objects
 */
const LottiePlayer: React.FC<LottiePlayerProps> = ({ 
  animationUrl, 
  animationData: initialData, 
  loop = true, 
  autoplay = true,
  className,
  style
}) => {
  const [data, setData] = useState<any>(initialData);

  useEffect(() => {
    if (animationUrl && !initialData) {
      fetch(animationUrl)
        .then(res => res.json())
        .then(json => setData(json))
        .catch(err => console.error('Error loading lottie:', err));
    }
  }, [animationUrl, initialData]);

  if (!data) return <div className={`${className} animate-pulse bg-white/5 rounded-2xl`} style={style} />;

  return (
    <div className={className} style={style}>
      <Lottie 
        animationData={data} 
        loop={loop} 
        autoplay={autoplay} 
      />
    </div>
  );
};

export default LottiePlayer;

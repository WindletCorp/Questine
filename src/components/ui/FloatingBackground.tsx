import React from 'react';

export const FloatingBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10 flex items-center justify-center">
      {/* Decorative Blob 1 */}
      <div className="absolute top-[10%] left-[10%] opacity-30 animate-[float_6s_ease-in-out_infinite]">
        <svg width="120" height="120" viewBox="0 0 200 200" fill="var(--color-primary)">
          <path d="M45.7,-76.1C58.9,-69.3,69,-55.4,76.6,-40.8C84.3,-26.2,89.5,-11,88.1,3.7C86.7,18.5,78.8,32.7,69.5,45.4C60.2,58.1,49.5,69.2,36,75.9C22.6,82.5,6.4,84.7,-8.4,81.4C-23.3,78.2,-36.8,69.4,-50.2,60.1C-63.5,50.8,-76.6,40.9,-83.4,26.5C-90.2,12,-90.6,-7,-83.7,-22.4C-76.7,-37.8,-62.3,-49.5,-48.1,-56.3C-33.8,-63.1,-19.7,-65, -3.9,-59.4C11.9,-53.8,23.8,-40.7,33.1,-48.1C42.4,-55.5,49.2,-74.6,45.7,-76.1Z" transform="translate(100 100)" />
        </svg>
      </div>

      {/* Decorative Blob 2 */}
      <div className="absolute bottom-[15%] right-[10%] opacity-30 animate-[float_8s_ease-in-out_infinite_reverse]">
        <svg width="150" height="150" viewBox="0 0 200 200" fill="var(--color-accent)">
          <path d="M51.9,-65.4C65.5,-53.6,73.6,-35,76.3,-16.2C79,2.6,76.2,21.6,67.6,38.1C59,54.6,44.7,68.7,28.3,74.9C11.9,81.1,-6.6,79.5,-23.5,72.4C-40.4,65.2,-55.6,52.5,-65.7,36.5C-75.7,20.6,-80.5,1.5,-76.4,-15.5C-72.3,-32.5,-59.2,-47.5,-44.1,-58.8C-29,-70.1,-12,-77.7,3.6,-82.1C19.2,-86.5,38.4,-77.2,51.9,-65.4Z" transform="translate(100 100)" />
        </svg>
      </div>

      {/* Little Star 1 */}
      <div className="absolute top-[30%] right-[25%] opacity-40 animate-[spin_10s_linear_infinite]">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="var(--color-accent)">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
        </svg>
      </div>

      {/* Little Star 2 */}
      <div className="absolute bottom-[35%] left-[20%] opacity-40 animate-[spin_12s_linear_infinite_reverse]">
        <svg width="60" height="60" viewBox="0 0 24 24" fill="var(--color-primary)">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
        </svg>
      </div>
      
      {/* Playful Circle */}
      <div className="absolute top-[60%] right-[35%] opacity-20 animate-[bounce_4s_infinite]">
        <div className="w-16 h-16 rounded-full bg-error" />
      </div>
    </div>
  );
};

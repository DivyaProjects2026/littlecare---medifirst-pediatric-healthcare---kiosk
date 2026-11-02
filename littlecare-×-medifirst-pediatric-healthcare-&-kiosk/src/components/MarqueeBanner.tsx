import React from 'react';

interface MarqueeBannerProps {
  message: string;
}

export const MarqueeBanner: React.FC<MarqueeBannerProps> = ({ message }) => {
  return (
    <div
      id="marqueeBanner"
      className="bg-amber-400 text-slate-900 py-2.5 px-4 overflow-hidden shadow-inner font-bold text-sm marquee-container relative z-40 border-b border-amber-500"
    >
      <div className="marquee-text kids-font">
        {message}
      </div>
    </div>
  );
};

import React from 'react';
import { Meh, Frown, Smile, Skull } from 'lucide-react';

interface FaceIndicatorProps {
  value: number;
}

export const FaceIndicator: React.FC<FaceIndicatorProps> = ({ value }) => {
  const getColor = () => {
    if (value < 40) return 'text-emerald-400';
    if (value < 70) return 'text-yellow-400';
    return 'text-red-500';
  };

  const getIcon = () => {
    if (value < 30) return <Smile size={28} className={getColor()} />;
    if (value < 60) return <Meh size={28} className={getColor()} />;
    if (value < 85) return <Frown size={28} className={getColor()} />;
    return <Skull size={28} className={`${getColor()} animate-pulse`} />;
  };

  return (
    <div className={`p-2 rounded-full bg-slate-800 border border-slate-700 shadow-inner ${value > 90 ? 'animate-bounce' : ''}`}>
      {getIcon()}
    </div>
  );
};

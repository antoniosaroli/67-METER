import React from 'react';

interface MeterBarProps {
  value: number; // 0-100
}

export const MeterBar: React.FC<MeterBarProps> = ({ value }) => {
  const totalSegments = 20;
  
  // Create an array of segments
  const segments = Array.from({ length: totalSegments }, (_, i) => {
    const threshold = (i / totalSegments) * 100;
    const isActive = value > threshold;
    
    // Determine color based on index
    let activeColorClass = 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]'; // Default Green
    
    if (i > 12) activeColorClass = 'bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.8)]';
    if (i > 16) activeColorClass = 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]';

    return (
      <div
        key={i}
        className={`
          flex-1 mx-[1px] rounded-sm transition-all duration-75 h-full
          ${isActive ? activeColorClass : 'bg-slate-800/50 opacity-20'}
        `}
      />
    );
  });

  return (
    <div className="w-full flex flex-row items-end justify-between px-1 h-full">
      {segments}
    </div>
  );
};
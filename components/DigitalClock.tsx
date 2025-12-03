import React from 'react';

interface DigitalClockProps {
  totalMinutes: number;
}

const DigitalClock: React.FC<DigitalClockProps> = ({ totalMinutes }) => {
  // Normalize
  const normalizedMinutes = totalMinutes % 1440; // ensure strict 0-1439
  const hours = Math.floor(normalizedMinutes / 60);
  const minutes = normalizedMinutes % 60;
  
  // Format for 12h display
  const period = hours >= 12 ? 'PM' : 'AM';
  let displayHour = hours % 12;
  if (displayHour === 0) displayHour = 12;

  const displayMinute = minutes.toString().padStart(2, '0');

  return (
    <div className="bg-white/90 backdrop-blur-sm border-4 border-slate-200 rounded-3xl p-6 shadow-xl flex items-center justify-center space-x-4 min-w-[280px]">
      <div className="text-6xl font-black text-slate-800 tracking-wider font-mono">
        {displayHour}:{displayMinute}
      </div>
      <div className="flex flex-col justify-center text-xl font-bold text-slate-500">
        <span className={period === 'AM' ? 'text-orange-500' : 'text-slate-300'}>AM</span>
        <span className={period === 'PM' ? 'text-indigo-500' : 'text-slate-300'}>PM</span>
      </div>
    </div>
  );
};

export default DigitalClock;
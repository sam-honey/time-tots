import React, { useMemo } from 'react';

interface SunMoonBackgroundProps {
  totalMinutes: number; // 0 - 1439
}

const SunMoonBackground: React.FC<SunMoonBackgroundProps> = ({ totalMinutes }) => {
  
  // Calculate sun/moon position
  // Day is roughly 6:00 (360 mins) to 18:00 (1080 mins)
  // 6:00 AM -> Sun rises (0 degrees)
  // 12:00 PM -> Sun zenith (90 degrees)
  // 18:00 PM -> Sun sets (180 degrees)
  
  const getCelestialPosition = (mins: number) => {
    // Normalize so 6am is 0 deg, 6pm is 180 deg
    let degrees = 0;
    let isDay = false;

    if (mins >= 360 && mins < 1080) {
      // Day
      isDay = true;
      degrees = ((mins - 360) / 720) * 180;
    } else {
      // Night
      isDay = false;
      // Map 18:00 (1080) -> 0 deg, 6:00 (360) -> 180 deg
      if (mins >= 1080) {
        degrees = ((mins - 1080) / 720) * 180;
      } else {
         degrees = ((mins + 360) / 720) * 180; // 0:00 is part of the night starting previous day
      }
    }
    return { degrees, isDay };
  };

  const { degrees, isDay } = getCelestialPosition(totalMinutes);
  
  // Background Colors
  const skyColor = useMemo(() => {
    // Simple interpolation based on time
    if (totalMinutes >= 300 && totalMinutes < 480) return "bg-gradient-to-t from-orange-300 to-blue-400"; // Sunrise
    if (totalMinutes >= 480 && totalMinutes < 1020) return "bg-gradient-to-t from-sky-300 to-blue-500"; // Day
    if (totalMinutes >= 1020 && totalMinutes < 1200) return "bg-gradient-to-t from-orange-400 to-purple-800"; // Sunset
    return "bg-gradient-to-t from-slate-900 to-slate-800"; // Night
  }, [totalMinutes]);

  // Calculate position on an arc
  // Center of screen bottom is pivot. Radius is roughly 80% of width.
  // Using simple CSS transforms for rotation relative to bottom center
  
  return (
    <div className={`absolute inset-0 -z-10 w-full h-full overflow-hidden transition-colors duration-1000 ${skyColor}`}>
        
      {/* Stars (Only visible at night) */}
      {!isDay && (
        <div className="absolute inset-0 opacity-80">
          {[...Array(20)].map((_, i) => (
             <div 
               key={i}
               className="absolute bg-white rounded-full animate-pulse"
               style={{
                 top: `${Math.random() * 50}%`,
                 left: `${Math.random() * 100}%`,
                 width: `${Math.random() * 3 + 1}px`,
                 height: `${Math.random() * 3 + 1}px`,
                 animationDelay: `${Math.random() * 2}s`
               }}
             />
          ))}
        </div>
      )}

      {/* Clouds (Decoration) */}
      <div className="absolute top-20 left-10 opacity-60 text-white/50">
         <svg width="100" height="60" viewBox="0 0 100 60" fill="currentColor">
             <path d="M10,40 Q20,20 40,30 T80,30 T90,50 H10 Z" />
         </svg>
      </div>
       <div className="absolute top-40 right-20 opacity-40 text-white/40">
         <svg width="120" height="70" viewBox="0 0 120 70" fill="currentColor">
             <path d="M10,50 Q30,20 60,30 T100,30 T110,60 H10 Z" />
         </svg>
      </div>

      {/* Celestial Body Container (Rotates around bottom center) */}
      <div 
        className="absolute bottom-[-20%] left-1/2 w-[120vw] h-[120vw] -translate-x-1/2 transition-transform duration-75 pointer-events-none"
        style={{ transform: `translateX(-50%) rotate(${degrees - 90}deg)` }}
      >
          {/* The Object (Sun or Moon) attached to the top of this big rotating circle */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
             {isDay ? (
                 <div className="relative">
                    <div className="w-24 h-24 bg-yellow-400 rounded-full shadow-[0_0_40px_rgba(250,204,21,0.6)]"></div>
                    {/* Sun rays */}
                    <div className="absolute inset-0 border-4 border-dashed border-yellow-200/50 rounded-full w-32 h-32 -top-4 -left-4 animate-spin-slow"></div>
                 </div>
             ) : (
                 <div className="w-20 h-20 bg-slate-200 rounded-full shadow-[0_0_30px_rgba(255,255,255,0.4)] relative overflow-hidden">
                    <div className="absolute w-6 h-6 bg-slate-300 rounded-full top-3 left-4 opacity-50"></div>
                    <div className="absolute w-4 h-4 bg-slate-300 rounded-full bottom-4 right-5 opacity-50"></div>
                 </div>
             )}
          </div>
      </div>

      {/* Rolling Hills Landscape */}
      <div className="absolute bottom-0 left-0 w-full h-[25vh]">
         {/* Back Hill */}
         <div className={`absolute bottom-0 left-[-10%] w-[120%] h-[80%] rounded-t-[100%] transition-colors duration-1000 ${isDay ? 'bg-green-600' : 'bg-slate-700'}`}></div>
         {/* Front Hill */}
         <div className={`absolute bottom-[-10%] right-[-10%] w-[120%] h-[70%] rounded-t-[100%] transition-colors duration-1000 ${isDay ? 'bg-green-500' : 'bg-slate-800'}`}></div>
         
         {/* House / Trees can be added here for flavor */}
      </div>

    </div>
  );
};

export default SunMoonBackground;
import React, { useRef, useState, useEffect } from 'react';
import { DragState } from '../types';

interface AnalogClockProps {
  totalMinutes: number;
  onTimeChange: (newTotalMinutes: number) => void;
}

const AnalogClock: React.FC<AnalogClockProps> = ({ totalMinutes, onTimeChange }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragState, setDragState] = useState<DragState>({ isDragging: false, handType: null });

  // Geometry Constants
  const CX = 200;
  const CY = 200;
  const RADIUS = 180;
  const HOUR_HAND_LENGTH = 70;
  const MINUTE_HAND_LENGTH = 140; // Overly long to reach outer ring
  const INNER_RADIUS = 120; // Radius where hour numbers sit
  const OUTER_RADIUS = 160; // Radius where minute numbers sit

  // Calculate Angles
  // Total Minutes -> Hours (0-11.99) -> Degrees
  // Total Minutes -> Minutes (0-59.99) -> Degrees
  
  // Normalize totalMinutes to 12-hour cycle for display (0 - 719)
  const cycleMinutes = totalMinutes % 720;
  const hourAngle = (cycleMinutes / 720) * 360;
  const minuteAngle = (cycleMinutes % 60) / 60 * 360;

  const getPointerAngle = (event: React.PointerEvent) => {
    if (!svgRef.current) return 0;
    const CTM = svgRef.current.getScreenCTM();
    if (!CTM) return 0;

    const x = (event.clientX - CTM.e) / CTM.a;
    const y = (event.clientY - CTM.f) / CTM.d;

    // Calculate angle in degrees from 12 o'clock position
    // atan2 returns angle from X axis (3 o'clock). 
    // We want 12 o'clock to be 0.
    // dx = x - CX, dy = y - CY
    // theta = atan2(dy, dx) + 90deg
    
    let theta = Math.atan2(y - CY, x - CX) * (180 / Math.PI);
    theta += 90; 
    if (theta < 0) theta += 360;
    return theta;
  };

  const handlePointerDown = (event: React.PointerEvent, handType: 'hour' | 'minute') => {
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragState({ isDragging: true, handType });
    event.stopPropagation();
  };

  const handlePointerMove = (event: React.PointerEvent) => {
    if (!dragState.isDragging || !dragState.handType) return;

    const angle = getPointerAngle(event);
    
    if (dragState.handType === 'minute') {
        // Snap to closest minute for cleaner feel, or float?
        // Let's do partial float for smooth drag but round for value.
        // 360 degrees = 60 minutes
        let mins = Math.round(angle / 6);
        if (mins === 60) mins = 0;
        
        // Determine offset from current hour
        const currentHour = Math.floor(totalMinutes / 60);
        
        // We need to handle wrapping intelligently. 
        // If we dragged from 59 to 0, increment hour.
        // Simplified: Just calculate new time based on hour + new minute
        
        // Better Interaction: Dragging minute hand changes time naturally
        // If the angle crosses the 12 o'clock boundary, we need to handle hour increment/decrement
        // But for a simple kid's clock, let's just derive minutes from angle 
        // and keep the hour static UNLESS we implement full rotational winding logic.
        
        // Implementation for "Gearing":
        // This is complex for a stateless drag. 
        // EASIER APPROACH: Update only the minute component of the current time.
        // But the prompt says "Moving one arm moves the other respectively".
        // This usually implies full winding. 
        
        // Let's try "Absolute" mapping for this frame.
        // Current Hour Component:
        const currentTotalHours = Math.floor(totalMinutes / 60);
        let newTotalMinutes = (currentTotalHours * 60) + mins;
        
        // Heuristic to handle wrapping roughly:
        // If we jumped from 55 to 5, we likely crossed forward.
        // If we jumped from 5 to 55, we likely crossed backward.
        const oldMins = totalMinutes % 60;
        if (oldMins > 45 && mins < 15) {
             newTotalMinutes += 60; // Crossed forward
        } else if (oldMins < 15 && mins > 45) {
             newTotalMinutes -= 60; // Crossed backward
        }
        
        // Normalize 24h
        if (newTotalMinutes < 0) newTotalMinutes += 1440;
        if (newTotalMinutes >= 1440) newTotalMinutes -= 1440;
        
        onTimeChange(newTotalMinutes);

    } else if (dragState.handType === 'hour') {
        // 360 degrees = 12 hours = 720 minutes
        // 1 degree = 2 minutes
        const minutesFrom12 = angle * 2;
        
        // We need to decide AM or PM. Let's stick to the current AM/PM half 
        // unless we wind all the way around, but for absolute hour dragging:
        // Just map to the nearest 12-hour value within the current 12-hour block.
        
        const isPm = totalMinutes >= 720;
        let newTotalMinutes = Math.round(minutesFrom12);
        
        if (isPm) newTotalMinutes += 720;
        
        // Wrap fix
        if (newTotalMinutes >= 1440) newTotalMinutes -= 1440;
        
        onTimeChange(newTotalMinutes);
    }
  };

  const handlePointerUp = (event: React.PointerEvent) => {
    setDragState({ isDragging: false, handType: null });
  };

  // --- Rendering Helpers ---

  // Hour Numbers (1-12)
  const renderHourNumbers = () => {
    return Array.from({ length: 12 }, (_, i) => {
      const num = i + 1;
      const angle = num * 30; // 30 degrees per hour
      const rad = (angle - 90) * (Math.PI / 180);
      const x = CX + INNER_RADIUS * Math.cos(rad);
      const y = CY + INNER_RADIUS * Math.sin(rad);
      return (
        <text
          key={`h-${num}`}
          x={x}
          y={y}
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-slate-700 font-bold text-2xl select-none pointer-events-none"
          style={{ fontFamily: 'Fredoka, sans-serif' }}
        >
          {num}
        </text>
      );
    });
  };

  // Minute Numbers (5, 10, 15...) on outer ring
  const renderMinuteNumbers = () => {
    const currentMinute = totalMinutes % 60;
    
    return Array.from({ length: 60 }, (_, i) => {
      // Only draw numbers for multiples of 5, ticks for others
      const isMain = i % 5 === 0;
      const angle = i * 6;
      const rad = (angle - 90) * (Math.PI / 180);
      const x = CX + OUTER_RADIUS * Math.cos(rad);
      const y = CY + OUTER_RADIUS * Math.sin(rad);

      // Emphasis Logic: "number will increase slightly to emphasis the correct number"
      // If the minute hand points exactly here (or very close)
      const isCurrent = currentMinute === i;
      const scale = isCurrent ? 1.5 : 1;
      const color = isCurrent ? '#f43f5e' : (isMain ? '#64748b' : '#cbd5e1');
      const weight = isCurrent ? 'bold' : 'normal';

      if (isMain || isCurrent) {
        // Show number (0 should be 60 usually, or 00. Let's use 60 for top, or 00? Standard is 60 or 12, but for minutes usually 05, 10... 60/00)
        // Let's use 5, 10... 55, 60
        const displayNum = i === 0 ? 60 : i;
        
        return (
          <text
            key={`m-${i}`}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={color}
            fontWeight={weight}
            className="select-none pointer-events-none transition-all duration-200 ease-out"
            style={{ 
                fontFamily: 'Fredoka, sans-serif', 
                fontSize: isMain ? '16px' : '12px',
                transformBox: 'fill-box',
                transformOrigin: 'center',
                transform: `scale(${scale})`
            }}
          >
            {displayNum}
          </text>
        );
      } else {
        // Small tick for minutes in between
        return (
             <circle 
                key={`dot-${i}`} 
                cx={x} 
                cy={y} 
                r={1.5} 
                fill={color} 
             />
        );
      }
    });
  };

  return (
    <div className="relative touch-none">
      <svg
        ref={svgRef}
        width="400"
        height="400"
        viewBox="0 0 400 400"
        className="mx-auto drop-shadow-2xl"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {/* Clock Face Background */}
        <circle cx={CX} cy={CY} r={RADIUS + 20} fill="#f8fafc" stroke="#e2e8f0" strokeWidth="8" />
        <circle cx={CX} cy={CY} r={RADIUS} fill="white" />
        
        {/* Decorative Inner Ring */}
        <circle cx={CX} cy={CY} r={INNER_RADIUS + 25} fill="none" stroke="#f1f5f9" strokeWidth="2" strokeDasharray="5,5" />

        {/* Numbers */}
        {renderHourNumbers()}
        {renderMinuteNumbers()}

        {/* Hands Group - Rotated by angle */}
        
        {/* Hour Hand */}
        <g transform={`rotate(${hourAngle}, ${CX}, ${CY})`}>
             {/* Shadow */}
            <rect x={CX - 6} y={CY - HOUR_HAND_LENGTH} width="12" height={HOUR_HAND_LENGTH} rx="6" fill="rgba(0,0,0,0.2)" transform="translate(4, 4)" />
            {/* Hand */}
            <rect
                x={CX - 6}
                y={CY - HOUR_HAND_LENGTH}
                width="12"
                height={HOUR_HAND_LENGTH}
                rx="6"
                fill="#3b82f6"
                className="cursor-pointer hover:brightness-110"
                onPointerDown={(e) => handlePointerDown(e, 'hour')}
            />
        </g>

        {/* Minute Hand - "Overly long to extend out to these minute numbers" */}
        <g transform={`rotate(${minuteAngle}, ${CX}, ${CY})`}>
            {/* Shadow */}
            <rect x={CX - 4} y={CY - MINUTE_HAND_LENGTH} width="8" height={MINUTE_HAND_LENGTH + 20} rx="4" fill="rgba(0,0,0,0.2)" transform="translate(4, 4)" />
            
            {/* Hand Body */}
            <rect
                x={CX - 4}
                y={CY - MINUTE_HAND_LENGTH} // Start from outer ring
                width="8"
                height={MINUTE_HAND_LENGTH} // Length to center
                rx="4"
                fill="#ef4444"
                className="cursor-pointer hover:brightness-110"
                onPointerDown={(e) => handlePointerDown(e, 'minute')}
            />
            {/* The "Pointer" part extending slightly past center for visual balance */}
            <rect x={CX - 4} y={CY} width="8" height="20" rx="4" fill="#ef4444" />
            
            {/* Tip emphasis */}
            <circle cx={CX} cy={CY - MINUTE_HAND_LENGTH + 5} r="6" fill="#fca5a5" />
        </g>

        {/* Center Pin */}
        <circle cx={CX} cy={CY} r="10" fill="#1e293b" stroke="white" strokeWidth="2" />
        <circle cx={CX} cy={CY} r="4" fill="#64748b" />

      </svg>
    </div>
  );
};

export default AnalogClock;
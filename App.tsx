import React, { useState, useEffect, useRef } from 'react';
import { Volume2, Power, Smartphone } from 'lucide-react';
import { GeigerAudio } from './components/GeigerAudio';
import { MeterBar } from './components/MeterBar';
import { FaceIndicator } from './components/FaceIndicator';

export default function App() {
  const [level, setLevel] = useState<number>(0);
  const [isOn, setIsOn] = useState<boolean>(false);
  const [useGyro, setUseGyro] = useState<boolean>(false);
  const [sensorStatus, setSensorStatus] = useState<string>('');
  
  // Use a ref to track value for smooth animation/filtering without dependency loops
  const levelRef = useRef<number>(0);

  const handleTogglePower = () => {
    setIsOn(!isOn);
    if (!isOn) {
      setLevel(10); // Start at a low rumble
      levelRef.current = 10;
    } else {
      setLevel(0);
      levelRef.current = 0;
      setUseGyro(false); // Reset gyro when turning off
      setSensorStatus('');
    }
  };

  const toggleGyro = async () => {
    // If already on, turn off.
    if (useGyro) {
      setUseGyro(false);
      setSensorStatus('');
      return;
    }

    // iOS 13+ requires permission for motion sensors
    if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
      try {
        const permissionState = await (DeviceMotionEvent as any).requestPermission();
        if (permissionState === 'granted') {
          setUseGyro(true);
          setSensorStatus('ACTIVE');
        } else {
          alert('Motion sensor permission denied. You may need to reset site permissions.');
        }
      } catch (error) {
        console.error(error);
        // Fallback for non-secure contexts or dev environments
        setUseGyro(true);
        setSensorStatus('ACTIVE');
      }
    } else {
      // Non-iOS devices usually work instantly
      setUseGyro(true);
      setSensorStatus('ACTIVE');
    }
  };

  useEffect(() => {
    const handleMotion = (event: DeviceMotionEvent) => {
      if (!useGyro || !isOn) return;
      
      const acc = event.accelerationIncludingGravity;
      if (!acc) return;
      
      const { x, y, z } = acc;
      
      if (x === null || y === null || z === null) return;

      const totalAccel = Math.sqrt(x*x + y*y + z*z);
      if (totalAccel < 1) return;

      const yRatio = y / totalAccel;
      const uprightFactor = Math.abs(yRatio); 
      const tiltFactor = 1.0 - uprightFactor; 
      
      const MAX_TILT_THRESHOLD = 0.85; 
      
      let targetLevel = (tiltFactor / MAX_TILT_THRESHOLD) * 100;
      targetLevel = Math.max(0, Math.min(100, targetLevel));

      const smoothingFactor = 0.08; 
      const current = levelRef.current;
      const next = current + (targetLevel - current) * smoothingFactor;

      levelRef.current = next;
      
      if (Math.abs(next - level) > 0.1) {
         setLevel(parseFloat(next.toFixed(1)));
      }
    };

    if (useGyro && isOn) {
      window.addEventListener('devicemotion', handleMotion);
    }

    return () => {
      window.removeEventListener('devicemotion', handleMotion);
    };
  }, [useGyro, isOn, level]);

  useEffect(() => {
    if (!useGyro) {
      levelRef.current = level;
    }
  }, [level, useGyro]);

  const VERSION_TEXT = "67-v4.3.0 67s 67 MAX";
  const HEADER_TITLE = "SIX-SEVEN-METER";
  const SCALE_LABEL = "SIX-SEVEN SCALE";

  return (
    <div className="w-full h-[100dvh] bg-slate-950 flex flex-col items-center justify-center sm:p-4 selection:bg-cyan-500 selection:text-white overflow-hidden touch-none">
      
      <GeigerAudio intensity={level} isEnabled={isOn} />

      {/* Main Device Container */}
      <div className={`
        relative w-full h-full sm:h-auto sm:max-h-[95vh] sm:max-w-md 
        bg-slate-900 sm:rounded-3xl 
        border-0 sm:border-[6px] transition-colors duration-500 shadow-2xl
        flex flex-col
        ${isOn ? 'border-slate-700 shadow-cyan-900/20' : 'border-slate-800'}
      `}>
        
        {/* Screw Decorations (Desktop only) */}
        <div className="hidden sm:block absolute top-3 left-3 w-2 h-2 rounded-full bg-slate-600/50" />
        <div className="hidden sm:block absolute top-3 right-3 w-2 h-2 rounded-full bg-slate-600/50" />
        <div className="hidden sm:block absolute bottom-3 left-3 w-2 h-2 rounded-full bg-slate-600/50" />
        <div className="hidden sm:block absolute bottom-3 right-3 w-2 h-2 rounded-full bg-slate-600/50" />

        {/* Inner Content Wrapper */}
        <div className="flex flex-col w-full h-full p-2 md:p-6 gap-2 justify-between">
            
            {/* Header Block */}
            <div className="flex flex-col items-center w-full shrink-0 pt-1">
                <div className="flex items-center justify-center gap-2 md:gap-3 relative mb-1">
                    {/* 6 Block */}
                    <div className={`
                        w-16 h-20 md:w-20 md:h-24 rounded-lg md:rounded-xl flex items-center justify-center text-5xl md:text-6xl font-black font-mono 
                        border-[3px] transition-all duration-300 transform shadow-xl
                        ${isOn 
                            ? 'bg-gradient-to-br from-cyan-400 to-cyan-600 border-cyan-300 text-white shadow-[0_0_35px_rgba(6,182,212,0.6)] scale-100' 
                            : 'bg-slate-800 border-slate-700 text-slate-600 scale-95'}
                    `}>
                        6
                    </div>
                    
                    {/* 7 Block */}
                    <div className={`
                        w-16 h-20 md:w-20 md:h-24 rounded-lg md:rounded-xl flex items-center justify-center text-5xl md:text-6xl font-black font-mono 
                        border-[3px] transition-all duration-300 transform shadow-xl
                        ${isOn 
                            ? 'bg-gradient-to-br from-teal-400 to-teal-600 border-teal-300 text-white shadow-[0_0_35px_rgba(20,184,166,0.6)] scale-100' 
                            : 'bg-slate-800 border-slate-700 text-slate-600 scale-95'}
                    `}>
                        7
                    </div>

                    {isOn && (
                        <div className="absolute inset-0 bg-cyan-500/30 blur-3xl -z-10 rounded-full animate-pulse"></div>
                    )}
                </div>
                
                <h1 className={`
                    text-lg md:text-2xl font-black tracking-[0.2em] md:tracking-[0.3em] font-mono-tech uppercase drop-shadow-md text-center transition-colors duration-300
                    ${isOn ? 'text-slate-100' : 'text-slate-700'}
                `}>
                    {HEADER_TITLE}
                </h1>
            </div>

            {/* Version Bar */}
            <div className="bg-slate-800 rounded px-3 py-1 border border-slate-700 flex justify-between items-center text-slate-400 text-[10px] md:text-xs font-mono tracking-widest uppercase shrink-0">
               <span>{VERSION_TEXT}</span>
               <span>@antoh_sar on YouTube</span>
            </div>

            {/* Display Screen (The main glossy area) */}
            {/* flex-1 and min-h-0 allows this to shrink if space is tight */}
            <div className={`
                relative flex-1 min-h-0
                rounded-xl md:rounded-2xl p-3 md:p-5 border-2 overflow-hidden transition-all duration-300 flex flex-col justify-between
                ${isOn ? 'bg-black border-slate-600 shadow-[inset_0_0_20px_rgba(0,0,0,1)]' : 'bg-slate-900 border-slate-800'}
            `}>
                
                {/* Glare */}
                <div className="absolute top-0 right-0 w-full h-1/2 bg-gradient-to-b from-white/5 to-transparent pointer-events-none rounded-t-xl" />

                {/* Top Row: Labels + Face */}
                <div className="flex justify-between items-start relative z-10 shrink-0">
                    <div>
                        <h2 className={`font-bold text-xs md:text-sm tracking-widest uppercase mb-1 ${isOn ? 'text-slate-200' : 'text-slate-600'}`}>
                            {SCALE_LABEL}
                        </h2>
                        <div className="flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${isOn ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]' : 'bg-slate-700'}`} />
                            <span className={`text-[9px] md:text-[10px] font-mono tracking-wider ${isOn ? 'text-emerald-500' : 'text-slate-700'}`}>
                            {useGyro ? `SENSOR ACTIVE` : 'MANUAL MODE'}
                            </span>
                        </div>
                    </div>
                    
                    <div className={`transition-opacity duration-300 ${isOn ? 'opacity-100' : 'opacity-20'}`}>
                        <FaceIndicator value={level} />
                    </div>
                </div>

                {/* Meter Bars: Flex grow to fill space */}
                <div className="relative flex-1 min-h-[40px] flex items-end my-2">
                    {isOn && <MeterBar value={level} />}
                    {!isOn && (
                        <div className="w-full h-full flex items-center justify-center text-slate-700 font-mono text-sm uppercase tracking-widest animate-pulse">
                            System Offline
                        </div>
                    )}
                </div>

                {/* Min/Max Labels */}
                <div className="flex justify-between text-[10px] font-mono font-bold text-slate-500 uppercase shrink-0">
                    <span>Min</span>
                    <span>Max</span>
                </div>

                {/* Scan Line */}
                {isOn && (
                    <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] opacity-20" />
                )}
            </div>

            {/* Bottom Status Level */}
            <div className="flex justify-between items-center bg-slate-800/50 rounded-lg p-3 border border-slate-700 shrink-0">
                <div>
                    <span className="text-slate-400 text-[10px] md:text-xs font-bold uppercase block mb-1">SIX-SEVEN LEVEL</span>
                    <span className={`font-mono text-lg font-bold ${isOn ? 'text-cyan-400' : 'text-slate-600'}`}>
                        {isOn ? `${level.toFixed(1)}%` : '--'}
                    </span>
                </div>
                <div className="flex gap-1">
                    <div className={`w-3 h-3 rounded-full ${level > 80 && isOn ? 'bg-red-500 animate-ping' : 'bg-slate-700'}`} />
                    <div className={`w-3 h-3 rounded-full ${isOn ? 'bg-emerald-500' : 'bg-slate-700'}`} />
                </div>
            </div>

            {/* Controls Section */}
            <div className="shrink-0 pb-safe-bottom">
                {!isOn ? (
                    <button 
                        onClick={handleTogglePower}
                        className="w-full py-4 rounded-xl bg-slate-800 hover:bg-slate-700 border-2 border-slate-600 hover:border-cyan-500 text-cyan-500 font-bold uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2 group cursor-pointer active:scale-95"
                    >
                        <Power className="group-hover:text-cyan-400" /> Initialize System
                    </button>
                ) : (
                    <div className="flex flex-col gap-2">
                        <div className="space-y-1">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2 text-xs text-slate-400 font-mono uppercase">
                                    <span>Rate Control</span>
                                    {useGyro && <span className="text-emerald-500 animate-pulse">[AUTO]</span>}
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={toggleGyro}
                                        className={`p-1.5 px-3 rounded-md transition-all flex items-center gap-1.5 active:scale-95 ${useGyro ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 shadow-[0_0_10px_rgba(34,211,238,0.2)]' : 'bg-slate-800 text-slate-500 border border-slate-700 hover:text-slate-300'}`}
                                        title="Enable Gravity Sensor (Resets Zero Point)"
                                    >
                                        <Smartphone size={14} />
                                        <span className="text-[10px] font-bold">SENSOR</span>
                                    </button>
                                    <div className="p-1.5 rounded-md bg-slate-800 border border-slate-700">
                                        <Volume2 size={14} className={level > 0 ? "text-cyan-400" : "text-slate-600"} />
                                    </div>
                                </div>
                            </div>
                            
                            <input 
                                type="range" 
                                min="0" 
                                max="100" 
                                step="0.5"
                                disabled={useGyro}
                                value={level}
                                onChange={(e) => setLevel(parseFloat(e.target.value))}
                                className={`w-full h-8 bg-transparent appearance-none focus:outline-none ${useGyro ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                            />
                            
                            <div className="flex justify-between text-[10px] text-slate-600 font-mono pt-1">
                                <span>SAFE</span>
                                <span>CAUTION</span>
                                <span>DANGER</span>
                            </div>
                        </div>

                        <div className="pt-2 border-t border-slate-800/50">
                            <button 
                                onClick={handleTogglePower}
                                className="w-full py-2 rounded-lg bg-slate-800/50 hover:bg-red-950/30 border border-slate-700 hover:border-red-500/30 text-slate-500 hover:text-red-400 font-mono text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 group cursor-pointer active:scale-95"
                            >
                                <Power size={14} className="group-hover:text-red-400 transition-colors" /> De-initialize
                            </button>
                        </div>
                        
                        {useGyro && (
                            <div className="text-center text-[9px] text-slate-500 font-mono mt-1 animate-pulse">
                                TILT DEVICE FORWARD TO SCAN
                            </div>
                        )}
                    </div>
                )}
            </div>

        </div>

      </div>
    </div>
  );
}
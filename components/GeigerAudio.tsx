import React, { useEffect, useRef } from 'react';

interface GeigerAudioProps {
  intensity: number; // 0 to 100
  isEnabled: boolean;
}

export const GeigerAudio: React.FC<GeigerAudioProps> = ({ intensity, isEnabled }) => {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const nextClickTimeRef = useRef<number>(0);
  const isRunningRef = useRef<boolean>(false);
  const intensityRef = useRef<number>(intensity);
  
  // Buffers
  const lowClickBufferRef = useRef<AudioBuffer | null>(null);
  const highClickBufferRef = useRef<AudioBuffer | null>(null);
  
  // Nodes
  const masterGainRef = useRef<GainNode | null>(null);
  const beepGainRef = useRef<GainNode | null>(null);

  // Keep ref in sync
  useEffect(() => {
    intensityRef.current = intensity;
    
    // Dynamically adjust the "Beep" layer volume based on intensity
    // As radiation gets higher, the "beepy" undertones become more prominent
    if (audioCtxRef.current && beepGainRef.current) {
        const ctx = audioCtxRef.current;
        // Curve: Low visibility at bottom, ramps up quickly past 50%
        // Normalized 0-1
        const normalized = Math.max(0, Math.min(1, intensity / 100));
        const beepVolume = Math.pow(normalized, 1.5) * 0.4; // Max volume 0.4
        
        beepGainRef.current.gain.setTargetAtTime(beepVolume, ctx.currentTime, 0.1);
    }
  }, [intensity]);

  useEffect(() => {
    if (isEnabled && !audioCtxRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        try {
            const ctx = new AudioContext();
            audioCtxRef.current = ctx;

            // --- 1. Master Gain ---
            const masterGain = ctx.createGain();
            masterGain.gain.value = 0.8;
            masterGain.connect(ctx.destination);
            masterGainRef.current = masterGain;

            // --- 2. Beep Layer Gain (Dynamic) ---
            // This controls the volume of the high pitched undertones
            const beepGain = ctx.createGain();
            beepGain.gain.value = 0; // Starts silent
            beepGain.connect(masterGain);
            beepGainRef.current = beepGain;

            // --- 3. Sound Generation ---
            
            // A. THE LOW KNOCK (Recreating the "Change 2" sound)
            // Method: White Noise -> Bandpass Filter (800Hz) -> Envelope
            // We use OfflineAudioContext to pre-render this for performance.
            try {
                const renderCtx = new OfflineAudioContext(1, 44100 * 0.02, 44100);
                
                // Generate White Noise
                const noiseBuffer = renderCtx.createBuffer(1, renderCtx.length, 44100);
                const noiseData = noiseBuffer.getChannelData(0);
                for (let i = 0; i < noiseData.length; i++) {
                    noiseData[i] = (Math.random() - 0.5) * 2;
                }
                
                // Filter Setup: 800Hz, Q=1.0 (The specific request)
                const source = renderCtx.createBufferSource();
                source.buffer = noiseBuffer;
                const filter = renderCtx.createBiquadFilter();
                filter.type = 'bandpass';
                filter.frequency.value = 800; 
                filter.Q.value = 1.0;
                
                source.connect(filter);
                filter.connect(renderCtx.destination);
                source.start();
                
                renderCtx.startRendering().then((renderedBuffer) => {
                    // Apply Manual Envelope (Decay ~5ms)
                    const data = renderedBuffer.getChannelData(0);
                    for(let i=0; i<data.length; i++) {
                        const t = i / 44100;
                        // Exponential decay matching the "5ms" feel
                        const envelope = Math.exp(-t * 600); 
                        data[i] *= envelope * 2.5; // Boost gain slightly
                    }
                    lowClickBufferRef.current = renderedBuffer;
                });
            } catch (e) {
                console.error("OfflineAudioContext not supported or failed", e);
            }

            // B. THE HIGH BEEP (The "Undertone")
            // Method: Sine Wave (3500Hz) -> Fast Decay
            const beepLen = Math.floor(44100 * 0.01); // 10ms
            const beepBuffer = ctx.createBuffer(1, beepLen, 44100);
            const beepData = beepBuffer.getChannelData(0);
            for(let i=0; i<beepLen; i++) {
                const t = i / 44100;
                // 3500Hz sine wave with sharp decay
                beepData[i] = Math.sin(2 * Math.PI * 3500 * t) * Math.exp(-t * 1200);
            }
            highClickBufferRef.current = beepBuffer;
        } catch (e) {
            console.error("Audio initialization failed", e);
        }
      }
    }

    if (isEnabled && audioCtxRef.current?.state === 'suspended') {
      audioCtxRef.current.resume().catch(e => console.log("Resume failed", e));
    }

    isRunningRef.current = isEnabled;
    if (isEnabled) {
      if (audioCtxRef.current) {
         nextClickTimeRef.current = Math.max(nextClickTimeRef.current, audioCtxRef.current.currentTime);
      }
      scheduleClicks();
    }
    
    return () => {
      isRunningRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEnabled]);

  const playClick = (time: number) => {
    if (!audioCtxRef.current || !masterGainRef.current || !beepGainRef.current) return;
    const ctx = audioCtxRef.current;

    // 1. Play Low Knock (Always active)
    if (lowClickBufferRef.current) {
        const sourceLow = ctx.createBufferSource();
        sourceLow.buffer = lowClickBufferRef.current;
        // Micro-variation for organic feel
        sourceLow.detune.value = (Math.random() - 0.5) * 200; 
        sourceLow.connect(masterGainRef.current);
        sourceLow.start(time);
    }

    // 2. Play High Beep (Volume controlled by beepGainRef)
    if (highClickBufferRef.current) {
        const sourceHigh = ctx.createBufferSource();
        sourceHigh.buffer = highClickBufferRef.current;
        // Less variation on the beep to keep it cutting through
        sourceHigh.detune.value = (Math.random() - 0.5) * 50;
        sourceHigh.connect(beepGainRef.current);
        sourceHigh.start(time);
    }
  };

  const scheduleClicks = () => {
    if (!isRunningRef.current || !audioCtxRef.current) return;

    const ctx = audioCtxRef.current;
    const currentTime = ctx.currentTime;
    
    while (nextClickTimeRef.current < currentTime + 0.1) {
      if (nextClickTimeRef.current < currentTime) {
        nextClickTimeRef.current = currentTime;
      }
      
      playClick(nextClickTimeRef.current);

      const val = intensityRef.current;
      
      let rate;
      if (val <= 0) {
        rate = 0.5; 
      } else {
        rate = 0.5 + Math.pow(val, 2.6) / 300;
      }
      
      const avgInterval = 1 / rate;
      const poissonRandom = -Math.log(Math.random()); 
      const interval = avgInterval * poissonRandom;
      
      nextClickTimeRef.current += interval;
    }

    const timerId = window.setTimeout(scheduleClicks, 25);
    return () => clearTimeout(timerId);
  };

  return null;
};
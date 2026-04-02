'use client';

import React, { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

export const ProgressBar = () => {
  const { roomState } = useStore();
  
  const currentSong = roomState?.currentSong;
  const startTs = roomState?.currentSongStartTimestamp;

  const barRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let animationFrameId: number;

    if (!currentSong || !startTs) {
      if (barRef.current) barRef.current.style.width = '0%';
      if (timeRef.current) timeRef.current.textContent = '0:00';
      return;
    }

    const duration = currentSong.duration || 0;

    const updateProgress = () => {
      const now = Date.now();
      const elapsed = Math.max(0, (now - startTs) / 1000);
      
      if (barRef.current && duration > 0) {
        const percent = Math.min(100, (elapsed / duration) * 100);
        barRef.current.style.width = `${percent}%`;
      }
      
      if (timeRef.current) {
        timeRef.current.textContent = formatTime(elapsed);
      }

      if (elapsed <= duration) {
        animationFrameId = requestAnimationFrame(updateProgress);
      }
    };

    animationFrameId = requestAnimationFrame(updateProgress);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [currentSong, startTs]);

  if (!currentSong) return null;

  const duration = currentSong.duration || 0;

  return (
    <div className="w-full flex items-center gap-3 mt-4">
      <span ref={timeRef} className="text-xs text-gray-400 font-mono w-10 text-right">
        0:00
      </span>
      
      <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
        <div 
          ref={barRef}
          className="h-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)] transition-none" 
          style={{ width: '0%' }}
        />
      </div>
      
      <span className="text-xs text-gray-400 font-mono w-10">
        {duration > 0 ? formatTime(duration) : '--:--'}
      </span>
    </div>
  );
};
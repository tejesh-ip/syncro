'use client';

import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

export const ProgressBar = () => {
  const { roomState } = useStore();
  const [elapsed, setElapsed] = useState(0);

  const currentSong = roomState?.currentSong;
  const startTs = roomState?.currentSongStartTimestamp;

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (!currentSong || !startTs) {
      if (elapsed !== 0) setElapsed(0);
    } else {
      interval = setInterval(() => {
        const now = Date.now();
        setElapsed(Math.max(0, (now - startTs) / 1000));
      }, 100);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentSong, startTs, elapsed]);

  if (!currentSong) return null;

  const duration = currentSong.duration || 0;
  const progressPercent = duration > 0 ? Math.min(100, (elapsed / duration) * 100) : 0;

  return (
    <div className="w-full flex items-center gap-3 mt-4">
      <span className="text-xs text-gray-400 font-mono w-10 text-right">{formatTime(elapsed)}</span>
      
      <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
        <div 
          className="h-full bg-cyan-400 transition-all duration-100 ease-linear shadow-[0_0_10px_rgba(34,211,238,0.5)]" 
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      
      <span className="text-xs text-gray-400 font-mono w-10">
        {duration > 0 ? formatTime(duration) : '--:--'}
      </span>
    </div>
  );
};
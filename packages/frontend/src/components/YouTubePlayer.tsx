'use client';

import React, { useEffect, useMemo } from 'react';
import { useStore } from '../store/useStore';

export const YouTubePlayer = () => {
  const { roomState, emitSongEnded } = useStore();

  const currentSong = roomState?.currentSong;
  const currentSongStartTimestamp = roomState?.currentSongStartTimestamp;
  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  const embedSrc = useMemo(() => {
    if (!currentSong) return '';

    return `https://www.youtube.com/embed/${encodeURIComponent(currentSong.videoId)}?${new URLSearchParams({
      autoplay: '1',
      enablejsapi: '1',
      origin,
      widget_referrer: origin,
      playsinline: '1',
      start: '0',
      controls: '0',
      disablekb: '1',
      fs: '0',
      rel: '0',
      modestbranding: '1',
      iv_load_policy: '3',
    }).toString()}`;
  }, [currentSong, origin]);

  useEffect(() => {
    if (!currentSong || !currentSongStartTimestamp || !currentSong.duration) return;

    const elapsedMs = Date.now() - currentSongStartTimestamp;
    const remainingMs = Math.max(0, currentSong.duration * 1000 - elapsedMs);
    const timeoutId = window.setTimeout(() => {
      emitSongEnded(currentSong.videoId);
    }, remainingMs + 500);

    return () => window.clearTimeout(timeoutId);
  }, [currentSong, currentSongStartTimestamp, emitSongEnded]);

  if (!currentSong) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900 border border-gray-800 rounded-xl">
        <p className="text-gray-500 animate-pulse">Waiting for a DJ to add a song...</p>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-2xl bg-black group">
      <iframe
        key={currentSong.id}
        src={embedSrc}
        title={currentSong.title}
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        className="w-full h-full border-0"
      />
    </div>
  );
};

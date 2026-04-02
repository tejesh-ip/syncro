'use client';

import React, { useEffect, useRef } from 'react';
import YouTube, { YouTubeEvent, YouTubeProps, YouTubePlayer as YTPlayerType } from 'react-youtube';
import { useStore } from '../store/useStore';

export const YouTubePlayer = () => {
  const { roomState, emitSongEnded } = useStore();
  const playerRef = useRef<YTPlayerType | null>(null);

  const currentSong = roomState?.currentSong;
  const currentSongStartTimestamp = roomState?.currentSongStartTimestamp;

  // The Master Clock Sync Logic
  const syncPlayer = () => {
    if (!playerRef.current || !currentSongStartTimestamp) return;
    
    // Calculate how many seconds have passed since the server started this song
    const elapsedSeconds = (Date.now() - currentSongStartTimestamp) / 1000;
    const playerTime = playerRef.current.getCurrentTime() || 0;

    // If the client is out of sync by more than 2 seconds, force them to the master clock
    if (Math.abs(elapsedSeconds - playerTime) > 2) {
      console.log(`Syncing player. Server elapsed: ${elapsedSeconds}, Client time: ${playerTime}`);
      playerRef.current.seekTo(elapsedSeconds, true);
    }
  };

  // Run sync loop every second just in case they fall behind
  useEffect(() => {
    const interval = setInterval(syncPlayer, 1000);
    return () => clearInterval(interval);
  }, [currentSongStartTimestamp]);

  const onReady = (event: YouTubeEvent) => {
    playerRef.current = event.target;
    // Initial sync
    syncPlayer();
    event.target.playVideo();
  };

  const onStateChange = (event: YouTubeEvent) => {
    // YouTube Player States:
    // -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (video cued).

    if (event.data === YouTube.PlayerState.ENDED) {
      if (currentSong) {
        emitSongEnded(currentSong.videoId);
      }
    }

    // Ad Mitigation & Un-pause Logic
    if (event.data === YouTube.PlayerState.PLAYING) {
      // Just came out of buffering or an ad, force a sync check
      syncPlayer();
    }

    if (event.data === YouTube.PlayerState.PAUSED) {
      // Force play if they somehow managed to pause it
      event.target.playVideo();
    }
  };

  const opts: YouTubeProps['opts'] = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 1,
      controls: 0,      // Hide controls
      disablekb: 1,     // Disable keyboard shortcuts
      fs: 0,            // Disable fullscreen
      rel: 0,           // Don't show related videos on end
      modestbranding: 1,// Hide YouTube logo
      iv_load_policy: 3,// Hide video annotations
    },
  };

  if (!currentSong) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900 border border-gray-800 rounded-xl">
        <p className="text-gray-500 animate-pulse">Waiting for a DJ to add a song...</p>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-2xl bg-black group">
      {/* 
        This absolute div sits ON TOP of the iframe, completely blocking pointer events.
        Users cannot click the video to pause it, cannot see the controls, nothing.
      */}
      <div className="absolute inset-0 z-10" style={{ pointerEvents: 'none' }} />
      
      <YouTube
        videoId={currentSong.videoId}
        opts={opts}
        onReady={onReady}
        onStateChange={onStateChange}
        className="w-full h-full pointer-events-none" // Extra safety
        iframeClassName="w-full h-full pointer-events-none"
      />
      
      {/* Custom UI overlay could go here (e.g., currently playing track info) */}
    </div>
  );
};
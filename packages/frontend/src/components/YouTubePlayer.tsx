'use client';

import React, { useEffect, useRef, useState } from 'react';
import YouTube, { YouTubeEvent, YouTubeProps, YouTubePlayer as YTPlayerType } from 'react-youtube';
import { useStore } from '../store/useStore';
import { PlayCircle } from 'lucide-react';

export const YouTubePlayer = () => {
  const { roomState, emitSongEnded } = useStore();
  const playerRef = useRef<YTPlayerType | null>(null);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

  const currentSong = roomState?.currentSong;
  const currentSongStartTimestamp = roomState?.currentSongStartTimestamp;

  // Run sync loop every second to enforce Master Clock
  useEffect(() => {
    const interval = setInterval(() => {
      // Need a stable reference to syncPlayer to avoid linting warnings
      if (!playerRef.current || !currentSongStartTimestamp) return;
    
      const state = playerRef.current.getPlayerState();
      
      if (state === 2 || state === -1 || state === 5) {
        setAutoplayBlocked(true);
        playerRef.current.playVideo();
      } else {
        setAutoplayBlocked(false);
      }

      if (state === 1 || state === 3) {
        const elapsedSeconds = (Date.now() - currentSongStartTimestamp) / 1000;
        const playerTime = playerRef.current.getCurrentTime() || 0;

        if (Math.abs(elapsedSeconds - playerTime) > 2) {
          playerRef.current.seekTo(elapsedSeconds, true);
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [currentSongStartTimestamp]);

  const onReady = (event: YouTubeEvent) => {
    playerRef.current = event.target;
    event.target.playVideo();
  };

  const onStateChange = (event: YouTubeEvent) => {
    if (event.data === YouTube.PlayerState.ENDED) {
      if (currentSong) {
        emitSongEnded(currentSong.videoId);
      }
    }

    if (event.data === YouTube.PlayerState.PLAYING) {
      setAutoplayBlocked(false);
    }

    if (event.data === YouTube.PlayerState.PAUSED) {
      setAutoplayBlocked(true);
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
      
      {/* Autoplay Blocked Overlay - Z-index 20 so it sits above the blocking div */}
      {autoplayBlocked && (
        <div 
          className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-md cursor-pointer transition-opacity"
          onClick={() => {
            if (playerRef.current) {
              playerRef.current.playVideo();
              setAutoplayBlocked(false);
            }
          }}
        >
          <div className="flex flex-col items-center bg-gray-900/90 p-8 rounded-2xl border border-gray-700 hover:border-cyan-400 transition-colors shadow-2xl transform hover:scale-105 duration-200">
            <PlayCircle size={64} className="text-cyan-400 mb-4 animate-pulse" />
            <h3 className="text-2xl font-bold mb-2">Tap to Sync & Play</h3>
            <p className="text-sm text-gray-400 text-center max-w-xs">
              Your browser paused the audio. Click anywhere to sync with the room and continue listening.
            </p>
          </div>
        </div>
      )}

      <YouTube
        videoId={currentSong.videoId}
        opts={opts}
        onReady={onReady}
        onStateChange={onStateChange}
        className="w-full h-full pointer-events-none" // Extra safety
        iframeClassName="w-full h-full pointer-events-none"
      />
    </div>
  );
};
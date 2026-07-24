'use client';

import React, { useEffect, useRef, useState } from 'react';
import YouTube, { YouTubeEvent, YouTubeProps, YouTubePlayer as YTPlayerType } from 'react-youtube';
import { useStore } from '../store/useStore';
import { PlayCircle } from 'lucide-react';

export const YouTubePlayer = () => {
  const { roomState, emitSongEnded, volume } = useStore();
  const playerRef = useRef<YTPlayerType | null>(null);
  const loadedSongIdRef = useRef<string | null>(null);
  const skipTimerRef = useRef<number | null>(null);
  const hasTriedUserPlayRef = useRef(false);
  const [autoplayBlockedSongId, setAutoplayBlockedSongId] = useState<string | null>(null);
  const [playerError, setPlayerError] = useState<{ songId: string; message: string } | null>(null);

  const currentSong = roomState?.currentSong;
  const currentSongStartTimestamp = roomState?.currentSongStartTimestamp;
  const visiblePlayerError =
    playerError && playerError.songId === currentSong?.id ? playerError.message : null;
  const autoplayBlocked = autoplayBlockedSongId === currentSong?.id;

  useEffect(() => {
    if (!currentSong) {
      loadedSongIdRef.current = null;
      return;
    }

    if (!playerRef.current || loadedSongIdRef.current === currentSong.id) return;

    loadedSongIdRef.current = currentSong.id;

    const startSeconds = currentSongStartTimestamp
      ? Math.max(0, (Date.now() - currentSongStartTimestamp) / 1000)
      : 0;

    playerRef.current.loadVideoById({
      videoId: currentSong.videoId,
      startSeconds,
    });
    playerRef.current.playVideo();
  }, [currentSong, currentSongStartTimestamp]);

  useEffect(() => {
    return () => {
      if (skipTimerRef.current) {
        window.clearTimeout(skipTimerRef.current);
      }
    };
  }, []);

  // React to Volume Changes
  useEffect(() => {
    if (playerRef.current && typeof playerRef.current.setVolume === 'function') {
      playerRef.current.setVolume(volume);
    }
  }, [volume]);

  // Run sync loop every second to enforce Master Clock
  useEffect(() => {
    const interval = setInterval(() => {
      // Need a stable reference to syncPlayer to avoid linting warnings
      if (!playerRef.current || !currentSongStartTimestamp) return;
    
      const state = playerRef.current.getPlayerState();
      
      if (state === YouTube.PlayerState.PAUSED && hasTriedUserPlayRef.current) {
        setAutoplayBlockedSongId(currentSong?.id || null);
      } else if (state === YouTube.PlayerState.PLAYING || state === YouTube.PlayerState.BUFFERING) {
        setAutoplayBlockedSongId(null);
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
  }, [currentSong?.id, currentSongStartTimestamp]);

  const onReady = (event: YouTubeEvent) => {
    playerRef.current = event.target;
    setAutoplayBlockedSongId(null);
    setPlayerError(null);
    if (typeof event.target.setVolume === 'function') {
      event.target.setVolume(volume);
    }

    if (currentSong && loadedSongIdRef.current !== currentSong.id) {
      loadedSongIdRef.current = currentSong.id;
      const startSeconds = currentSongStartTimestamp
        ? Math.max(0, (Date.now() - currentSongStartTimestamp) / 1000)
        : 0;

      event.target.loadVideoById({
        videoId: currentSong.videoId,
        startSeconds,
      });
    }

    event.target.playVideo();
  };

  const onStateChange = (event: YouTubeEvent) => {
    if (event.data === YouTube.PlayerState.ENDED) {
      if (currentSong) {
        emitSongEnded(currentSong.videoId);
      }
    }

    if (event.data === YouTube.PlayerState.PLAYING) {
      hasTriedUserPlayRef.current = false;
      setAutoplayBlockedSongId(null);
      setPlayerError(null);
    }

    if (event.data === YouTube.PlayerState.PAUSED && hasTriedUserPlayRef.current) {
      setAutoplayBlockedSongId(currentSong?.id || null);
    }
  };

  const onError = (event: YouTubeEvent) => {
    const errorMessages: Record<number, string> = {
      2: 'This video ID is invalid.',
      5: 'This video cannot be played in this browser.',
      100: 'This video is unavailable.',
      101: 'This video can only be watched on YouTube. Skipping to the next song.',
      150: 'This video can only be watched on YouTube. Skipping to the next song.',
    };

    const errorCode = event.data as number;
    console.warn('YouTube player error', {
      errorCode,
      videoId: currentSong?.videoId,
      title: currentSong?.title,
    });

    setPlayerError({
      songId: currentSong?.id || '',
      message:
        errorMessages[errorCode] ||
        'YouTube playback was blocked. Disable ad blockers or browser shields for this site, then retry.',
    });
    setAutoplayBlockedSongId(currentSong?.id || null);

    if (currentSong && [2, 100, 101, 150].includes(errorCode)) {
      if (skipTimerRef.current) {
        window.clearTimeout(skipTimerRef.current);
      }

      const blockedVideoId = currentSong.videoId;
      skipTimerRef.current = window.setTimeout(() => {
        emitSongEnded(blockedVideoId);
      }, 1500);
    }
  };

  const opts: YouTubeProps['opts'] = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 1,
      enablejsapi: 1,
      origin: typeof window !== 'undefined' ? window.location.origin : undefined,
      playsinline: 1,
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
      {(autoplayBlocked || visiblePlayerError) && (
        <div 
          className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-md cursor-pointer transition-opacity"
          onClick={() => {
            if (playerRef.current) {
              setPlayerError(null);
              setAutoplayBlockedSongId(null);
              hasTriedUserPlayRef.current = true;

              if (currentSongStartTimestamp) {
                const elapsedSeconds = Math.max(0, (Date.now() - currentSongStartTimestamp) / 1000);
                playerRef.current.seekTo(elapsedSeconds, true);
              }

              if (typeof playerRef.current.unMute === 'function') {
                playerRef.current.unMute();
              }
              playerRef.current.playVideo();
            }
          }}
        >
          <div className="flex flex-col items-center bg-gray-900/90 p-8 rounded-2xl border border-gray-700 hover:border-cyan-400 transition-colors shadow-2xl transform hover:scale-105 duration-200">
            <PlayCircle size={64} className="text-cyan-400 mb-4 animate-pulse" />
            <h3 className="text-2xl font-bold mb-2">{visiblePlayerError ? 'Playback Blocked' : 'Tap to Sync & Play'}</h3>
            <p className="text-sm text-gray-400 text-center max-w-xs">
              {visiblePlayerError || 'Your browser paused the audio. Click anywhere to sync with the room and continue listening.'}
            </p>
          </div>
        </div>
      )}

      <YouTube
        videoId={currentSong.videoId}
        opts={opts}
        onReady={onReady}
        onStateChange={onStateChange}
        onError={onError}
        className="w-full h-full pointer-events-none" // Extra safety
        iframeClassName="w-full h-full pointer-events-none"
      />
    </div>
  );
};

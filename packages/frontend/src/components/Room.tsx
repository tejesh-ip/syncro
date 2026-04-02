'use client';

import React from 'react';
import { useStore } from '../store/useStore';
import { YouTubePlayer } from './YouTubePlayer';
import { Users, Music, Search } from 'lucide-react';

export const Room = () => {
  const { roomState, nickname, leaveRoom } = useStore();

  if (!roomState) return null;

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <header className="h-16 border-b border-gray-800 flex items-center justify-between px-6 bg-gray-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-500">
            SYNCRO
          </h1>
          <span className="px-3 py-1 rounded-full bg-gray-800 text-xs font-mono text-gray-300 uppercase">
            Room: {roomState.id}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-400 bg-gray-900 px-3 py-1.5 rounded-full border border-gray-800">
            <Users size={16} className="text-cyan-400" />
            <span>{roomState.users.length} Listening</span>
          </div>
          <button 
            onClick={leaveRoom}
            className="text-sm text-red-400 hover:text-red-300 transition-colors"
          >
            Leave
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden p-4 gap-4">
        {/* Left Column: Player & Info */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          <div className="flex-shrink-0">
            <YouTubePlayer />
          </div>
          
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 flex-1">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Music className="text-fuchsia-400" />
              Now Playing
            </h2>
            {roomState.currentSong ? (
              <div>
                <p className="text-2xl font-bold truncate">{roomState.currentSong.title}</p>
                <p className="text-gray-400 mt-2">
                  Added by <span className="text-white font-medium" style={{ color: roomState.currentSong.userColor }}>{roomState.currentSong.addedByName}</span>
                </p>
              </div>
            ) : (
              <p className="text-gray-500">Nothing playing. Be the DJ.</p>
            )}
          </div>
        </div>

        {/* Right Column: Queue & Search */}
        <div className="w-full lg:w-96 flex flex-col gap-4 flex-shrink-0">
          {/* Temporary Mock Search Box */}
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search YouTube..." 
                className="w-full bg-gray-950 border border-gray-800 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-cyan-400 transition-colors"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">Search integration coming soon.</p>
          </div>

          <div className="bg-gray-900 rounded-xl border border-gray-800 flex-1 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-800 bg-gray-900/50">
              <h3 className="font-bold">Up Next ({roomState.queue.length})</h3>
            </div>
            <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-3">
              {roomState.queue.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-500 text-sm text-center">
                  The queue is empty.
                </div>
              ) : (
                roomState.queue.map((song, index) => (
                  <div 
                    key={song.id} 
                    className="flex flex-col gap-1 p-3 rounded-lg bg-gray-950 border-l-2"
                    style={{ borderLeftColor: song.userColor }}
                  >
                    <p className="text-sm font-medium line-clamp-1">{song.title}</p>
                    <p className="text-xs text-gray-500">
                      {index + 1} • from {song.addedByName}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
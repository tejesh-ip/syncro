'use client';

import React from 'react';
import { useStore } from '../store/useStore';
import { ClubEnvironment } from './ClubEnvironment';
import { SearchBox } from './SearchBox';
import { ProgressBar } from './ProgressBar';
import { Users, Music, Heart, FastForward } from 'lucide-react';
import { useRouter } from 'next/navigation';

export const Room = () => {
  const { roomState, userId, leaveRoom, likeSong, skipSong } = useStore();
  const router = useRouter();

  if (!roomState) return null;

  const handleLeave = () => {
    leaveRoom();
    router.push('/');
  };

  const hasLiked = roomState.currentSongLikes.includes(userId);
  const hasSkipped = roomState.currentSongSkips.includes(userId);
  const skipThreshold = Math.min(3, roomState.users.length);

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <header className="h-16 border-b border-gray-800 flex items-center justify-between px-6 bg-gray-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-500 cursor-pointer" onClick={handleLeave}>
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
            onClick={handleLeave}
            className="text-sm text-red-400 hover:text-red-300 transition-colors"
          >
            Leave
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col xl:flex-row overflow-hidden p-4 gap-4">
        {/* Left Column: Campus Environment & Info */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          <div className="flex-shrink-0 w-full">
            <ClubEnvironment />
          </div>
          
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 flex-1 flex flex-col justify-between items-start gap-4">
            <div className="w-full">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Music className="text-fuchsia-400" />
                Now Playing
              </h2>
              
              {roomState.currentSong && (
                <div className="mb-4">
                  <ProgressBar />
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row justify-between w-full items-start sm:items-center gap-4">
                <div className="min-w-0 flex-1 pr-4">
                  {roomState.currentSong ? (
                    <div>
                      <p className="text-2xl font-bold truncate">{roomState.currentSong.title}</p>
                      <p className="text-gray-400 mt-1">
                        Added by <span className="text-white font-medium" style={{ color: roomState.currentSong.userColor }}>{roomState.currentSong.addedByName}</span>
                      </p>
                    </div>
                  ) : (
                    <p className="text-gray-500">Nothing playing. Be the DJ.</p>
                  )}
                </div>

                {roomState.currentSong && (
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <button 
                      onClick={likeSong}
                      disabled={hasLiked}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${
                        hasLiked 
                          ? 'bg-fuchsia-500/20 border-fuchsia-500/50 text-fuchsia-400 cursor-default' 
                          : 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-white'
                      }`}
                    >
                      <Heart size={18} className={hasLiked ? 'fill-current' : ''} />
                      <span>{roomState.currentSongLikes.length}</span>
                    </button>

                    <button 
                      onClick={skipSong}
                      disabled={hasSkipped}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${
                        hasSkipped 
                          ? 'bg-orange-500/20 border-orange-500/50 text-orange-400 cursor-default' 
                          : 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-white'
                      }`}
                      title={`Skip requires ${skipThreshold} votes`}
                    >
                      <FastForward size={18} className={hasSkipped ? 'fill-current' : ''} />
                      <span>{roomState.currentSongSkips.length} / {skipThreshold}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Queue & Search */}
        <div className="w-full xl:w-[400px] flex flex-col gap-4 flex-shrink-0">
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 relative z-50">
            <SearchBox />
          </div>

          <div className="bg-gray-900 rounded-xl border border-gray-800 flex-1 overflow-hidden flex flex-col z-0 max-h-[400px] xl:max-h-none">
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
          
          {/* Participant List with Likes */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden flex flex-col flex-shrink-0 z-0">
             <div className="p-3 border-b border-gray-800 bg-gray-900/50">
              <h3 className="font-bold text-sm">DJs in Room</h3>
            </div>
            <div className="p-3 overflow-y-auto flex-col gap-2 max-h-48 flex">
               {roomState.users.map((user) => (
                 <div key={user.id} className="flex justify-between items-center text-sm">
                   <div className="flex items-center gap-2">
                     <span className="text-lg">{user.avatar}</span>
                     <span>{user.nickname} {user.id === userId && '(You)'}</span>
                   </div>
                   <div className="flex items-center gap-1 text-xs text-gray-400" title="Total Likes Received">
                     <Heart size={12} className="text-fuchsia-400" />
                     {user.likesReceived}
                   </div>
                 </div>
               ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

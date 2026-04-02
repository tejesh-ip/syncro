'use client';

import React from 'react';
import { useStore } from '../store/useStore';
import { YouTubePlayer } from './YouTubePlayer';
import { motion } from 'framer-motion';

export const ClubEnvironment = () => {
  const { roomState } = useStore();

  if (!roomState) return null;

  const currentSong = roomState.currentSong;
  
  // Find who the DJ is
  const djUser = currentSong 
    ? roomState.users.find(u => u.id === currentSong.addedBy) 
    : null;

  // Everyone else is the crowd
  const crowd = roomState.users.filter(u => u.id !== djUser?.id);

  // Animation for dancing (only dance if a song is playing)
  const isPlaying = !!currentSong;

  return (
    <div className="relative w-full h-[600px] bg-black rounded-xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-gray-800 perspective-[1000px] flex flex-col items-center justify-end">
      
      {/* Background Glow based on DJ Color */}
      {djUser && (
        <div 
          className="absolute inset-0 opacity-20 pointer-events-none transition-colors duration-1000"
          style={{ 
            background: `radial-gradient(circle at center 30%, ${djUser.color}, transparent 60%)` 
          }}
        />
      )}

      {/* The Big Screen (YouTube Player) */}
      <div className="absolute top-8 w-[80%] max-w-3xl aspect-video bg-gray-900 border-4 border-gray-800 rounded-lg shadow-2xl z-10 overflow-hidden transform translate-z-0">
        <YouTubePlayer />
      </div>

      {/* The DJ Booth */}
      <div className="absolute top-[55%] flex flex-col items-center z-20">
        {/* DJ Avatar */}
        {djUser ? (
          <motion.div 
            className="relative flex flex-col items-center mb-[-20px] z-30"
            animate={isPlaying ? { y: [0, -15, 0] } : {}}
            transition={{ repeat: Infinity, duration: 0.5, ease: "easeInOut" }}
          >
            {/* Floating Name */}
            <div 
              className="absolute -top-8 whitespace-nowrap px-3 py-1 bg-black/90 rounded-full border text-xs font-bold"
              style={{ borderColor: djUser.color, color: djUser.color, boxShadow: `0 0 10px ${djUser.color}40` }}
            >
              👑 {djUser.nickname}
            </div>
            
            <div 
              className="text-6xl drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] mt-2"
              title={djUser.nickname}
            >
              {djUser.avatar || '🎧'}
            </div>
          </motion.div>
        ) : (
          <div className="text-4xl opacity-50 mb-[-10px] z-30">🔇</div>
        )}
        
        {/* The Booth Deck */}
        <div className="w-64 h-24 bg-gray-900 border-t-4 border-l-2 border-r-2 border-gray-700 rounded-t-xl flex items-center justify-center shadow-2xl relative overflow-hidden z-20">
           {/* Fake DJ Equipment UI */}
           <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.1),transparent)]" />
           <div className="flex gap-4 items-center">
             <div className={`w-12 h-12 rounded-full border-2 border-gray-600 ${isPlaying ? 'animate-[spin_3s_linear_infinite]' : ''}`} style={{ borderColor: djUser?.color || '#333' }}>
                <div className="w-full h-full rounded-full border-4 border-dashed border-gray-800" />
             </div>
             <div className="flex gap-1">
               <div className="w-2 h-8 bg-gray-800 rounded flex items-end">
                 <motion.div className="w-full bg-cyan-400 rounded-b" animate={isPlaying ? { height: ['20%', '80%', '40%', '100%', '30%'] } : { height: '10%' }} transition={{ repeat: Infinity, duration: 0.8 }} />
               </div>
               <div className="w-2 h-8 bg-gray-800 rounded flex items-end">
                 <motion.div className="w-full bg-fuchsia-500 rounded-b" animate={isPlaying ? { height: ['60%', '20%', '90%', '40%', '70%'] } : { height: '10%' }} transition={{ repeat: Infinity, duration: 0.6 }} />
               </div>
             </div>
             <div className={`w-12 h-12 rounded-full border-2 border-gray-600 ${isPlaying ? 'animate-[spin_3s_linear_infinite]' : ''}`} style={{ borderColor: djUser?.color || '#333' }}>
                <div className="w-full h-full rounded-full border-4 border-dashed border-gray-800" />
             </div>
           </div>
        </div>
      </div>

      {/* The Dance Floor */}
      <div 
        className="absolute bottom-[-100px] w-[150%] h-[400px] bg-gray-950/80 z-0 border-t border-gray-800"
        style={{ 
          transform: 'rotateX(60deg)',
          backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          boxShadow: 'inset 0 100px 100px rgba(0,0,0,0.9)'
        }}
      />

      {/* The Crowd */}
      <div className="absolute bottom-0 w-full h-[250px] z-30 pointer-events-none">
        {crowd.map((user, i) => {
          const seed = user.id.charCodeAt(user.id.length - 1);
          const leftPercent = 15 + (seed % 70); 
          const bottomPercent = 10 + ((seed * 3) % 60); 
          const scale = 0.8 + (bottomPercent / 100); 
          const delay = (seed % 10) * 0.1;

          return (
            <motion.div 
              key={user.id}
              className="absolute flex flex-col items-center pointer-events-auto"
              style={{ left: `${leftPercent}%`, bottom: `${bottomPercent}%`, zIndex: Math.floor(100 - bottomPercent) }}
              animate={isPlaying ? { y: [0, -15, 0] } : {}}
              transition={{ repeat: Infinity, duration: 0.4 + (seed % 3) * 0.1, delay, ease: "easeInOut" }}
            >
              {/* Floating Name */}
              <div 
                className="absolute -top-6 whitespace-nowrap px-2 py-0.5 bg-black/90 rounded-full border text-[10px] font-bold"
                style={{ borderColor: user.color, color: user.color, boxShadow: `0 0 5px ${user.color}40` }}
              >
                {user.nickname}
              </div>

              <div 
                className="text-5xl drop-shadow-[0_5px_10px_rgba(0,0,0,0.8)] mt-2"
                style={{ transform: `scale(${scale})` }}
                title={user.nickname}
              >
                {user.avatar || '🕺'}
              </div>
            </motion.div>
          );
        })}
      </div>

    </div>
  );
};
'use client';

import React from 'react';
import { useStore } from '../store/useStore';
import { YouTubePlayer } from './YouTubePlayer';
import { motion } from 'framer-motion';

export const ClubEnvironment = () => {
  const { roomState } = useStore();

  if (!roomState) return null;

  const currentSong = roomState.currentSong;
  
  const djUser = currentSong 
    ? roomState.users.find(u => u.id === currentSong.addedBy) 
    : null;

  const crowd = roomState.users.filter(u => u.id !== djUser?.id);
  const isPlaying = !!currentSong;

  return (
    <div className="relative w-full h-[600px] bg-black rounded-xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-gray-800 perspective-[1200px] flex flex-col items-center">
      
      {djUser && (
        <div 
          className="absolute inset-0 opacity-20 pointer-events-none transition-colors duration-1000"
          style={{ 
            background: `radial-gradient(circle at center top, ${djUser.color}, transparent 70%)` 
          }}
        />
      )}

      {/* 1. The Big Screen (Behind DJ) */}
      <div className="absolute top-4 w-[70%] max-w-2xl aspect-video bg-gray-900 border-4 border-gray-800 rounded-lg shadow-2xl z-0 overflow-hidden">
        <YouTubePlayer />
      </div>

      {/* 2. The Dance Floor (Perspective Grid) */}
      <div 
        className="absolute top-[45%] w-[200%] h-[100%] bg-gray-950/80 z-10 border-t-2 border-gray-800"
        style={{ 
          transformOrigin: 'top center',
          transform: 'rotateX(70deg)',
          backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.05) 2px, transparent 2px),
            linear-gradient(to bottom, rgba(255,255,255,0.05) 2px, transparent 2px)
          `,
          backgroundSize: '50px 50px',
          boxShadow: 'inset 0 100px 100px rgba(0,0,0,0.9)'
        }}
      />

      {/* 3. The DJ Booth (Top Center, in front of screen, behind crowd) */}
      <div className="absolute top-[38%] flex flex-col items-center z-20">
        
        {djUser ? (
          <motion.div 
            className="relative flex flex-col items-center z-20"
            animate={isPlaying ? { y: [0, -10, 0] } : {}}
            transition={{ repeat: Infinity, duration: 0.5, ease: "easeInOut" }}
          >
            <div 
              className="absolute -top-8 whitespace-nowrap px-3 py-1 bg-black/90 rounded-full border text-xs font-bold"
              style={{ borderColor: djUser.color, color: djUser.color, boxShadow: `0 0 10px ${djUser.color}40` }}
            >
              👑 {djUser.nickname}
            </div>
            
            <div className="text-6xl drop-shadow-[0_0_20px_rgba(255,255,255,0.8)] mt-2" title={djUser.nickname}>
              {djUser.avatar || '🎧'}
            </div>
          </motion.div>
        ) : (
          <div className="text-4xl opacity-50 z-20 mb-2">🔇</div>
        )}
        
        {/* DJ Deck (In front of DJ emoji) */}
        <div className="w-72 h-20 bg-gray-900 border-t-4 border-l-2 border-r-2 border-gray-700 rounded-t-xl flex items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.9)] relative overflow-hidden z-30 mt-[-10px]">
           <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.1),transparent)]" />
           <div className="flex gap-6 items-center">
             <div className={`w-14 h-14 rounded-full border-2 border-gray-600 ${isPlaying ? 'animate-[spin_2s_linear_infinite]' : ''}`} style={{ borderColor: djUser?.color || '#333' }}>
                <div className="w-full h-full rounded-full border-4 border-dashed border-gray-800" />
             </div>
             <div className="flex gap-1.5">
               <div className="w-2 h-10 bg-gray-800 rounded flex items-end">
                 <motion.div className="w-full bg-cyan-400 rounded-b" animate={isPlaying ? { height: ['20%', '80%', '40%', '100%', '30%'] } : { height: '10%' }} transition={{ repeat: Infinity, duration: 0.4 }} />
               </div>
               <div className="w-2 h-10 bg-gray-800 rounded flex items-end">
                 <motion.div className="w-full bg-fuchsia-500 rounded-b" animate={isPlaying ? { height: ['60%', '20%', '90%', '40%', '70%'] } : { height: '10%' }} transition={{ repeat: Infinity, duration: 0.5 }} />
               </div>
               <div className="w-2 h-10 bg-gray-800 rounded flex items-end">
                 <motion.div className="w-full bg-cyan-400 rounded-b" animate={isPlaying ? { height: ['40%', '90%', '20%', '70%', '50%'] } : { height: '10%' }} transition={{ repeat: Infinity, duration: 0.3 }} />
               </div>
             </div>
             <div className={`w-14 h-14 rounded-full border-2 border-gray-600 ${isPlaying ? 'animate-[spin_2s_linear_infinite]' : ''}`} style={{ borderColor: djUser?.color || '#333' }}>
                <div className="w-full h-full rounded-full border-4 border-dashed border-gray-800" />
             </div>
           </div>
        </div>
      </div>

      {/* 4. The Crowd (Ahead of DJ set, facing it) */}
      <div className="absolute top-[55%] bottom-0 w-full z-40 pointer-events-none">
        {crowd.map((user) => {
          const seed = user.id.charCodeAt(user.id.length - 1);
          // Distribute across width (10% to 90%)
          const leftPercent = 10 + (seed % 80); 
          // Distribute across depth (10% to 90% of the crowd container)
          const topPercent = 10 + ((seed * 3) % 80); 
          
          // Those further down the screen (higher topPercent) are closer to the camera -> larger scale
          const scale = 0.9 + (topPercent / 100); 
          const delay = (seed % 10) * 0.1;

          return (
            <motion.div 
              key={user.id}
              className="absolute flex flex-col items-center pointer-events-auto"
              style={{ 
                left: `${leftPercent}%`, 
                top: `${topPercent}%`, 
                zIndex: Math.floor(topPercent) // closer to bottom = higher z-index
              }}
              animate={isPlaying ? { y: [0, -15 * scale, 0] } : {}}
              transition={{ repeat: Infinity, duration: 0.4 + (seed % 3) * 0.1, delay, ease: "easeInOut" }}
            >
              <div 
                className="absolute -top-6 whitespace-nowrap px-2 py-0.5 bg-black/90 rounded-full border text-[10px] font-bold"
                style={{ borderColor: user.color, color: user.color, boxShadow: `0 0 5px ${user.color}40` }}
              >
                {user.nickname}
              </div>

              <div 
                className="text-5xl drop-shadow-[0_10px_15px_rgba(0,0,0,0.8)] mt-2"
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
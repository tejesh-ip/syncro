'use client';

import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { PlayCircle } from 'lucide-react';

export const JoinForm = () => {
  const [nickname, setNickname] = useState('');
  const [roomId, setRoomId] = useState('');
  const { connect, joinRoom } = useStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname || !roomId) return;
    connect();
    joinRoom(roomId.trim().toLowerCase(), nickname.trim());
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-white p-4">
      <div className="text-center mb-12">
        <h1 className="text-6xl font-black tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-500">
          SYNCRO
        </h1>
        <p className="text-gray-400 text-lg">Social listening. Perfectly synchronized.</p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-gray-900 p-8 rounded-2xl shadow-2xl border border-gray-800">
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-400 mb-2">Nickname</label>
          <input
            type="text"
            required
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors"
            placeholder="DJ Phantom"
          />
        </div>
        
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-400 mb-2">Room Code</label>
          <input
            type="text"
            required
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 transition-colors uppercase"
            placeholder="NIGHTCLUB"
          />
        </div>

        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-fuchsia-500 hover:from-cyan-400 hover:to-fuchsia-400 text-white font-bold py-3 px-4 rounded-lg transition-all transform hover:scale-[1.02] active:scale-95"
        >
          <PlayCircle size={20} />
          Enter Room
        </button>
      </form>
    </div>
  );
};
'use client';

import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { JoinForm } from '../components/JoinForm';
import { Users, Music, RefreshCw } from 'lucide-react';

interface ActiveRoom {
  id: string;
  userCount: number;
  currentSongTitle: string | null;
  djs: string[];
}

export default function Home() {
  const { initSession } = useStore();
  const [rooms, setRooms] = useState<ActiveRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoomId, setSelectedRoomId] = useState<string | undefined>(undefined);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/rooms`);
      if (res.ok) {
        const data = await res.json();
        setRooms(data);
      }
    } catch (error) {
      console.error('Failed to fetch rooms', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initSession();
    fetchRooms();
  }, [initSession]);

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col md:flex-row overflow-hidden">
      
      {/* Left Column: Lobby / Active Rooms */}
      <div className="flex-1 p-8 md:p-12 flex flex-col h-full md:h-screen overflow-y-auto custom-scrollbar border-b md:border-b-0 md:border-r border-gray-800">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-5xl md:text-6xl font-black tracking-tighter mb-2 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-500">
              SYNCRO
            </h1>
            <p className="text-gray-400 text-lg">Social listening. Perfectly synchronized.</p>
          </div>
          
          <button 
            onClick={fetchRooms}
            disabled={loading}
            className="p-3 bg-gray-900 border border-gray-800 rounded-xl hover:bg-gray-800 transition-colors text-gray-400 hover:text-cyan-400 disabled:opacity-50"
            title="Refresh Rooms"
          >
            <RefreshCw className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse"></span>
              Live Rooms
            </h2>
            <span className="text-sm font-mono text-gray-500 bg-gray-900 px-3 py-1 rounded-full border border-gray-800">
              {rooms.length} Active
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
               {[...Array(4)].map((_, i) => (
                 <div key={i} className="h-32 bg-gray-900/50 rounded-2xl animate-pulse border border-gray-800/50"></div>
               ))}
            </div>
          ) : rooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-gray-900/30 rounded-3xl border border-dashed border-gray-800">
              <div className="text-6xl mb-4 opacity-50">👻</div>
              <h3 className="text-xl font-bold text-gray-300 mb-2">No active rooms</h3>
              <p className="text-gray-500 max-w-sm">
                The club is empty right now. Create a new room and be the first DJ to start the party!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {rooms.map((room) => (
                <div 
                  key={room.id}
                  onClick={() => setSelectedRoomId(room.id)}
                  className={`cursor-pointer group relative bg-gray-900 p-6 rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-cyan-500/10 ${
                    selectedRoomId === room.id 
                      ? 'border-cyan-400 shadow-lg shadow-cyan-500/20' 
                      : 'border-gray-800 hover:border-gray-700'
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className="px-3 py-1 rounded-lg bg-gray-950 font-mono text-sm font-bold tracking-wider text-cyan-400 border border-gray-800 uppercase">
                      {room.id}
                    </span>
                    <div className="flex items-center gap-1.5 text-gray-400 bg-gray-950 px-2.5 py-1 rounded-lg text-sm border border-gray-800">
                      <Users size={14} />
                      <span className="font-medium">{room.userCount}</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-start gap-2 text-gray-300">
                      <Music size={16} className="mt-1 text-fuchsia-400 flex-shrink-0" />
                      <p className="font-medium line-clamp-2 leading-tight">
                        {room.currentSongTitle || <span className="text-gray-500 italic">Silence...</span>}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex -space-x-2">
                      {room.djs.map((avatar, idx) => (
                        <div key={idx} className="w-8 h-8 rounded-full bg-gray-800 border-2 border-gray-900 flex items-center justify-center text-sm z-10 relative">
                          {avatar}
                        </div>
                      ))}
                      {room.userCount > 3 && (
                        <div className="w-8 h-8 rounded-full bg-gray-800 border-2 border-gray-900 flex items-center justify-center text-xs font-bold text-gray-400 z-0 relative">
                          +{room.userCount - 3}
                        </div>
                      )}
                    </div>
                    
                    <div className={`text-sm font-bold transition-colors ${selectedRoomId === room.id ? 'text-cyan-400' : 'text-gray-500 group-hover:text-gray-300'}`}>
                      {selectedRoomId === room.id ? 'Selected' : 'Join →'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Join / Create Form */}
      <div className="w-full md:w-[450px] lg:w-[500px] flex-shrink-0 bg-gray-950 md:bg-gray-900/20">
        <JoinForm forcedRoomId={selectedRoomId} />
      </div>

    </div>
  );
}
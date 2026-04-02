import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { RoomState } from '../types';

interface StoreState {
  socket: Socket | null;
  isConnected: boolean;
  nickname: string;
  roomState: RoomState | null;
  
  // Actions
  connect: () => void;
  joinRoom: (roomId: string, nickname: string) => void;
  leaveRoom: () => void;
  addSong: (videoId: string, title: string) => void;
  emitSongEnded: (videoId: string) => void;
}

// Ensure we only create one socket connection
const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', {
  autoConnect: false,
});

export const useStore = create<StoreState>((set, get) => {
  // Listeners
  socket.on('connect', () => set({ isConnected: true }));
  socket.on('disconnect', () => set({ isConnected: false }));
  socket.on('room_state', (state: RoomState) => set({ roomState: state }));

  return {
    socket,
    isConnected: false,
    nickname: '',
    roomState: null,

    connect: () => {
      if (!socket.connected) {
        socket.connect();
      }
    },

    joinRoom: (roomId: string, nickname: string) => {
      set({ nickname });
      socket.emit('join_room', { roomId, nickname });
    },

    leaveRoom: () => {
      socket.disconnect(); // Or emit leave_room
      set({ roomState: null, nickname: '' });
    },

    addSong: (videoId: string, title: string) => {
      socket.emit('add_song', { videoId, title });
    },

    emitSongEnded: (videoId: string) => {
      socket.emit('song_ended', { videoId });
    }
  };
});
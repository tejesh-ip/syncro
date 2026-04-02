import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { RoomState } from '../types';

interface StoreState {
  socket: Socket | null;
  isConnected: boolean;
  userId: string;
  nickname: string;
  roomState: RoomState | null;
  
  // Actions
  initSession: () => void;
  connect: () => void;
  joinRoom: (roomId: string, nickname: string) => void;
  leaveRoom: () => void;
  addSong: (videoId: string, title: string) => void;
  emitSongEnded: (videoId: string) => void;
  likeSong: () => void;
  skipSong: () => void;
}

const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', {
  autoConnect: false,
});

const generateUserId = () => {
  return 'user_' + Math.random().toString(36).substr(2, 9);
};

export const useStore = create<StoreState>((set, get) => {
  socket.on('connect', () => {
    set({ isConnected: true });
    // If we reconnect and already have a room, re-join it
    const state = get();
    if (state.roomState && state.nickname && state.userId) {
      socket.emit('join_room', { 
        roomId: state.roomState.id, 
        userId: state.userId, 
        nickname: state.nickname 
      });
    }
  });
  
  socket.on('disconnect', () => set({ isConnected: false }));
  socket.on('room_state', (state: RoomState) => set({ roomState: state }));

  return {
    socket,
    isConnected: false,
    userId: '',
    nickname: '',
    roomState: null,

    initSession: () => {
      // Restore from localStorage or create new
      if (typeof window !== 'undefined') {
        let storedId = localStorage.getItem('syncro_userId');
        let storedNick = localStorage.getItem('syncro_nickname');
        
        if (!storedId) {
          storedId = generateUserId();
          localStorage.setItem('syncro_userId', storedId);
        }
        
        set({ userId: storedId, nickname: storedNick || '' });
      }
    },

    connect: () => {
      if (!socket.connected) {
        socket.connect();
      }
    },

    joinRoom: (roomId: string, nickname: string) => {
      const state = get();
      if (!state.userId) {
        state.initSession(); // Just in case
      }
      
      const newUserId = get().userId || generateUserId();
      
      set({ nickname, userId: newUserId });
      if (typeof window !== 'undefined') {
        localStorage.setItem('syncro_nickname', nickname);
      }
      
      socket.emit('join_room', { roomId, userId: newUserId, nickname });
    },

    leaveRoom: () => {
      socket.disconnect();
      set({ roomState: null });
    },

    addSong: (videoId: string, title: string) => {
      socket.emit('add_song', { videoId, title });
    },

    emitSongEnded: (videoId: string) => {
      socket.emit('song_ended', { videoId });
    },

    likeSong: () => {
      socket.emit('like_song');
    },

    skipSong: () => {
      socket.emit('skip_song');
    }
  };
});
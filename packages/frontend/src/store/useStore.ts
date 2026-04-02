import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { RoomState } from '../types';

interface StoreState {
  socket: Socket | null;
  isConnected: boolean;
  isInitialized: boolean; // Add initialization flag
  userId: string;
  nickname: string;
  avatar: string;
  roomState: RoomState | null;
  volume: number;
  
  // Actions
  initSession: () => void;
  connect: () => void;
  joinRoom: (roomId: string, nickname: string, avatar?: string) => void;
  leaveRoom: () => void;
  addSong: (videoId: string, title: string, duration: number) => void;
  emitSongEnded: (videoId: string) => void;
  likeSong: () => void;
  skipSong: () => void;
  setVolume: (v: number) => void;
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
    const state = get();
    if (state.roomState && state.nickname && state.userId && state.avatar) {
      socket.emit('join_room', { 
        roomId: state.roomState.id, 
        userId: state.userId, 
        nickname: state.nickname,
        avatar: state.avatar 
      });
    }
  });
  
  socket.on('disconnect', () => set({ isConnected: false }));
  socket.on('room_state', (state: RoomState) => set({ roomState: state }));

  return {
    socket,
    isConnected: false,
    isInitialized: false, // Default
    userId: '',
    nickname: '',
    avatar: '', // Empty default instead of '🎧'
    roomState: null,
    volume: 100,

    setVolume: (v: number) => set({ volume: v }),

    initSession: () => {
      // Restore from localStorage or create new
      if (typeof window !== 'undefined') {
        let storedId = localStorage.getItem('syncro_userId');
        const storedNick = localStorage.getItem('syncro_nickname');
        const storedAvatar = localStorage.getItem('syncro_avatar');
        
        if (!storedId) {
          storedId = generateUserId();
          localStorage.setItem('syncro_userId', storedId);
        }
        
        set({ 
          userId: storedId, 
          nickname: storedNick || '', 
          avatar: storedAvatar || '', // Load stored or empty
          isInitialized: true // Mark as ready
        });
      }
    },

    connect: () => {
      if (!socket.connected) {
        socket.connect();
      }
    },

    joinRoom: (roomId: string, nickname: string, avatar?: string) => {
      const state = get();
      if (!state.userId) {
        state.initSession(); // Just in case
      }
      
      const newUserId = get().userId || generateUserId();
      const finalAvatar = avatar || get().avatar || '🎧'; // The only fallback allowed
      
      set({ nickname, avatar: finalAvatar, userId: newUserId });
      if (typeof window !== 'undefined') {
        localStorage.setItem('syncro_nickname', nickname);
        localStorage.setItem('syncro_avatar', finalAvatar);
      }
      
      socket.emit('join_room', { roomId, userId: newUserId, nickname, avatar: finalAvatar });
    },

    leaveRoom: () => {
      socket.disconnect();
      set({ roomState: null });
    },

    addSong: (videoId: string, title: string, duration: number) => {
      socket.emit('add_song', { videoId, title, duration });
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
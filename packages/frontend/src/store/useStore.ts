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

const generateUserId = () => {
  return 'user_' + Math.random().toString(36).substr(2, 9);
};

export const useStore = create<StoreState>((set, get) => {
  return {
    socket: null,
    isConnected: false,
    isInitialized: false,
    userId: '',
    nickname: '',
    avatar: '',
    roomState: null,
    volume: 100,

    setVolume: (v: number) => set({ volume: v }),

    initSession: () => {
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
          avatar: storedAvatar || '',
          isInitialized: true
        });
      }
    },

    connect: () => {
      let s = get().socket;
      if (!s) {
        s = io(window.location.origin, { autoConnect: false });
        s.on('connect', () => {
          set({ isConnected: true });
          const state = get();
          if (state.roomState && state.nickname && state.userId && state.avatar) {
            get().socket!.emit('join_room', {
              roomId: state.roomState.id,
              userId: state.userId,
              nickname: state.nickname,
              avatar: state.avatar,
            });
          }
        });
        s.on('disconnect', () => set({ isConnected: false }));
        s.on('room_state', (state: RoomState) => set({ roomState: state }));
        set({ socket: s });
      }
      if (!s.connected) {
        s.connect();
      }
    },

    joinRoom: (roomId: string, nickname: string, avatar?: string) => {
      const state = get();
      if (!state.userId) {
        state.initSession();
      }

      const newUserId = get().userId || generateUserId();
      const finalAvatar = avatar || get().avatar || '🎧';

      set({ nickname, avatar: finalAvatar, userId: newUserId });
      if (typeof window !== 'undefined') {
        localStorage.setItem('syncro_nickname', nickname);
        localStorage.setItem('syncro_avatar', finalAvatar);
      }

      get().socket!.emit('join_room', { roomId, userId: newUserId, nickname, avatar: finalAvatar });
    },

    leaveRoom: () => {
      get().socket?.disconnect();
      set({ roomState: null });
    },

    addSong: (videoId: string, title: string, duration: number) => {
      get().socket?.emit('add_song', { videoId, title, duration });
    },

    emitSongEnded: (videoId: string) => {
      get().socket?.emit('song_ended', { videoId });
    },

    likeSong: () => {
      get().socket?.emit('like_song');
    },

    skipSong: () => {
      get().socket?.emit('skip_song');
    }
  };
});
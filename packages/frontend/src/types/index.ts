export interface User {
  id: string; // Persistent User ID
  socketId: string;
  nickname: string;
  color: string;
  likesReceived: number;
}

export interface Song {
  id: string;
  videoId: string;
  title: string;
  duration?: number;
  addedBy: string;
  addedByName: string;
  userColor: string;
}

export interface RoomState {
  id: string;
  users: User[];
  currentSong: Song | null;
  currentSongStartTimestamp: number | null;
  queue: Song[];
  currentSongLikes: string[];
  currentSongSkips: string[];
}
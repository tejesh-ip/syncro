export interface User {
  id: string; // Socket ID
  nickname: string;
  color: string;
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
}
export interface User {
  id: string; // Socket ID
  nickname: string;
  color: string; // Used for the UI glowing borders
}

export interface Song {
  id: string; // Unique ID for the queue item
  videoId: string; // YouTube video ID
  title: string;
  duration?: number; // In seconds, if available
  addedBy: string; // User ID
  addedByName: string; // User nickname for easy UI access
  userColor: string;
}

export interface RoomState {
  id: string;
  users: User[];
  currentSong: Song | null;
  currentSongStartTimestamp: number | null;
  queue: Song[]; // The pre-computed flat list of the round-robin queue
}
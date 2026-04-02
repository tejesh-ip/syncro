export interface User {
  id: string; // Persistent User ID (from localStorage)
  socketId: string; // Current Socket ID
  nickname: string;
  color: string; // Used for the UI glowing borders
  avatar: string; // Emoji representing the user
  likesReceived: number; // Total likes this user's songs have gotten
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
  currentSongLikes: string[]; // Array of User IDs who liked
  currentSongSkips: string[]; // Array of User IDs who voted to skip
}
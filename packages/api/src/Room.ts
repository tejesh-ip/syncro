import { User, Song, RoomState } from './types';

// Helper to generate a random neon color for users
const generateNeonColor = () => {
  const colors = [
    '#00ffff', // Cyan
    '#ff00ff', // Magenta
    '#39ff14', // Neon Green
    '#ff073a', // Neon Red
    '#faff00', // Neon Yellow
    '#bc13fe', // Neon Purple
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

export class Room {
  public id: string;
  public users: Map<string, User> = new Map();
  
  // A map of userId -> array of their queued songs
  public userQueues: Map<string, Song[]> = new Map();
  
  // The order of users for the round-robin
  public userTurnOrder: string[] = [];
  public currentTurnIndex: number = 0;

  public currentSong: Song | null = null;
  public currentSongStartTimestamp: number | null = null;

  constructor(id: string) {
    this.id = id;
  }

  public addUser(socketId: string, nickname: string): User {
    const user: User = {
      id: socketId,
      nickname,
      color: generateNeonColor(),
    };
    
    this.users.set(socketId, user);
    if (!this.userTurnOrder.includes(socketId)) {
      this.userTurnOrder.push(socketId);
    }
    if (!this.userQueues.has(socketId)) {
      this.userQueues.set(socketId, []);
    }
    return user;
  }

  public removeUser(socketId: string) {
    this.users.delete(socketId);
    
    // Note: We deliberately KEEP their songs in the queue if they disconnect, 
    // or we could clear them. For this MVP, let's remove their unplayed songs
    // so we don't play songs for someone who isn't there.
    this.userQueues.delete(socketId);
    this.userTurnOrder = this.userTurnOrder.filter(id => id !== socketId);
    
    // Adjust turn index if out of bounds
    if (this.currentTurnIndex >= this.userTurnOrder.length) {
      this.currentTurnIndex = 0;
    }
  }

  public addSong(socketId: string, videoId: string, title: string): Song {
    const user = this.users.get(socketId);
    if (!user) throw new Error("User not found");

    const song: Song = {
      id: Math.random().toString(36).substring(2, 10),
      videoId,
      title,
      addedBy: user.id,
      addedByName: user.nickname,
      userColor: user.color,
    };

    const q = this.userQueues.get(socketId) || [];
    q.push(song);
    this.userQueues.set(socketId, q);

    return song;
  }

  // The core round-robin algorithm
  // Calculates the flattened upcoming queue based on user turns
  public getComputedQueue(): Song[] {
    const flatQueue: Song[] = [];
    if (this.userTurnOrder.length === 0) return flatQueue;

    // Clone the queues so we can destructively compute the order
    const tempQueues = new Map<string, Song[]>();
    for (const [userId, songs] of this.userQueues.entries()) {
      tempQueues.set(userId, [...songs]);
    }

    let tempIndex = this.currentTurnIndex;
    let songsRemaining = true;

    while (songsRemaining) {
      songsRemaining = false;
      let addedInThisRound = false;

      // Do a full pass over all users starting from current tempIndex
      for (let i = 0; i < this.userTurnOrder.length; i++) {
        const userIdx = (tempIndex + i) % this.userTurnOrder.length;
        const userId = this.userTurnOrder[userIdx];
        const userQ = tempQueues.get(userId);

        if (userQ && userQ.length > 0) {
          flatQueue.push(userQ.shift()!);
          songsRemaining = true;
          addedInThisRound = true;
        }
      }

      // If we made a full pass and no one had songs, we're done
      if (!addedInThisRound) break;
    }

    return flatQueue;
  }

  public nextSong(): Song | null {
    if (this.userTurnOrder.length === 0) {
      this.clearCurrentSong();
      return null;
    }

    // Try to find the next person with a song
    let loops = 0;
    while (loops < this.userTurnOrder.length) {
      const userId = this.userTurnOrder[this.currentTurnIndex];
      const userQ = this.userQueues.get(userId);

      // Advance turn index for the NEXT time we call nextSong
      this.currentTurnIndex = (this.currentTurnIndex + 1) % this.userTurnOrder.length;

      if (userQ && userQ.length > 0) {
        const song = userQ.shift()!;
        this.currentSong = song;
        this.currentSongStartTimestamp = Date.now();
        return song;
      }
      loops++;
    }

    // If we get here, no one had any songs
    this.clearCurrentSong();
    return null;
  }

  private clearCurrentSong() {
    this.currentSong = null;
    this.currentSongStartTimestamp = null;
  }

  public getState(): RoomState {
    return {
      id: this.id,
      users: Array.from(this.users.values()),
      currentSong: this.currentSong,
      currentSongStartTimestamp: this.currentSongStartTimestamp,
      queue: this.getComputedQueue(),
    };
  }
}
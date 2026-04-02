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
  public users: Map<string, User> = new Map(); // Key is persistent userId
  
  // A map of userId -> array of their queued songs
  public userQueues: Map<string, Song[]> = new Map();
  
  // The order of users for the round-robin
  public userTurnOrder: string[] = [];
  public currentTurnIndex: number = 0;

  public currentSong: Song | null = null;
  public currentSongStartTimestamp: number | null = null;

  // Voting
  public currentSongLikes: Set<string> = new Set();
  public currentSongSkips: Set<string> = new Set();

  public destroyTimer: NodeJS.Timeout | null = null;

  constructor(id: string) {
    this.id = id;
  }

  public addUser(userId: string, socketId: string, nickname: string, avatar: string): User {
    // If user already exists (e.g. reconnecting), just update their socketId
    if (this.users.has(userId)) {
      const existingUser = this.users.get(userId)!;
      existingUser.socketId = socketId;
      existingUser.nickname = nickname; // In case they changed it
      existingUser.avatar = avatar; // In case they changed their emoji
      return existingUser;
    }

    const user: User = {
      id: userId,
      socketId,
      nickname,
      color: generateNeonColor(),
      avatar: avatar || '🕺', // Fallback
      likesReceived: 0,
    };
    
    this.users.set(userId, user);
    if (!this.userTurnOrder.includes(userId)) {
      this.userTurnOrder.push(userId);
    }
    if (!this.userQueues.has(userId)) {
      this.userQueues.set(userId, []);
    }
    return user;
  }

  public removeUserBySocketId(socketId: string) {
    // Find the user with this socketId
    let targetUserId: string | null = null;
    for (const [userId, user] of this.users.entries()) {
      if (user.socketId === socketId) {
        targetUserId = userId;
        break;
      }
    }

    if (targetUserId) {
      this.users.delete(targetUserId);
      // Remove from turn order
      this.userTurnOrder = this.userTurnOrder.filter(id => id !== targetUserId);
      // If we want to clear their queue when they leave:
      this.userQueues.delete(targetUserId);
      
      // Adjust turn index if out of bounds
      if (this.currentTurnIndex >= this.userTurnOrder.length) {
        this.currentTurnIndex = 0;
      }

      // Remove their votes
      this.currentSongLikes.delete(targetUserId);
      this.currentSongSkips.delete(targetUserId);
    }
  }

  public addSong(userId: string, videoId: string, title: string, duration?: number): Song {
    const user = this.users.get(userId);
    if (!user) throw new Error("User not found");

    const song: Song = {
      id: Math.random().toString(36).substring(2, 10),
      videoId,
      title,
      duration,
      addedBy: user.id,
      addedByName: user.nickname,
      userColor: user.color,
    };

    const q = this.userQueues.get(userId) || [];
    q.push(song);
    this.userQueues.set(userId, q);

    return song;
  }

  // The core round-robin algorithm
  public getComputedQueue(): Song[] {
    const flatQueue: Song[] = [];
    if (this.userTurnOrder.length === 0) return flatQueue;

    const tempQueues = new Map<string, Song[]>();
    for (const [userId, songs] of this.userQueues.entries()) {
      tempQueues.set(userId, [...songs]);
    }

    let tempIndex = this.currentTurnIndex;
    let songsRemaining = true;

    while (songsRemaining) {
      songsRemaining = false;
      let addedInThisRound = false;

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

      if (!addedInThisRound) break;
    }

    return flatQueue;
  }

  public nextSong(): Song | null {
    // Reset votes for the new song
    this.currentSongLikes.clear();
    this.currentSongSkips.clear();

    if (this.userTurnOrder.length === 0) {
      this.clearCurrentSong();
      return null;
    }

    let loops = 0;
    while (loops < this.userTurnOrder.length) {
      const userId = this.userTurnOrder[this.currentTurnIndex];
      const userQ = this.userQueues.get(userId);

      this.currentTurnIndex = (this.currentTurnIndex + 1) % this.userTurnOrder.length;

      if (userQ && userQ.length > 0) {
        const song = userQ.shift()!;
        this.currentSong = song;
        this.currentSongStartTimestamp = Date.now();
        return song;
      }
      loops++;
    }

    this.clearCurrentSong();
    return null;
  }

  private clearCurrentSong() {
    this.currentSong = null;
    this.currentSongStartTimestamp = null;
  }

  // Voting Logic
  public likeSong(userId: string) {
    if (!this.currentSong) return;
    
    // If they haven't liked it yet
    if (!this.currentSongLikes.has(userId)) {
      this.currentSongLikes.add(userId);
      
      // Credit the DJ who added the song
      const dj = this.users.get(this.currentSong.addedBy);
      if (dj) {
        dj.likesReceived += 1;
      }
    }
  }

  public skipSong(userId: string): boolean {
    if (!this.currentSong) return false;
    
    this.currentSongSkips.add(userId);
    
    // Check threshold (3, or number of users if less than 3)
    const activeUsers = this.users.size;
    const threshold = Math.min(3, activeUsers);
    
    if (this.currentSongSkips.size >= threshold) {
      // Threshold met! Skip the song.
      this.nextSong();
      return true; // Indicates a skip occurred
    }
    return false; // Indicates vote was registered but no skip yet
  }

  public getState(): RoomState {
    return {
      id: this.id,
      users: Array.from(this.users.values()),
      currentSong: this.currentSong,
      currentSongStartTimestamp: this.currentSongStartTimestamp,
      queue: this.getComputedQueue(),
      currentSongLikes: Array.from(this.currentSongLikes),
      currentSongSkips: Array.from(this.currentSongSkips),
    };
  }
}
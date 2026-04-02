import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { Room } from './Room';
import ytSearch from 'yt-search';

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // For MVP. Update for production
    methods: ['GET', 'POST'],
  },
});

app.get('/search', async (req, res) => {
  try {
    const q = req.query.q as string;
    if (!q) {
      return res.json([]);
    }
    
    // Append "audio" or "song" to highly bias YouTube's search algorithm towards music
    const searchQuery = `${q} song audio`;
    const r = await ytSearch(searchQuery);
    
    // Filter out obvious non-music videos (e.g. movies, long compilations)
    // Most standard songs are under 10 minutes (600 seconds)
    // We'll allow up to 15 minutes (900 seconds) just in case it's a long mix or extended version
    const musicVideos = r.videos.filter(v => v.seconds < 900);
    
    const videos = musicVideos.slice(0, 10).map(v => ({
      videoId: v.videoId,
      title: v.title,
      thumbnail: v.thumbnail,
      author: v.author.name,
      timestamp: v.timestamp,
      duration: v.seconds // Add duration in seconds
    }));
    
    res.json(videos);
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ error: 'Search failed' });
  }
});

const rooms = new Map<string, Room>();
const socketRoomMap = new Map<string, string>();
const socketUserMap = new Map<string, string>(); // socket.id -> userId

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join_room', ({ roomId, userId, nickname, avatar }) => {
    // Basic cleanup of previous room if needed
    const currentRoomId = socketRoomMap.get(socket.id);
    if (currentRoomId) {
      socket.leave(currentRoomId);
      const oldRoom = rooms.get(currentRoomId);
      if (oldRoom) {
        oldRoom.removeUserBySocketId(socket.id);
        io.to(currentRoomId).emit('room_state', oldRoom.getState());
      }
    }

    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Room(roomId));
    }

    const room = rooms.get(roomId)!;
    
    // Clear the destruction timer if it exists because someone joined!
    if (room.destroyTimer) {
      clearTimeout(room.destroyTimer);
      room.destroyTimer = null;
    }

    room.addUser(userId, socket.id, nickname, avatar);
    
    socket.join(roomId);
    socketRoomMap.set(socket.id, roomId);
    socketUserMap.set(socket.id, userId);

    console.log(`${nickname} (${userId}) joined room ${roomId}`);
    io.to(roomId).emit('room_state', room.getState());
  });

  socket.on('add_song', ({ videoId, title, duration }) => {
    const roomId = socketRoomMap.get(socket.id);
    const userId = socketUserMap.get(socket.id);
    if (!roomId || !userId) return;

    const room = rooms.get(roomId);
    if (!room) return;

    room.addSong(userId, videoId, title, duration);

    if (!room.currentSong) {
      room.nextSong();
    }

    io.to(roomId).emit('room_state', room.getState());
  });

  socket.on('like_song', () => {
    const roomId = socketRoomMap.get(socket.id);
    const userId = socketUserMap.get(socket.id);
    if (!roomId || !userId) return;

    const room = rooms.get(roomId);
    if (room) {
      room.likeSong(userId);
      io.to(roomId).emit('room_state', room.getState());
    }
  });

  socket.on('skip_song', () => {
    const roomId = socketRoomMap.get(socket.id);
    const userId = socketUserMap.get(socket.id);
    if (!roomId || !userId) return;

    const room = rooms.get(roomId);
    if (room) {
      room.skipSong(userId);
      // Whether it skipped or just recorded the vote, broadcast state
      io.to(roomId).emit('room_state', room.getState());
    }
  });

  socket.on('song_ended', ({ videoId }) => {
    const roomId = socketRoomMap.get(socket.id);
    if (!roomId) return;

    const room = rooms.get(roomId);
    if (!room) return;

    if (room.currentSong && room.currentSong.videoId === videoId) {
      room.nextSong();
      io.to(roomId).emit('room_state', room.getState());
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    const roomId = socketRoomMap.get(socket.id);
    if (roomId) {
      const room = rooms.get(roomId);
      if (room) {
        room.removeUserBySocketId(socket.id);
        
        if (room.users.size === 0) {
          // Grace period: Give users 10 seconds to reconnect before wiping the room
          console.log(`Room ${roomId} is empty. Starting 10s destruction timer.`);
          room.destroyTimer = setTimeout(() => {
            console.log(`Destroying room ${roomId}.`);
            rooms.delete(roomId);
          }, 10000);
        } else {
          io.to(roomId).emit('room_state', room.getState());
        }
      }
      socketRoomMap.delete(socket.id);
      socketUserMap.delete(socket.id);
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Syncro API running on port ${PORT}`);
});
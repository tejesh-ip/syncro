import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { Room } from './Room';

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // For MVP. Update for production
    methods: ['GET', 'POST'],
  },
});

// In-memory store for rooms
const rooms = new Map<string, Room>();

// Track which socket is in which room to handle disconnects cleanly
const socketRoomMap = new Map<string, string>();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // 1. Join Room
  socket.on('join_room', ({ roomId, nickname }) => {
    // Leave current room if already in one
    const currentRoomId = socketRoomMap.get(socket.id);
    if (currentRoomId) {
      socket.leave(currentRoomId);
      const oldRoom = rooms.get(currentRoomId);
      if (oldRoom) {
        oldRoom.removeUser(socket.id);
        io.to(currentRoomId).emit('room_state', oldRoom.getState());
      }
    }

    // Create room if it doesn't exist
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Room(roomId));
    }

    const room = rooms.get(roomId)!;
    room.addUser(socket.id, nickname);
    
    socket.join(roomId);
    socketRoomMap.set(socket.id, roomId);

    console.log(`${nickname} joined room ${roomId}`);

    // Broadcast updated state to everyone in the room
    io.to(roomId).emit('room_state', room.getState());
  });

  // 2. Add Song
  socket.on('add_song', ({ videoId, title }) => {
    const roomId = socketRoomMap.get(socket.id);
    if (!roomId) return;

    const room = rooms.get(roomId);
    if (!room) return;

    room.addSong(socket.id, videoId, title);

    // If nothing is playing, start playing immediately!
    if (!room.currentSong) {
      room.nextSong();
    }

    io.to(roomId).emit('room_state', room.getState());
  });

  // 3. Next Song (Triggered by a client when their song finishes)
  // To prevent multiple clients firing this at the same time and skipping 2 songs,
  // we could require the client to pass the videoId they just finished.
  socket.on('song_ended', ({ videoId }) => {
    const roomId = socketRoomMap.get(socket.id);
    if (!roomId) return;

    const room = rooms.get(roomId);
    if (!room) return;

    // Only skip if the song that ended is actually the current song
    if (room.currentSong && room.currentSong.videoId === videoId) {
      room.nextSong();
      io.to(roomId).emit('room_state', room.getState());
    }
  });

  // 4. Disconnect Handling
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    const roomId = socketRoomMap.get(socket.id);
    if (roomId) {
      const room = rooms.get(roomId);
      if (room) {
        room.removeUser(socket.id);
        
        // Clean up empty rooms
        if (room.users.size === 0) {
          console.log(`Room ${roomId} is empty. Destroying.`);
          rooms.delete(roomId);
        } else {
          io.to(roomId).emit('room_state', room.getState());
        }
      }
      socketRoomMap.delete(socket.id);
    }
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Syncro API running on port ${PORT}`);
});
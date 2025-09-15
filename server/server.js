import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Debug environment loading
console.log('Environment check:');
console.log('MURF_API_KEY configured:', process.env.MURF_API_KEY ? 'Yes' : 'No');
console.log('GEMINI_API_KEY configured:', process.env.GEMINI_API_KEY ? 'Yes' : 'No');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:8080"], // Vite dev server and test server
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Configure CORS
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:8080"],
  credentials: true
}));

// Add JSON body parser middleware
app.use(express.json());

app.use(express.json());

// Room data structure with persistent storage
const rooms = new Map();
const roomSettings = {
  defaultWorkDuration: 25 * 60, // 25 minutes
  defaultBreakDuration: 5 * 60, // 5 minutes
  maxRooms: 1000, // Maximum number of rooms to keep
  roomCleanupInterval: 60000 * 5 // Clean every 5 minutes instead of 1
};

// Helper function to clean expired rooms (only if empty)
const cleanExpiredRooms = () => {
  const now = Date.now();
  for (const [roomId, room] of rooms.entries()) {
    // Only delete rooms that are both expired AND empty
    if (room.expiry <= now && room.users.size === 0) {
      rooms.delete(roomId);
      console.log(`Empty expired room ${roomId} cleaned up`);
    }
  }
  
  // If we have too many rooms, clean up the oldest empty ones
  if (rooms.size > roomSettings.maxRooms) {
    const sortedRooms = Array.from(rooms.entries())
      .filter(([_, room]) => room.users.size === 0)
      .sort((a, b) => a[1].createdAt - b[1].createdAt);
    
    const roomsToDelete = sortedRooms.slice(0, rooms.size - roomSettings.maxRooms);
    roomsToDelete.forEach(([roomId]) => {
      rooms.delete(roomId);
      console.log(`Old empty room ${roomId} cleaned up`);
    });
  }
};

// Clean expired rooms every 5 minutes
setInterval(cleanExpiredRooms, roomSettings.roomCleanupInterval);

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Create a new room
  socket.on('createRoom', ({ name, subject, duration }) => {
    const roomId = uuidv4().substring(0, 8).toUpperCase(); // Short room code
    const expiry = Date.now() + (duration * 60 * 1000);
    
    const room = {
      id: roomId,
      host: name,
      subject,
      expiry,
      duration,
      createdAt: Date.now(),
      todos: [],
      timer: {
        isRunning: false,
        timeLeft: 25 * 60, // Default 25 minutes
        duration: 25 * 60, // Current timer duration
        type: 'focus', // 'focus' or 'break' or 'custom'
        startedBy: null, // User who started the timer
        startedAt: null,
        totalSessions: 0
      },
      users: new Map(),
      shareUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/room/${roomId}`
    };

    rooms.set(roomId, room);
    socket.join(roomId);
    
    // Add user to room
    room.users.set(socket.id, {
      username: name,
      joinedAt: Date.now(),
      isHost: true
    });

    console.log(`Room ${roomId} created by ${name}`);
    
    socket.emit('room:created', { 
      roomId, 
      room: {
        ...room,
        users: Array.from(room.users.entries()).map(([id, user]) => ({ id, ...user }))
      }
    });
  });

  // Join an existing room
  socket.on('joinRoom', ({ roomId, username }) => {
    const room = rooms.get(roomId);
    
    if (!room) {
      socket.emit('room:error', { message: 'Room not found' });
      return;
    }
    
    if (room.expiry <= Date.now()) {
      socket.emit('room:error', { message: 'Room has expired' });
      return;
    }

    socket.join(roomId);
    
    // Add user to room
    room.users.set(socket.id, {
      username,
      joinedAt: Date.now(),
      isHost: false
    });

    console.log(`${username} joined room ${roomId}`);
    
    // Notify user they joined successfully
    socket.emit('room:joined', { 
      roomId,
      room: {
        ...room,
        users: Array.from(room.users.entries()).map(([id, user]) => ({ id, ...user }))
      }
    });
    
    // Notify other users
    socket.to(roomId).emit('room:userJoined', { 
      username,
      userId: socket.id,
      users: Array.from(room.users.entries()).map(([id, user]) => ({ id, ...user }))
    });
  });

  // Leave room
  socket.on('leaveRoom', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const user = room.users.get(socket.id);
    if (user) {
      room.users.delete(socket.id);
      socket.leave(roomId);
      
      console.log(`${user.username} left room ${roomId}`);
      
      // Notify other users
      socket.to(roomId).emit('room:userLeft', { 
        username: user.username,
        userId: socket.id,
        users: Array.from(room.users.entries()).map(([id, user]) => ({ id, ...user }))
      });
      
      // Don't delete room immediately - keep it alive for rejoining
      console.log(`Room ${roomId} has ${room.users.size} users remaining`);
    }
  });

  // Custom timer events
  socket.on('timer:start', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const user = room.users.get(socket.id);
    if (!user) return;

    room.timer.isRunning = true;
    room.timer.startedBy = user.username;
    room.timer.startedAt = Date.now();
    
    io.to(roomId).emit('timer:started', { 
      timer: room.timer,
      startedBy: user.username 
    });
  });

  socket.on('timer:pause', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    room.timer.isRunning = false;
    room.timer.startedAt = null;
    
    io.to(roomId).emit('timer:paused', { 
      timer: room.timer,
      pausedBy: room.users.get(socket.id)?.username || 'Unknown'
    });
  });

  socket.on('timer:reset', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    room.timer.isRunning = false;
    room.timer.timeLeft = room.timer.duration;
    room.timer.startedAt = null;
    room.timer.startedBy = null;
    
    io.to(roomId).emit('timer:reset', { 
      timer: room.timer,
      resetBy: room.users.get(socket.id)?.username || 'Unknown'
    });
  });

  socket.on('timer:tick', ({ roomId, timeLeft }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    room.timer.timeLeft = timeLeft;
    socket.to(roomId).emit('timer:updated', { timer: room.timer });
  });

  socket.on('timer:complete', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    room.timer.isRunning = false;
    room.timer.totalSessions++;
    room.timer.startedAt = null;
    room.timer.startedBy = null;
    
    io.to(roomId).emit('timer:completed', { 
      timer: room.timer,
      completedBy: room.users.get(socket.id)?.username || 'Unknown'
    });
  });

  // Todo list events
  socket.on('todo:add', ({ roomId, todo }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const newTodo = {
      id: uuidv4(),
      text: todo.text,
      completed: false,
      createdBy: room.users.get(socket.id)?.username || 'Unknown',
      createdAt: Date.now(),
      progress: 0
    };

    room.todos.push(newTodo);
    io.to(roomId).emit('todo:added', { todo: newTodo, todos: room.todos });
  });

  socket.on('todo:update', ({ roomId, todoId, updates }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const todoIndex = room.todos.findIndex(t => t.id === todoId);
    if (todoIndex !== -1) {
      room.todos[todoIndex] = { ...room.todos[todoIndex], ...updates };
      io.to(roomId).emit('todo:updated', { 
        todo: room.todos[todoIndex], 
        todos: room.todos 
      });
    }
  });

  socket.on('todo:delete', ({ roomId, todoId }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    room.todos = room.todos.filter(t => t.id !== todoId);
    io.to(roomId).emit('todo:deleted', { todoId, todos: room.todos });
  });

  socket.on('todo:toggleComplete', ({ roomId, todoId }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const todo = room.todos.find(t => t.id === todoId);
    if (todo) {
      todo.completed = !todo.completed;
      todo.progress = todo.completed ? 100 : 0;
      io.to(roomId).emit('todo:updated', { todo, todos: room.todos });
    }
  });

  // Custom timer setting events
  socket.on('timer:set', ({ roomId, duration, type = 'focus' }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const user = room.users.get(socket.id);
    if (!user) return;

    // Stop current timer if running
    if (room.timer.isRunning) {
      room.timer.isRunning = false;
      room.timer.startedAt = null;
      room.timer.startedBy = null;
    }

    // Set new timer settings
    room.timer.duration = duration * 60;
    room.timer.timeLeft = duration * 60;
    room.timer.type = type;

    io.to(roomId).emit('timer:settingsUpdated', { 
      timer: room.timer,
      updatedBy: user.username
    });
  });

  // Share room functionality
  socket.on('room:getShareInfo', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const shareInfo = {
      roomId: room.id,
      subject: room.subject,
      host: room.host,
      shareUrl: room.shareUrl,
      whatsappUrl: `https://wa.me/?text=${encodeURIComponent(
        `Join my StudySphere room: ${room.subject}\nRoom ID: ${room.id}\nJoin here: ${room.shareUrl}`
      )}`,
      twitterUrl: `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        `Join my StudySphere room: ${room.subject} - ${room.shareUrl}`
      )}`,
      facebookUrl: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(room.shareUrl)}`
    };

    socket.emit('room:shareInfo', shareInfo);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    
    // Remove user from all rooms but keep rooms alive
    for (const [roomId, room] of rooms.entries()) {
      const user = room.users.get(socket.id);
      if (user) {
        room.users.delete(socket.id);
        
        // Notify other users
        socket.to(roomId).emit('room:userLeft', { 
          username: user.username,
          userId: socket.id,
          users: Array.from(room.users.entries()).map(([id, user]) => ({ id, ...user }))
        });
        
        // Don't delete room immediately - let cleanup function handle it later
        console.log(`User ${user.username} left room ${roomId}, room has ${room.users.size} users remaining`);
      }
    }
  });
});

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    activeRooms: rooms.size,
    timestamp: new Date().toISOString()
  });
});

// Import podcast helpers
import { generatePodcast } from '../podcast_helpers.js';

// Generate podcast endpoint
app.post('/generate-podcast', async (req, res) => {
  try {
    const { topic } = req.body;
    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    console.log('Request to generate podcast for topic:', topic);
    await generatePodcast(topic.trim(), res);
  } catch (error) {
    console.error('Error in /generate-podcast endpoint:', error.message);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`StudySphere Backend running on port ${PORT}`);
});

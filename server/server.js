import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import quizRouter from './src/routes/quiz.js';
import { initializeQuizSocket } from './src/sockets/quizSocket.js';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Vite dev server
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.set('socketio', io); // Make io accessible to routes

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));

app.use(express.json());
app.use('/api/quiz', quizRouter);

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
    } else if (room.expiry <= now && room.users.size > 0) {
      console.log(`Room ${roomId} is expired but still has ${room.users.size} users - keeping alive`);
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

initializeQuizSocket(io);

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Add heartbeat to keep connection alive
  socket.on('ping', () => {
    socket.emit('pong');
  });

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
    
    // Check if user is reconnecting
    let existingUser = null;
    for (const [socketId, user] of room.users.entries()) {
      if (user.username === username && user.disconnectedAt) {
        existingUser = { socketId, user };
        break;
      }
    }
    
    if (existingUser) {
      // User is reconnecting - update their socket ID and mark as connected
      room.users.delete(existingUser.socketId);
      room.users.set(socket.id, {
        ...existingUser.user,
        isConnected: true,
        disconnectedAt: null
      });
      console.log(`${username} reconnected to room ${roomId}`);
      
      // Notify other users of reconnection
      socket.to(roomId).emit('room:userReconnected', { 
        username: username,
        userId: socket.id,
        users: Array.from(room.users.entries()).map(([id, user]) => ({ id, ...user }))
      });
    } else {
      // New user joining
      room.users.set(socket.id, {
        username: username,
        joinedAt: Date.now(),
        isHost: false,
        isConnected: true,
        disconnectedAt: null
      });
      console.log(`${username} joined room ${roomId}`);
      
      // Notify other users of new join
      socket.to(roomId).emit('room:userJoined', { 
        username: username,
        userId: socket.id,
        users: Array.from(room.users.entries()).map(([id, user]) => ({ id, ...user }))
      });
    }
    
    // Notify user they joined successfully
    socket.emit('room:joined', { 
      roomId,
      room: {
        ...room,
        users: Array.from(room.users.entries()).map(([id, user]) => ({ id, ...user }))
      }
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

  // Handle disconnect - implement grace period for reconnection
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    
    // Instead of immediately removing user, mark them as temporarily disconnected
    for (const [roomId, room] of rooms.entries()) {
      const user = room.users.get(socket.id);
      if (user) {
        // Mark user as disconnected but keep them in room for 30 seconds
        user.disconnectedAt = Date.now();
        user.isConnected = false;
        
        console.log(`User ${user.username} temporarily disconnected from room ${roomId}`);
        
        // Set a timeout to remove user if they don't reconnect
        setTimeout(() => {
          const roomNow = rooms.get(roomId);
          if (roomNow) {
            const currentUser = roomNow.users.get(socket.id);
            if (currentUser && currentUser.disconnectedAt && !currentUser.isConnected) {
              // User hasn't reconnected within grace period, remove them
              roomNow.users.delete(socket.id);
              
              // Notify other users
              io.to(roomId).emit('room:userLeft', { 
                username: currentUser.username,
                userId: socket.id,
                users: Array.from(roomNow.users.values())
              });
              
              console.log(`User ${currentUser.username} permanently removed from room ${roomId} after grace period`);
            }
          }
        }, 30000); // 30 second grace period
        
        // Notify other users of temporary disconnection
        socket.to(roomId).emit('room:userDisconnected', { 
          username: user.username,
          userId: socket.id,
          users: Array.from(room.users.entries()).map(([id, user]) => ({ id, ...user }))
        });
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

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`StudySphere Backend running on port ${PORT}`);
});

import { io, Socket } from 'socket.io-client';

interface User {
  id: string;
  username: string;
  joinedAt: number;
  isHost: boolean;
  isConnected?: boolean;
  disconnectedAt?: number | null;
}

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdBy: string;
  createdAt: number;
  progress: number;
}

interface TimerState {
  isRunning: boolean;
  timeLeft: number;
  duration: number;
  type: 'focus' | 'break' | 'custom';
  startedBy: string | null;
  startedAt: number | null;
  totalSessions: number;
}

interface Room {
  id: string;
  host: string;
  subject: string;
  expiry: number;
  duration: number;
  createdAt: number;
  todos: Todo[];
  timer: TimerState;
  users: User[];
  shareUrl: string;
}

class SocketService {
  private socket: Socket | null = null;
  private roomId: string | null = null;

  connect() {
    if (!this.socket || !this.socket.connected) {
      console.log("SocketService: Creating new socket connection");
      this.socket = io('http://localhost:3001', {
        transports: ['websocket'],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 500, // Faster initial reconnection
        reconnectionDelayMax: 2000, // Shorter max delay
        timeout: 10000, // Shorter timeout
        forceNew: false
      });
      
      this.socket.on('connect', () => {
        console.log("SocketService: Connected to server", this.socket?.id);
        this.startHeartbeat();
      });
      
      this.socket.on('connect_error', (error) => {
        console.error("SocketService: Connection error:", error);
      });
      
      this.socket.on('disconnect', () => {
        console.log("SocketService: Disconnected from server");
        this.stopHeartbeat();
      });

      this.socket.on('pong', () => {
        console.log("SocketService: Received pong from server");
      });
    }
    return this.socket;
  }

  private heartbeatInterval: NodeJS.Timeout | null = null;

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('ping');
      }
    }, 30000); // Send ping every 30 seconds
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  disconnect() {
    if (this.socket) {
      this.stopHeartbeat();
      this.socket.disconnect();
      this.socket = null;
      this.roomId = null;
    }
  }

  // Room management
  createRoom(name: string, subject: string, duration: number) {
    this.socket?.emit('createRoom', { name, subject, duration });
  }

  joinRoom(roomId: string, username: string) {
    console.log("SocketService: Joining room", { roomId, username });
    this.roomId = roomId;
    this.socket?.emit('joinRoom', { roomId, username });
  }

  leaveRoom() {
    if (this.roomId) {
      this.socket?.emit('leaveRoom', { roomId: this.roomId });
      this.roomId = null;
    }
  }

  // Custom timer methods
  startTimer() {
    if (this.roomId) {
      this.socket?.emit('timer:start', { roomId: this.roomId });
    }
  }

  pauseTimer() {
    if (this.roomId) {
      this.socket?.emit('timer:pause', { roomId: this.roomId });
    }
  }

  resetTimer() {
    if (this.roomId) {
      this.socket?.emit('timer:reset', { roomId: this.roomId });
    }
  }

  updateTimerTime(timeLeft: number) {
    if (this.roomId) {
      this.socket?.emit('timer:tick', { roomId: this.roomId, timeLeft });
    }
  }

  completeTimer() {
    if (this.roomId) {
      this.socket?.emit('timer:complete', { roomId: this.roomId });
    }
  }

  // Todo methods
  addTodo(text: string) {
    if (this.roomId) {
      this.socket?.emit('todo:add', { 
        roomId: this.roomId, 
        todo: { text } 
      });
    }
  }

  updateTodo(todoId: string, updates: Partial<Todo>) {
    if (this.roomId) {
      this.socket?.emit('todo:update', { 
        roomId: this.roomId, 
        todoId, 
        updates 
      });
    }
  }

  deleteTodo(todoId: string) {
    if (this.roomId) {
      this.socket?.emit('todo:delete', { roomId: this.roomId, todoId });
    }
  }

  toggleTodoComplete(todoId: string) {
    if (this.roomId) {
      this.socket?.emit('todo:toggleComplete', { roomId: this.roomId, todoId });
    }
  }

  // Timer management
  setTimer(duration: number, type: 'focus' | 'break' | 'custom' = 'focus') {
    if (this.roomId) {
      this.socket?.emit('timer:set', { roomId: this.roomId, duration, type });
    }
  }

  // Sharing
  getShareInfo() {
    if (this.roomId) {
      this.socket?.emit('room:getShareInfo', { roomId: this.roomId });
    }
  }

  // Event listeners
  onRoomCreated(callback: (data: { roomId: string; room: Room }) => void) {
    this.socket?.on('room:created', callback);
  }

  onRoomJoined(callback: (data: { roomId: string; room: Room }) => void) {
    console.log("SocketService: Setting up room:joined listener");
    this.socket?.on('room:joined', (data) => {
      console.log("SocketService: Received room:joined event", data);
      callback(data);
    });
  }

  onRoomError(callback: (data: { message: string }) => void) {
    console.log("SocketService: Setting up room:error listener");
    this.socket?.on('room:error', (data) => {
      console.log("SocketService: Received room:error event", data);
      callback(data);
    });
  }

  onRoomExpired(callback: (data: { roomId: string }) => void) {
    this.socket?.on('room:expired', callback);
  }

  onUserJoined(callback: (data: { username: string; userId: string; users: User[] }) => void) {
    this.socket?.on('room:userJoined', callback);
  }

  onUserLeft(callback: (data: { username: string; userId: string; users: User[] }) => void) {
    this.socket?.on('room:userLeft', callback);
  }

  onUserDisconnected(callback: (data: { username: string; userId: string; users: User[] }) => void) {
    this.socket?.on('room:userDisconnected', callback);
  }

  onUserReconnected(callback: (data: { username: string; userId: string; users: User[] }) => void) {
    this.socket?.on('room:userReconnected', callback);
  }

  // Timer event listeners
  onTimerStarted(callback: (data: { timer: TimerState; startedBy: string }) => void) {
    this.socket?.on('timer:started', callback);
  }

  onTimerPaused(callback: (data: { timer: TimerState; pausedBy: string }) => void) {
    this.socket?.on('timer:paused', callback);
  }

  onTimerReset(callback: (data: { timer: TimerState; resetBy: string }) => void) {
    this.socket?.on('timer:reset', callback);
  }

  onTimerUpdated(callback: (data: { timer: TimerState }) => void) {
    this.socket?.on('timer:updated', callback);
  }

  onTimerCompleted(callback: (data: { timer: TimerState; completedBy: string }) => void) {
    this.socket?.on('timer:completed', callback);
  }

  // Todo event listeners
  onTodoAdded(callback: (data: { todo: Todo; todos: Todo[] }) => void) {
    this.socket?.on('todo:added', callback);
  }

  onTodoUpdated(callback: (data: { todo: Todo; todos: Todo[] }) => void) {
    this.socket?.on('todo:updated', callback);
  }

  onTodoDeleted(callback: (data: { todoId: string; todos: Todo[] }) => void) {
    this.socket?.on('todo:deleted', callback);
  }

  // Timer settings event listeners
  onTimerSettingsUpdated(callback: (data: { timer: TimerState; updatedBy: string }) => void) {
    this.socket?.on('timer:settingsUpdated', callback);
  }

  // Sharing event listeners
  onShareInfo(callback: (data: { shareUrl: string }) => void) {
    this.socket?.on('room:shareInfo', callback);
  }

  // Cleanup method to remove all listeners
  removeAllListeners() {
    this.socket?.removeAllListeners();
  }

  getCurrentRoomId() {
    return this.roomId;
  }
}

export const socketService = new SocketService();
export type { Room, Todo, TimerState, User };

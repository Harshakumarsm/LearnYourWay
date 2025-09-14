import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@clerk/clerk-react";
import { RoomHeader } from "@/components/StudyRoom/RoomHeader";
import { CustomTimer } from "@/components/StudyRoom/CustomTimer";
import { TodoList } from "@/components/StudyRoom/TodoList";
import { UserPresence } from "@/components/StudyRoom/UserPresence";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Home, Video } from "lucide-react";
import { socketService, type Room, type User } from "@/services/socket";
import { toast } from "sonner";

export const StudyRoom = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { user } = useUser();
  
  const [room, setRoom] = useState<Room | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!roomId || !user) return;

    const socket = socketService.connect();
    
    // Setup socket event listeners
    socketService.onRoomJoined(({ room: joinedRoom }) => {
      setRoom(joinedRoom);
      setUsers(joinedRoom.users);
      setIsLoading(false);
      setError(null);
    });

    socketService.onRoomError(({ message }) => {
      setError(message);
      setIsLoading(false);
      toast.error(message);
    });

    socketService.onRoomExpired(() => {
      setIsExpired(true);
      toast.error("Study session has expired!", {
        duration: 5000,
      });
    });

    socketService.onUserJoined(({ username, users: updatedUsers }) => {
      setUsers(updatedUsers);
      toast.success(`${username} joined the room!`);
    });

    socketService.onUserLeft(({ username, users: updatedUsers }) => {
      setUsers(updatedUsers);
      toast.info(`${username} left the room`);
    });

    // Todo event listeners
    socketService.onTodoAdded(({ todos }) => {
      setRoom(prev => prev ? { ...prev, todos } : null);
    });

    socketService.onTodoUpdated(({ todos }) => {
      setRoom(prev => prev ? { ...prev, todos } : null);
    });

    socketService.onTodoDeleted(({ todos }) => {
      setRoom(prev => prev ? { ...prev, todos } : null);
    });

    // Join the room
    const username = user.fullName || user.firstName || "Anonymous";
    socketService.joinRoom(roomId, username);

    // Cleanup on unmount
    return () => {
      socketService.removeAllListeners();
      if (room) {
        socketService.leaveRoom();
      }
    };
  }, [roomId, user]);

  const handleLeaveRoom = () => {
    socketService.removeAllListeners();
    setRoom(null);
    setUsers([]);
  };

  const goHome = () => {
    navigate("/");
  };

  const joinVideoCall = () => {
    navigate(`/video/${roomId}`);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-indigo-950 dark:via-gray-900 dark:to-purple-950 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto"
          />
          <h2 className="text-xl font-semibold">Connecting to study room...</h2>
          <p className="text-muted-foreground">Room ID: {roomId}</p>
        </motion.div>
      </div>
    );
  }

  // Error state
  if (error || !room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-red-950 dark:via-gray-900 dark:to-orange-950 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full"
        >
          <Card className="border-red-200 dark:border-red-800">
            <CardContent className="p-6 text-center space-y-4">
              <AlertTriangle className="w-16 h-16 text-red-500 mx-auto" />
              <h2 className="text-xl font-semibold text-red-700 dark:text-red-400">
                Room Not Found
              </h2>
              <p className="text-muted-foreground">
                {error || "The study room you're looking for doesn't exist or has expired."}
              </p>
              <Button onClick={goHome} className="w-full">
                <Home className="w-4 h-4 mr-2" />
                Return to Dashboard
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Expired state
  if (isExpired) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50 dark:from-orange-950 dark:via-gray-900 dark:to-yellow-950 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          <Card className="border-orange-200 dark:border-orange-800">
            <CardContent className="p-6 text-center space-y-4">
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <AlertTriangle className="w-16 h-16 text-orange-500 mx-auto" />
              </motion.div>
              <h2 className="text-xl font-semibold text-orange-700 dark:text-orange-400">
                Session Expired
              </h2>
              <p className="text-muted-foreground">
                This study room session has ended. Create or join a new room to continue studying.
              </p>
              <Button onClick={goHome} className="w-full">
                <Home className="w-4 h-4 mr-2" />
                Create New Session
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  const currentUser = users.find(u => u.username === (user?.fullName || user?.firstName || "Anonymous"));
  const isHost = currentUser?.isHost || false;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-indigo-950 dark:via-gray-900 dark:to-purple-950">
      {/* Room Header */}
      <RoomHeader 
        roomId={room.id}
        subject={room.subject}
        expiry={room.expiry}
        users={users}
        onLeave={handleLeaveRoom}
      />

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="container mx-auto px-4 py-6 max-w-7xl"
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Custom Timer */}
          <div className="lg:col-span-1">
            <CustomTimer 
              initialState={room.timer}
            />
          </div>

          {/* Middle Column - Todo List */}
          <div className="lg:col-span-1">
            <TodoList 
              todos={room.todos}
              currentUser={user?.fullName || user?.firstName || "Anonymous"}
            />
          </div>

          {/* Right Column - User Presence */}
          <div className="lg:col-span-1">
            <UserPresence 
              users={users}
              currentUserId={currentUser?.id}
            />
          </div>
        </div>


        {/* Mobile-friendly stacked layout for smaller screens */}
        <div className="block lg:hidden mt-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center text-sm text-muted-foreground"
          >
            Syncing in real-time with {users.length} member{users.length !== 1 ? 's' : ''}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

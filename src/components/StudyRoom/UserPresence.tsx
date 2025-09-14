import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, Crown, Clock } from "lucide-react";
import { type User } from "@/services/socket";

interface UserPresenceProps {
  users: User[];
  currentUserId?: string;
}

export const UserPresence = ({ users, currentUserId }: UserPresenceProps) => {
  const formatJoinTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return "Just joined";
    if (minutes === 1) return "1 minute ago";
    if (minutes < 60) return `${minutes} minutes ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return "1 hour ago";
    return `${hours} hours ago`;
  };

  const getInitials = (username: string) => {
    if (!username || typeof username !== 'string') {
      return 'U';
    }
    return username
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const cardVariants = {
    initial: { x: 20, opacity: 0 },
    animate: { 
      x: 0, 
      opacity: 1,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  const userVariants = {
    initial: { opacity: 0, y: 10, scale: 0.95 },
    animate: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { duration: 0.3, ease: "easeOut" }
    },
    exit: { 
      opacity: 0, 
      x: 20, 
      scale: 0.95,
      transition: { duration: 0.2, ease: "easeIn" }
    }
  };

  const avatarColors = [
    'bg-indigo-500',
    'bg-purple-500', 
    'bg-emerald-500',
    'bg-blue-500',
    'bg-pink-500',
    'bg-orange-500',
    'bg-teal-500',
    'bg-red-500'
  ];

  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
    >
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-2 border-blue-200 dark:border-blue-800">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            Active Members
            <Badge variant="secondary" className="ml-auto">
              {users.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-3">
          <div className="max-h-[180px] overflow-y-auto">
            <AnimatePresence>
            {users.map((user, index) => (
              <motion.div
                key={user.id}
                variants={userVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                layout
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  user.id === currentUserId 
                    ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700' 
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1, type: "spring", stiffness: 200 }}
                >
                  <Avatar className={`w-10 h-10 ${avatarColors[index % avatarColors.length]}`}>
                    <AvatarFallback className="text-white font-medium">
                      {getInitials(user.username)}
                    </AvatarFallback>
                  </Avatar>
                </motion.div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">
                      {user.username || 'Unknown User'}
                      {user.id === currentUserId && (
                        <span className="text-blue-600 ml-1">(You)</span>
                      )}
                    </span>
                    {user.isHost && (
                      <motion.div
                        initial={{ rotate: -10, scale: 0 }}
                        animate={{ rotate: 0, scale: 1 }}
                        transition={{ delay: 0.2, type: "spring" }}
                      >
                        <Crown className="w-4 h-4 text-yellow-500" />
                      </motion.div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{formatJoinTime(user.joinedAt)}</span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  {user.isHost && (
                    <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-700 dark:text-yellow-400">
                      Host
                    </Badge>
                  )}
                  {user.isConnected === false && (
                    <Badge variant="outline" className="text-xs border-orange-500 text-orange-700 dark:text-orange-400">
                      Reconnecting...
                    </Badge>
                  )}
                  <motion.div
                    animate={{ 
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 1, 0.5]
                    }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className={`w-2 h-2 rounded-full ${
                      user.isConnected === false ? 'bg-orange-500' : 'bg-green-500'
                    }`}
                  />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          </div>

          {users.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-6 text-muted-foreground"
            >
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No members in the room yet</p>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

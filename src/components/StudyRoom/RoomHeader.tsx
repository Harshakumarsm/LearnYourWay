import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Copy, Check, LogOut, Clock, Users as UsersIcon, Share2, MessageCircle, Video } from "lucide-react";
import { toast } from "sonner";
import { socketService, type User } from "@/services/socket";

interface RoomHeaderProps {
  roomId: string;
  subject: string;
  expiry: number;
  users: User[];
  onLeave: () => void;
}

export const RoomHeader = ({ roomId, subject, expiry, users, onLeave }: RoomHeaderProps) => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [shareInfo, setShareInfo] = useState<{ shareUrl: string } | null>(null);

  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, expiry - now);
      setTimeLeft(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [expiry]);

  const copyRoomKey = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      setCopied(true);
      toast.success("Room key copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy room key");
    }
  };

  const handleLeave = () => {
    socketService.leaveRoom();
    onLeave();
    navigate("/");
    toast.info("Left StudySphere room");
  };

  const shareToWhatsApp = () => {
    const shareUrl = `${window.location.origin}/room/${roomId}`;
    const message = `Join my StudySphere room: ${subject}\nRoom ID: ${roomId}\nJoin here: ${shareUrl}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const copyShareLink = async () => {
    const shareUrl = `${window.location.origin}/room/${roomId}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Share link copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy share link");
    }
  };

  const joinVideoCall = () => {
    // Scroll to video conference section instead of navigating to separate page
    const videoSection = document.querySelector('[data-video-conference]');
    if (videoSection) {
      videoSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${remainingMinutes}m`;
  };

  const headerVariants = {
    initial: { y: -20, opacity: 0 },
    animate: { 
      y: 0, 
      opacity: 1,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  return (
    <motion.div
      variants={headerVariants}
      initial="initial"
      animate="animate"
      className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-sm text-gray-800 shadow-lg border-b border-gray-200"
    >
      <div className="px-4 py-3 flex items-center justify-between">
        {/* Left: Subject and Room Info */}
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-xl font-bold">{subject}</h1>
            <div className="flex items-center gap-2 text-sm text-indigo-100">
              <UsersIcon className="w-4 h-4" />
              <span>{users.length} member{users.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>

        {/* Center: Room Key */}
        <motion.div 
          className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg border border-gray-200"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <span className="text-sm font-medium text-gray-700">Room:</span>
          <code className="font-mono text-lg font-bold text-gray-800">{roomId}</code>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={copyRoomKey}
            className="h-8 w-8 p-0 hover:bg-gray-200 text-gray-700"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-600" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
        </motion.div>

        {/* Right: Timer, Share buttons and Leave Button */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4" />
            <span className={`font-mono ${timeLeft < 300000 ? 'text-yellow-300' : ''}`}>
              {formatTime(timeLeft)}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={joinVideoCall}
              className="h-8 px-3 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              title="Start Video Call"
            >
              <Video className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Video</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={shareToWhatsApp}
              className="h-8 px-3 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              title="Share on WhatsApp"
            >
              <MessageCircle className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">WhatsApp</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={copyShareLink}
              className="h-8 px-3 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              title="Copy share link"
            >
              <Share2 className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Share</span>
            </Button>
          </div>
          
          <Button
            variant="destructive"
            size="sm"
            onClick={handleLeave}
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            <LogOut className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Leave Room</span>
            <span className="sm:hidden">Leave</span>
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

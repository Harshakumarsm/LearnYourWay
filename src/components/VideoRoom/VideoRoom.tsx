import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ZegoUIKitPrebuilt } from "@zegocloud/zego-uikit-prebuilt";
import { Button } from "@/components/ui/button";
import { Maximize2, Minimize2 } from "lucide-react";
import { toast } from "sonner";
import { zegoCloudService } from "@/services/zegoCloudService";

interface VideoRoomProps {
  roomId: string;
  userName: string;
  userID: string;
}

const appID = 1166166195;
const serverSecret = "d54a389f25728a8180aeaea4f883046d";

export const VideoRoom = ({ roomId, userName, userID }: VideoRoomProps) => {
  const navigate = useNavigate();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const meetingContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initializeZegoCloud();
    return () => {
      cleanup();
    };
  }, []);


  const initializeZegoCloud = async () => {
    try {
      if (!meetingContainerRef.current) return;

      setIsLoading(true);

      // Generate token for ZegoCloud
      const token = await zegoCloudService.getToken(userID, roomId);
      
      // Create ZegoCloud kit token
      const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
        appID,
        token,
        roomId,
        userID,
        userName
      );

      // Create ZegoCloud instance
      const zp = ZegoUIKitPrebuilt.create(kitToken);
      
      // Join the room
      zp.joinRoom({
        container: meetingContainerRef.current,
        scenario: {
          mode: ZegoUIKitPrebuilt.GroupCall,
        },
        showScreenSharingButton: true,
        showTurnOffCameraButton: true,
        showMuteAudioButton: true,
        showUserList: true,
        showLeavingView: true,
        showRemoveUserButton: true,
        showNonVideoUser: true,
        showOnlyAudioUser: true,
        onLeaveRoom: () => {
          toast.info("Left video room");
          navigate(-1); // Go back to previous page
        },
        onUserJoin: (user) => {
          toast.success(`${user.userName || 'User'} joined the call`);
        },
        onUserLeave: (user) => {
          toast.info(`${user.userName || 'User'} left the call`);
        },
      });

      setIsLoading(false);
      toast.success("Connected to video room");
    } catch (error) {
      console.error('Failed to initialize ZegoCloud:', error);
      toast.error("Failed to connect to video room");
      setIsLoading(false);
    }
  };

  const cleanup = () => {
    // ZegoUIKitPrebuilt handles cleanup automatically
    console.log("VideoRoom cleanup completed");
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900 flex items-center justify-center z-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-white mb-2">Connecting to Video Room...</h2>
          <p className="text-indigo-200">Room ID: {roomId}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900 z-50 ${
      isFullscreen ? 'p-0' : 'p-4'
    }`}>
      <div className={`relative ${isFullscreen ? 'h-full w-full' : 'h-full max-w-6xl mx-auto'}`}>
        {/* Header with Fullscreen Toggle */}
        <div className="absolute top-4 right-4 z-10">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
            className="bg-black/50 hover:bg-black/70 text-white border border-white/20"
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Video Container */}
        <div 
          className={`bg-black rounded-lg overflow-hidden ${
            isFullscreen ? 'h-full w-full' : 'h-full'
          }`}
          ref={meetingContainerRef}
        />
      </div>
    </div>
  );
};

export default VideoRoom;
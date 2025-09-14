import { useEffect, useRef, useState, useCallback } from "react";
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
  containerRef?: React.RefObject<HTMLDivElement>;
}

const appID = 1166166195;
const serverSecret = "d54a389f25728a8180aeaea4f883046d";

export const VideoRoom = ({ roomId, userName, userID, containerRef }: VideoRoomProps) => {
  const navigate = useNavigate();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const meetingContainerRef = useRef<HTMLDivElement>(null);

  const initializeZegoCloud = useCallback(async () => {
    try {
      if (!meetingContainerRef.current) return;

      setIsLoading(true);

      // Validate required parameters
      if (!roomId || !userID || !userName) {
        throw new Error('Missing required parameters: roomId, userID, or userName');
      }

      // Validate ZegoCloud credentials
      if (!appID || !serverSecret) {
        throw new Error('ZegoCloud credentials not configured');
      }

      console.log('Initializing ZegoCloud with:', { appID, roomId, userID, userName });

      // For development/testing, use ZegoCloud's test token generation directly
      const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
        appID,
        serverSecret,
        roomId,
        userID,
        userName
      );

      console.log('Generated kit token successfully');

      // Create ZegoCloud instance
      const zp = ZegoUIKitPrebuilt.create(kitToken);
      
      // Join the room
      zp.joinRoom({
        container: meetingContainerRef.current,
        scenario: {
          mode: ZegoUIKitPrebuilt.GroupCall,
        },
        // --- UI Customization ---
        // Hide pre-join view
        showPreJoinView: false,
        
        // Hide all top bar elements
        showRoomTimer: false,
        showRoomDetailsButton: false,
        showUserList: false,
        showLayoutButton: false,

        // Hide all bottom bar controls 
        showMyCameraToggleButton: false,
        showMyMicrophoneToggleButton: false,
        showAudioVideoSettingsButton: false,
        showScreenSharingButton: false, // Hide screen sharing
        showTextChat: false,
        showPinButton: false,
        showLeaveRoomButton: false, // Hide leave button
        turnOnMicrophoneWhenJoining: true,
        turnOnCameraWhenJoining: true,
        
        // Configure what happens on leave
        onLeaveRoom: () => {
          toast.info("Left video room");
          navigate(-1); // Go back to previous page
        },
        onUserJoin: (users) => {
          const user = Array.isArray(users) ? users[0] : users;
          toast.success(`${user?.userID || 'User'} joined the call`);
        },
        onUserLeave: (users) => {
          const user = Array.isArray(users) ? users[0] : users;
          toast.info(`${user?.userID || 'User'} left the call`);
        },
      });

      setIsLoading(false);
      toast.success("Connected to video room");
    } catch (error) {
      console.error('Failed to initialize ZegoCloud:', error);
      toast.error("Failed to connect to video room");
      setIsLoading(false);
    }
  }, [roomId, userID, userName, navigate]); // useCallback dependencies

  useEffect(() => {
    initializeZegoCloud();
    return () => {
      cleanup();
    };
  }, [initializeZegoCloud]);

  const cleanup = () => {
    // ZegoUIKitPrebuilt handles cleanup automatically
    console.log("VideoRoom cleanup completed");
  };

  // Define types for fullscreen API
  interface FullscreenElement extends HTMLDivElement {
    webkitRequestFullscreen?: () => Promise<void>;
    msRequestFullscreen?: () => Promise<void>;
  }

  interface FullscreenDocument extends Document {
    webkitExitFullscreen?: () => Promise<void>;
    msExitFullscreen?: () => Promise<void>;
  }
  
  const toggleFullscreen = () => {
    // Target the provided containerRef if it exists, otherwise default to the meeting container's parent
    const element = (containerRef?.current || meetingContainerRef.current?.parentElement || meetingContainerRef.current) as FullscreenElement | null;
    if (!element) return;

    if (!document.fullscreenElement) {
      // Request fullscreen with fallbacks for different browsers
      if (element.requestFullscreen) {
        element.requestFullscreen().catch(err => {
          console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
          toast.error("Couldn't enter fullscreen mode");
        });
      } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen();
      } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      // Exit fullscreen with fallbacks
      const doc = document as FullscreenDocument;
      if (doc.exitFullscreen) {
        doc.exitFullscreen();
      } else if (doc.webkitExitFullscreen) {
        doc.webkitExitFullscreen();
      } else if (doc.msExitFullscreen) {
        doc.msExitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

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
    <div className="fixed inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900 z-50">
      <div className="relative h-full w-full">
        {/* Header with Fullscreen Toggle */}
        {/* Video Container */}
        <div 
          className="h-full w-full relative"
          ref={meetingContainerRef}
        >
          {/* Fullscreen button overlay */}
          <div className="absolute top-4 right-4 z-50">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
              className="bg-black/40 hover:bg-black/60 text-white border border-white/20 rounded-full p-2 w-10 h-10 flex items-center justify-center"
            >
              {isFullscreen ? (
                <Minimize2 className="w-6 h-6" />
              ) : (
                <Maximize2 className="w-6 h-6" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoRoom;
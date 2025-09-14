import { useEffect, useRef, useState } from "react";
import { ZegoUIKitPrebuilt } from "@zegocloud/zego-uikit-prebuilt";
import { Button } from "@/components/ui/button";
import { Video, VideoOff, Mic, MicOff, PhoneOff } from "lucide-react";
import { toast } from "sonner";
import { zegoCloudService } from "@/services/zegoCloudService";

interface VideoConferenceProps {
  roomId: string;
  username: string;
  topic?: string;
}

const appID = 1166166195;
const serverSecret = "d54a389f25728a8180aeaea4f883046d";

export const VideoConference = ({ roomId, username, topic }: VideoConferenceProps) => {
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const meetingContainerRef = useRef<HTMLDivElement>(null);
  const zegoInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (isConnected) {
      initializeZegoCloud();
    }
    
    return () => {
      cleanup();
    };
  }, [isConnected, roomId, username]);

  const initializeZegoCloud = async () => {
    try {
      if (!meetingContainerRef.current || !isConnected) return;

      setIsLoading(true);

      // Generate a simple userID based on username
      const userID = `${username.replace(/\s+/g, '_')}_${Date.now()}`;
      
      // Generate token for ZegoCloud
      const token = await zegoCloudService.getToken(userID, roomId);
      
      // Create ZegoCloud kit token
      const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
        appID,
        token,
        roomId,
        userID,
        username
      );

      // Create ZegoCloud instance with minimal UI for study room integration
      const zego = ZegoUIKitPrebuilt.create(kitToken);
      zegoInstanceRef.current = zego;

      // Configure for study room (minimal video conference)
      await zego.joinRoom({
        container: meetingContainerRef.current,
        scenario: {
          mode: ZegoUIKitPrebuilt.GroupCall,
        },
        showPreJoinView: false,
        showScreenSharingButton: true,
        showLayoutButton: false,
        showPinButton: false,
        maxUsers: 6,
        onJoinRoom: () => {
          setIsLoading(false);
          toast.success("Joined video conference!");
        },
        onLeaveRoom: () => {
          setIsConnected(false);
          toast.info("Left video conference");
        },
        onError: (error) => {
          console.error("ZegoCloud error:", error);
          toast.error("Video conference error");
          setIsLoading(false);
        }
      });

    } catch (error) {
      console.error("Failed to initialize video conference:", error);
      toast.error("Failed to start video conference");
      setIsLoading(false);
    }
  };

  const cleanup = () => {
    if (zegoInstanceRef.current) {
      try {
        zegoInstanceRef.current.destroy();
        zegoInstanceRef.current = null;
      } catch (error) {
        console.error("Error cleaning up ZegoCloud:", error);
      }
    }
  };

  const handleJoinVideo = () => {
    setIsConnected(true);
  };

  const handleLeaveVideo = () => {
    cleanup();
    setIsConnected(false);
  };

  const toggleVideo = () => {
    if (zegoInstanceRef.current) {
      const newState = !isVideoEnabled;
      zegoInstanceRef.current.turnCameraOn(newState);
      setIsVideoEnabled(newState);
    }
  };

  const toggleAudio = () => {
    if (zegoInstanceRef.current) {
      const newState = !isAudioEnabled;
      zegoInstanceRef.current.turnMicrophoneOn(newState);
      setIsAudioEnabled(newState);
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-6 shadow-lg">
        <div className="text-center">
          <div className="mb-4">
            <Video className="mx-auto h-12 w-12 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Video Conference
          </h3>
          <p className="text-gray-600 mb-4">
            {topic ? `Join video conference for ${topic}` : "Connect with study partners via video"}
          </p>
          <Button 
            onClick={handleJoinVideo}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Join Video Conference
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-semibold">Video Conference</h3>
            {topic && <p className="text-blue-100 text-sm">{topic}</p>}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={toggleVideo}
              className="text-white hover:bg-white/20"
            >
              {isVideoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={toggleAudio}
              className="text-white hover:bg-white/20"
            >
              {isAudioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleLeaveVideo}
              className="text-white hover:bg-red-500/20"
            >
              <PhoneOff className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600">Connecting to video conference...</p>
            </div>
          </div>
        )}
        <div 
          ref={meetingContainerRef}
          className="w-full h-96 bg-gray-900"
        />
      </div>
    </div>
  );
};
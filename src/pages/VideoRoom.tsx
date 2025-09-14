import { useParams, useLocation } from "react-router-dom";
import { VideoRoom } from "@/components/VideoRoom/VideoRoom";
import { useUser } from "@clerk/clerk-react";

export const VideoRoomPage = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { user } = useUser();
  const location = useLocation();

  // Get parameters from navigation state or URL
  const userName = user?.fullName || user?.firstName || "Anonymous";
  const userID = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  if (!roomId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-red-950 dark:via-gray-900 dark:to-orange-950 flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-700 dark:text-red-400">
            Invalid Room ID
          </h2>
          <p className="text-muted-foreground">
            No room ID provided for video call.
          </p>
        </div>
      </div>
    );
  }

  return (
    <VideoRoom 
      roomId={roomId}
      userName={userName}
      userID={userID}
    />
  );
};

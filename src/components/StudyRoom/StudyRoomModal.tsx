import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Plus, Key, Clock, BookOpen, Copy, Check, Share2, MessageCircle, Twitter, Facebook } from "lucide-react";
import { socketService } from "@/services/socket";
import { toast } from "sonner";

interface StudyRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StudyRoomModal = ({ isOpen, onClose }: StudyRoomModalProps) => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"create" | "join">("create");
  const [isLoading, setIsLoading] = useState(false);
  const [showRoomKey, setShowRoomKey] = useState(false);
  const [generatedRoomId, setGeneratedRoomId] = useState("");
  const [copied, setCopied] = useState(false);
  const [shareInfo, setShareInfo] = useState<any>(null);
  const [showShareOptions, setShowShareOptions] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: user?.fullName || user?.firstName || "",
    subject: "",
    duration: 60,
    roomKey: ""
  });

  const handleCreateRoom = async () => {
    if (!formData.subject || !formData.duration) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    
    try {
      // Connect to socket
      const socket = socketService.connect();
      
      // Listen for room creation success
      socketService.onRoomCreated(({ roomId, room }) => {
        setGeneratedRoomId(roomId);
        setShowRoomKey(true);
        setIsLoading(false);
        setShareInfo(room);
        toast.success("StudySphere room created successfully!");
      });

      // Listen for errors
      socketService.onRoomError(({ message }) => {
        toast.error(message);
        setIsLoading(false);
      });

      // Create the room
      socketService.createRoom(formData.name, formData.subject, formData.duration);
      
    } catch (error) {
      console.error("Error creating room:", error);
      toast.error("Failed to create room. Please try again.");
      setIsLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!formData.roomKey.trim()) {
      toast.error("Please enter a room key");
      return;
    }

    setIsLoading(true);
    
    try {
      const socket = socketService.connect();
      
      // Listen for successful join
      socketService.onRoomJoined(({ roomId }) => {
        setIsLoading(false);
        onClose();
        navigate(`/room/${roomId}`);
        toast.success("Joined study room successfully!");
      });

      // Listen for errors
      socketService.onRoomError(({ message }) => {
        toast.error(message);
        setIsLoading(false);
      });

      // Join the room
      socketService.joinRoom(formData.roomKey.trim().toUpperCase(), formData.name);
      
    } catch (error) {
      console.error("Error joining room:", error);
      toast.error("Failed to join room. Please try again.");
      setIsLoading(false);
    }
  };

  const copyRoomKey = async () => {
    try {
      await navigator.clipboard.writeText(generatedRoomId);
      setCopied(true);
      toast.success("Room key copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy room key");
    }
  };

  const joinMyRoom = () => {
    onClose();
    navigate(`/room/${generatedRoomId}`);
  };

  const shareToWhatsApp = () => {
    if (shareInfo) {
      const message = `Join my StudySphere room: ${shareInfo.subject}\nRoom ID: ${shareInfo.id}\nJoin here: ${shareInfo.shareUrl}`;
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  const shareToTwitter = () => {
    if (shareInfo) {
      const message = `Join my StudySphere room: ${shareInfo.subject} - ${shareInfo.shareUrl}`;
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`;
      window.open(twitterUrl, '_blank');
    }
  };

  const shareToFacebook = () => {
    if (shareInfo) {
      const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareInfo.shareUrl)}`;
      window.open(facebookUrl, '_blank');
    }
  };

  const copyShareLink = async () => {
    if (shareInfo) {
      try {
        await navigator.clipboard.writeText(shareInfo.shareUrl);
        toast.success("Share link copied to clipboard!");
      } catch (error) {
        toast.error("Failed to copy share link");
      }
    }
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { duration: 0.3, ease: "easeOut" }
    },
    exit: { 
      opacity: 0, 
      scale: 0.95,
      transition: { duration: 0.2, ease: "easeIn" }
    }
  };

  const cardVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { duration: 0.4, ease: "easeOut" }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="sm:max-w-md p-0 overflow-hidden">
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-indigo-950 dark:via-gray-900 dark:to-purple-950"
            >
              <DialogHeader className="p-6 pb-0">
                <DialogTitle className="flex items-center gap-2 text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  <Users className="w-6 h-6 text-indigo-600" />
                  StudySphere
                </DialogTitle>
              </DialogHeader>

              <div className="p-6">
                <AnimatePresence mode="wait">
                  {!showRoomKey ? (
                    <motion.div
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      key="main-form"
                    >
                      <Tabs value={mode} onValueChange={(value) => setMode(value as "create" | "join")}>
                        <TabsList className="grid w-full grid-cols-2 mb-6">
                          <TabsTrigger value="create" className="flex items-center gap-2">
                            <Plus className="w-4 h-4" />
                            Create Room
                          </TabsTrigger>
                          <TabsTrigger value="join" className="flex items-center gap-2">
                            <Key className="w-4 h-4" />
                            Join Room
                          </TabsTrigger>
                        </TabsList>

                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <div className="space-y-4 mb-6">
                            <div>
                              <Label htmlFor="name" className="text-sm font-medium">
                                Your Name
                              </Label>
                              <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Enter your name"
                                className="mt-1"
                              />
                            </div>
                          </div>

                          <TabsContent value="create" className="space-y-4 m-0">
                            <div>
                              <Label htmlFor="subject" className="text-sm font-medium">
                                Subject
                              </Label>
                              <div className="relative mt-1">
                                <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                  id="subject"
                                  value={formData.subject}
                                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                  placeholder="e.g., Math, AI Revision, Biology"
                                  className="pl-10"
                                />
                              </div>
                            </div>

                            <div>
                              <Label htmlFor="duration" className="text-sm font-medium">
                                Room Duration (minutes)
                              </Label>
                              <div className="relative mt-1">
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                  id="duration"
                                  type="number"
                                  value={formData.duration}
                                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 60 })}
                                  placeholder="60"
                                  min="15"
                                  max="480"
                                  className="pl-10"
                                />
                              </div>
                            </div>


                            <Button 
                              onClick={handleCreateRoom}
                              disabled={isLoading}
                              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                            >
                              {isLoading ? (
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                                />
                              ) : (
                                <Plus className="w-4 h-4 mr-2" />
                              )}
                              {isLoading ? "Creating Room..." : "Create Study Room"}
                            </Button>
                          </TabsContent>

                          <TabsContent value="join" className="space-y-4 m-0">
                            <div>
                              <Label htmlFor="roomKey" className="text-sm font-medium">
                                Room Key
                              </Label>
                              <div className="relative mt-1">
                                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                  id="roomKey"
                                  value={formData.roomKey}
                                  onChange={(e) => setFormData({ ...formData, roomKey: e.target.value })}
                                  placeholder="Paste room key here"
                                  className="pl-10 font-mono"
                                />
                              </div>
                            </div>

                            <Button 
                              onClick={handleJoinRoom}
                              disabled={isLoading}
                              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                            >
                              {isLoading ? (
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                                />
                              ) : (
                                <Key className="w-4 h-4 mr-2" />
                              )}
                              {isLoading ? "Joining Room..." : "Join Study Room"}
                            </Button>
                          </TabsContent>
                        </motion.div>
                      </Tabs>
                    </motion.div>
                  ) : (
                    <motion.div
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      key="room-key"
                      className="text-center"
                    >
                      <Card className="border-2 border-dashed border-indigo-300 bg-indigo-50 dark:bg-indigo-950/20">
                        <CardContent className="p-6">
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                            className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4"
                          >
                            <Key className="w-8 h-8 text-white" />
                          </motion.div>
                          
                          <h3 className="text-xl font-bold mb-2">Room Created!</h3>
                          <p className="text-muted-foreground mb-4">
                            Share this room key with others:
                          </p>
                          
                          <div className="flex items-center justify-center gap-2 mb-6">
                            <code className="bg-white dark:bg-gray-800 px-4 py-2 rounded-lg text-xl font-mono font-bold border">
                              {generatedRoomId}
                            </code>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={copyRoomKey}
                              className="p-2"
                            >
                              {copied ? (
                                <Check className="w-4 h-4 text-green-600" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                          </div>

                          <div className="space-y-3">
                            <Button 
                              onClick={joinMyRoom}
                              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                            >
                              Enter StudySphere Room
                            </Button>

                            {/* Share Options */}
                            <div className="space-y-3">
                              <div className="text-center">
                                <span className="text-sm text-muted-foreground">Share with others:</span>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={shareToWhatsApp}
                                  className="flex items-center gap-2"
                                >
                                  <MessageCircle className="w-4 h-4 text-green-600" />
                                  WhatsApp
                                </Button>
                                
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={copyShareLink}
                                  className="flex items-center gap-2"
                                >
                                  <Share2 className="w-4 h-4" />
                                  Copy Link
                                </Button>
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={shareToTwitter}
                                  className="flex items-center gap-2"
                                >
                                  <Twitter className="w-4 h-4 text-blue-500" />
                                  Twitter
                                </Button>
                                
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={shareToFacebook}
                                  className="flex items-center gap-2"
                                >
                                  <Facebook className="w-4 h-4 text-blue-600" />
                                  Facebook
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
};

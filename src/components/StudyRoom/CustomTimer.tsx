import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Play, Pause, RotateCcw, Timer, Focus, Coffee } from "lucide-react";
import { socketService, type TimerState } from "@/services/socket";
import { toast } from "sonner";

interface CustomTimerProps {
  initialState: TimerState;
}

export const CustomTimer = ({ initialState }: CustomTimerProps) => {
  const [timerState, setTimerState] = useState<TimerState>(initialState);
  const [localTimeLeft, setLocalTimeLeft] = useState(initialState.timeLeft);
  const intervalRef = useRef<NodeJS.Timeout>();
  const [showTimerSettings, setShowTimerSettings] = useState(false);
  const [customTimer, setCustomTimer] = useState({
    duration: 25,
    type: 'focus' as 'focus' | 'break' | 'custom'
  });

  useEffect(() => {
    // Listen for timer updates from socket
    socketService.onTimerStarted(({ timer, startedBy }) => {
      setTimerState(timer);
      setLocalTimeLeft(timer.timeLeft);
      toast.info(`Timer started by ${startedBy}`, { duration: 2000 });
    });

    socketService.onTimerPaused(({ timer, pausedBy }) => {
      setTimerState(timer);
      setLocalTimeLeft(timer.timeLeft);
      toast.info(`Timer paused by ${pausedBy}`, { duration: 2000 });
    });

    socketService.onTimerReset(({ timer, resetBy }) => {
      setTimerState(timer);
      setLocalTimeLeft(timer.timeLeft);
      toast.info(`Timer reset by ${resetBy}`, { duration: 2000 });
    });

    socketService.onTimerUpdated(({ timer }) => {
      setTimerState(timer);
      setLocalTimeLeft(timer.timeLeft);
    });

    socketService.onTimerCompleted(({ timer, completedBy }) => {
      setTimerState(timer);
      setLocalTimeLeft(timer.timeLeft);
      toast.success(`🎉 ${timer.type} session completed by ${completedBy}!`, {
        duration: 5000,
      });
    });

    socketService.onTimerSettingsUpdated(({ timer, updatedBy }) => {
      setTimerState(timer);
      setLocalTimeLeft(timer.timeLeft);
      toast.info(`Timer updated by ${updatedBy}`, { duration: 3000 });
    });

    return () => {
      socketService.removeAllListeners();
    };
  }, []);

  useEffect(() => {
    if (timerState.isRunning) {
      intervalRef.current = setInterval(() => {
        setLocalTimeLeft((prev) => {
          const newTime = Math.max(0, prev - 1);
          
          // Sync with server every 10 seconds
          if (newTime % 10 === 0) {
            socketService.updateTimerTime(newTime);
          }
          
          // Handle timer completion
          if (newTime === 0) {
            socketService.completeTimer();
            return newTime;
          }
          
          return newTime;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timerState.isRunning]);

  const handleStart = () => {
    socketService.startTimer();
  };

  const handlePause = () => {
    socketService.pauseTimer();
  };

  const handleReset = () => {
    socketService.resetTimer();
  };

  const handleSetCustomTimer = () => {
    socketService.setTimer(customTimer.duration, customTimer.type);
    setShowTimerSettings(false);
    toast.success(`Timer set to ${customTimer.duration} minutes for ${customTimer.type} session`);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    return ((timerState.duration - localTimeLeft) / timerState.duration) * 100;
  };

  const getTimerIcon = () => {
    switch (timerState.type) {
      case 'focus':
        return <Focus className="w-6 h-6 text-indigo-600" />;
      case 'break':
        return <Coffee className="w-6 h-6 text-emerald-600" />;
      default:
        return <Timer className="w-6 h-6 text-purple-600" />;
    }
  };

  const getTimerColor = () => {
    switch (timerState.type) {
      case 'focus':
        return {
          text: 'text-indigo-600',
          bg: 'bg-indigo-600',
          hover: 'hover:bg-indigo-700',
          progress: '[&>div]:bg-indigo-600'
        };
      case 'break':
        return {
          text: 'text-emerald-600',
          bg: 'bg-emerald-600',
          hover: 'hover:bg-emerald-700',
          progress: '[&>div]:bg-emerald-600'
        };
      default:
        return {
          text: 'text-purple-600',
          bg: 'bg-purple-600',
          hover: 'hover:bg-purple-700',
          progress: '[&>div]:bg-purple-600'
        };
    }
  };

  const cardVariants = {
    initial: { scale: 0.95, opacity: 0 },
    animate: { 
      scale: 1, 
      opacity: 1,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  const timerVariants = {
    pulse: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const colors = getTimerColor();

  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
    >
      <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 border-2 border-indigo-200 dark:border-indigo-800">
        <CardHeader className="text-center pb-4">
          <CardTitle className="flex items-center justify-center gap-2 text-xl">
            {getTimerIcon()}
            <span className="capitalize">{timerState.type} Session</span>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Timer Display */}
          <motion.div
            variants={timerVariants}
            animate={timerState.isRunning ? "pulse" : ""}
            className="text-center"
          >
            <motion.div
              className={`text-6xl font-mono font-bold ${colors.text}`}
            >
              {formatTime(localTimeLeft)}
            </motion.div>
            
            <div className="mt-2 text-sm text-muted-foreground">
              {timerState.startedBy && (
                <span>Started by {timerState.startedBy}</span>
              )}
            </div>
          </motion.div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress 
              value={getProgressPercentage()} 
              className={`h-3 ${colors.progress}`}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span>{Math.round(getProgressPercentage())}%</span>
            </div>
          </div>

          {/* Controls */}
          <AnimatePresence mode="wait">
            <motion.div
              key="timer-controls"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              {/* Main Timer Controls */}
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={timerState.isRunning ? handlePause : handleStart}
                  className={`flex items-center gap-2 ${colors.bg} ${colors.hover} text-white`}
                >
                  {timerState.isRunning ? (
                    <>
                      <Pause className="w-4 h-4" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Start
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </Button>
              </div>

              {/* Timer Settings Button */}
              <div className="flex justify-center">
                <Dialog open={showTimerSettings} onOpenChange={setShowTimerSettings}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="flex items-center gap-2">
                      <Timer className="w-4 h-4" />
                      Set Custom Timer
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Set Custom Timer</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Timer Type</label>
                        <Select
                          value={customTimer.type}
                          onValueChange={(value: 'focus' | 'break' | 'custom') => 
                            setCustomTimer({ ...customTimer, type: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="focus">Focus Session</SelectItem>
                            <SelectItem value="break">Break Time</SelectItem>
                            <SelectItem value="custom">Custom Timer</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Duration (minutes)</label>
                        <Select
                          value={customTimer.duration.toString()}
                          onValueChange={(value) => 
                            setCustomTimer({ ...customTimer, duration: parseInt(value) })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5">5 minutes</SelectItem>
                            <SelectItem value="10">10 minutes</SelectItem>
                            <SelectItem value="15">15 minutes</SelectItem>
                            <SelectItem value="25">25 minutes</SelectItem>
                            <SelectItem value="30">30 minutes</SelectItem>
                            <SelectItem value="45">45 minutes</SelectItem>
                            <SelectItem value="60">60 minutes</SelectItem>
                            <SelectItem value="90">90 minutes</SelectItem>
                            <SelectItem value="120">120 minutes</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <Button 
                        onClick={handleSetCustomTimer}
                        className="w-full"
                      >
                        Set Timer for Everyone
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              
              {/* Session Stats */}
              <div className="text-center text-xs text-muted-foreground">
                {timerState.totalSessions} session{timerState.totalSessions !== 1 ? 's' : ''} completed
              </div>
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
};

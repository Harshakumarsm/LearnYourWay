import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Play, Pause, RotateCcw, Coffee, Target, Settings, Timer } from "lucide-react";
import { socketService, type PomodoroState } from "@/services/socket";
import { toast } from "sonner";

interface PomodoroTimerProps {
  initialState: PomodoroState;
  isHost?: boolean;
}

export const PomodoroTimer = ({ initialState, isHost = false }: PomodoroTimerProps) => {
  const [pomodoroState, setPomodoroState] = useState<PomodoroState>(initialState);
  const [localTimeLeft, setLocalTimeLeft] = useState(initialState.timeLeft);
  const intervalRef = useRef<NodeJS.Timeout>();
  const [showTimerSettings, setShowTimerSettings] = useState(false);
  const [customTimer, setCustomTimer] = useState({
    duration: 25,
    type: 'work' as 'work' | 'break' | 'longBreak'
  });

  useEffect(() => {
    // Listen for pomodoro updates from socket
    socketService.onPomodoroStarted(({ pomodoro }) => {
      setPomodoroState(pomodoro);
      setLocalTimeLeft(pomodoro.timeLeft);
    });

    socketService.onPomodoroPaused(({ pomodoro }) => {
      setPomodoroState(pomodoro);
      setLocalTimeLeft(pomodoro.timeLeft);
    });

    socketService.onPomodoroReset(({ pomodoro }) => {
      setPomodoroState(pomodoro);
      setLocalTimeLeft(pomodoro.timeLeft);
    });

    socketService.onPomodoroUpdated(({ pomodoro }) => {
      setPomodoroState(pomodoro);
      setLocalTimeLeft(pomodoro.timeLeft);
    });

    socketService.onPomodoroSessionComplete(({ pomodoro }) => {
      setPomodoroState(pomodoro);
      setLocalTimeLeft(pomodoro.timeLeft);
      
      if (pomodoro.sessionType === 'break' || pomodoro.sessionType === 'longBreak') {
        toast.success("🎉 Work session complete! Time for a break!", {
          duration: 5000,
        });
      } else {
        toast.success("☕ Break time over! Ready for another session?", {
          duration: 5000,
        });
      }
    });

    socketService.onTimerSettingsUpdated(({ pomodoro, updatedBy }) => {
      setPomodoroState(pomodoro);
      setLocalTimeLeft(pomodoro.timeLeft);
      toast.info(`Timer updated by ${updatedBy}`, {
        duration: 3000,
      });
    });

    return () => {
      socketService.removeAllListeners();
    };
  }, []);

  useEffect(() => {
    if (pomodoroState.isRunning) {
      intervalRef.current = setInterval(() => {
        setLocalTimeLeft((prev) => {
          const newTime = Math.max(0, prev - 1);
          
          // Sync with server every 10 seconds
          if (newTime % 10 === 0) {
            socketService.updatePomodoroTime(newTime);
          }
          
          // Handle session completion
          if (newTime === 0) {
            socketService.completePomodoro();
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
  }, [pomodoroState.isRunning]);

  const handleStart = () => {
    socketService.startPomodoro();
  };

  const handlePause = () => {
    socketService.pausePomodoro();
  };

  const handleReset = () => {
    socketService.resetPomodoro();
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
    let totalTime;
    if (pomodoroState.sessionType === 'work') {
      totalTime = pomodoroState.settings?.workDuration || 25 * 60;
    } else if (pomodoroState.sessionType === 'longBreak') {
      totalTime = pomodoroState.settings?.longBreakDuration || 15 * 60;
    } else {
      totalTime = pomodoroState.settings?.breakDuration || 5 * 60;
    }
    return ((totalTime - localTimeLeft) / totalTime) * 100;
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
    work: { 
      scale: 1,
      transition: { duration: 0.3 }
    },
    break: { 
      scale: 1.05,
      transition: { duration: 0.3 }
    }
  };

  const pulseVariants = {
    initial: { scale: 1 },
    pulse: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
    >
      <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 border-2 border-indigo-200 dark:border-indigo-800">
        <CardHeader className="text-center pb-4">
          <CardTitle className="flex items-center justify-center gap-2 text-xl">
            {pomodoroState.sessionType === 'work' ? (
              <>
                <Target className="w-6 h-6 text-indigo-600" />
                Focus Session
              </>
            ) : pomodoroState.sessionType === 'longBreak' ? (
              <>
                <Coffee className="w-6 h-6 text-orange-600" />
                Long Break
              </>
            ) : (
              <>
                <Coffee className="w-6 h-6 text-emerald-600" />
                Short Break
              </>
            )}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Timer Display */}
          <motion.div
            variants={timerVariants}
            animate={pomodoroState.sessionType}
            className="text-center"
          >
            <motion.div
              variants={pulseVariants}
              animate={pomodoroState.isRunning ? "pulse" : "initial"}
              className={`text-6xl font-mono font-bold ${
                pomodoroState.sessionType === 'work' 
                  ? 'text-indigo-600' 
                  : pomodoroState.sessionType === 'longBreak'
                  ? 'text-orange-600'
                  : 'text-emerald-600'
              }`}
            >
              {formatTime(localTimeLeft)}
            </motion.div>
            
            <div className="mt-2 text-sm text-muted-foreground">
              Session {pomodoroState.totalSessions + 1}
            </div>
          </motion.div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress 
              value={getProgressPercentage()} 
              className={`h-3 ${
                pomodoroState.sessionType === 'work' 
                  ? '[&>div]:bg-indigo-600' 
                  : pomodoroState.sessionType === 'longBreak'
                  ? '[&>div]:bg-orange-600'
                  : '[&>div]:bg-emerald-600'
              }`}
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
                  onClick={pomodoroState.isRunning ? handlePause : handleStart}
                  disabled={!isHost}
                  className={`flex items-center gap-2 ${
                    pomodoroState.sessionType === 'work'
                      ? 'bg-indigo-600 hover:bg-indigo-700'
                      : pomodoroState.sessionType === 'longBreak'
                      ? 'bg-orange-600 hover:bg-orange-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  } text-white`}
                >
                  {pomodoroState.isRunning ? (
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
                  disabled={!isHost}
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
                          onValueChange={(value: 'work' | 'break' | 'longBreak') => 
                            setCustomTimer({ ...customTimer, type: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="work">Work Session</SelectItem>
                            <SelectItem value="break">Short Break</SelectItem>
                            <SelectItem value="longBreak">Long Break</SelectItem>
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
              
              {/* Host/Participant indicator */}
              {!isHost && (
                <div className="text-center text-xs text-muted-foreground">
                  Synced with room host • Use "Set Custom Timer" to suggest changes
                </div>
              )}
              </motion.div>
          </AnimatePresence>

          {/* Session Stats */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">
                {pomodoroState.totalSessions}
              </div>
              <div className="text-xs text-muted-foreground">
                Sessions Completed
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">
                {Math.floor(pomodoroState.totalSessions * 25)}
              </div>
              <div className="text-xs text-muted-foreground">
                Minutes Focused
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};


    }

  };



  return (

    <motion.div

      variants={cardVariants}

      initial="initial"

      animate="animate"

    >

      <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 border-2 border-indigo-200 dark:border-indigo-800">

        <CardHeader className="text-center pb-4">

          <CardTitle className="flex items-center justify-center gap-2 text-xl">

            {pomodoroState.sessionType === 'work' ? (

              <>

                <Target className="w-6 h-6 text-indigo-600" />

                Focus Session

              </>

            ) : (

              <>

                <Coffee className="w-6 h-6 text-emerald-600" />

                Break Time

              </>

            )}

          </CardTitle>

        </CardHeader>

        

        <CardContent className="space-y-6">

          {/* Timer Display */}

          <motion.div

            variants={timerVariants}

            animate={pomodoroState.sessionType}

            className="text-center"

          >

            <motion.div

              variants={pulseVariants}

              animate={pomodoroState.isRunning ? "pulse" : "initial"}

              className={`text-6xl font-mono font-bold ${

                pomodoroState.sessionType === 'work' 

                  ? 'text-indigo-600' 

                  : 'text-emerald-600'

              }`}

            >

              {formatTime(localTimeLeft)}

            </motion.div>

            

            <div className="mt-2 text-sm text-muted-foreground">

              Session {pomodoroState.totalSessions + 1}

            </div>

          </motion.div>



          {/* Progress Bar */}

          <div className="space-y-2">

            <Progress 

              value={getProgressPercentage()} 

              className={`h-3 ${

                pomodoroState.sessionType === 'work' 

                  ? '[&>div]:bg-indigo-600' 

                  : '[&>div]:bg-emerald-600'

              }`}

            />

            <div className="flex justify-between text-xs text-muted-foreground">

              <span>Progress</span>

              <span>{Math.round(getProgressPercentage())}%</span>

            </div>

          </div>



          {/* Controls */}

          <AnimatePresence mode="wait">

            {isHost ? (

              <motion.div

                key="host-controls"

                initial={{ opacity: 0, y: 10 }}

                animate={{ opacity: 1, y: 0 }}

                exit={{ opacity: 0, y: -10 }}

                className="flex gap-3 justify-center"

              >

                <Button

                  onClick={pomodoroState.isRunning ? handlePause : handleStart}

                  className={`flex items-center gap-2 ${

                    pomodoroState.sessionType === 'work'

                      ? 'bg-indigo-600 hover:bg-indigo-700'

                      : 'bg-emerald-600 hover:bg-emerald-700'

                  } text-white`}

                >

                  {pomodoroState.isRunning ? (

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

              </motion.div>

            ) : (

              <motion.div

                key="participant-view"

                initial={{ opacity: 0, y: 10 }}

                animate={{ opacity: 1, y: 0 }}

                exit={{ opacity: 0, y: -10 }}

                className="text-center text-sm text-muted-foreground"

              >

                Synced with room host

              </motion.div>

            )}

          </AnimatePresence>



          {/* Session Stats */}

          <div className="grid grid-cols-2 gap-4 pt-4 border-t">

            <div className="text-center">

              <div className="text-2xl font-bold text-indigo-600">

                {pomodoroState.totalSessions}

              </div>

              <div className="text-xs text-muted-foreground">

                Sessions Completed

              </div>

            </div>

            <div className="text-center">

              <div className="text-2xl font-bold text-emerald-600">

                {Math.floor(pomodoroState.totalSessions * 25)}

              </div>

              <div className="text-xs text-muted-foreground">

                Minutes Focused

              </div>

            </div>

          </div>

        </CardContent>

      </Card>

    </motion.div>

  );

};



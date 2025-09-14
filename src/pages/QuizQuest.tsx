import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@clerk/clerk-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Trophy, 
  Clock, 
  Users, 
  Brain, 
  Play, 
  Plus,
  Target,
  Zap,
  Crown
} from "lucide-react";
import { toast } from "sonner";

interface QuizSession {
  id: string;
  topic: string;
  totalQuestions: number;
  timePerQuestion: number;
  participants: number;
  status: 'waiting' | 'active' | 'completed';
  creator: string;
}

interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  streak: number;
}

const QuizQuest = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [sessions, setSessions] = useState<QuizSession[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newSession, setNewSession] = useState({
    topic: '',
    totalQuestions: 10,
    timePerQuestion: 15
  });

  useEffect(() => {
    // Fetch existing quiz sessions and leaderboard
    fetchQuizSessions();
    fetchLeaderboard();
  }, []);

  const fetchQuizSessions = async () => {
    try {
      // TODO: Replace with actual API call
      const mockSessions: QuizSession[] = [
        {
          id: '1',
          topic: 'React Fundamentals',
          totalQuestions: 10,
          timePerQuestion: 15,
          participants: 3,
          status: 'waiting',
          creator: 'John Doe'
        },
        {
          id: '2',
          topic: 'JavaScript ES6+',
          totalQuestions: 15,
          timePerQuestion: 20,
          participants: 7,
          status: 'active',
          creator: 'Jane Smith'
        }
      ];
      setSessions(mockSessions);
    } catch (error) {
      console.error('Failed to fetch quiz sessions:', error);
      toast.error('Failed to load quiz sessions');
    }
  };

  const fetchLeaderboard = async () => {
    try {
      // TODO: Replace with actual API call
      const mockLeaderboard: LeaderboardEntry[] = [
        { id: '1', name: 'Alice Johnson', score: 850, streak: 5 },
        { id: '2', name: 'Bob Wilson', score: 720, streak: 3 },
        { id: '3', name: 'Carol Davis', score: 680, streak: 2 },
        { id: '4', name: 'David Brown', score: 590, streak: 1 },
        { id: '5', name: 'Eva Martinez', score: 540, streak: 4 }
      ];
      setLeaderboard(mockLeaderboard);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
      toast.error('Failed to load leaderboard');
    }
  };

  const createQuizSession = async () => {
    if (!newSession.topic.trim()) {
      toast.error('Please enter a quiz topic');
      return;
    }

    try {
      setIsCreating(true);
      
      // TODO: Replace with actual API call
      const response = await fetch('/api/quiz/session/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: newSession.topic,
          totalQuestions: newSession.totalQuestions,
          timePerQuestion: newSession.timePerQuestion,
          creator: user?.fullName || user?.firstName || 'Anonymous'
        }),
      });

      if (response.ok) {
        const { sessionId } = await response.json();
        toast.success('Quiz session created successfully!');
        navigate(`/quiz/${sessionId}`);
      } else {
        throw new Error('Failed to create session');
      }
    } catch (error) {
      console.error('Failed to create quiz session:', error);
      toast.error('Failed to create quiz session');
    } finally {
      setIsCreating(false);
    }
  };

  const joinSession = async (sessionId: string) => {
    try {
      // TODO: Replace with actual API call
      const response = await fetch('/api/quiz/session/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          userName: user?.fullName || user?.firstName || 'Anonymous'
        }),
      });

      if (response.ok) {
        navigate(`/quiz/${sessionId}`);
      } else {
        throw new Error('Failed to join session');
      }
    } catch (error) {
      console.error('Failed to join quiz session:', error);
      toast.error('Failed to join quiz session');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center mb-4">
            <Trophy className="h-12 w-12 text-yellow-500 mr-3" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              QuizQuest
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            Challenge yourself and compete with others in interactive quizzes
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create New Quiz */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Plus className="h-5 w-5 mr-2 text-green-600" />
                  Create Quiz
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Topic
                  </label>
                  <Input
                    placeholder="Enter quiz topic..."
                    value={newSession.topic}
                    onChange={(e) => setNewSession(prev => ({ ...prev, topic: e.target.value }))}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Questions
                    </label>
                    <Input
                      type="number"
                      min="5"
                      max="50"
                      value={newSession.totalQuestions}
                      onChange={(e) => setNewSession(prev => ({ ...prev, totalQuestions: parseInt(e.target.value) || 10 }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Time (sec)
                    </label>
                    <Input
                      type="number"
                      min="10"
                      max="120"
                      value={newSession.timePerQuestion}
                      onChange={(e) => setNewSession(prev => ({ ...prev, timePerQuestion: parseInt(e.target.value) || 15 }))}
                    />
                  </div>
                </div>

                <Button
                  onClick={createQuizSession}
                  disabled={isCreating}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {isCreating ? 'Creating...' : 'Create Quiz Session'}
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Active Quiz Sessions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Brain className="h-5 w-5 mr-2 text-blue-600" />
                  Active Sessions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <AnimatePresence>
                    {sessions.map((session) => (
                      <motion.div
                        key={session.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 mb-1">
                              {session.topic}
                            </h4>
                            <p className="text-sm text-gray-600 mb-2">
                              by {session.creator}
                            </p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span className="flex items-center">
                                <Target className="h-3 w-3 mr-1" />
                                {session.totalQuestions} questions
                              </span>
                              <span className="flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {session.timePerQuestion}s each
                              </span>
                              <span className="flex items-center">
                                <Users className="h-3 w-3 mr-1" />
                                {session.participants}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4 flex flex-col items-end">
                            <Badge 
                              variant={session.status === 'active' ? 'default' : 'secondary'}
                              className="mb-2"
                            >
                              {session.status}
                            </Badge>
                            <Button
                              size="sm"
                              onClick={() => joinSession(session.id)}
                              disabled={session.status === 'completed'}
                            >
                              <Play className="h-3 w-3 mr-1" />
                              Join
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  
                  {sessions.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Brain className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No active quiz sessions</p>
                      <p className="text-sm">Create one to get started!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Leaderboard */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Crown className="h-5 w-5 mr-2 text-yellow-500" />
                  Leaderboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {leaderboard.map((entry, index) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        index === 0 ? 'bg-yellow-50 border border-yellow-200' :
                        index === 1 ? 'bg-gray-50 border border-gray-200' :
                        index === 2 ? 'bg-orange-50 border border-orange-200' :
                        'bg-gray-25 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3 ${
                          index === 0 ? 'bg-yellow-500 text-white' :
                          index === 1 ? 'bg-gray-400 text-white' :
                          index === 2 ? 'bg-orange-500 text-white' :
                          'bg-gray-200 text-gray-600'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{entry.name}</p>
                          <div className="flex items-center text-xs text-gray-500">
                            <Zap className="h-3 w-3 mr-1" />
                            {entry.streak} streak
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-gray-900">{entry.score}</p>
                        <p className="text-xs text-gray-500">points</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default QuizQuest;
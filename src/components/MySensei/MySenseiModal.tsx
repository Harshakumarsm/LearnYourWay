import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Send, Bot, User, RotateCcw, Brain, MessageCircle } from "lucide-react";

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  mode?: 'learning' | 'llm';
}

interface MySenseiModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MySenseiModal: React.FC<MySenseiModalProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentMode, setCurrentMode] = useState<'idle' | 'learning' | 'llm'>('idle');
  const [isInitialized, setIsInitialized] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize with dynamic welcome message when modal opens
  useEffect(() => {
    if (isOpen && !isInitialized) {
      const initializeChat = async () => {
        setIsLoading(true);
        try {
          const response = await fetch('http://localhost:3001/chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ message: "Hello" })
          });

          if (response.ok) {
            const data = await response.json();
            const welcomeMessage: Message = {
              id: '1',
              content: data.reply,
              sender: 'bot',
              timestamp: new Date()
            };
            setMessages([welcomeMessage]);
          } else {
            // If server error, try direct Gemini call
            const fallbackResponse = await fetch('http://localhost:3001/chat', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
              body: JSON.stringify({ message: "Hi, I'm opening My Sensei for the first time. Please introduce yourself as my AI learning assistant." })
            });
            
            if (fallbackResponse.ok) {
              const fallbackData = await fallbackResponse.json();
              const fallbackMessage: Message = {
                id: '1',
                content: fallbackData.reply,
                sender: 'bot',
                timestamp: new Date()
              };
              setMessages([fallbackMessage]);
            }
          }
        } catch (error) {
          console.error('Error initializing chat:', error);
          // Last resort - try one more API call
          try {
            const lastResortResponse = await fetch('http://localhost:3001/chat', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
              body: JSON.stringify({ message: "Please introduce yourself as an AI learning assistant" })
            });
            
            if (lastResortResponse.ok) {
              const lastResortData = await lastResortResponse.json();
              const lastResortMessage: Message = {
                id: '1',
                content: lastResortData.reply,
                sender: 'bot',
                timestamp: new Date()
              };
              setMessages([lastResortMessage]);
            }
          } catch (finalError) {
            console.error('Final fallback failed:', finalError);
          }
        } finally {
          setIsLoading(false);
          setIsInitialized(true);
        }
      };

      initializeChat();
    }
  }, [isOpen, isInitialized]);

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:3001/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for session management
        body: JSON.stringify({ message: inputValue })
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      
      // Detect mode based on response content
      const detectedMode = data.reply.includes('Quiz') || data.reply.includes('Question') ? 'learning' : 'llm';
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.reply,
        sender: 'bot',
        timestamp: new Date(),
        mode: detectedMode
      };

      setMessages(prev => [...prev, botMessage]);
      setCurrentMode(detectedMode);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'm sorry, I'm having trouble connecting right now. Please make sure the server is running on port 3001.",
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const resetChat = async () => {
    try {
      await fetch('http://localhost:3001/chat/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      setMessages([]);
      setCurrentMode('idle');
      setIsInitialized(false);
    } catch (error) {
      console.error('Error resetting chat:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatMessage = (content: string) => {
    // Convert markdown-style formatting to JSX
    return content.split('\n').map((line, index) => {
      // Handle bold text
      line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      
      return (
        <div key={index} className={index > 0 ? 'mt-2' : ''}>
          <span dangerouslySetInnerHTML={{ __html: line }} />
        </div>
      );
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-blue-600" />
            My Sensei - AI Learning Assistant
            {currentMode !== 'idle' && (
              <Badge variant={currentMode === 'learning' ? 'default' : 'secondary'}>
                {currentMode === 'learning' ? '📚 Learning Mode' : '💬 Q&A Mode'}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Your personalized AI learning assistant with adaptive quizzes and direct Q&A support
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0">
          <ScrollArea ref={scrollAreaRef} className="flex-1 pr-4">
            <div className="space-y-4 pb-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.sender === 'bot' && (
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <Bot className="h-4 w-4 text-blue-600" />
                      </div>
                    </div>
                  )}
                  
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-2 ${
                      message.sender === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div className="text-sm">
                      {formatMessage(message.content)}
                    </div>
                    <div className={`text-xs mt-1 opacity-70`}>
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>

                  {message.sender === 'user' && (
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                        <User className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-blue-600" />
                    </div>
                  </div>
                  <div className="bg-gray-100 rounded-lg px-4 py-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="flex-shrink-0 border-t pt-4">
            <div className="flex gap-2 mb-3">
              <Button
                variant="outline"
                size="sm"
                onClick={resetChat}
                className="flex items-center gap-1"
              >
                <RotateCcw className="h-3 w-3" />
                Reset Chat
              </Button>
              <div className="flex-1" />
              <Badge variant="outline" className="text-xs">
                Server: localhost:3001
              </Badge>
            </div>
            
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything or say 'Explain [topic]' for learning mode..."
                className="flex-1"
                disabled={isLoading}
              />
              <Button
                onClick={sendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="flex items-center gap-1"
              >
                <Send className="h-4 w-4" />
                Send
              </Button>
            </div>
            
            <div className="mt-2 text-xs text-gray-500 flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Brain className="h-3 w-3" />
                Learning: "Explain JavaScript"
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="h-3 w-3" />
                Q&A: "Who is Alan Turing?"
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

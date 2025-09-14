'use client';

import { useState } from "react";
<<<<<<< Updated upstream
import { useState } from "react";
=======
>>>>>>> Stashed changes
import { Sidebar } from "./Sidebar";
import ReminderOverlay from "./ReminderOverlay";
import { FeatureCard } from "./FeatureCard";
import { StudyRoomModal } from "./StudyRoom/StudyRoomModal";
import { Search, Mic, MapPin, Brain, Bell, Trophy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";

const features = [
  {
    id: "hearme-ai",
    icon: Mic,
    title: "HearMe AI",
    description: "Hearing and vision support for an inclusive learning experience.",
    label: "New"
  },
  {
    id: "consult-ai", 
    icon: MapPin,
    title: "Consult AI",
    description: "Personalized career guidance and planning for every learner.",
    label: "AI Powered"
  },
  {
    id: "my-sensei",
    icon: Brain,
    title: "My Sensei", 
    description: "Your AI-powered mentor providing adaptive learning and real-time assistance.",
    label: "Interactive"
  },
  {
    id: "content-miner",
    icon: Search,
    title: "ContentMiner",
    description: "Curates and delivers relevant learning resources automatically.",
    label: "Smart"
  },
  {
    id: "ping-me",
    icon: Bell,
    title: "PingMe!",
    description: "Engaging push notifications to keep learners motivated and on track.", 
    label: "Engaging"
  },
  {
    id: "quiz-quest",
    icon: Trophy,
    title: "QuizQuest",
    description: "Interactive, gamified assessments to make learning fun and competitive.",
    label: "Gamified"
  },
  {
    id: "study-rooms",
    icon: Users,
    title: "StudySphere",
    description: "Create and join group study rooms with video/audio chat, tasks, and Pomodoro timers.",
    label: "Collaborate"
  }
];

export const Dashboard = () => {
  const [isReminderOverlayOpen, setReminderOverlayOpen] = useState(false);

  const openReminderOverlay = () => setReminderOverlayOpen(true);
  const closeReminderOverlay = () => setReminderOverlayOpen(false);
<<<<<<< Updated upstream
  const [isStudyRoomModalOpen, setIsStudyRoomModalOpen] = useState(false);

=======
>>>>>>> Stashed changes
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar />
        
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
          </header>
          
          <main className="flex-1 p-4 md:p-8">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                What do you want to{" "}
                <span className="relative">
                  explore
                  <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-primary"></div>
                </span>{" "}
                today?
              </h1>
            </div>

            {/* Search Bar */}
            <div className="mb-8 flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Ask your Sensei..."
                  className="pl-10 py-3 bg-card border-border search-focus"
                />
              </div>
              <Button className="px-8 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-medium">
                Ask
              </Button>
            </div>

            {/* All Folders Filter */}
            <div className="mb-6">
              <span className="text-sm text-muted-foreground">All Folders</span>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature) => {
                if (feature.id === 'ping-me') {
                  return (
                    <div key={feature.id} onClick={openReminderOverlay} className="cursor-pointer">
                      <FeatureCard {...feature} />
                    </div>
                  );
                }
<<<<<<< Updated upstream
                return <FeatureCard 
                  key={feature.id} 
                  {...feature}
                  onStudyRoomClick={() => setIsStudyRoomModalOpen(true)}
                />;
=======
                return <FeatureCard key={feature.id} {...feature} />;
>>>>>>> Stashed changes
              })}
            </div>
          </main>
        </SidebarInset>
      </div>
      <ReminderOverlay isOpen={isReminderOverlayOpen} onClose={closeReminderOverlay} />
<<<<<<< Updated upstream

      {/* Study Room Modal */}
      <StudyRoomModal 
        isOpen={isStudyRoomModalOpen}
        onClose={() => setIsStudyRoomModalOpen(false)}
      />
=======
>>>>>>> Stashed changes
    </SidebarProvider>
  );
};
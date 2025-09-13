import { 
  Rocket, 
  Brain, 
  Briefcase, 
  Smartphone, 
  Users, 
  Trophy,
  ChevronDown
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const menuItems = [
  { icon: Rocket, label: "Launcher", active: false },
  { icon: Brain, label: "My Sensei", active: false },
  { icon: Briefcase, label: "Portfolio", active: false },
  { icon: Smartphone, label: "AI Apps", active: true },
  { icon: Users, label: "Consult AI", active: false },
  { icon: Trophy, label: "QuizQuest", active: false },
];

export const Sidebar = () => {
  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar-bg sidebar-shadow z-10">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">✧</span>
            </div>
            <span className="text-xl font-bold text-primary">LearnYourWay</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.label}>
                  <a
                    href="#"
                    className={`nav-item ${item.active ? 'active' : ''}`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  S
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground truncate">
                  Student
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  student@gami.com...
                </div>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      </div>
    </aside>
  );
};
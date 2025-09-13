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
import {
  Sidebar as SidebarRoot,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { SignedIn, SignedOut, useUser } from "@clerk/clerk-react";
import { AuthWrapper, UserButton } from "@/components/Authentication";

const menuItems = [
  { icon: Rocket, label: "Launcher", active: false },
  { icon: Brain, label: "My Sensei", active: false },
  { icon: Briefcase, label: "Portfolio", active: false },
  { icon: Smartphone, label: "AI Apps", active: true },
  { icon: Users, label: "Consult AI", active: false },
  { icon: Trophy, label: "QuizQuest", active: false },
];

export const Sidebar = () => {
  const { state } = useSidebar();
  const { user } = useUser();
  const isCollapsed = state === "collapsed";

  return (
    <SidebarRoot collapsible="icon" className="border-r border-border">
      {/* Header with Logo */}
      <SidebarHeader className={`${isCollapsed ? 'p-4' : 'p-6'} border-b border-border`}>
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <span className="text-primary-foreground font-bold text-lg">✧</span>
          </div>
          {!isCollapsed && (
            <span className="text-xl font-bold text-primary ml-2">LearnYourWay</span>
          )}
        </div>
      </SidebarHeader>

      {/* Navigation Content */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className={`${isCollapsed ? 'px-2 py-4' : 'px-4 py-6'} space-y-1`}>
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton 
                      isActive={item.active}
                      tooltip={isCollapsed ? item.label : undefined}
                      className={`w-full ${isCollapsed ? 'justify-center px-0 h-10' : 'justify-start gap-3 px-3 h-10'} ${
                        item.active 
                          ? 'bg-primary/10 text-primary border-r-2 border-primary' 
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                      }`}
                    >
                      <Icon className="w-5 h-5 shrink-0" />
                      {!isCollapsed && <span>{item.label}</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* User Profile Footer - Always visible, content changes based on auth state */}
      <SidebarFooter className="p-4 border-t border-border">
        <SignedIn>
          {!isCollapsed ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <UserButton />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">
                    {user?.firstName || user?.username || "User"}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {user?.primaryEmailAddress?.emailAddress || "No email"}
                  </div>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </div>
          ) : (
            <div className="flex justify-center">
              <UserButton />
            </div>
          )}
        </SignedIn>
        <SignedOut>
          {!isCollapsed ? (
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground text-center">
                Sign in to access all features
              </div>
              <AuthWrapper showSignUp={true} />
            </div>
          ) : (
            <div className="flex justify-center">
              <AuthWrapper showSignUp={false} />
            </div>
          )}
        </SignedOut>
      </SidebarFooter>
    </SidebarRoot>
  );
};
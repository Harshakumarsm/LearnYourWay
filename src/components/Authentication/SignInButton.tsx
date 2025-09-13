import { SignInButton as ClerkSignInButton } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";

interface SignInButtonProps {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
}

export const SignInButton = ({ 
  variant = "default", 
  size = "default", 
  className = "" 
}: SignInButtonProps) => {
  return (
    <ClerkSignInButton mode="modal">
      <Button variant={variant} size={size} className={className}>
        <LogIn className="w-4 h-4 mr-2" />
        Sign In
      </Button>
    </ClerkSignInButton>
  );
};
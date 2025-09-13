import { SignUpButton as ClerkSignUpButton } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";

interface SignUpButtonProps {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
}

export const SignUpButton = ({ 
  variant = "outline", 
  size = "default", 
  className = "" 
}: SignUpButtonProps) => {
  return (
    <ClerkSignUpButton mode="modal">
      <Button variant={variant} size={size} className={className}>
        <UserPlus className="w-4 h-4 mr-2" />
        Sign Up
      </Button>
    </ClerkSignUpButton>
  );
};
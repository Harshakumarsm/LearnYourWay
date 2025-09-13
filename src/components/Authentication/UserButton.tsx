import { UserButton as ClerkUserButton } from "@clerk/clerk-react";

interface UserButtonProps {
  showName?: boolean;
}

export const UserButton = ({ showName = false }: UserButtonProps) => {
  return (
    <ClerkUserButton 
      appearance={{
        elements: {
          avatarBox: "w-10 h-10",
          userButtonTrigger: "w-10 h-10"
        }
      }}
      showName={showName}
    />
  );
};
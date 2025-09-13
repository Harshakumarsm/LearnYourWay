import { SignedIn, SignedOut } from "@clerk/clerk-react";
import { SignInButton } from "./SignInButton";
import { SignUpButton } from "./SignUpButton";
import { UserButton } from "./UserButton";

interface AuthWrapperProps {
  children?: React.ReactNode;
  showSignUp?: boolean;
}

export const AuthWrapper = ({ children, showSignUp = true }: AuthWrapperProps) => {
  return (
    <>
      <SignedOut>
        <div className="flex items-center gap-2">
          <SignInButton variant="ghost" size="sm" />
          {showSignUp && <SignUpButton variant="outline" size="sm" />}
        </div>
      </SignedOut>
      <SignedIn>
        {children || <UserButton />}
      </SignedIn>
    </>
  );
};
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface SignInLinkProps {
  className?: string;
  children: React.ReactNode;
}

export function SignInLink({ className, children }: SignInLinkProps) {
  const navigate = useNavigate();

  return (
    <Button
      variant="outline"
      onClick={() => navigate("/auth")}
      className={className}
    >
      {children}
    </Button>
  );
}

export function SignUpLink({ className, children }: SignInLinkProps) {
  const navigate = useNavigate();

  return (
    <Button
      onClick={() => navigate("/auth")}
      className={className}
    >
      {children}
    </Button>
  );
}
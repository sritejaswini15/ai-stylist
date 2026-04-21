import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { login } from "@/services/auth";

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/dashboard";

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate(from, { replace: true });
    }
  }, [navigate, from]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const data = await login(email, password);

      if (!data?.access_token) {
        throw new Error("Invalid response from server");
      }

      toast.success("Welcome back!");
      
      localStorage.setItem("token", data.access_token);
      navigate(from, { replace: true });
    } catch (err) {
      console.error("Sign in error:", err);
      
      const authError = err as { detail?: string };
      const errorMessage = authError.detail || "Failed to sign in";
      const isIncorrectCreds = errorMessage === "Incorrect email or password";
      
      toast.error(errorMessage, {
        description: isIncorrectCreds 
          ? "Please check your credentials and try again."
          : "An error occurred. Please try again or join us if you're new.",
        action: isIncorrectCreds ? undefined : {
          label: "Sign Up",
          onClick: () => navigate("/signup"),
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left - Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-2">
            <Link to="/" className="font-display text-2xl font-bold text-foreground">clueless</Link>
            <h1 className="font-display text-3xl font-bold text-foreground mt-8">Welcome back</h1>
            <p className="text-muted-foreground font-body">Sign in to your account to continue styling.</p>
          </div>

          <form className="space-y-5" onSubmit={handleSignIn}>
            <div className="space-y-2">
              <Label htmlFor="email" className="font-body text-sm font-medium text-foreground">Email or Username</Label>
              <Input 
                id="email" 
                type="text" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="you@example.com or username" 
                required 
                disabled={isLoading}
                className="rounded-xl bg-secondary border-border font-body" 
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="font-body text-sm font-medium text-foreground">Password</Label>
                <Link to="/forgot-password" virtual-link="" className="text-xs text-gold hover:underline font-medium">
                  Forgot password?
                </Link>
              </div>
              <Input 
                id="password" 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="••••••••" 
                required 
                disabled={isLoading}
                className="rounded-xl bg-secondary border-border font-body" 
              />
            </div>
            <Button 
              type="submit" 
              disabled={isLoading} 
              className="w-full bg-foreground text-background hover:bg-foreground/90 rounded-full font-body text-sm h-11"
            >
              {isLoading ? "Signing In" : "Sign In"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground font-body">
            Don't have an account?{" "}
            <Link to="/signup" className="text-gold font-medium hover:underline">Sign up</Link>
          </p>
        </div>
      </div>

      {/* Right - Visual */}
      <div className="hidden lg:flex flex-1 bg-secondary items-center justify-center p-12">
        <div className="max-w-md space-y-6 text-center">
          <p className="font-display text-4xl font-bold text-foreground leading-tight">
            "As if I'd leave the house without checking <span className="italic text-gold">Clueless</span> first."
          </p>
          <p className="text-muted-foreground font-body">- Every stylish person, probably</p>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
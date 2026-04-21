import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, X, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { signup, checkEmail, checkUsername } from "@/services/auth";

const SignUp = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  // Debounced check for email availability
  useEffect(() => {
    if (!email || !email.includes("@")) {
      setEmailAvailable(null);
      return;
    }

    setIsCheckingEmail(true);
    const timer = setTimeout(async () => {
      try {
        const data = await checkEmail(email);
        setEmailAvailable(data.available);
      } catch (err) {
        console.error("Error checking email:", err);
      } finally {
        setIsCheckingEmail(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [email]);

  // Debounced check for username availability
  useEffect(() => {
    if (!username || username.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    setIsCheckingUsername(true);
    const timer = setTimeout(async () => {
      try {
        const data = await checkUsername(username);
        setUsernameAvailable(data.available);
      } catch (err) {
        console.error("Error checking username:", err);
      } finally {
        setIsCheckingUsername(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [username]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (emailAvailable === false) {
      toast.error("Email is already in use.");
      return;
    }
    if (usernameAvailable === false) {
      toast.error("Username is already taken.");
      return;
    }

    setIsLoading(true);

    try {
      await signup({ email, password, username });

      toast.success("Account created successfully!", {
        description: "Please sign in to continue.",
      });
      navigate("/signin");
    } catch (err) {
      console.error("Sign up error:", err);
      const authError = err as { detail?: string };
      const errorMessage = authError.detail || "Failed to sign up";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left - Visual */}
      <div className="hidden lg:flex flex-1 bg-secondary items-center justify-center p-12">
        <div className="max-w-md space-y-6 text-center">
          <p className="font-display text-4xl font-bold text-foreground leading-tight">
            Your personal AI stylist is <span className="italic text-gold">one step</span> away.
          </p>
          <p className="text-muted-foreground font-body">Join Clueless and never have a "clueless" moment again.</p>
        </div>
      </div>

      {/* Right - Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-2">
            <Link to="/" className="font-display text-2xl font-bold text-foreground">clueless</Link>
            <h1 className="font-display text-3xl font-bold text-foreground mt-8">Create your account</h1>
            <p className="text-muted-foreground font-body">Start your style journey today.</p>
          </div>

          <form className="space-y-5" onSubmit={handleSignUp}>
            <div className="space-y-2 relative">
              <Label htmlFor="email" className="font-body text-sm font-medium text-foreground">Email</Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  disabled={isLoading}
                  className={`rounded-xl bg-secondary border-border font-body pr-10 ${
                    emailAvailable === true ? "border-green-500" : emailAvailable === false ? "border-red-500" : ""
                  }`}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {isCheckingEmail ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-gold border-t-transparent" />
                  ) : emailAvailable === true ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : emailAvailable === false ? (
                    <XCircle className="h-5 w-5 text-red-500" />
                  ) : null}
                </div>
              </div>
              {emailAvailable === false && (
                <p className="text-red-500 text-xs mt-1 flex justify-between items-center">
                  <span>This email is already in use.</span>
                  <Link to="/signin" className="text-gold hover:underline font-medium">Sign in</Link>
                </p>
              )}
            </div>

            <div className="space-y-2 relative">
              <Label htmlFor="username" className="font-body text-sm font-medium text-foreground">Username</Label>
              <div className="relative">
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choose a username"
                  required
                  disabled={isLoading}
                  className={`rounded-xl bg-secondary border-border font-body pr-10 ${
                    usernameAvailable === true ? "border-green-500" : usernameAvailable === false ? "border-red-500" : ""
                  }`}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {isCheckingUsername ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-gold border-t-transparent" />
                  ) : usernameAvailable === true ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : usernameAvailable === false ? (
                    <XCircle className="h-5 w-5 text-red-500" />
                  ) : null}
                </div>
              </div>
              {usernameAvailable === false && <p className="text-red-500 text-xs mt-1">Username is already taken</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="font-body text-sm font-medium text-foreground">Password</Label>
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
              disabled={isLoading || emailAvailable === false || usernameAvailable === false}
              className="w-full bg-foreground text-background hover:bg-foreground/90 rounded-full font-body text-sm h-11"
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground font-body">
            Already have an account?{" "}
            <Link to="/signin" className="text-gold font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
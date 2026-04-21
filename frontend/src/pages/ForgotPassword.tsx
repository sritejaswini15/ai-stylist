import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getApiUrl } from "@/services/api";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState(1); // 1: Email, 2: Code & New Password
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email address.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(getApiUrl("/api/auth/forgot-password"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Something went wrong");
      }

      toast.success("Reset code sent! Check your email.");
      console.log("Mock Reset Code:", data.resetCode);
      setStep(2);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !newPassword) {
      toast.error("Please fill in all fields.");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(getApiUrl("/api/auth/reset-password"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, code, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Invalid or expired code");
      }

      toast.success("Password reset successfully!");
      navigate("/signin");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-2 text-center">
          <Link to="/" className="font-display text-2xl font-bold text-foreground inline-block mb-4">clueless</Link>
          <h1 className="font-display text-3xl font-bold text-foreground">
            {step === 1 ? "Forgot Password?" : "Reset Password"}
          </h1>
          <p className="text-muted-foreground font-body">
            {step === 1 
              ? "Enter your email to receive a reset code." 
              : "Enter the 6-digit code and your new password."}
          </p>
        </div>

        {step === 1 ? (
          <form className="space-y-5" onSubmit={handleSendCode}>
            <div className="space-y-2">
              <Label htmlFor="email" className="font-body text-sm font-medium text-foreground">Email Address</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="you@example.com" 
                className="rounded-xl bg-secondary border-border font-body"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-foreground text-background hover:bg-foreground/90 rounded-full font-body text-sm h-11"
              disabled={isLoading}
            >
              {isLoading ? "Sending..." : "Send Reset Code"}
            </Button>
            <p className="text-center text-sm text-muted-foreground font-body mt-4">
              Remembered your password?{" "}
              <Link to="/signin" className="text-gold font-medium hover:underline">Sign in</Link>
            </p>
          </form>
        ) : (
          <form className="space-y-5" onSubmit={handleResetPassword}>
            <div className="space-y-2">
              <Label htmlFor="code" className="font-body text-sm font-medium text-foreground">Verification Code</Label>
              <Input 
                id="code" 
                type="text" 
                placeholder="6-digit code" 
                className="rounded-xl bg-secondary border-border font-body text-center text-xl tracking-widest"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength={6}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="font-body text-sm font-medium text-foreground">New Password</Label>
              <Input 
                id="newPassword" 
                type="password" 
                placeholder="••••••••" 
                className="rounded-xl bg-secondary border-border font-body"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-foreground text-background hover:bg-foreground/90 rounded-full font-body text-sm h-11"
              disabled={isLoading}
            >
              {isLoading ? "Resetting..." : "Reset Password"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;


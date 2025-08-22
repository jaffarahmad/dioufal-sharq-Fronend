import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Eye,
  EyeOff,
  User,
  Lock,
  ArrowRight,
  Building2,
  AlertCircle,
  Mail,
} from "lucide-react";
import logoPath from "@assets/image-logo.png";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { login, isLoading: authLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();

  // Form states
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [isSendingReset, setIsSendingReset] = useState(false);

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      setLocation("/");
    }
  }, [isAuthenticated, authLoading, setLocation]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !password) {
      toast({
        title: "Login Failed",
        description: "Please enter both username and password",
        variant: "destructive",
      });
      return;
    }

    // Prevent double submissions
    if (isLoading) return;

    setIsLoading(true);

    try {
      const result = await login(username, password);

      if (result.success) {
        toast({
          title: "Login Successful",
          description: "Welcome back to the Construction Management System!",
        });

        // Use setTimeout to ensure state is updated before redirect
        setTimeout(() => {
          setLocation("/");
        }, 100);
      } else {
        toast({
          title: "Login Failed",
          description: result.error || "Invalid credentials",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login Failed",
        description: "Network error. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingReset(true);

    try {
      // Simulate sending reset email
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast({
        title: "Password Reset Sent",
        description: `Password reset instructions have been sent to ${forgotEmail}`,
      });

      setShowForgotPassword(false);
      setForgotEmail("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send password reset email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSendingReset(false);
    }
  };

  // Show loading spinner while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (showForgotPassword) {
    return (
      <div className="min-h-screen bg-blue-50 dark:bg-gray-900 flex items-center justify-center p-2 sm:p-4 md:p-6">
        <Card className="w-full max-w-sm sm:max-w-md shadow-xl border-0 bg-white dark:bg-gray-900">
          <CardHeader className="text-center space-y-3 sm:space-y-4 pb-4 sm:pb-6 px-4 sm:px-6 pt-4 sm:pt-6">
            {/* Company Logo */}
            <div className="flex flex-col items-center space-y-2">
              <img
                src={logoPath}
                alt="Diouf Al-Sharq"
                className="h-35 w-auto object-contain drop-shadow-lg"
                style={{ height: "140px" }}
              />
              <h2 className="text-lg sm:text-xl font-bold text-purple-600">
                Diouf Al-Sharq
              </h2>
            </div>
            <div>
              <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                Forgot Password?
              </CardTitle>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1 sm:mt-2">
                Enter your email address and we'll send you instructions to
                reset your password.
              </p>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6 pb-4 sm:pb-6">
            <form
              onSubmit={handleForgotPassword}
              className="space-y-3 sm:space-y-4"
            >
              <div className="space-y-1 sm:space-y-2">
                <Label htmlFor="reset-email" className="text-sm font-medium">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="admin@dioufalsharq.com"
                    value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                    className="pl-10 h-10 sm:h-12 text-base"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2 sm:space-y-3">
                <Button
                  type="submit"
                  className="w-full h-10 sm:h-12 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-sm sm:text-base"
                  disabled={isSendingReset}
                >
                  {isSendingReset ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white mr-2"></div>
                      <span className="text-sm sm:text-base">
                        Sending Reset Link...
                      </span>
                    </>
                  ) : (
                    <>
                      <Mail className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                      <span className="text-sm sm:text-base">
                        Send Reset Link
                      </span>
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full h-10 sm:h-12 text-sm sm:text-base"
                  onClick={() => setShowForgotPassword(false)}
                >
                  <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 mr-2 rotate-180" />
                  <span className="text-sm sm:text-base">Back to Login</span>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50 dark:bg-gray-900 flex items-center justify-center p-2 sm:p-4 md:p-6">
      <Card className="w-full max-w-sm sm:max-w-md shadow-xl border-0 bg-white dark:bg-gray-900">
        <CardHeader className="text-center space-y-3 sm:space-y-4 pb-4 sm:pb-6 px-4 sm:px-6 pt-4 sm:pt-6">
          {/* Company Logo and Branding */}
          <div className="flex flex-col items-center space-y-2 sm:space-y-3">
            <div className="flex flex-col items-center space-y-2">
              <img
                src={logoPath}
                alt="Diouf Al-Sharq"
                className="h-35 w-auto object-contain drop-shadow-lg"
                style={{ height: "140px" }}
              />
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-purple-600">
                Diouf Al-Sharq
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium">
                General Contracting Company
              </p>
            </div>
          </div>

          <div>
            <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              Welcome Back
            </CardTitle>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1 sm:mt-2">
              Sign in to your account to continue
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6 pb-4 sm:pb-6">
          <form onSubmit={handleLogin} className="space-y-3 sm:space-y-4">
            {/* Username Input */}
            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="username" className="text-sm font-medium">
                Username
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="pl-10 h-10 sm:h-12 text-base"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-10 sm:h-12 text-base"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-10 sm:h-12 px-2 sm:px-3 hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="flex justify-end">
              <Button
                type="button"
                variant="link"
                className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-0 h-auto"
                onClick={() => setShowForgotPassword(true)}
              >
                Forgot password?
              </Button>
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              className="w-full h-10 sm:h-12 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-sm sm:text-base"
              disabled={isLoading || authLoading}
            >
              {isLoading || authLoading ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white mr-2"></div>
                  <span className="text-sm sm:text-base">Signing in...</span>
                </>
              ) : (
                <>
                  <span className="text-sm sm:text-base">Sign In</span>
                  <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-2" />
                </>
              )}
            </Button>
          </form>

          {/* Company Info */}
          <div className="text-center space-y-1 sm:space-y-2 mt-4 sm:mt-6">
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium">
              DIOUF AL-SHARQ GENERAL CONTRACTING COMPANY
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Professional Construction Management System
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

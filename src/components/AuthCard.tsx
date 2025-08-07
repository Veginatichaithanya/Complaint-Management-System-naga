
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight, User, CheckCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AuthCardProps {
  onSuccess?: () => void;
}

export function AuthCard({ onSuccess }: AuthCardProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const { signIn, signInWithGoogle } = useAuth();

  const handleSignUp = async (email: string, password: string, fullName: string) => {
    try {
      console.log("Starting signup process for:", email);
      
      // Sign up user without email confirmation (we'll handle it manually)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        console.error("Signup error:", error);
        toast.error(error.message);
        return;
      }

      if (data.user) {
        console.log("User created successfully:", data.user.id);
        
        // Send verification email via edge function
        const { error: emailError } = await supabase.functions.invoke('send-verification-email', {
          body: {
            email: email,
            fullName: fullName,
            userId: data.user.id,
          },
        });

        if (emailError) {
          console.error("Email sending error:", emailError);
          toast.error("Account created but failed to send verification email. Please contact support.");
        } else {
          console.log("Verification email sent successfully");
          setEmailSent(true);
          toast.success("Account created! Please check your email to verify your account.");
        }
      }
    } catch (error: any) {
      console.error("Unexpected signup error:", error);
      toast.error("An unexpected error occurred during signup");
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    
    try {
      if (isSignUp) {
        await handleSignUp(email, password, fullName);
      } else {
        const { error } = await signIn(email, password);
        if (!error && onSuccess) {
          onSuccess();
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email || !fullName) {
      toast.error("Please provide email and name to resend verification");
      return;
    }

    setIsLoading(true);
    try {
      // Try to resend verification email directly
      const { error: functionError } = await supabase.functions.invoke('send-verification-email', {
        body: {
          email: email,
          fullName: fullName,
          userId: 'resend-request', // The edge function will handle finding the user
        },
      });

      if (functionError) {
        console.error("Resend error:", functionError);
        toast.error("Failed to resend verification email");
      } else {
        toast.success("Verification email resent! Please check your inbox.");
      }
    } catch (error) {
      console.error("Resend error:", error);
      toast.error("Failed to resend verification email");
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="text-center space-y-4 mb-8">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", duration: 0.8 }}
            className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center shadow-xl"
          >
            <CheckCircle className="w-8 h-8 text-white" />
          </motion.div>

          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Check Your Email</h1>
            <p className="text-white/60 text-sm">
              We've sent a verification link to {email}
            </p>
          </div>
        </div>

        <motion.div
          className="bg-black/40 backdrop-blur-xl rounded-2xl p-8 border border-white/10 shadow-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center space-y-6">
            <div className="space-y-4">
              <p className="text-white/80">
                Click the magic link in your email to verify your account and start using Complaindesk.
              </p>
              <p className="text-white/60 text-sm">
                The link will expire in 15 minutes for security.
              </p>
            </div>

            <div className="space-y-4">
              <Button
                onClick={handleResendVerification}
                disabled={isLoading}
                variant="outline"
                className="w-full h-12 bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  "Resend Verification Email"
                )}
              </Button>

              <Button
                onClick={() => {
                  setEmailSent(false);
                  setIsSignUp(false);
                  setEmail("");
                  setPassword("");
                  setFullName("");
                }}
                variant="ghost"
                className="w-full text-white/60 hover:text-white"
              >
                Back to Sign In
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Header */}
      <div className="text-center space-y-4 mb-8">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", duration: 0.8 }}
          className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-xl"
        >
          <span className="text-2xl font-bold text-white">C</span>
        </motion.div>

        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p className="text-white/60 text-sm">
            {isSignUp 
              ? 'Join Complaindesk to manage your support experience' 
              : 'Sign in to your Complaindesk account'
            }
          </p>
        </div>
      </div>

      {/* Auth Form */}
      <motion.div
        className="bg-black/40 backdrop-blur-xl rounded-2xl p-8 border border-white/10 shadow-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={isSignUp ? 'signup' : 'signin'}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {isSignUp && (
                <div className="relative">
                  <User className={`absolute left-3 top-3 w-5 h-5 transition-colors duration-300 ${
                    focusedInput === "fullName" ? 'text-white' : 'text-white/40'
                  }`} />
                  <Input
                    type="text"
                    placeholder="Full Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    onFocus={() => setFocusedInput("fullName")}
                    onBlur={() => setFocusedInput(null)}
                    className="pl-11 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-white/30"
                    required={isSignUp}
                  />
                </div>
              )}

              <div className="relative">
                <Mail className={`absolute left-3 top-3 w-5 h-5 transition-colors duration-300 ${
                  focusedInput === "email" ? 'text-white' : 'text-white/40'
                }`} />
                <Input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedInput("email")}
                  onBlur={() => setFocusedInput(null)}
                  className="pl-11 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-white/30"
                  required
                />
              </div>

              <div className="relative">
                <Lock className={`absolute left-3 top-3 w-5 h-5 transition-colors duration-300 ${
                  focusedInput === "password" ? 'text-white' : 'text-white/40'
                }`} />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedInput("password")}
                  onBlur={() => setFocusedInput(null)}
                  className="pl-11 pr-11 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-white/30"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-white/40 hover:text-white transition-colors"
                >
                  {showPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                </button>
              </div>
            </motion.div>
          </AnimatePresence>

          {!isSignUp && (
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-white/20 bg-white/5 text-blue-500"
                />
                <span className="text-sm text-white/60">Remember me</span>
              </label>
              <button
                type="button"
                className="text-sm text-white/60 hover:text-white transition-colors"
              >
                Forgot password?
              </button>
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium rounded-xl transition-all duration-300"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                {isSignUp ? 'Create Account' : 'Sign In'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-black/40 text-white/60">or</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full h-12 bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm text-white/60 hover:text-white transition-colors"
          >
            {isSignUp 
              ? 'Already have an account? Sign in' 
              : "Don't have an account? Sign up"
            }
          </button>
        </div>
      </motion.div>
    </div>
  );
}

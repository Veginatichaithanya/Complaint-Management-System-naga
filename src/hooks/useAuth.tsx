
import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        if (event === 'SIGNED_OUT') {
          console.log('User signed out');
          setUser(null);
          setSession(null);
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('Token refreshed successfully');
        } else if (event === 'SIGNED_IN') {
          console.log('User signed in');
        }
      }
    );

    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
        }
        console.log('Initial session:', session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);
      } catch (error) {
        console.error('Error in getSession:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        toast.error(error.message);
        return { error };
      }
      
      if (data.session) {
        toast.success('Signed in successfully!');
      }
      
      return { error: null };
    } catch (error: any) {
      console.error('Sign in error:', error);
      toast.error('An unexpected error occurred during sign in');
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      setLoading(true);
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
          },
        },
      });
      
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Please check your email to confirm your account!');
      }
      
      return { error };
    } catch (error: any) {
      console.error('Sign up error:', error);
      toast.error('An unexpected error occurred during sign up');
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      
      if (error) {
        toast.error(error.message);
      }
      
      return { error };
    } catch (error: any) {
      console.error('Google sign in error:', error);
      toast.error('An unexpected error occurred during Google sign in');
      return { error };
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      
      setUser(null);
      setSession(null);
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.log('Sign out error (non-critical):', error.message);
        if (!error.message.includes('session_not_found')) {
          toast.error('Sign out error: ' + error.message);
        }
      } else {
        toast.success('Signed out successfully!');
      }
      
      window.location.href = '/';
      
      return { error };
    } catch (err) {
      console.error('Logout error:', err);
      setUser(null);
      setSession(null);
      window.location.href = '/';
      return { error: null };
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    session,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
  };
}

'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, UserProfile, fetchUserProfileDB, upsertUserProfileDB } from '@/lib/supabase';

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, username?: string, displayName?: string) => Promise<void>;
  loginWithDiscord: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Clean up any legacy manual localStorage user session keys
    try {
      localStorage.removeItem('watchers_user');
    } catch {
      // ignore
    }

    if (!supabase) {
      setIsLoading(false);
      return;
    }

    // Load active session from Supabase
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      try {
        if (session?.user) {
          const u = session.user;
          const metadata = u.user_metadata || {};

          const dbProfile = await fetchUserProfileDB(u.id);
          const profile: UserProfile = dbProfile || {
            id: u.id,
            username:
              metadata.preferred_username ||
              metadata.user_name ||
              metadata.username ||
              metadata.full_name?.toLowerCase().replace(/\s+/g, '_') ||
              u.email?.split('@')[0] ||
              'watcher',
            display_name:
              metadata.display_name ||
              metadata.full_name ||
              metadata.name ||
              metadata.custom_claims?.global_name ||
              'Watcher',
            avatar_url: metadata.avatar_url || metadata.picture || '',
            bio: metadata.bio || 'Movie & TV show enthusiast on Weflixd.',
            provider:
              u.app_metadata?.provider === 'discord'
                ? 'discord'
                : u.app_metadata?.provider || 'email',
            created_at: u.created_at,
          };

          if (!dbProfile) {
            await upsertUserProfileDB(profile);
          }

          setUser(profile);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.warn('Error fetching Supabase session user profile:', err);
      } finally {
        setIsLoading(false);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const u = session.user;
          const metadata = u.user_metadata || {};
          const dbProfile = await fetchUserProfileDB(u.id);
          const profile: UserProfile = dbProfile || {
            id: u.id,
            username:
              metadata.preferred_username ||
              metadata.user_name ||
              metadata.username ||
              metadata.full_name?.toLowerCase().replace(/\s+/g, '_') ||
              u.email?.split('@')[0] ||
              'watcher',
            display_name:
              metadata.display_name ||
              metadata.full_name ||
              metadata.name ||
              'Watcher',
            avatar_url: metadata.avatar_url || metadata.picture || '',
            bio: metadata.bio || 'Movie & TV show enthusiast on Weflixd.',
            provider:
              u.app_metadata?.provider === 'discord'
                ? 'discord'
                : u.app_metadata?.provider || 'email',
            created_at: u.created_at,
          };

          if (!dbProfile) {
            await upsertUserProfileDB(profile);
          }

          setUser(profile);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const loginWithEmail = async (email: string, password: string) => {
    setIsLoading(true);
    if (!supabase) {
      setIsLoading(false);
      throw new Error('Supabase client is not configured.');
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        throw error;
      }

      if (data?.user) {
        const u = data.user;
        const metadata = u.user_metadata || {};
        const dbProfile = await fetchUserProfileDB(u.id);
        const profile: UserProfile = dbProfile || {
          id: u.id,
          username:
            metadata.preferred_username ||
            metadata.user_name ||
            metadata.username ||
            u.email?.split('@')[0] ||
            'watcher',
          display_name:
            metadata.display_name ||
            metadata.full_name ||
            metadata.name ||
            'Watcher',
          avatar_url: metadata.avatar_url || metadata.picture || '',
          bio: metadata.bio || 'Movie & TV show enthusiast on Weflixd.',
          provider: 'email',
          created_at: u.created_at,
        };

        if (!dbProfile) {
          await upsertUserProfileDB(profile);
        }

        setUser(profile);
      }
    } catch (err) {
      setIsLoading(false);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signUpWithEmail = async (
    email: string,
    password: string,
    username?: string,
    displayName?: string
  ) => {
    setIsLoading(true);
    if (!supabase) {
      setIsLoading(false);
      throw new Error('Supabase client is not configured.');
    }

    try {
      const cleanEmail = email.trim();
      const cleanUsername = (username || cleanEmail.split('@')[0])
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '');
      const cleanDisplayName = (displayName || cleanUsername || 'Watcher').trim();

      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            username: cleanUsername,
            display_name: cleanDisplayName,
          },
        },
      });

      if (error) {
        throw error;
      }

      let sessionUser = data.user;

      // Direct sign-in to skip verification
      if (!data.session && sessionUser) {
        try {
          const signInRes = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password,
          });
          if (signInRes.data?.user) {
            sessionUser = signInRes.data.user;
          }
        } catch {
          // Continue with sessionUser
        }
      }

      if (sessionUser) {
        const profile: UserProfile = {
          id: sessionUser.id,
          username: cleanUsername || 'watcher',
          display_name: cleanDisplayName || 'Watcher',
          avatar_url: '',
          bio: 'Movie & TV show enthusiast on Weflixd.',
          provider: 'email',
          created_at: sessionUser.created_at || new Date().toISOString(),
        };

        await upsertUserProfileDB(profile);
        setUser(profile);
      }
    } catch (err) {
      setIsLoading(false);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithDiscord = async () => {
    setIsLoading(true);
    if (!supabase) {
      setIsLoading(false);
      throw new Error('Supabase client is not configured.');
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: {
          redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/` : undefined,
        },
      });
      if (error) {
        throw error;
      }
    } catch (err) {
      setIsLoading(false);
      console.error('Supabase Discord OAuth error:', err);
      throw err;
    }
  };

  const logout = async () => {
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch {
        // ignore
      }
    }
    setUser(null);
  };

  const updateProfile = async (updates: Partial<UserProfile>): Promise<boolean> => {
    if (!user) return false;
    const updated = { ...user, ...updates };
    setUser(updated);

    if (supabase && user.id) {
      try {
        await upsertUserProfileDB({
          id: user.id,
          username: updated.username,
          display_name: updated.display_name,
          avatar_url: updated.avatar_url,
          banner_image: updated.banner_image,
          bio: updated.bio,
          provider: updated.provider,
        });

        // Also update auth user metadata
        await supabase.auth.updateUser({
          data: {
            username: updated.username,
            display_name: updated.display_name,
            avatar_url: updated.avatar_url,
            banner_image: updated.banner_image,
            bio: updated.bio,
          },
        }).catch(() => {});

        return true;
      } catch (err) {
        console.warn('Failed to save profile updates to database:', err);
        return false;
      }
    }
    return true;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        loginWithEmail,
        signUpWithEmail,
        loginWithDiscord,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

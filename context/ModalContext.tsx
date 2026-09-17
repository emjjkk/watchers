'use client';

import React, { createContext, useContext, useState } from 'react';
import { MediaItem } from '@/lib/types';

interface ModalContextType {
  quickViewItem: MediaItem | null;
  openQuickView: (media: MediaItem) => void;
  closeQuickView: () => void;

  logWatchedItem: MediaItem | null;
  openLogWatched: (media: MediaItem) => void;
  closeLogWatched: () => void;

  trailerKey: string | null;
  openTrailer: (key: string) => void;
  closeTrailer: () => void;

  shareItem: MediaItem | null;
  openShare: (media: MediaItem) => void;
  closeShare: () => void;

  isSearchOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;

  isAuthPromptOpen: boolean;
  authPromptMessage: string | null;
  openAuthPrompt: (message?: string) => void;
  closeAuthPrompt: () => void;
  showToast: (message: string) => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [quickViewItem, setQuickViewItem] = useState<MediaItem | null>(null);
  const [logWatchedItem, setLogWatchedItem] = useState<MediaItem | null>(null);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [shareItem, setShareItem] = useState<MediaItem | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isAuthPromptOpen, setIsAuthPromptOpen] = useState<boolean>(false);
  const [authPromptMessage, setAuthPromptMessage] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const openQuickView = (media: MediaItem) => setQuickViewItem(media);
  const closeQuickView = () => setQuickViewItem(null);

  const openLogWatched = (media: MediaItem) => setLogWatchedItem(media);
  const closeLogWatched = () => setLogWatchedItem(null);

  const openTrailer = (key: string) => setTrailerKey(key);
  const closeTrailer = () => setTrailerKey(null);

  const openShare = (media: MediaItem) => setShareItem(media);
  const closeShare = () => setShareItem(null);

  const openSearch = () => setIsSearchOpen(true);
  const closeSearch = () => setIsSearchOpen(false);

  const openAuthPrompt = (message?: string) => {
    setAuthPromptMessage(message || null);
    setIsAuthPromptOpen(true);
  };
  const closeAuthPrompt = () => {
    setIsAuthPromptOpen(false);
    setAuthPromptMessage(null);
  };

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 3000);
  };

  return (
    <ModalContext.Provider
      value={{
        quickViewItem,
        openQuickView,
        closeQuickView,
        logWatchedItem,
        openLogWatched,
        closeLogWatched,
        trailerKey,
        openTrailer,
        closeTrailer,
        shareItem,
        openShare,
        closeShare,
        isSearchOpen,
        openSearch,
        closeSearch,
        isAuthPromptOpen,
        authPromptMessage,
        openAuthPrompt,
        closeAuthPrompt,
        showToast,
      }}
    >
      {children}
      {toast && (
        <div className="fixed bottom-5 right-5 z-[100] flex items-center gap-2 rounded-lg border border-emerald-200 bg-white px-4 py-3 text-sm font-medium text-zinc-800 shadow-xl dark:border-emerald-900 dark:bg-zinc-900 dark:text-zinc-100">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-xs text-white">✓</span>
          {toast}
        </div>
      )}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) throw new Error('useModal must be used within ModalProvider');
  return context;
}

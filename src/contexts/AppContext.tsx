import React, { createContext, useCallback, useContext, useState } from 'react';
import type { AppSettings, ToastMessage } from '../types';
import { DEFAULT_SETTINGS, storageService } from '../services/storageService';

interface ConfirmOptions {
  title: string;
  description: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
}

interface AppContextValue {
  settings: AppSettings;
  updateSettings: (next: Partial<AppSettings>) => void;
  resetSettings: () => void;
  toasts: ToastMessage[];
  showToast: (toast: Omit<ToastMessage, 'id'>) => void;
  dismissToast: (id: string) => void;
  confirmAction: (options: ConfirmOptions) => void;
  activeConfirm: ConfirmOptions | null;
  closeConfirm: () => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(() => storageService.getSettings());
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [activeConfirm, setActiveConfirm] = useState<ConfirmOptions | null>(null);

  const updateSettings = useCallback((next: Partial<AppSettings>) => {
    setSettings((prev) => {
      const merged: AppSettings = {
        ...prev,
        ...next,
      };
      storageService.saveSettings(merged);
      return merged;
    });
  }, []);

  const resetSettings = useCallback(() => {
    const reset = storageService.resetSettings();
    setSettings(reset);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (toast: Omit<ToastMessage, 'id'>) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev.slice(-3), { ...toast, id }]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    []
  );

  const confirmAction = useCallback((options: ConfirmOptions) => {
    setActiveConfirm(options);
  }, []);

  const closeConfirm = useCallback(() => {
    setActiveConfirm(null);
  }, []);

  return (
    <AppContext.Provider
      value={{
        settings,
        updateSettings,
        resetSettings,
        toasts,
        showToast,
        dismissToast,
        confirmAction,
        activeConfirm,
        closeConfirm,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useAppContext must be used inside AppProvider');
  }
  return ctx;
}

export { DEFAULT_SETTINGS };

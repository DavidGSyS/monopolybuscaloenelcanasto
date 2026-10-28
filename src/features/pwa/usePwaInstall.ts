"use client";

import { useState, useEffect, useCallback, useSyncExternalStore } from "react";
import {
  PlatformType,
  getCachedDeviceInfo,
  refreshDeviceInfo,
  DEFAULT_DEVICE_INFO,
} from "@/lib/device";

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const STORAGE_KEY_DISMISSED = "canasto_install_dismissed";

function subscribeDeviceInfo(onStoreChange: () => void) {
  const handleChange = () => {
    refreshDeviceInfo();
    onStoreChange();
  };

  window.addEventListener("resize", handleChange);
  const mediaQuery = window.matchMedia("(display-mode: standalone)");
  if (mediaQuery?.addEventListener) {
    mediaQuery.addEventListener("change", handleChange);
  }
  return () => {
    window.removeEventListener("resize", handleChange);
    if (mediaQuery?.removeEventListener) {
      mediaQuery.removeEventListener("change", handleChange);
    }
  };
}

let dismissedListeners: Array<() => void> = [];

function subscribeDismissed(onStoreChange: () => void) {
  dismissedListeners.push(onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    dismissedListeners = dismissedListeners.filter((l) => l !== onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function notifyDismissedListeners() {
  dismissedListeners.forEach((l) => l());
}

function getDismissedSnapshot(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY_DISMISSED) === "true";
  } catch {
    return false;
  }
}

const emptySubscribe = () => () => {};

export function usePwaInstall() {
  // 1. Estado de hidratación seguro (false en servidor, true inmediatamente en cliente)
  const isHydrated = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  // 2. Información del dispositivo estable con caché
  const deviceInfo = useSyncExternalStore(
    subscribeDeviceInfo,
    getCachedDeviceInfo,
    () => DEFAULT_DEVICE_INFO
  );

  // 3. Preferencia de continuar guardada localmente
  const isDismissed = useSyncExternalStore(
    subscribeDismissed,
    getDismissedSnapshot,
    () => false
  );

  // 4. Captura del evento de instalación nativo (Chromium / Android)
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  // 5. Permite forzar simulación de plataforma para desarrollo / pruebas
  const [manualPlatformOverride, setManualPlatformOverride] =
    useState<PlatformType | null>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, []);

  const dismissInstall = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY_DISMISSED, "true");
      notifyDismissedListeners();
    } catch {
      // Ignorar error de persistencia
    }
  }, []);

  const resetDismiss = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY_DISMISSED);
      notifyDismissedListeners();
    } catch {
      // Ignorar error de persistencia
    }
  }, []);

  const triggerAndroidInstall = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) {
      return false;
    }

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === "accepted") {
        setDeferredPrompt(null);
        dismissInstall();
        return true;
      }
      return false;
    } catch (err) {
      console.error("Error al mostrar el prompt de instalación de Android:", err);
      return false;
    }
  }, [deferredPrompt, dismissInstall]);

  const effectivePlatform = manualPlatformOverride || deviceInfo.platform;

  return {
    isHydrated,
    deviceInfo,
    platform: effectivePlatform,
    isStandalone: deviceInfo.isStandalone,
    deferredPrompt,
    hasNativeInstallPrompt: Boolean(deferredPrompt),
    isDismissed,
    dismissInstall,
    resetDismiss,
    triggerAndroidInstall,
    setManualPlatformOverride,
  };
}

"use client";

import React from "react";
import Image from "next/image";
import { usePwaInstall } from "@/features/pwa/usePwaInstall";
import { IOSInstallGuide } from "@/features/pwa/IOSInstallGuide";
import { AndroidInstallGuide } from "@/features/pwa/AndroidInstallGuide";
import { DesktopBlockedView } from "@/features/pwa/DesktopBlockedView";
import { BankDashboard } from "@/components/views/BankDashboard";

export default function AppEntry() {
  const {
    isHydrated,
    platform,
    isStandalone,
    hasNativeInstallPrompt,
    isDismissed,
    dismissInstall,
    resetDismiss,
    triggerAndroidInstall,
    setManualPlatformOverride,
  } = usePwaInstall();

  // 1. Renderizado seguro inicial (SSR y pre-hidratación)
  // Evita discrepancias entre el HTML generado en el servidor y el navegador
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-surface-bg flex flex-col items-center justify-center p-6 text-slate-900">
        <div className="space-y-4 text-center animate-pulse">
          <div className="inline-flex items-center justify-center mx-auto">
            <Image
              src="/icons/icon-192.png"
              alt="Cargando Canasto Bank"
              width={64}
              height={64}
              className="w-16 h-16 rounded-3xl object-cover shadow-soft-glow"
              priority
            />
          </div>
          <p className="text-xs font-bold text-slate-400 tracking-wider uppercase">
            Cargando Canasto Bank...
          </p>
        </div>
      </div>
    );
  }

  // 2. Si se detecta un ordenador o dispositivo de escritorio, bloquear la experiencia
  if (platform === "desktop") {
    return (
      <DesktopBlockedView onSimulatePlatform={setManualPlatformOverride} />
    );
  }

  // 3. Si la aplicación ya se ejecuta en modo standalone (instalada en inicio), mostrar directamente el banco
  if (isStandalone) {
    return <BankDashboard isStandalone={true} platform={platform} />;
  }

  // 4. Si es iPhone / iOS y el usuario aún no la ha añadido ni descartado la guía
  if (platform === "ios" && !isDismissed) {
    return <IOSInstallGuide onContinue={dismissInstall} />;
  }

  // 5. Si es Android y el usuario aún no la ha instalado ni descartado la guía
  if (platform === "android" && !isDismissed) {
    return (
      <AndroidInstallGuide
        hasNativePrompt={hasNativeInstallPrompt}
        onInstallNative={triggerAndroidInstall}
        onContinue={dismissInstall}
      />
    );
  }

  // 6. Vista del banco móvil en navegador convencional (con recordatorio accesible para instalar)
  return (
    <BankDashboard
      isStandalone={false}
      platform={platform}
      onShowInstallGuide={resetDismiss}
    />
  );
}

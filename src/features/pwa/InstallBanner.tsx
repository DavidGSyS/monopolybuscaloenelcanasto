"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";

interface InstallBannerProps {
  platform: "ios" | "android" | "desktop" | "unknown";
  onShowGuide: () => void;
}

export function InstallBanner({ platform, onShowGuide }: InstallBannerProps) {
  const [closed, setClosed] = useState(false);

  if (closed) return null;

  return (
    <aside
      aria-label="Aviso de instalación PWA"
      className="bg-gradient-to-r from-brand-purple to-brand-purple-dark text-white px-4 py-2.5 shadow-sm text-xs"
    >
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-base shrink-0">📱</span>
          <span className="font-medium text-slate-100">
            {platform === "ios"
              ? "¿Aún en Safari? Añade Canasto Bank a tu inicio para jugar a pantalla completa."
              : "¿Aún en el navegador? Instala la app para jugar a pantalla completa."}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="yellow"
            onClick={onShowGuide}
            className="text-[11px] py-1 px-2.5 h-auto font-bold text-slate-900"
          >
            Ver pasos
          </Button>

          <button
            onClick={() => setClosed(true)}
            aria-label="Cerrar aviso"
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            ✕
          </button>
        </div>
      </div>
    </aside>
  );
}

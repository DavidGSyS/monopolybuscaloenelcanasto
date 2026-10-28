"use client";

import React, { useState, useSyncExternalStore } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PlatformType } from "@/lib/device";

interface DesktopBlockedViewProps {
  onSimulatePlatform?: (platform: PlatformType) => void;
}

function subscribeUrl(onStoreChange: () => void) {
  window.addEventListener("popstate", onStoreChange);
  return () => window.removeEventListener("popstate", onStoreChange);
}

export function DesktopBlockedView({
  onSimulatePlatform,
}: DesktopBlockedViewProps) {
  const [showDevSimulator, setShowDevSimulator] = useState(false);
  const [copied, setCopied] = useState(false);

  // Obtiene la URL actual sincronizada con el cliente sin efectos en cascada
  const currentUrl = useSyncExternalStore(
    subscribeUrl,
    () => window.location.href,
    () => ""
  );

  const handleCopy = () => {
    if (typeof navigator !== "undefined" && currentUrl) {
      navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-surface-bg flex flex-col items-center justify-center p-6 text-slate-900">
      <div className="max-w-md w-full space-y-6 text-center">
        {/* Logotipo Canasto Bank */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-tr from-brand-purple-dark to-brand-purple shadow-soft-glow mx-auto">
          <svg
            className="w-12 h-12 text-brand-yellow"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 10h16l-2 10H6L4 10z" />
            <path d="M8 10V6a4 4 0 0 1 8 0v4" />
            <circle cx="12" cy="14" r="2" fill="currentColor" />
          </svg>
        </div>

        {/* Título y Mensaje Exclusivo Móvil */}
        <div className="space-y-3">
          <Badge variant="purple" dot className="mx-auto">
            Experiencia Móvil Exclusiva
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-snug">
            Canasto Bank está diseñado para jugar desde tu teléfono.
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-medium">
            Abre este enlace en Safari desde un iPhone o en Chrome desde
            Android.
          </p>
        </div>

        {/* Tarjeta Informativa Móvil */}
        <Card className="p-6 bg-white border border-purple-100 shadow-soft-card text-left space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-brand-purple-light flex items-center justify-center text-brand-purple font-bold">
              📱
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Tu mesa, tus reglas
              </h3>
              <p className="text-xs text-slate-500">
                Optimizado para tener tu banco en la palma de la mano
              </p>
            </div>
          </div>

          <div className="space-y-2 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-mint shrink-0" />
              <span>Instalable como PWA en pantalla completa</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-yellow shrink-0" />
              <span>Sin necesidad de mouse ni pantalla grande</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-coral shrink-0" />
              <span>Diseñado para pasarse entre jugadores o jugar en vivo</span>
            </div>
          </div>

          {/* Enlace o acción para compartir a móvil */}
          {currentUrl && (
            <div className="pt-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                Enlace para abrir en tu móvil:
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={currentUrl}
                  className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-600 font-mono truncate focus:outline-none"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="shrink-0 text-xs"
                >
                  {copied ? "Copiado ✓" : "Copiar"}
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Panel de desarrollo para probar simulaciones desde el navegador de escritorio */}
        {onSimulatePlatform && (
          <div className="pt-4 border-t border-slate-200/60 text-center">
            <button
              onClick={() => setShowDevSimulator((prev) => !prev)}
              className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              {showDevSimulator ? "Ocultar simulador" : "🛠️ Opciones de simulación móvil (Dev)"}
            </button>

            {showDevSimulator && (
              <div className="mt-3 p-3 bg-slate-100/80 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <p className="text-slate-500 font-medium">
                  Prueba las diferentes vistas móviles en este navegador:
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => onSimulatePlatform("ios")}
                  >
                    Simular iPhone (iOS)
                  </Button>
                  <Button
                    size="sm"
                    variant="mint"
                    onClick={() => onSimulatePlatform("android")}
                  >
                    Simular Android
                  </Button>
                  <Button
                    size="sm"
                    variant="yellow"
                    onClick={() => onSimulatePlatform("unknown")}
                  >
                    Ver Banco Directo
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

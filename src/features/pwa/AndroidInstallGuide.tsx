"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

interface AndroidInstallGuideProps {
  hasNativePrompt: boolean;
  onInstallNative: () => Promise<boolean>;
  onContinue: () => void;
}

export function AndroidInstallGuide({
  hasNativePrompt,
  onInstallNative,
  onContinue,
}: AndroidInstallGuideProps) {
  const [isInstalling, setIsInstalling] = useState(false);

  const handleInstallClick = async () => {
    setIsInstalling(true);
    try {
      const installed = await onInstallNative();
      if (!installed) {
        // El usuario canceló o el navegador no lanzó el diálogo
      }
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-bg flex flex-col justify-between p-4 sm:p-6 max-w-lg mx-auto">
      {/* Encabezado y Marca */}
      <header className="text-center pt-2 sm:pt-4 space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-brand-purple-dark to-brand-purple shadow-soft-glow mb-1">
          <svg
            className="w-9 h-9 text-brand-yellow"
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

        <div>
          <Badge variant="mint" dot className="mb-2">
            Diseñada para Android
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
            Instala Canasto Bank en tu móvil
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-xs mx-auto leading-relaxed">
            Instala la aplicación para jugar a pantalla completa, con acceso
            rápido desde tus apps y mejor respuesta en la mesa.
          </p>
        </div>
      </header>

      {/* Contenido según soporte nativo de Chrome/Chromium o instrucciones manuales */}
      <div className="my-6 space-y-4">
        {hasNativePrompt ? (
          /* Opción 1: Disparador nativo beforeinstallprompt disponible */
          <Card className="p-6 bg-white border border-purple-100 shadow-soft-card text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-mint-light text-brand-mint-dark mx-auto flex items-center justify-center">
              <svg
                className="w-6 h-6 text-brand-mint"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Instalación en 1 toque
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Tu navegador permite instalar Canasto Bank directamente en tu pantalla de inicio.
              </p>
            </div>
            <Button
              variant="mint"
              size="lg"
              fullWidth
              disabled={isInstalling}
              onClick={handleInstallClick}
              className="font-bold text-sm"
            >
              {isInstalling ? "Abriendo instalador..." : "Instalar aplicación"}
            </Button>
          </Card>
        ) : (
          /* Opción 2: Instrucciones manuales para Chrome, Firefox, Samsung Internet */
          <div className="space-y-3">
            <Card className="p-4 sm:p-5 bg-white border border-purple-100/80 shadow-soft-card">
              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-xl bg-brand-purple-light text-brand-purple font-extrabold flex items-center justify-center shrink-0 text-sm">
                  1
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    Abre el menú de opciones (tres puntos)
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-slate-100 text-brand-purple">
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <circle cx="12" cy="5" r="2" />
                        <circle cx="12" cy="12" r="2" />
                        <circle cx="12" cy="19" r="2" />
                      </svg>
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Toca los tres puntos en la esquina superior derecha de Chrome o del navegador que utilices.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4 sm:p-5 bg-white border border-purple-100/80 shadow-soft-card">
              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-xl bg-brand-purple-light text-brand-purple font-extrabold flex items-center justify-center shrink-0 text-sm">
                  2
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-slate-900">
                    Pulsa &quot;Instalar aplicación&quot; o &quot;Añadir a la pantalla de inicio&quot;
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Dependiendo de tu navegador, la opción puede figurar como{" "}
                    <strong>Instalar aplicación</strong> o{" "}
                    <strong>Añadir a la pantalla de inicio</strong>.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4 sm:p-5 bg-white border border-purple-100/80 shadow-soft-card">
              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-xl bg-brand-purple-light text-brand-purple font-extrabold flex items-center justify-center shrink-0 text-sm">
                  3
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-slate-900">
                    Confirma la instalación
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    El icono de Canasto Bank se añadirá a tus aplicaciones.
                  </p>
                </div>
              </div>
            </Card>

            <p className="text-[11px] text-slate-400 text-center px-4">
              * El diálogo y el nombre exacto de la opción pueden variar según el navegador y la marca de tu dispositivo Android.
            </p>
          </div>
        )}
      </div>

      {/* Acciones */}
      <footer className="space-y-3 pb-4">
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={onContinue}
          className="shadow-soft-glow font-bold text-sm"
        >
          {hasNativePrompt ? "Ya la instalé / Continuar" : "Ya la añadí a mi inicio"}
        </Button>

        <button
          onClick={onContinue}
          className="w-full text-center text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors py-1 cursor-pointer"
        >
          Continuar temporalmente en el navegador
        </button>
      </footer>
    </div>
  );
}

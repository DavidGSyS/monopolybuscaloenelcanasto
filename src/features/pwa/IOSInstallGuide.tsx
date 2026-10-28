"use client";

import React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

interface IOSInstallGuideProps {
  onContinue: () => void;
}

export function IOSInstallGuide({ onContinue }: IOSInstallGuideProps) {
  return (
    <div className="min-h-screen bg-surface-bg flex flex-col justify-between p-4 sm:p-6 max-w-lg mx-auto">
      {/* Encabezado y Marca */}
      <header className="text-center pt-2 sm:pt-4 space-y-3">
        <div className="inline-flex items-center justify-center mb-1">
          <Image
            src="/icons/icon-192.png"
            alt="Canasto Bank Icono"
            width={72}
            height={72}
            className="w-18 h-18 rounded-3xl object-cover shadow-soft-glow"
            priority
          />
        </div>

        <div>
          <Badge variant="purple" dot className="mb-2">
            Diseñada para iPhone
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
            Lleva Canasto Bank a tu pantalla de inicio
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-xs mx-auto leading-relaxed">
            Para disfrutar de la experiencia completa a pantalla completa y sin
            barras del navegador durante tu partida, añade la aplicación a tu
            iPhone.
          </p>
        </div>
      </header>

      {/* Pasos de Instalación Manual en Safari */}
      <div className="my-6 space-y-3">
        {/* Paso 1 */}
        <Card className="p-4 sm:p-5 bg-white border border-purple-100/80 shadow-soft-card">
          <div className="flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-xl bg-brand-purple-light text-brand-purple font-extrabold flex items-center justify-center shrink-0 text-sm">
              1
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                Abre el menú Compartir
                {/* Icono de compartir Safari (cuadro con flecha saliendo) */}
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-slate-100 text-brand-purple">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                    />
                  </svg>
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Pulsa el icono de <strong>Compartir</strong> en la barra inferior
                de Safari (o en la barra superior en iPad).
              </p>
            </div>
          </div>
        </Card>

        {/* Paso 2 */}
        <Card className="p-4 sm:p-5 bg-white border border-purple-100/80 shadow-soft-card">
          <div className="flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-xl bg-brand-purple-light text-brand-purple font-extrabold flex items-center justify-center shrink-0 text-sm">
              2
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                Selecciona &quot;Añadir a pantalla de inicio&quot;
                {/* Icono de agregar a inicio (cuadrado con +) */}
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-slate-100 text-brand-purple">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="4" />
                    <path strokeLinecap="round" d="M12 8v8m-4-4h8" />
                  </svg>
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Baja en las opciones del menú hasta encontrar y pulsar{" "}
                <strong>Añadir a pantalla de inicio</strong>.
              </p>
            </div>
          </div>
        </Card>

        {/* Paso 3 */}
        <Card className="p-4 sm:p-5 bg-white border border-purple-100/80 shadow-soft-card">
          <div className="flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-xl bg-brand-purple-light text-brand-purple font-extrabold flex items-center justify-center shrink-0 text-sm">
              3
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-slate-900">
                Confirma tocando &quot;Añadir&quot;
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Toca <strong>Añadir</strong> en la esquina superior derecha para
                guardar el icono en tu teléfono.
              </p>
            </div>
          </div>
        </Card>

        {/* Paso 4: Abrir desde el inicio */}
        <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/60 text-amber-900 text-xs flex items-center gap-3">
          <span className="text-lg shrink-0">✨</span>
          <p className="leading-snug">
            <strong>¡Listo!</strong> Sal de Safari y abre el nuevo icono{" "}
            <strong>Canasto Bank</strong> en tu pantalla de inicio para jugar.
          </p>
        </div>

        <p className="text-[11px] text-slate-400 text-center px-4">
          * Los pasos pueden variar ligeramente según la versión de iOS de tu dispositivo.
        </p>
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
          Ya la añadí a mi inicio
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

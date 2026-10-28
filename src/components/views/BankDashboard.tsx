"use client";

import React from "react";
import { Header } from "@/components/ui/Header";
import { GameModeSelector } from "@/features/game/GameModeSelector";
import { QuickDemoBalance } from "@/features/bank/QuickDemoBalance";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { InstallBanner } from "@/features/pwa/InstallBanner";
import { PlatformType } from "@/lib/device";

interface BankDashboardProps {
  isStandalone?: boolean;
  platform?: PlatformType;
  onShowInstallGuide?: () => void;
}

export function BankDashboard({
  isStandalone = false,
  platform = "unknown",
  onShowInstallGuide,
}: BankDashboardProps) {
  return (
    <div className="min-h-full flex flex-col">
      {/* Banner de instalación si se usa en navegador web móvil */}
      {!isStandalone && onShowInstallGuide && (
        <InstallBanner
          platform={platform}
          onShowGuide={onShowInstallGuide}
        />
      )}

      {/* Cabecera de la aplicación */}
      <Header
        isStandalone={isStandalone}
        onShowInstallGuide={onShowInstallGuide}
      />

      {/* Contenido Principal */}
      <div className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-5 sm:py-8 space-y-6 sm:space-y-10">
        {/* Hero Section */}
        <section className="text-center space-y-3 pt-1 sm:pt-3">
          <div className="inline-flex items-center gap-2">
            <Badge variant="purple" dot>
              Banco Digital para Juegos de Mesa
            </Badge>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              Tu mesa,{" "}
              <span className="bg-gradient-to-r from-brand-purple via-brand-purple-accent to-brand-coral bg-clip-text text-transparent">
                tus reglas
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              Canasto Bank reemplaza el dinero en efectivo y la lentitud del
              banquero tradicional por transferencias rápidas, claras y sin
              disputas.
            </p>
          </div>
        </section>

        {/* Grid Principal: Selector de Modos + Demo Interactivo */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
          {/* Columna Izquierda: Modalidades */}
          <div className="lg:col-span-7 space-y-5">
            <GameModeSelector />

            {/* Tarjetas de Beneficios Clave */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <Card className="p-4 bg-purple-50/50 border-purple-100">
                <div className="w-8 h-8 rounded-xl bg-brand-purple text-white flex items-center justify-center font-bold text-xs mb-2 shadow-sm">
                  ₵
                </div>
                <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                  Cero billetes rotos
                </h4>
                <p className="text-[11px] text-slate-500 mt-1">
                  Control numérico exacto sin desorden en la mesa.
                </p>
              </Card>

              <Card className="p-4 bg-emerald-50/50 border-emerald-100">
                <div className="w-8 h-8 rounded-xl bg-brand-mint text-white flex items-center justify-center font-bold text-xs mb-2 shadow-sm">
                  ⚡
                </div>
                <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                  Partidas 2x rápidas
                </h4>
                <p className="text-[11px] text-slate-500 mt-1">
                  Paga alquileres y cobra sueldos con un solo toque.
                </p>
              </Card>

              <Card className="p-4 bg-amber-50/50 border-amber-100">
                <div className="w-8 h-8 rounded-xl bg-brand-yellow text-slate-900 flex items-center justify-center font-bold text-xs mb-2 shadow-sm">
                  📱
                </div>
                <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                  PWA Instalable
                </h4>
                <p className="text-[11px] text-slate-500 mt-1">
                  Guárdala en tu pantalla de inicio en iOS y Android.
                </p>
              </Card>
            </div>
          </div>

          {/* Columna Derecha: Vista previa del banquero */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Vista Previa de la Banca
              </span>
              <span className="text-xs text-brand-purple font-semibold">
                Interactivo
              </span>
            </div>
            <QuickDemoBalance />
          </div>
        </div>

        {/* Pie de página con información del estado */}
        <footer className="pt-6 border-t border-slate-200/80 text-center space-y-2 pb-6">
          <p className="text-xs font-medium text-slate-500">
            Canasto Bank • Banco Digital para Juegos de Mesa • Fase 1
          </p>
          <p className="text-[11px] text-slate-400">
            Diseñada exclusivamente para teléfonos móviles (iOS & Android).
          </p>
        </footer>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { Header } from "@/components/ui/Header";
import { GameModeSelector } from "@/features/game/GameModeSelector";
import { QuickDemoBalance } from "@/features/bank/QuickDemoBalance";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { InstallBanner } from "@/features/pwa/InstallBanner";
import { PlatformType } from "@/lib/device";
import { useGame } from "@/features/game/GameContext";
import { CreateGameForm } from "@/features/game/CreateGameForm";
import { SavedGamesSection } from "@/features/game/SavedGamesSection";
import { ActiveGameView } from "@/features/game/ActiveGameView";
import { formatMoney } from "@/lib/utils";

export type DashboardView = "hub" | "create" | "active" | "saved";

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
  const { activeSession, savedGamesList, storageError, clearStorageError } = useGame();
  const [view, setView] = useState<DashboardView>("hub");

  const totalTableMoney = activeSession
    ? activeSession.players.reduce((sum, p) => sum + p.balance, 0)
    : 0;

  return (
    <div className="min-h-full flex flex-col">
      {/* Banner de instalación si se usa en navegador web móvil */}
      {!isStandalone && onShowInstallGuide && (
        <InstallBanner platform={platform} onShowGuide={onShowInstallGuide} />
      )}

      {/* Cabecera de la aplicación */}
      <Header isStandalone={isStandalone} onShowInstallGuide={onShowInstallGuide} />

      {/* Contenido Principal */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-5 sm:py-8">
        {/* Banner de advertencia si hubo problemas con localStorage / cuota */}
        {storageError && (
          <div className="mb-5 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="text-base">⚠️</span>
              <span>{storageError.message}</span>
            </div>
            <button
              type="button"
              onClick={clearStorageError}
              className="text-[11px] underline font-bold hover:text-amber-950 shrink-0 cursor-pointer"
            >
              Entendido
            </button>
          </div>
        )}

        {/* 1. Vista: Formulario de Creación de Partida */}
        {view === "create" && (
          <CreateGameForm
            onSuccess={() => setView("active")}
            onCancel={() => setView("hub")}
          />
        )}

        {/* 2. Vista: Mesa de Partida Activa */}
        {view === "active" && (
          activeSession ? (
            <ActiveGameView
              session={activeSession}
              onBackToHub={() => setView("hub")}
              onViewAllSavedGames={() => setView("saved")}
            />
          ) : (
            <Card className="p-8 text-center space-y-4 max-w-md mx-auto">
              <div className="text-3xl">🎲</div>
              <h3 className="font-bold text-slate-800 text-base">
                No hay ninguna partida activa en este momento
              </h3>
              <p className="text-xs text-slate-500">
                Crea una nueva partida o abre una desde el historial guardado.
              </p>
              <div className="flex items-center justify-center gap-2 pt-2">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => setView("create")}
                >
                  + Crear Partida
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setView("saved")}
                >
                  Ver Guardadas
                </Button>
              </div>
            </Card>
          )
        )}

        {/* 3. Vista: Administrador de Partidas Guardadas */}
        {view === "saved" && (
          <SavedGamesSection
            onSelectSession={() => setView("active")}
            onCreateNewGame={() => setView("create")}
            onBack={() => setView("hub")}
          />
        )}

        {/* 4. Vista Principal: Hub del Banco */}
        {view === "hub" && (
          <div className="space-y-6 sm:space-y-10">
            {/* Hero Section */}
            <section className="text-center space-y-3 pt-1 sm:pt-2">
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

            {/* Acceso Rápido a Partida Activa (si existe) */}
            {activeSession && (
              <Card
                variant="interactive"
                onClick={() => setView("active")}
                className="p-5 bg-gradient-to-r from-purple-50 via-white to-emerald-50/40 border-purple-200 ring-2 ring-brand-purple/10 shadow-soft-glow"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="mint" dot>
                        Partida en curso
                      </Badge>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {activeSession.players.length} jugadores
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-slate-900 truncate tracking-tight">
                      {activeSession.name}
                    </h3>
                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                      {activeSession.players.map((p) => (
                        <span
                          key={p.id}
                          className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-700 shadow-2xs"
                        >
                          <span>{p.avatarSymbol}</span>
                          <span className="truncate max-w-[80px]">{p.name}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                      En circulación
                    </span>
                    <span className="text-sm sm:text-base font-black text-brand-purple">
                      {formatMoney(totalTableMoney)}
                    </span>
                    <div className="mt-2">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          setView("active");
                        }}
                        className="text-xs font-bold shadow-xs"
                      >
                        Continuar mesa →
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Botonera de Acciones Principales (Fase 2) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <button
                type="button"
                onClick={() => setView("create")}
                className="group p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-brand-purple to-purple-800 text-white shadow-soft-glow hover:shadow-lg transition-all text-left flex items-center justify-between cursor-pointer"
              >
                <div className="space-y-1">
                  <span className="inline-block text-xl">🎲</span>
                  <h3 className="font-extrabold text-base sm:text-lg tracking-tight">
                    Crear Nueva Partida
                  </h3>
                  <p className="text-xs text-purple-200">
                    De 2 a 8 jugadores con dinero inicial y colores
                  </p>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center font-bold text-lg group-hover:translate-x-1 transition-transform shrink-0">
                  +
                </div>
              </button>

              <button
                type="button"
                onClick={() => setView("saved")}
                className="group p-4 sm:p-5 rounded-3xl bg-white border-2 border-slate-200 hover:border-brand-purple/50 shadow-soft hover:shadow-md transition-all text-left flex items-center justify-between cursor-pointer"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-block text-xl">📁</span>
                    <Badge variant={savedGamesList.length > 0 ? "purple" : "neutral"}>
                      {savedGamesList.length}
                    </Badge>
                  </div>
                  <h3 className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight">
                    Partidas Guardadas
                  </h3>
                  <p className="text-xs text-slate-500">
                    {savedGamesList.length === 0
                      ? "Sin partidas previas en este dispositivo"
                      : "Reanudar, consultar o administrar sesiones"}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-slate-100 group-hover:bg-purple-100 text-slate-600 group-hover:text-brand-purple flex items-center justify-center font-bold text-lg group-hover:translate-x-1 transition-all shrink-0">
                  →
                </div>
              </button>
            </div>

            {/* Grid Principal: Selector de Modos + Demo Interactivo */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
              {/* Columna Izquierda: Modalidades */}
              <div className="lg:col-span-7 space-y-5">
                <GameModeSelector onStartLocal={() => setView("create")} />

                {/* Tarjetas de Beneficios Clave */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <Card className="p-4 bg-purple-50/50 border-purple-100">
                    <div className="w-8 h-8 rounded-xl bg-brand-purple text-white flex items-center justify-center font-bold text-xs mb-2 shadow-xs">
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
                    <div className="w-8 h-8 rounded-xl bg-brand-mint text-white flex items-center justify-center font-bold text-xs mb-2 shadow-xs">
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
                    <div className="w-8 h-8 rounded-xl bg-brand-yellow text-slate-900 flex items-center justify-center font-bold text-xs mb-2 shadow-xs">
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
                Canasto Bank • Banco Digital para Juegos de Mesa • Fase 2
              </p>
              <p className="text-[11px] text-slate-400">
                Diseñada exclusivamente para teléfonos móviles (iOS & Android).
              </p>
            </footer>
          </div>
        )}
      </main>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { GameSession } from "@/types";
import { useGame } from "./GameContext";
import { formatMoney } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export interface SavedGamesSectionProps {
  onSelectSession: (session: GameSession) => void;
  onCreateNewGame: () => void;
  onBack?: () => void;
}

function formatGameDate(timestamp: number): string {
  try {
    const d = new Date(timestamp);
    return d.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "Fecha no disponible";
  }
}

export function SavedGamesSection({
  onSelectSession,
  onCreateNewGame,
  onBack,
}: SavedGamesSectionProps) {
  const {
    savedGamesList,
    activeSessionId,
    switchActiveGame,
    finishActiveGame,
    resumeActiveGame,
    deleteGame,
  } = useGame();

  const [sessionToDelete, setSessionToDelete] = useState<GameSession | null>(null);
  const [sessionToFinish, setSessionToFinish] = useState<GameSession | null>(null);

  const handleOpenGame = (session: GameSession) => {
    switchActiveGame(session.id);
    onSelectSession(session);
  };

  const handleConfirmDelete = () => {
    if (!sessionToDelete) return;
    deleteGame(sessionToDelete.id);
    setSessionToDelete(null);
  };

  const handleConfirmFinish = () => {
    if (!sessionToFinish) return;
    finishActiveGame(sessionToFinish.id);
    setSessionToFinish(null);
  };

  return (
    <div className="space-y-4">
      {/* Encabezado */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 gap-2">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="p-1 -ml-1 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Volver al menú principal"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Partidas Guardadas
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {savedGamesList.length === 1
                ? "1 partida registrada en este dispositivo"
                : `${savedGamesList.length} partidas registradas en este dispositivo`}
            </p>
          </div>
        </div>

        <Button
          type="button"
          size="sm"
          variant="primary"
          onClick={onCreateNewGame}
          className="text-xs font-bold shrink-0"
        >
          + Nueva
        </Button>
      </div>

      {/* Estado Vacío */}
      {savedGamesList.length === 0 ? (
        <Card className="p-8 text-center bg-white border border-dashed border-slate-300 rounded-3xl space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-brand-purple-light text-brand-purple flex items-center justify-center text-3xl mx-auto shadow-xs">
            🎲
          </div>
          <div className="space-y-1.5 max-w-xs mx-auto">
            <h3 className="text-base font-bold text-slate-900">
              No tienes partidas guardadas
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Crea tu primera partida para registrar a tus jugadores, sus saldos
              iniciales y comenzar a administrar la banca digital.
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={onCreateNewGame}
            className="shadow-soft-glow font-bold text-xs"
          >
            Crear Primera Partida
          </Button>
        </Card>
      ) : (
        /* Lista de Partidas */
        <div className="space-y-3">
          {savedGamesList.map((session) => {
            const isActiveCurrent = session.id === activeSessionId;
            const isFinished = session.status === "finished";
            const totalTableMoney = session.players.reduce(
              (acc, p) => acc + p.balance,
              0
            );

            return (
              <Card
                key={session.id}
                className={`p-4 sm:p-5 bg-white border transition-all space-y-3 ${
                  isActiveCurrent
                    ? "border-brand-purple/60 ring-2 ring-brand-purple/15 shadow-md"
                    : "border-slate-200/80 shadow-xs hover:border-slate-300"
                }`}
              >
                {/* Cabecera de la partida */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                        {session.name}
                      </h3>
                      {isActiveCurrent && (
                        <Badge variant="purple" dot className="text-[10px] py-0.5 px-2">
                          En curso
                        </Badge>
                      )}
                      {isFinished ? (
                        <Badge variant="neutral" className="text-[10px] py-0.5 px-2">
                          Finalizada
                        </Badge>
                      ) : (
                        <Badge variant="mint" className="text-[10px] py-0.5 px-2">
                          Activa
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Actualizada: {formatGameDate(session.updatedAt)}
                    </p>
                  </div>

                  <span className="text-xs font-bold text-slate-700 font-mono bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-100">
                    {formatMoney(totalTableMoney, session.settings.currencySymbol)}
                  </span>
                </div>

                {/* Resumen de Jugadores */}
                <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50/70 p-2.5 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-1.5 overflow-hidden">
                    <span className="font-semibold text-slate-500 text-[11px] shrink-0">
                      {session.players.length} Jugadores:
                    </span>
                    <div className="flex items-center gap-1 truncate">
                      {session.players.map((p) => (
                        <span
                          key={p.id}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-white border border-slate-200 text-[11px] font-medium"
                          title={`${p.name}: ${formatMoney(p.balance)}`}
                        >
                          <span>{p.avatarSymbol}</span>
                          <span className="truncate max-w-[60px]">{p.name}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Botonera de Acciones Táctiles */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    {/* Botón Finalizar / Reanudar */}
                    {isFinished ? (
                      <button
                        type="button"
                        onClick={() => resumeActiveGame(session.id)}
                        className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 px-2.5 py-1.5 rounded-xl hover:bg-emerald-50 transition-colors cursor-pointer"
                      >
                        Reanudar
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSessionToFinish(session)}
                        className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        Finalizar
                      </button>
                    )}

                    {/* Botón Eliminar */}
                    <button
                      type="button"
                      onClick={() => setSessionToDelete(session)}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-800 px-2.5 py-1.5 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      Eliminar
                    </button>
                  </div>

                  {/* Botón Abrir / Continuar Mesa */}
                  <Button
                    type="button"
                    size="sm"
                    variant={isActiveCurrent ? "primary" : "outline"}
                    onClick={() => handleOpenGame(session)}
                    className="font-bold text-xs"
                  >
                    {isFinished ? "Consultar Mesa" : "Abrir Mesa"}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Diálogo de Confirmación para Eliminar Partida */}
      <ConfirmDialog
        isOpen={Boolean(sessionToDelete)}
        title="¿Eliminar partida?"
        description={`¿Estás seguro de que deseas eliminar permanentemente '${sessionToDelete?.name}'? Los saldos y el historial de esta partida se borrarán del almacenamiento local.`}
        confirmText="Sí, eliminar"
        confirmVariant="coral"
        onConfirm={handleConfirmDelete}
        onCancel={() => setSessionToDelete(null)}
      />

      {/* Diálogo de Confirmación para Finalizar Partida */}
      <ConfirmDialog
        isOpen={Boolean(sessionToFinish)}
        title="¿Finalizar partida?"
        description={`¿Deseas dar por terminada '${sessionToFinish?.name}'? La partida quedará en estado 'Finalizada' conservando los saldos finales y el historial completo.`}
        confirmText="Finalizar partida"
        confirmVariant="yellow"
        onConfirm={handleConfirmFinish}
        onCancel={() => setSessionToFinish(null)}
      />
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { GameSession, Player } from "@/types";
import { useGame } from "./GameContext";
import { formatMoney } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { BankingPanel, TransactionHistory, COLOR_BG } from "./BankingPanel";

export interface ActiveGameViewProps {
  session: GameSession;
  onBackToHub: () => void;
  onViewAllSavedGames: () => void;
}

export function ActiveGameView({
  session,
  onBackToHub,
  onViewAllSavedGames,
}: ActiveGameViewProps) {
  const { finishActiveGame, resumeActiveGame } = useGame();
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<"bank" | "history">("bank");

  const isFinished = session.status === "finished";
  const totalTableMoney = session.players.reduce((sum, p) => sum + p.balance, 0);
  // Exclude initial seeding transactions from "user operations" count
  const operationCount = session.transactions.filter(
    (tx) => tx.type !== "bank_to_player" || !tx.description.startsWith("Asignación de capital inicial")
  ).length;

  const handleFinish = () => {
    finishActiveGame(session.id);
    setShowFinishConfirm(false);
  };

  const handleResume = () => {
    resumeActiveGame(session.id);
  };

  return (
    <div className="space-y-5 pb-8">
      {/* ── Barra de Navegación ── */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <button
          type="button"
          onClick={onBackToHub}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-brand-purple transition-colors py-1 cursor-pointer"
        >
          <span>←</span>
          <span>Menú Principal</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onViewAllSavedGames}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-2.5 py-1 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            📁 Partidas
          </button>

          {isFinished ? (
            <Button
              type="button"
              size="sm"
              variant="mint"
              onClick={handleResume}
              className="text-xs font-bold"
            >
              Reanudar
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setShowFinishConfirm(true)}
              className="text-xs font-semibold text-slate-600 border-slate-300"
            >
              Finalizar
            </Button>
          )}
        </div>
      </div>

      {/* ── Cabecera de la Mesa ── */}
      <section className="bg-gradient-to-br from-brand-purple-dark via-brand-purple to-purple-900 rounded-3xl p-5 sm:p-6 text-white shadow-soft-glow space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight truncate">
                {session.name}
              </h1>
              <Badge
                variant={isFinished ? "neutral" : "mint"}
                dot={!isFinished}
                className="text-[10px] py-0.5 px-2 bg-white/20 text-white border-white/20 shrink-0"
              >
                {isFinished ? "Finalizada" : "En Vivo"}
              </Badge>
            </div>
            <p className="text-xs text-purple-200">
              {session.players.length} jugadores • Sueldo:{" "}
              {formatMoney(session.settings.salaryPassGo, session.settings.currencySymbol)}
            </p>
          </div>
        </div>

        {/* Estadísticas macro */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-purple-400/30 text-xs">
          <div>
            <span className="text-purple-300 uppercase tracking-wider font-semibold text-[10px] block">
              En Circulación
            </span>
            <span className="text-base sm:text-lg font-black text-brand-yellow font-mono mt-0.5 block">
              {formatMoney(totalTableMoney, session.settings.currencySymbol)}
            </span>
          </div>
          <div>
            <span className="text-purple-300 uppercase tracking-wider font-semibold text-[10px] block">
              Capital Inicial
            </span>
            <span className="text-base sm:text-lg font-black text-white font-mono mt-0.5 block">
              {formatMoney(session.settings.startingBalance, session.settings.currencySymbol)}
            </span>
          </div>
          <div>
            <span className="text-purple-300 uppercase tracking-wider font-semibold text-[10px] block">
              Operaciones
            </span>
            <span className="text-base sm:text-lg font-black text-white font-mono mt-0.5 block">
              {operationCount}
            </span>
          </div>
        </div>
      </section>

      {/* ── Saldos de los Jugadores ── */}
      <section className="space-y-3">
        <h2 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <span>Saldos de la Mesa</span>
          <span className="text-xs font-bold text-slate-400">({session.players.length})</span>
        </h2>

        <div className="grid grid-cols-2 gap-2.5">
          {session.players.map((player: Player) => {
            const colorCls = COLOR_BG[player.color] || COLOR_BG.purple;
            return (
              <Card
                key={player.id}
                className={`p-3.5 bg-white border shadow-xs space-y-2`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base border shrink-0 ${colorCls}`}>
                    {player.avatarSymbol}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 text-xs truncate leading-tight">
                      {player.name}
                    </p>
                    {player.isHost && (
                      <Badge variant="purple" className="text-[9px] py-0 px-1.5 mt-0.5">
                        Anfitrión
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="pt-1.5 border-t border-slate-100">
                  <span className="text-lg font-black text-slate-900 font-mono leading-tight block">
                    {formatMoney(player.balance, session.settings.currencySymbol)}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ── Tabs: Banco / Historial ── */}
      <section className="space-y-3">
        <div className="flex gap-1 p-1 bg-slate-100 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab("bank")}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === "bank"
                ? "bg-white text-brand-purple shadow-xs"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            🏦 Operaciones
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === "history"
                ? "bg-white text-brand-purple shadow-xs"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            📋 Historial ({session.transactions.length})
          </button>
        </div>

        <Card className="p-4">
          {activeTab === "bank" ? (
            <BankingPanel session={session} />
          ) : (
            <TransactionHistory
              transactions={session.transactions}
              players={session.players}
              currency={session.settings.currencySymbol}
            />
          )}
        </Card>
      </section>

      {/* ── Diálogo de Confirmación ── */}
      <ConfirmDialog
        isOpen={showFinishConfirm}
        title="¿Finalizar la partida actual?"
        description={`¿Deseas marcar '${session.name}' como terminada? Los saldos finales se conservarán en tu lista de partidas guardadas.`}
        confirmText="Finalizar"
        confirmVariant="yellow"
        onConfirm={handleFinish}
        onCancel={() => setShowFinishConfirm(false)}
      />
    </div>
  );
}

"use client";

import React, { useState, useTransition } from "react";
import { PlayerColor, GameSession } from "@/types";
import { useGame } from "./GameContext";
import {
  DEFAULT_PLAYER_COLORS,
  DEFAULT_AVATAR_SYMBOLS,
} from "@/lib/gameEngine";
import { DOMAIN_LIMITS, GameValidationError } from "@/lib/validation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface PlayerFormState {
  name: string;
  color: PlayerColor;
  avatar: string;
}

const COLOR_MAP: Record<PlayerColor, { bg: string; label: string; text: string }> = {
  purple: { bg: "bg-purple-600", label: "Morado", text: "text-purple-700" },
  yellow: { bg: "bg-amber-400", label: "Amarillo", text: "text-amber-800" },
  coral: { bg: "bg-rose-500", label: "Coral", text: "text-rose-700" },
  mint: { bg: "bg-emerald-500", label: "Menta", text: "text-emerald-700" },
  blue: { bg: "bg-sky-500", label: "Azul", text: "text-sky-700" },
  orange: { bg: "bg-orange-500", label: "Naranja", text: "text-orange-700" },
};

function createInitialPlayerList(count: number): PlayerFormState[] {
  return Array.from({ length: count }, (_, i) => ({
    name: `Jugador ${i + 1}`,
    color: DEFAULT_PLAYER_COLORS[i % DEFAULT_PLAYER_COLORS.length],
    avatar: DEFAULT_AVATAR_SYMBOLS[i % DEFAULT_AVATAR_SYMBOLS.length],
  }));
}

export interface CreateGameFormProps {
  onSuccess: (createdSession: GameSession) => void;
  onCancel: () => void;
}

export function CreateGameForm({ onSuccess, onCancel }: CreateGameFormProps) {
  const { createGame } = useGame();
  const [, startTransition] = useTransition();

  const [gameName, setGameName] = useState("");
  const [playerCount, setPlayerCount] = useState(3);
  const [players, setPlayers] = useState<PlayerFormState[]>(() =>
    createInitialPlayerList(3)
  );

  const [startingBalance, setStartingBalance] = useState<number>(1500);
  const [salaryPassGo, setSalaryPassGo] = useState<number>(200);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Adapta dinámicamente la lista de jugadores sin perder nombres introducidos
   */
  const handlePlayerCountChange = (newCount: number) => {
    if (newCount < DOMAIN_LIMITS.MIN_PLAYERS || newCount > DOMAIN_LIMITS.MAX_PLAYERS) {
      return;
    }

    setPlayerCount(newCount);
    setPlayers((prev) => {
      if (newCount > prev.length) {
        const additional = Array.from({ length: newCount - prev.length }, (_, i) => {
          const idx = prev.length + i;
          return {
            name: `Jugador ${idx + 1}`,
            color: DEFAULT_PLAYER_COLORS[idx % DEFAULT_PLAYER_COLORS.length],
            avatar: DEFAULT_AVATAR_SYMBOLS[idx % DEFAULT_AVATAR_SYMBOLS.length],
          };
        });
        return [...prev, ...additional];
      }
      return prev.slice(0, newCount);
    });

    // Limpiar errores previos de conteo
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy.players;
      return copy;
    });
  };

  const handlePlayerNameChange = (index: number, val: string) => {
    setPlayers((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], name: val };
      return copy;
    });

    // Limpieza de error en tiempo real para ese jugador
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy[`player_${index}`];
      delete copy.general;
      return copy;
    });
  };

  const handlePlayerColorChange = (index: number, color: PlayerColor) => {
    setPlayers((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], color };
      return copy;
    });
  };

  const handlePlayerAvatarChange = (index: number, avatar: string) => {
    setPlayers((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], avatar };
      return copy;
    });
  };

  /**
   * Validación local reactiva antes del envío
   */
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const trimmedName = gameName.trim();

    if (!trimmedName) {
      newErrors.gameName = "El nombre de la partida es obligatorio.";
    } else if (trimmedName.length > DOMAIN_LIMITS.MAX_GAME_NAME_LENGTH) {
      newErrors.gameName = `Máximo ${DOMAIN_LIMITS.MAX_GAME_NAME_LENGTH} caracteres.`;
    }

    const seenNames = new Set<string>();
    players.forEach((p, idx) => {
      const pName = p.name.trim();
      if (!pName) {
        newErrors[`player_${idx}`] = "Ingresa un nombre.";
      } else if (pName.length > DOMAIN_LIMITS.MAX_PLAYER_NAME_LENGTH) {
        newErrors[`player_${idx}`] = `Máximo ${DOMAIN_LIMITS.MAX_PLAYER_NAME_LENGTH} letras.`;
      } else if (seenNames.has(pName.toLowerCase())) {
        newErrors[`player_${idx}`] = "Nombre repetido en la mesa.";
      } else {
        seenNames.add(pName.toLowerCase());
      }
    });

    if (
      !Number.isSafeInteger(startingBalance) ||
      startingBalance < DOMAIN_LIMITS.MIN_STARTING_BALANCE ||
      startingBalance > DOMAIN_LIMITS.MAX_STARTING_BALANCE
    ) {
      newErrors.startingBalance = `Debe ser entre 1 y ${DOMAIN_LIMITS.MAX_STARTING_BALANCE.toLocaleString()}`;
    }

    if (
      !Number.isSafeInteger(salaryPassGo) ||
      salaryPassGo < DOMAIN_LIMITS.MIN_SALARY_PASS_GO ||
      salaryPassGo > DOMAIN_LIMITS.MAX_SALARY_PASS_GO
    ) {
      newErrors.salaryPassGo = `Debe ser entre 0 y ${DOMAIN_LIMITS.MAX_SALARY_PASS_GO.toLocaleString()}`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return; // Protección anti-duplicados por doble clic

    setGeneralError(null);
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const created = createGame({
        name: gameName.trim(),
        mode: "local",
        players: players.map((p) => ({
          name: p.name.trim(),
          color: p.color,
          avatarSymbol: p.avatar,
        })),
        startingBalance,
        salaryPassGo,
        currencySymbol: "₵",
      });

      startTransition(() => {
        onSuccess(created);
      });
    } catch (err: unknown) {
      setIsSubmitting(false);
      if (err instanceof GameValidationError) {
        setGeneralError(err.message);
      } else {
        setGeneralError("Ocurrió un error inesperado al crear la partida.");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-6">
      {/* Encabezado del Formulario */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Nueva Partida Local
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configura los participantes y el dinero de inicio
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-xl hover:bg-slate-100 transition-colors"
        >
          Cancelar
        </button>
      </div>

      {generalError && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
          <span>⚠️</span>
          <span>{generalError}</span>
        </div>
      )}

      {/* 1. Nombre de la Partida */}
      <div className="space-y-1.5">
        <label
          htmlFor="game-name-input"
          className="text-xs font-bold text-slate-700 uppercase tracking-wider block"
        >
          Nombre de la Partida <span className="text-rose-500">*</span>
        </label>
        <input
          id="game-name-input"
          type="text"
          value={gameName}
          onChange={(e) => {
            setGameName(e.target.value);
            if (errors.gameName) {
              setErrors((prev) => {
                const copy = { ...prev };
                delete copy.gameName;
                return copy;
              });
            }
          }}
          placeholder="Ej. Monopoly Noche de Viernes"
          maxLength={DOMAIN_LIMITS.MAX_GAME_NAME_LENGTH}
          className={`w-full px-4 py-3 rounded-2xl bg-white border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-purple/20 transition-all ${
            errors.gameName
              ? "border-rose-400 focus:border-rose-500"
              : "border-slate-200 focus:border-brand-purple"
          }`}
          autoFocus
        />
        {errors.gameName && (
          <p className="text-xs text-rose-600 font-medium">{errors.gameName}</p>
        )}
      </div>

      {/* 2. Selector de Cantidad de Jugadores (Chips táctiles) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
            Cantidad de Jugadores
          </label>
          <span className="text-xs font-bold text-brand-purple">
            {playerCount} Participantes
          </span>
        </div>

        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {[2, 3, 4, 5, 6, 7, 8].map((count) => {
            const isSelected = count === playerCount;
            return (
              <button
                key={count}
                type="button"
                onClick={() => handlePlayerCountChange(count)}
                className={`h-12 rounded-2xl font-extrabold text-sm flex items-center justify-center transition-all cursor-pointer ${
                  isSelected
                    ? "bg-brand-purple text-white shadow-soft-glow scale-105"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {count}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Configuración Individual de Cada Jugador */}
      <div className="space-y-3">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
          Configuración de Jugadores
        </label>

        <div className="space-y-3">
          {players.map((player, idx) => {
            const playerError = errors[`player_${idx}`];
            return (
              <Card
                key={idx}
                className="p-4 bg-white border border-slate-200/80 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base select-none">{player.avatar}</span>
                    <span className="text-xs font-bold text-slate-600">
                      Jugador #{idx + 1}
                    </span>
                    {idx === 0 && (
                      <Badge variant="purple" className="text-[10px] py-0.5 px-2">
                        Anfitrión
                      </Badge>
                    )}
                  </div>
                  <span
                    className={`w-3 h-3 rounded-full shrink-0 ${
                      COLOR_MAP[player.color].bg
                    }`}
                    title={COLOR_MAP[player.color].label}
                  />
                </div>

                {/* Input de Nombre */}
                <div>
                  <input
                    type="text"
                    value={player.name}
                    onChange={(e) => handlePlayerNameChange(idx, e.target.value)}
                    placeholder={`Nombre del Jugador ${idx + 1}`}
                    maxLength={DOMAIN_LIMITS.MAX_PLAYER_NAME_LENGTH}
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white transition-all ${
                      playerError
                        ? "border-rose-400 focus:border-rose-500"
                        : "border-slate-200 focus:border-brand-purple"
                    }`}
                  />
                  {playerError && (
                    <p className="text-[11px] text-rose-600 font-medium mt-1">
                      {playerError}
                    </p>
                  )}
                </div>

                {/* Selectores de Color y Avatar en línea */}
                <div className="space-y-2 pt-1 border-t border-slate-100">
                  {/* Selector de Color */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 font-medium shrink-0">
                      Color:
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {DEFAULT_PLAYER_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => handlePlayerColorChange(idx, c)}
                          className={`w-6 h-6 rounded-full transition-transform cursor-pointer ${
                            COLOR_MAP[c].bg
                          } ${
                            player.color === c
                              ? "ring-2 ring-offset-2 ring-slate-800 scale-110"
                              : "opacity-80 hover:opacity-100"
                          }`}
                          title={COLOR_MAP[c].label}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Selector de Avatar */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 font-medium shrink-0">
                      Avatar:
                    </span>
                    <div className="flex items-center gap-1 overflow-x-auto py-0.5 no-scrollbar">
                      {DEFAULT_AVATAR_SYMBOLS.map((symbol) => (
                        <button
                          key={symbol}
                          type="button"
                          onClick={() => handlePlayerAvatarChange(idx, symbol)}
                          className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center transition-all cursor-pointer ${
                            player.avatar === symbol
                              ? "bg-brand-purple-light text-brand-purple border border-purple-300 font-bold scale-110 shadow-xs"
                              : "bg-slate-50 hover:bg-slate-100 text-slate-700"
                          }`}
                        >
                          {symbol}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* 4. Configuración de Dinero (Colapsable) */}
      <div className="border border-slate-200 rounded-2xl bg-white p-4 space-y-3">
        <button
          type="button"
          onClick={() => setShowAdvancedSettings((prev) => !prev)}
          className="w-full flex items-center justify-between text-left cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <span className="text-base">💰</span>
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Ajustes de Dinero y Reglas
            </span>
          </div>
          <span className="text-xs text-brand-purple font-bold">
            {showAdvancedSettings ? "Ocultar ▲" : "Configurar ▼"}
          </span>
        </button>

        {showAdvancedSettings ? (
          <div className="space-y-4 pt-3 border-t border-slate-100 text-xs animate-in fade-in">
            {/* Capital Inicial */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="font-semibold text-slate-700">
                  Capital Inicial por Jugador:
                </label>
                <div className="flex gap-1">
                  {[1000, 1500, 2000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setStartingBalance(preset)}
                      className={`px-2 py-0.5 rounded-lg text-[11px] font-bold ${
                        startingBalance === preset
                          ? "bg-brand-purple text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="number"
                min={DOMAIN_LIMITS.MIN_STARTING_BALANCE}
                max={DOMAIN_LIMITS.MAX_STARTING_BALANCE}
                value={startingBalance}
                onChange={(e) => setStartingBalance(Number(e.target.value) || 0)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono text-sm focus:outline-none focus:border-brand-purple"
              />
              {errors.startingBalance && (
                <p className="text-[11px] text-rose-600 font-medium">
                  {errors.startingBalance}
                </p>
              )}
            </div>

            {/* Sueldo por vuelta */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="font-semibold text-slate-700">
                  Sueldo por Vuelta (Salida / Go):
                </label>
                <div className="flex gap-1">
                  {[100, 200, 400].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setSalaryPassGo(preset)}
                      className={`px-2 py-0.5 rounded-lg text-[11px] font-bold ${
                        salaryPassGo === preset
                          ? "bg-brand-mint text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="number"
                min={DOMAIN_LIMITS.MIN_SALARY_PASS_GO}
                max={DOMAIN_LIMITS.MAX_SALARY_PASS_GO}
                value={salaryPassGo}
                onChange={(e) => setSalaryPassGo(Number(e.target.value) || 0)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono text-sm focus:outline-none focus:border-brand-purple"
              />
              {errors.salaryPassGo && (
                <p className="text-[11px] text-rose-600 font-medium">
                  {errors.salaryPassGo}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span>
              Inicio: <strong>₵ {startingBalance.toLocaleString()}</strong>
            </span>
            <span>
              Vuelta: <strong>₵ {salaryPassGo.toLocaleString()}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Botón de Creación */}
      <div className="pt-2">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          disabled={isSubmitting}
          className="shadow-soft-glow font-bold text-sm h-12"
        >
          {isSubmitting ? "Creando Partida..." : "Crear Partida y Abrir Mesa"}
        </Button>
      </div>
    </form>
  );
}


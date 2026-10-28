"use client";

import React, { useState, useCallback } from "react";
import { Player, GameSession, Transaction } from "@/types";
import { useGame } from "./GameContext";
import { formatMoney } from "@/lib/utils";
import { GameValidationError, DOMAIN_LIMITS } from "@/lib/validation";
import { Button } from "@/components/ui/Button";

// ---------------------------------------------------------------------------
// Tipos internos
// ---------------------------------------------------------------------------

type OperationType = "bank_to_player" | "player_to_bank" | "player_to_player" | "pass_go_salary";

type OpStep = "select_op" | "select_player_from" | "select_player_to" | "enter_amount" | "confirm" | "result";

interface OperationState {
  type: OperationType | null;
  fromPlayer: Player | null;
  toPlayer: Player | null;
  amount: string;
  description: string;
}

// ---------------------------------------------------------------------------
// COLOR MAP
// ---------------------------------------------------------------------------

const COLOR_BG: Record<string, string> = {
  purple: "bg-purple-100 text-purple-800 border-purple-300",
  yellow: "bg-amber-100 text-amber-900 border-amber-300",
  coral: "bg-rose-100 text-rose-800 border-rose-300",
  mint: "bg-emerald-100 text-emerald-800 border-emerald-300",
  blue: "bg-sky-100 text-sky-800 border-sky-300",
  orange: "bg-orange-100 text-orange-800 border-orange-300",
};

const COLOR_SOLID: Record<string, string> = {
  purple: "bg-purple-600",
  yellow: "bg-amber-400",
  coral: "bg-rose-500",
  mint: "bg-emerald-500",
  blue: "bg-sky-500",
  orange: "bg-orange-500",
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface BankingPanelProps {
  session: GameSession;
}

// ---------------------------------------------------------------------------
// Componente: Selección de jugador
// ---------------------------------------------------------------------------

function PlayerSelector({
  players,
  selected,
  onSelect,
  excludeId,
  label,
  currency,
}: {
  players: Player[];
  selected: Player | null;
  onSelect: (p: Player) => void;
  excludeId?: string;
  label: string;
  currency: string;
}) {
  const eligible = players.filter((p) => p.id !== excludeId);

  return (
    <div className="space-y-2">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <div className="grid grid-cols-1 gap-2">
        {eligible.map((p) => {
          const colorCls = COLOR_BG[p.color] || COLOR_BG.purple;
          const isSelected = selected?.id === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelect(p)}
              className={`flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-2xl border-2 transition-all text-left cursor-pointer ${
                isSelected
                  ? "border-brand-purple bg-purple-50 ring-2 ring-brand-purple/20"
                  : `border-slate-200 bg-white hover:border-slate-300`
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base border ${colorCls}`}>
                  {p.avatarSymbol}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 leading-tight">{p.name}</p>
                  <p className="text-[11px] text-slate-400 font-mono">
                    {formatMoney(p.balance, currency)}
                  </p>
                </div>
              </div>
              {isSelected && (
                <svg className="w-4 h-4 text-brand-purple shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Componente: Teclado de importe
// ---------------------------------------------------------------------------

const QUICK_AMOUNTS = [50, 100, 200, 500, 1000, 2000];

function AmountInput({
  value,
  onChange,
  currency,
  maxHint,
}: {
  value: string;
  onChange: (v: string) => void;
  currency: string;
  maxHint?: string;
}) {
  const handleQuick = (n: number) => onChange(String(n));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    onChange(raw);
  };

  return (
    <div className="space-y-3">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Importe {currency}</p>
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-black text-slate-400 select-none">
          {currency}
        </span>
        <input
          type="number"
          inputMode="numeric"
          pattern="[0-9]*"
          value={value}
          onChange={handleChange}
          placeholder="0"
          min={1}
          max={DOMAIN_LIMITS.MAX_TRANSACTION_AMOUNT}
          className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-brand-purple focus:outline-none text-2xl font-black text-slate-900 font-mono text-center"
        />
      </div>
      {maxHint && (
        <p className="text-[11px] text-slate-400 text-center">{maxHint}</p>
      )}
      <div className="grid grid-cols-3 gap-2">
        {QUICK_AMOUNTS.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => handleQuick(n)}
            className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              value === String(n)
                ? "bg-brand-purple text-white border-brand-purple"
                : "bg-white text-slate-700 border-slate-200 hover:border-brand-purple/50 hover:text-brand-purple"
            }`}
          >
            {currency} {n.toLocaleString()}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Componente: Resumen de confirmación
// ---------------------------------------------------------------------------

function OperationSummary({
  op,
  session,
}: {
  op: OperationState;
  session: GameSession;
}) {
  const { type, fromPlayer, toPlayer, amount } = op;
  const currency = session.settings.currencySymbol;
  const parsedAmount = parseInt(amount, 10);

  const isValid =
    !isNaN(parsedAmount) &&
    parsedAmount >= DOMAIN_LIMITS.MIN_TRANSACTION_AMOUNT &&
    parsedAmount <= DOMAIN_LIMITS.MAX_TRANSACTION_AMOUNT;

  const opLabels: Record<string, string> = {
    bank_to_player: "Banco entrega dinero",
    player_to_bank: "Banco cobra dinero",
    player_to_player: "Transferencia entre jugadores",
    pass_go_salary: "Sueldo por vuelta",
  };

  return (
    <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-3">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
        Resumen de la Operación
      </p>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Tipo</span>
          <span className="font-bold text-slate-800">{type ? opLabels[type] : "—"}</span>
        </div>

        {fromPlayer && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Desde</span>
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <span>{fromPlayer.avatarSymbol}</span>
              <span>{fromPlayer.name}</span>
            </span>
          </div>
        )}

        {!fromPlayer && (type === "bank_to_player" || type === "pass_go_salary") && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Desde</span>
            <span className="font-bold text-slate-800">🏦 Banco</span>
          </div>
        )}

        {toPlayer && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Para</span>
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <span>{toPlayer.avatarSymbol}</span>
              <span>{toPlayer.name}</span>
            </span>
          </div>
        )}

        {type === "player_to_bank" && fromPlayer && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Para</span>
            <span className="font-bold text-slate-800">🏦 Banco</span>
          </div>
        )}

        <div className="flex items-center justify-between text-base border-t border-slate-200 pt-2 mt-1">
          <span className="text-slate-500 font-medium">Importe</span>
          <span className={`font-black text-lg font-mono ${isValid ? "text-brand-purple" : "text-rose-500"}`}>
            {isValid ? formatMoney(parsedAmount, currency) : "Importe inválido"}
          </span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Componente: Historial de transacciones
// ---------------------------------------------------------------------------

function TransactionHistory({
  transactions,
  players,
  currency,
}: {
  transactions: Transaction[];
  players: Player[];
  currency: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const playerMap = Object.fromEntries(players.map((p) => [p.id, p]));

  const typeConfig: Record<string, { label: string; color: string; icon: string }> = {
    bank_to_player: { label: "Del banco", color: "text-emerald-700 bg-emerald-50 border-emerald-200", icon: "↓" },
    player_to_bank: { label: "Al banco", color: "text-rose-700 bg-rose-50 border-rose-200", icon: "↑" },
    player_to_player: { label: "Transferencia", color: "text-sky-700 bg-sky-50 border-sky-200", icon: "⇄" },
    pass_go_salary: { label: "Sueldo vuelta", color: "text-amber-700 bg-amber-50 border-amber-200", icon: "★" },
    balance_adjustment: { label: "Ajuste", color: "text-violet-700 bg-violet-50 border-violet-200", icon: "⚙" },
  };

  const visible = expanded ? transactions : transactions.slice(0, 5);

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 space-y-2">
        <div className="text-3xl">📋</div>
        <p className="text-sm font-bold text-slate-600">Sin movimientos aún</p>
        <p className="text-xs text-slate-400">Las operaciones bancarias aparecerán aquí.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {visible.map((tx) => {
        const cfg = typeConfig[tx.type] || typeConfig.bank_to_player;
        const fromName =
          tx.fromPlayerId === "bank"
            ? "Banco"
            : tx.fromPlayerId
            ? (playerMap[tx.fromPlayerId]?.name ?? "Jugador")
            : undefined;
        const toName =
          tx.toPlayerId === "bank"
            ? "Banco"
            : tx.toPlayerId
            ? (playerMap[tx.toPlayerId]?.name ?? "Jugador")
            : undefined;

        const timeStr = new Date(tx.timestamp).toLocaleTimeString("es-ES", {
          hour: "2-digit",
          minute: "2-digit",
        });

        return (
          <div
            key={tx.id}
            className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-slate-100 shadow-xs"
          >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black border shrink-0 ${cfg.color}`}>
              {cfg.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate">{tx.description}</p>
              {fromName && toName && (
                <p className="text-[11px] text-slate-400 truncate">
                  {fromName} → {toName}
                </p>
              )}
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-black text-slate-900 font-mono">
                {formatMoney(tx.amount, currency)}
              </p>
              <p className="text-[10px] text-slate-400">{timeStr}</p>
            </div>
          </div>
        );
      })}

      {transactions.length > 5 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="w-full py-2 text-xs font-bold text-brand-purple hover:text-purple-800 transition-colors cursor-pointer"
        >
          {expanded
            ? "Ver menos"
            : `Ver ${transactions.length - 5} movimientos más`}
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Componente principal: BankingPanel
// ---------------------------------------------------------------------------

export function BankingPanel({ session }: BankingPanelProps) {
  const { payFromBank, chargeToBank, transferMoney, collectSalary } = useGame();
  const currency = session.settings.currencySymbol;
  const isFinished = session.status === "finished";

  const [step, setStep] = useState<OpStep>("select_op");
  const [op, setOp] = useState<OperationState>({
    type: null,
    fromPlayer: null,
    toPlayer: null,
    amount: "",
    description: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [lastTx, setLastTx] = useState<Transaction | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetPanel = useCallback(() => {
    setStep("select_op");
    setOp({ type: null, fromPlayer: null, toPlayer: null, amount: "", description: "" });
    setError(null);
    setLastTx(null);
    setIsSubmitting(false);
  }, []);

  const selectOperation = (type: OperationType) => {
    setError(null);
    const newOp: OperationState = {
      type,
      fromPlayer: null,
      toPlayer: null,
      amount: type === "pass_go_salary" ? String(session.settings.salaryPassGo) : "",
      description: "",
    };
    setOp(newOp);

    if (type === "bank_to_player") {
      setStep("select_player_to");
    } else if (type === "player_to_bank") {
      setStep("select_player_from");
    } else if (type === "player_to_player") {
      setStep("select_player_from");
    } else if (type === "pass_go_salary") {
      setStep("select_player_to");
    }
  };

  const handlePlayerFromSelect = (player: Player) => {
    setOp((prev) => ({ ...prev, fromPlayer: player }));
    if (op.type === "player_to_bank") {
      setStep("enter_amount");
    } else if (op.type === "player_to_player") {
      setStep("select_player_to");
    }
  };

  const handlePlayerToSelect = (player: Player) => {
    setOp((prev) => ({ ...prev, toPlayer: player }));
    if (op.type === "pass_go_salary") {
      setStep("confirm");
    } else {
      setStep("enter_amount");
    }
  };

  const handleAmountNext = () => {
    const parsed = parseInt(op.amount, 10);
    if (
      isNaN(parsed) ||
      parsed < DOMAIN_LIMITS.MIN_TRANSACTION_AMOUNT ||
      parsed > DOMAIN_LIMITS.MAX_TRANSACTION_AMOUNT
    ) {
      setError(`El importe debe ser un entero entre ${DOMAIN_LIMITS.MIN_TRANSACTION_AMOUNT} y ${DOMAIN_LIMITS.MAX_TRANSACTION_AMOUNT.toLocaleString()}.`);
      return;
    }
    setError(null);
    setStep("confirm");
  };

  const handleConfirm = () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError(null);

    const amount = parseInt(op.amount, 10);

    try {
      let tx: Transaction;

      if (op.type === "bank_to_player" && op.toPlayer) {
        tx = payFromBank(op.toPlayer.id, amount, op.description || undefined);
      } else if (op.type === "player_to_bank" && op.fromPlayer) {
        tx = chargeToBank(op.fromPlayer.id, amount, op.description || undefined);
      } else if (op.type === "player_to_player" && op.fromPlayer && op.toPlayer) {
        tx = transferMoney(op.fromPlayer.id, op.toPlayer.id, amount, op.description || undefined);
      } else if (op.type === "pass_go_salary" && op.toPlayer) {
        tx = collectSalary(op.toPlayer.id);
      } else {
        setError("Datos de operación incompletos. Vuelve a intentarlo.");
        setIsSubmitting(false);
        return;
      }

      setLastTx(tx);
      setStep("result");
    } catch (err) {
      if (err instanceof GameValidationError) {
        setError(err.message);
      } else {
        setError("Ocurrió un error inesperado al procesar la operación.");
      }
      setIsSubmitting(false);
    }
  };

  // -------------------------------------------------------------------------
  // PASO: Partida finalizada
  // -------------------------------------------------------------------------
  if (isFinished) {
    return (
      <div className="rounded-3xl bg-slate-50 border border-slate-200 p-5 text-center space-y-3">
        <div className="text-3xl">🔒</div>
        <p className="text-sm font-bold text-slate-700">Partida finalizada</p>
        <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
          Esta mesa está cerrada. Para realizar nuevas operaciones, reanuda la partida.
        </p>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // PASO: Resultado exitoso
  // -------------------------------------------------------------------------
  if (step === "result" && lastTx) {
    return (
      <div className="rounded-3xl bg-emerald-50 border border-emerald-200 p-5 space-y-4 text-center">
        <div className="w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center text-white text-2xl mx-auto shadow-sm">
          ✓
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-black text-emerald-900">¡Operación completada!</h3>
          <p className="text-xs text-emerald-700">{lastTx.description}</p>
        </div>
        <div className="bg-white rounded-2xl border border-emerald-200 px-4 py-3">
          <p className="text-2xl font-black text-emerald-700 font-mono">
            {formatMoney(lastTx.amount, currency)}
          </p>
        </div>
        <Button variant="primary" size="md" fullWidth onClick={resetPanel} className="font-bold">
          Nueva Operación
        </Button>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // PASO: Confirmar operación
  // -------------------------------------------------------------------------
  if (step === "confirm") {
    return (
      <div className="space-y-4">
        <StepHeader title="Confirmar Operación" onBack={() => {
          if (op.type === "pass_go_salary") {
            setStep("select_player_to");
          } else {
            setStep("enter_amount");
          }
          setError(null);
        }} />

        <OperationSummary op={op} session={session} />

        {error && <ErrorBanner message={error} />}

        <div className="grid grid-cols-2 gap-2.5 pt-2">
          <Button variant="outline" size="md" onClick={resetPanel} className="font-bold" disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button variant="primary" size="md" onClick={handleConfirm} disabled={isSubmitting} className="font-bold">
            {isSubmitting ? "Procesando…" : "Confirmar"}
          </Button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // PASO: Ingresar importe
  // -------------------------------------------------------------------------
  if (step === "enter_amount") {
    const maxHint =
      op.type === "player_to_bank" && op.fromPlayer
        ? `Máximo disponible: ${formatMoney(op.fromPlayer.balance, currency)}`
        : op.type === "player_to_player" && op.fromPlayer
        ? `Máximo disponible: ${formatMoney(op.fromPlayer.balance, currency)}`
        : undefined;

    return (
      <div className="space-y-4">
        <StepHeader title="Importe" onBack={() => {
          if (op.type === "bank_to_player" || op.type === "player_to_player") {
            setStep(op.type === "player_to_player" ? "select_player_to" : "select_player_to");
          } else {
            setStep("select_player_from");
          }
          setError(null);
        }} />

        <AmountInput
          value={op.amount}
          onChange={(v) => { setOp((prev) => ({ ...prev, amount: v })); setError(null); }}
          currency={currency}
          maxHint={maxHint}
        />

        <div className="space-y-1.5">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Descripción <span className="font-normal normal-case text-slate-400">(opcional)</span>
          </p>
          <input
            type="text"
            value={op.description}
            onChange={(e) => setOp((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Ej: Alquiler calle mayor…"
            maxLength={DOMAIN_LIMITS.MAX_TRANSACTION_DESCRIPTION_LENGTH}
            className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-brand-purple focus:outline-none text-sm text-slate-800 placeholder:text-slate-300"
          />
        </div>

        {error && <ErrorBanner message={error} />}

        <Button variant="primary" size="lg" fullWidth onClick={handleAmountNext} className="font-bold">
          Continuar →
        </Button>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // PASO: Seleccionar jugador destino
  // -------------------------------------------------------------------------
  if (step === "select_player_to") {
    const titleMap: Partial<Record<OperationType, string>> = {
      bank_to_player: "¿Quién recibe el dinero?",
      player_to_player: "¿Quién recibe?",
      pass_go_salary: "¿Quién cobra el sueldo?",
    };
    return (
      <div className="space-y-4">
        <StepHeader
          title={op.type ? (titleMap[op.type] ?? "Selecciona jugador") : "Selecciona jugador"}
          onBack={() => {
            if (op.type === "player_to_player") {
              setStep("select_player_from");
            } else {
              setStep("select_op");
            }
            setError(null);
          }}
        />
        <PlayerSelector
          players={session.players}
          selected={op.toPlayer}
          onSelect={handlePlayerToSelect}
          excludeId={op.fromPlayer?.id}
          label="Jugador receptor"
          currency={currency}
        />
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // PASO: Seleccionar jugador origen
  // -------------------------------------------------------------------------
  if (step === "select_player_from") {
    const titleMap: Partial<Record<OperationType, string>> = {
      player_to_bank: "¿Quién paga al banco?",
      player_to_player: "¿Quién envía el dinero?",
    };
    return (
      <div className="space-y-4">
        <StepHeader
          title={op.type ? (titleMap[op.type] ?? "Selecciona jugador") : "Selecciona jugador"}
          onBack={() => { setStep("select_op"); setError(null); }}
        />
        <PlayerSelector
          players={session.players}
          selected={op.fromPlayer}
          onSelect={handlePlayerFromSelect}
          label="Jugador emisor"
          currency={currency}
        />
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // PASO: Seleccionar tipo de operación (hub principal)
  // -------------------------------------------------------------------------
  const salary = session.settings.salaryPassGo;
  const hasSalary = Number.isSafeInteger(salary) && salary > 0;

  const operations: {
    type: OperationType;
    icon: string;
    title: string;
    desc: string;
    color: string;
    disabled?: boolean;
  }[] = [
    {
      type: "bank_to_player",
      icon: "↓",
      title: "Banco → Jugador",
      desc: "El banco entrega dinero a un jugador",
      color: "bg-emerald-500 text-white",
    },
    {
      type: "player_to_bank",
      icon: "↑",
      title: "Jugador → Banco",
      desc: "El banco cobra a un jugador",
      color: "bg-rose-500 text-white",
    },
    {
      type: "player_to_player",
      icon: "⇄",
      title: "Entre Jugadores",
      desc: "Transferencia directa entre participantes",
      color: "bg-sky-500 text-white",
    },
    {
      type: "pass_go_salary",
      icon: "★",
      title: `Sueldo de Vuelta`,
      desc: hasSalary
        ? `Acreditar ${formatMoney(salary, currency)} al pasar por salida`
        : "No hay sueldo configurado (₵ 0)",
      color: "bg-amber-400 text-slate-900",
      disabled: !hasSalary,
    },
  ];

  return (
    <div className="space-y-3">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
        Selecciona la operación
      </p>
      <div className="grid grid-cols-1 gap-2.5">
        {operations.map((o) => (
          <button
            key={o.type}
            type="button"
            disabled={o.disabled}
            onClick={() => selectOperation(o.type)}
            className={`flex items-center gap-3.5 p-4 rounded-2xl border-2 border-slate-200 bg-white text-left transition-all cursor-pointer hover:border-brand-purple/40 hover:shadow-sm active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black shrink-0 shadow-xs ${o.color}`}>
              {o.icon}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900 leading-tight">{o.title}</p>
              <p className="text-xs text-slate-500 mt-0.5 truncate">{o.desc}</p>
            </div>
            <svg className="w-4 h-4 text-slate-300 ml-auto shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Utilidades de UI locales
// ---------------------------------------------------------------------------

function StepHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
      <button
        type="button"
        onClick={onBack}
        className="p-1.5 -ml-1 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
        aria-label="Volver al paso anterior"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <h3 className="text-sm font-extrabold text-slate-900">{title}</h3>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
      <span className="text-base shrink-0">⚠️</span>
      <span>{message}</span>
    </div>
  );
}

// Export utility types needed by ActiveGameView
export type { OperationType };
export { COLOR_BG, COLOR_SOLID, TransactionHistory };

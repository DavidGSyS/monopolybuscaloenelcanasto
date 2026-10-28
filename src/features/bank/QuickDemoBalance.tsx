"use client";

import React, { useState } from "react";
import { formatMoney } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

interface LogItem {
  id: string;
  text: string;
  time: string;
  type: "positive" | "negative" | "neutral";
}

export function QuickDemoBalance() {
  const [balance, setBalance] = useState<number>(1500);
  const [history, setHistory] = useState<LogItem[]>([
    {
      id: "1",
      text: "Capital inicial de partida",
      time: "Inicio",
      type: "neutral",
    },
  ]);

  const handleAddGoSalary = () => {
    setBalance((prev) => prev + 200);
    setHistory((prev) => [
      {
        id: Date.now().toString(),
        text: "Paso por Salida (+ ₵ 200)",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        type: "positive",
      },
      ...prev.slice(0, 3),
    ]);
  };

  const handlePayRent = () => {
    if (balance >= 50) {
      setBalance((prev) => prev - 50);
      setHistory((prev) => [
        {
          id: Date.now().toString(),
          text: "Pago de Alquiler (- ₵ 50)",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          type: "negative",
        },
        ...prev.slice(0, 3),
      ]);
    }
  };

  const handleReset = () => {
    setBalance(1500);
    setHistory([
      {
        id: Date.now().toString(),
        text: "Reinicio de saldo a ₵ 1.500",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        type: "neutral",
      },
    ]);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/70 p-5 sm:p-7 shadow-soft-card space-y-6">
      {/* Encabezado del demo */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-brand-purple-light border border-purple-200 flex items-center justify-center text-brand-purple font-extrabold text-base">
            J1
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-sm sm:text-base">
                Jugador de Prueba
              </span>
              <Badge variant="purple">Tu Turno</Badge>
            </div>
            <span className="text-xs text-slate-500">Mesa: Finanzas Clásicas</span>
          </div>
        </div>

        <button
          onClick={handleReset}
          className="text-xs font-semibold text-slate-500 hover:text-brand-purple transition-colors px-2.5 py-1 rounded-lg hover:bg-slate-100"
          title="Reiniciar saldo de prueba"
        >
          Reiniciar
        </button>
      </div>

      {/* Saldo Principal */}
      <div className="text-center py-3 bg-gradient-to-br from-brand-purple-light/70 via-white to-purple-50/40 rounded-2xl border border-purple-100/80">
        <span className="text-xs font-bold uppercase tracking-wider text-brand-purple">
          Saldo Disponible
        </span>
        <div className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight mt-1">
          {formatMoney(balance)}
        </div>
        <p className="text-[11px] text-slate-500 mt-1">
          Sin billetes arrugados ni disputas con el banquero
        </p>
      </div>

      {/* Acciones Rápidas */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Acciones de Prueba Rápida
        </span>
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="mint"
            size="md"
            onClick={handleAddGoSalary}
            className="w-full flex items-center justify-center gap-1.5 font-bold"
          >
            <span>+ ₵ 200</span>
            <span className="text-xs font-normal opacity-90">(Salida)</span>
          </Button>

          <Button
            variant="coral"
            size="md"
            onClick={handlePayRent}
            className="w-full flex items-center justify-center gap-1.5 font-bold"
          >
            <span>- ₵ 50</span>
            <span className="text-xs font-normal opacity-90">(Alquiler)</span>
          </Button>
        </div>
      </div>

      {/* Historial inmediato */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        <span className="text-xs font-semibold text-slate-500">
          Últimos movimientos simulados:
        </span>
        <div className="space-y-1.5">
          {history.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between text-xs py-1.5 px-3 rounded-xl bg-slate-50 border border-slate-100 text-slate-700"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    item.type === "positive"
                      ? "bg-brand-mint"
                      : item.type === "negative"
                      ? "bg-brand-coral"
                      : "bg-slate-400"
                  }`}
                />
                <span>{item.text}</span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                {item.time}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

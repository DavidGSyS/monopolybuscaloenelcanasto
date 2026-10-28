"use client";

import React, { useState } from "react";
import { GAME_MODES } from "@/lib/constants";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface GameModeSelectorProps {
  onSelectMode?: (modeId: string) => void;
  onStartLocal?: () => void;
}

export function GameModeSelector({ onSelectMode, onStartLocal }: GameModeSelectorProps) {
  const [selected, setSelected] = useState<string>("local");

  const handleSelect = (id: string) => {
    setSelected(id);
    onSelectMode?.(id);
  };

  const handleButtonClick = (modeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (modeId === "local" && onStartLocal) {
      onStartLocal();
    } else {
      handleSelect(modeId);
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Modalidades de Juego
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Selecciona cómo deseas gestionar la banca en tu mesa
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {GAME_MODES.map((mode) => {
          const isSelected = selected === mode.id;
          const isLocal = mode.id === "local";

          return (
            <Card
              key={mode.id}
              variant="interactive"
              className={
                isSelected
                  ? "border-brand-purple/60 ring-2 ring-brand-purple/20 bg-gradient-to-b from-white to-purple-50/30"
                  : "bg-white hover:border-slate-300"
              }
              onClick={() => handleSelect(mode.id)}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold shrink-0 ${
                      isLocal
                        ? "bg-brand-purple text-white shadow-soft-glow"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {isLocal ? (
                      <svg
                        className="w-6 h-6 text-brand-yellow"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-6 h-6 text-brand-purple"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base sm:text-lg">
                        {mode.title}
                      </CardTitle>
                      <Badge variant={isLocal ? "mint" : "yellow"} dot={isLocal}>
                        {mode.badge}
                      </Badge>
                    </div>
                    <p className="text-xs text-brand-purple font-medium">
                      {mode.subtitle}
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardDescription className="mb-5 text-xs sm:text-sm">
                {mode.description}
              </CardDescription>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">
                  {isLocal ? "Sin necesidad de WiFi" : "Sincronización en vivo"}
                </span>
                <Button
                  size="sm"
                  variant={isLocal ? "primary" : "outline"}
                  onClick={(e) => handleButtonClick(mode.id, e)}
                >
                  {isLocal ? "Comenzar partida" : "Ver detalles"}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

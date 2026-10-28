import React from "react";
import Image from "next/image";
import { Badge } from "./Badge";

interface HeaderProps {
  isStandalone?: boolean;
  onShowInstallGuide?: () => void;
}

export function Header({ isStandalone = false, onShowInstallGuide }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 w-full backdrop-blur-md bg-white/90 border-b border-slate-100/80 transition-all">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logotipo y Título de Marca */}
        <div className="flex items-center gap-3">
          <Image
            src="/icons/icon-192.png"
            alt="Canasto Bank"
            width={40}
            height={40}
            className="w-10 h-10 rounded-2xl object-cover shadow-sm shrink-0"
            priority
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight">
                Canasto<span className="text-brand-purple">Bank</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-brand-yellow-light text-amber-900">
                Alpha
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
              Tu mesa, tus reglas
            </p>
          </div>
        </div>

        {/* Indicadores de Modo y PWA */}
        <div className="flex items-center gap-2">
          {isStandalone ? (
            <Badge variant="mint" dot>
              App Instalada
            </Badge>
          ) : (
            <>
              {onShowInstallGuide && (
                <button
                  onClick={onShowInstallGuide}
                  className="text-xs font-semibold text-brand-purple bg-brand-purple-light hover:bg-purple-100 px-3 py-1.5 rounded-xl border border-purple-200/80 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span>📲</span>
                  <span className="hidden xs:inline">Instalar</span>
                </button>
              )}
              <div className="flex items-center text-xs font-semibold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/60">
                <span>Offline First</span>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

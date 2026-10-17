import React from 'react';
import { Usb, ShieldCheck, Zap, Sparkles } from 'lucide-react';

export const Hero: React.FC = () => {
  return (
    <div className="relative pt-6 pb-6 text-center max-w-4xl mx-auto px-4 sm:px-6">
      
      {/* Badge */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/60 shadow-sm mb-4">
        <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
        <span>Runs entirely in your browser</span>
      </div>

      {/* Main Heading */}
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
        Eliyas Science Info{' '}
        <span className="text-blue-600 dark:text-blue-400 underline decoration-blue-500/30 decoration-wavy decoration-2 underline-offset-8">
          Flasher
        </span>
      </h1>

      {/* Subtitle */}
      <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
        Write firmware to ESP32, ESP8266 and supported Arduino boards directly from this page — no desktop IDE or drivers required.
      </p>

      {/* 3 Key Feature Indicators */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
        
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-subtle">
          <Usb className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>Connects over USB</span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-subtle">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Firmware stays on your device</span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-subtle">
          <Zap className="w-4 h-4 text-amber-500" />
          <span>Fast browser flashing</span>
        </div>

      </div>

    </div>
  );
};

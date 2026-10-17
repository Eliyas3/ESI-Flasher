import React, { useState } from 'react';
import { ShieldCheck, CheckCircle2, AlertTriangle, ExternalLink, X } from 'lucide-react';

export const BrowserCompatibilityAlert: React.FC = () => {
  const [dismissed, setDismissed] = useState(false);
  const isSecure = typeof window !== 'undefined' && window.isSecureContext;
  const hasSerial = typeof navigator !== 'undefined' && 'serial' in navigator;
  const isFullySupported = isSecure && hasSerial;

  if (dismissed) return null;

  if (!isFullySupported) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 mb-6">
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 rounded-xl p-4 flex items-start gap-3.5 shadow-sm">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-sm">
            <h4 className="font-semibold text-amber-900 dark:text-amber-200">
              Web Serial API is Not Available in This Browser
            </h4>
            <p className="mt-1 text-amber-800 dark:text-amber-300/90 text-xs sm:text-sm leading-relaxed">
              To communicate directly with ESP32 and Arduino microcontrollers over USB, please open this application in 
              <strong className="font-bold"> Google Chrome, Microsoft Edge, Brave, or Opera</strong> on a desktop computer. 
              {!isSecure && ' Web Serial also strictly requires HTTPS or localhost.'}
            </p>
            <div className="mt-2.5 flex items-center gap-4 text-xs font-medium">
              <span className={`inline-flex items-center gap-1 ${isSecure ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                {isSecure ? '✓ Secure Context (HTTPS/localhost)' : '✕ Insecure Context'}
              </span>
              <span className={`inline-flex items-center gap-1 ${hasSerial ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                {hasSerial ? '✓ Web Serial API Supported' : '✕ Web Serial API Missing'}
              </span>
            </div>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-amber-600 hover:text-amber-800 dark:text-amber-400 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 mb-4">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 rounded-xl bg-slate-100/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Secure Context
          </span>
          <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Web Serial API Active
          </span>
          <span className="hidden sm:flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Browser Supported
          </span>
        </div>
        <span className="text-[11px] text-slate-500 dark:text-slate-500 font-mono">
          ESI Web Hardware Transport
        </span>
      </div>
    </div>
  );
};

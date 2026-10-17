import React from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  RotateCcw, 
  Terminal, 
  Zap, 
  Clock, 
  Gauge, 
  Layers 
} from 'lucide-react';
import { FlashProgress, FlashState } from '../../types/hardware';
import { formatBytes, formatDuration } from '../../utils/formatters';

interface FlashProgressCardProps {
  flashState: FlashState;
  progress: FlashProgress | null;
  boardName: string;
  onResetDevice: () => void;
  onOpenSerialMonitor: () => void;
  errorMessage?: string | null;
  onShowTechDetails?: () => void;
}

export const FlashProgressCard: React.FC<FlashProgressCardProps> = ({
  flashState,
  progress,
  boardName,
  onResetDevice,
  onOpenSerialMonitor,
  errorMessage,
  onShowTechDetails,
}) => {
  const isFlashing = flashState === 'writing' || flashState === 'preparing' || flashState === 'erasing' || flashState === 'verifying';
  const isSuccess = flashState === 'success';
  const isError = flashState === 'error';

  if (!isFlashing && !isSuccess && !isError) {
    return null;
  }

  const pct = progress?.percentage || (isSuccess ? 100 : 0);

  return (
    <div className={`rounded-2xl border p-5 shadow-card transition-all duration-300 ${
      isSuccess
        ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800/60'
        : isError
        ? 'bg-red-50/70 dark:bg-red-950/30 border-red-300 dark:border-red-800/60'
        : 'bg-white dark:bg-slate-800/95 border-blue-300 dark:border-blue-700/60 ring-2 ring-blue-500/20'
    }`}>
      
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {isSuccess ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          ) : isError ? (
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          ) : (
            <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-pulse" />
          )}

          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {isSuccess
              ? 'Flash Completed Successfully'
              : isError
              ? 'Flashing Error Occurred'
              : `Flashing ${boardName}`}
          </h3>
        </div>

        <span className="font-mono text-lg font-extrabold text-blue-600 dark:text-blue-400">
          {pct}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 dark:bg-slate-700/80 rounded-full h-3 overflow-hidden p-0.5">
        <div
          className={`h-full rounded-full transition-all duration-200 ${
            isSuccess
              ? 'bg-emerald-500'
              : isError
              ? 'bg-red-500'
              : 'bg-gradient-to-r from-blue-600 to-cyan-500'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Current Operation Message */}
      <div className="mt-3 flex items-center justify-between text-xs font-medium">
        <span className="text-slate-700 dark:text-slate-300 truncate font-mono">
          {progress?.operation || (isSuccess ? 'Device ready in operational mode.' : isError ? (errorMessage || 'Flashing halted.') : 'Initializing hardware buffers...')}
        </span>
      </div>

      {/* Flashing Metrics Grid */}
      {isFlashing && progress && (
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          
          <div>
            <span className="text-slate-400 dark:text-slate-500 block text-[11px]">Written</span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
              {formatBytes(progress.bytesWritten)} / {formatBytes(progress.totalBytes)}
            </span>
          </div>

          <div>
            <span className="text-slate-400 dark:text-slate-500 block text-[11px]">Speed</span>
            <span className="font-mono font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
              <Gauge className="w-3.5 h-3.5" />
              {progress.speedKBps} KB/s
            </span>
          </div>

          <div>
            <span className="text-slate-400 dark:text-slate-500 block text-[11px]">Elapsed</span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {formatDuration(progress.elapsedSeconds)}
            </span>
          </div>

          <div>
            <span className="text-slate-400 dark:text-slate-500 block text-[11px]">Remaining</span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
              ~{formatDuration(progress.etaSeconds)}
            </span>
          </div>

        </div>
      )}

      {/* Success Actions */}
      {isSuccess && (
        <div className="mt-4 pt-3 border-t border-emerald-200/60 dark:border-emerald-800/40 flex flex-wrap items-center gap-3">
          <button
            onClick={onResetDevice}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5 text-blue-500" />
            <span>Reset Device</span>
          </button>

          <button
            onClick={onOpenSerialMonitor}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Open Serial Monitor</span>
          </button>
        </div>
      )}

      {/* Error Details Link */}
      {isError && (
        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="text-red-700 dark:text-red-300">
            Check wiring or bootloader mode.
          </span>
          {onShowTechDetails && (
            <button
              onClick={onShowTechDetails}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Show Technical Details
            </button>
          )}
        </div>
      )}

    </div>
  );
};

import React from 'react';
import { Usb, FileCode2, Zap, Check, AlertCircle, ArrowRight } from 'lucide-react';
import { ConnectionState, FlashState } from '../../types/hardware';

interface WorkflowStepsProps {
  connectionState: ConnectionState;
  boardName: string;
  hasFirmware: boolean;
  firmwareName?: string;
  flashState: FlashState;
}

export const WorkflowSteps: React.FC<WorkflowStepsProps> = ({
  connectionState,
  boardName,
  hasFirmware,
  firmwareName,
  flashState,
}) => {
  // Step 1: Connect
  const step1Completed = connectionState === 'connected';
  const step1Active = connectionState === 'connecting';
  const step1Error = connectionState === 'error';

  // Step 2: Choose
  const step2Completed = hasFirmware;
  const step2Active = step1Completed && !hasFirmware;
  const step2Disabled = !step1Completed && !hasFirmware;

  // Step 3: Flash
  const step3Completed = flashState === 'success';
  const step3Active = flashState === 'writing' || flashState === 'preparing' || flashState === 'erasing' || flashState === 'verifying';
  const step3Error = flashState === 'error';
  const step3Ready = step1Completed && step2Completed && flashState === 'idle';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 mb-8">
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/90 dark:border-slate-700/80 p-4 sm:p-5 shadow-card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
          
          {/* Step 1: Connect */}
          <div className="flex items-center gap-3.5 p-3 rounded-xl transition-all duration-200 bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-700/50">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                step1Completed
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                  : step1Error
                  ? 'bg-red-500 text-white'
                  : step1Active
                  ? 'bg-blue-600 text-white animate-pulse'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {step1Completed ? <Check className="w-5 h-5 stroke-[2.5]" /> : step1Error ? <AlertCircle className="w-5 h-5" /> : <Usb className="w-5 h-5" />}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Step 1
              </span>
              <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                Connect Board
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {step1Completed ? `${boardName} connected` : step1Active ? 'Opening port...' : step1Error ? 'Connection failed' : 'No board connected'}
              </span>
            </div>
          </div>

          {/* Step 2: Choose */}
          <div className="flex items-center gap-3.5 p-3 rounded-xl transition-all duration-200 bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-700/50">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                step2Completed
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                  : step2Active
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
              }`}
            >
              {step2Completed ? <Check className="w-5 h-5 stroke-[2.5]" /> : <FileCode2 className="w-5 h-5" />}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Step 2
              </span>
              <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                Choose Firmware
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {step2Completed ? (firmwareName || 'Firmware selected') : 'Pick firmware or drop .bin'}
              </span>
            </div>
          </div>

          {/* Step 3: Flash */}
          <div className="flex items-center gap-3.5 p-3 rounded-xl transition-all duration-200 bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-700/50">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                step3Completed
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                  : step3Active
                  ? 'bg-blue-600 text-white animate-pulse'
                  : step3Error
                  ? 'bg-red-500 text-white'
                  : step3Ready
                  ? 'bg-blue-600/90 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
              }`}
            >
              {step3Completed ? <Check className="w-5 h-5 stroke-[2.5]" /> : step3Error ? <AlertCircle className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Step 3
              </span>
              <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                Flash Hardware
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {step3Completed 
                  ? '✓ Flashed successfully' 
                  : step3Active 
                  ? 'Writing to flash...' 
                  : step3Error 
                  ? 'Flash failed' 
                  : step3Ready 
                  ? 'Ready to flash' 
                  : 'Waiting for board & file'}
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

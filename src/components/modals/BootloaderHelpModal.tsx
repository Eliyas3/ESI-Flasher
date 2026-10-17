import React from 'react';
import { X, HelpCircle, AlertTriangle, Cpu, ArrowRight } from 'lucide-react';
import { BoardFamily } from '../../types/hardware';

interface BootloaderHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  boardFamily: BoardFamily;
}

export const BootloaderHelpModal: React.FC<BootloaderHelpModalProps> = ({
  isOpen,
  onClose,
  boardFamily,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Manual Bootloader Instructions
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Hardware recovery & boot synchronization guide
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
          
          <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-xl p-3.5 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-900 dark:text-blue-200 leading-relaxed">
              Most standard NodeMCU and ESP32 DevKit boards reset automatically via DTR/RTS lines. However, bare modules or custom boards often lack auto-reset circuitry and require manual bootloader entry.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
              {boardFamily === 'ESP32' ? 'ESP32 Manual Boot Sequence' : 'Hardware Boot Sequence'}
            </h4>

            <div className="space-y-2.5">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                  1
                </span>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white text-xs">
                    Hold down the <span className="text-blue-600 dark:text-blue-400 font-bold">BOOT / FLASH</span> button
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    This pulls GPIO0 low, forcing the ESP microcontroller into ROM download mode.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                  2
                </span>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white text-xs">
                    Press & release the <span className="text-blue-600 dark:text-blue-400 font-bold">EN / RST</span> button (1 sec)
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Keep holding the BOOT button while momentarily tapping Reset.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                  3
                </span>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white text-xs">
                    Click <span className="text-blue-600 dark:text-blue-400 font-bold">Connect</span> in ESI Flasher, then release BOOT
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Once the browser sync handshake finishes, the chip will be identified.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 text-[11px] text-slate-500 dark:text-slate-400 leading-normal border-t border-slate-100 dark:border-slate-800">
            <strong>Tip for CH340 / CP2102 drivers:</strong> Ensure no serial terminal (like Arduino IDE Serial Monitor or PuTTY) is occupying the COM port concurrently.
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors"
          >
            Understood
          </button>
        </div>

      </div>
    </div>
  );
};

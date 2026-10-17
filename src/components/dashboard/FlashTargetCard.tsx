import React from 'react';
import { 
  Cpu, 
  Usb, 
  Zap, 
  HelpCircle, 
  AlertCircle, 
  CheckCircle2, 
  Radio, 
  Loader2,
  PowerOff
} from 'lucide-react';
import { BoardFamily, ConnectionState, FlashState, TargetChip, ESP32Chip, ArduinoBoard } from '../../types/hardware';

interface FlashTargetCardProps {
  boardFamily: BoardFamily;
  onBoardFamilyChange: (family: BoardFamily) => void;
  selectedChip: TargetChip;
  onChipChange: (chip: TargetChip) => void;
  connectionState: ConnectionState;
  flashState: FlashState;
  hasFirmware: boolean;
  isDemoMode: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  onFlash: () => void;
  onOpenBootloaderHelp: () => void;
}

const ESP32_CHIPS: ESP32Chip[] = [
  'ESP32',
  'ESP32-S2',
  'ESP32-S3',
  'ESP32-C2',
  'ESP32-C3',
  'ESP32-C5',
  'ESP32-C6',
  'ESP32-H2',
];

const ARDUINO_BOARDS: ArduinoBoard[] = [
  'Arduino Uno (ATmega328P)',
  'Arduino Nano (ATmega328P)',
  'Arduino Nano (Old Bootloader)',
  'Arduino Mega 2560',
  'Arduino Leonardo',
];

export const FlashTargetCard: React.FC<FlashTargetCardProps> = ({
  boardFamily,
  onBoardFamilyChange,
  selectedChip,
  onChipChange,
  connectionState,
  flashState,
  hasFirmware,
  isDemoMode,
  onConnect,
  onDisconnect,
  onFlash,
  onOpenBootloaderHelp,
}) => {
  const isConnected = connectionState === 'connected';
  const isConnecting = connectionState === 'connecting';
  const isFlashing = flashState === 'writing' || flashState === 'preparing' || flashState === 'erasing' || flashState === 'verifying';

  const canFlash = isConnected && hasFirmware && !isFlashing;

  return (
    <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/90 dark:border-slate-700/80 shadow-card p-5 space-y-5">
      
      {/* Title */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Cpu className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>Flash Target</span>
        </h3>
        <button
          onClick={onOpenBootloaderHelp}
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Bootloader Help</span>
        </button>
      </div>

      {/* Board Platform Tabs */}
      <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80">
        {(['ESP32', 'ESP8266', 'Arduino'] as BoardFamily[]).map((family) => (
          <button
            key={family}
            disabled={isConnected || isFlashing}
            onClick={() => onBoardFamilyChange(family)}
            className={`py-2 rounded-lg text-xs font-bold transition-all ${
              boardFamily === family
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-50'
            }`}
          >
            {family}
          </button>
        ))}
      </div>

      {/* Chip Dropdown */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
          Target Chip / Architecture
        </label>
        
        {boardFamily === 'ESP32' && (
          <select
            value={selectedChip}
            disabled={isConnected || isFlashing}
            onChange={(e) => onChipChange(e.target.value as TargetChip)}
            className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 disabled:opacity-60"
          >
            {ESP32_CHIPS.map((chip) => (
              <option key={chip} value={chip}>
                {chip}
              </option>
            ))}
          </select>
        )}

        {boardFamily === 'ESP8266' && (
          <select
            value={selectedChip}
            disabled={isConnected || isFlashing}
            onChange={(e) => onChipChange(e.target.value as TargetChip)}
            className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
          >
            <option value="ESP8266">ESP8266EX / NodeMCU</option>
          </select>
        )}

        {boardFamily === 'Arduino' && (
          <select
            value={selectedChip}
            disabled={isConnected || isFlashing}
            onChange={(e) => onChipChange(e.target.value as TargetChip)}
            className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 disabled:opacity-60"
          >
            {ARDUINO_BOARDS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        )}

        {/* Informational Guidance Text */}
        <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
          USB-to-serial adapters such as CH340 and CP210x are commonly used with ESP boards. The USB adapter itself may not reveal the ESP chip automatically.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        {isConnected ? (
          <button
            onClick={onDisconnect}
            disabled={isFlashing}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/40 dark:hover:bg-red-950/60 dark:text-red-400 border border-red-200 dark:border-red-800 transition-colors disabled:opacity-50"
          >
            <PowerOff className="w-4 h-4" />
            <span>Disconnect</span>
          </button>
        ) : (
          <button
            onClick={onConnect}
            disabled={isConnecting}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all hover:shadow-md disabled:opacity-60"
          >
            {isConnecting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <Usb className="w-4 h-4" />
                <span>Connect</span>
              </>
            )}
          </button>
        )}

        <button
          onClick={onFlash}
          disabled={!canFlash}
          className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            canFlash
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 hover:scale-[1.01]'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed border border-slate-200 dark:border-slate-700'
          }`}
          title={!isConnected ? 'Connect board first' : !hasFirmware ? 'Select firmware first' : 'Flash firmware'}
        >
          {isFlashing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>Flashing...</span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              <span>Flash Now</span>
            </>
          )}
        </button>
      </div>

      {/* Validation status hint */}
      {!canFlash && !isFlashing && (
        <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
          <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
          <span>
            {!isConnected
              ? 'Connect your board via USB to enable flashing'
              : !hasFirmware
              ? 'Select or drop a firmware file to proceed'
              : 'Target configuration ready'}
          </span>
        </div>
      )}

    </div>
  );
};

import React, { useState } from 'react';
import { Settings, Sliders, ChevronDown, ChevronUp } from 'lucide-react';
import { FlashSettings, FlashBaudRate, BoardFamily } from '../../types/hardware';

interface FlashSettingsCardProps {
  boardFamily: BoardFamily;
  settings: FlashSettings;
  onSettingsChange: (settings: FlashSettings) => void;
  disabled?: boolean;
}

export const FlashSettingsCard: React.FC<FlashSettingsCardProps> = ({
  boardFamily,
  settings,
  onSettingsChange,
  disabled = false,
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/90 dark:border-slate-700/80 shadow-card p-5">
      
      {/* Header with expand toggle */}
      <div 
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between cursor-pointer select-none"
      >
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Sliders className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>Flash Settings</span>
        </h3>
        <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Primary Toggle: Erase Entire Flash */}
      <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-700/60">
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.eraseAll}
            disabled={disabled}
            onChange={(e) => onSettingsChange({ ...settings, eraseAll: e.target.checked })}
            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
          />
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            Erase entire flash before writing
          </span>
        </label>
        <p className="ml-6 text-[11px] text-slate-500 dark:text-slate-400">
          Wipes full SPI flash memory including NVS, EEPROM, and partition tables.
        </p>
      </div>

      {/* Advanced Settings (Accordion or always visible on desktop) */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/60 space-y-3.5 text-xs">
          
          {/* Baud Rate */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Flashing Baud Rate
            </label>
            <select
              value={settings.baudRate}
              disabled={disabled}
              onChange={(e) => onSettingsChange({ ...settings, baudRate: Number(e.target.value) as FlashBaudRate })}
              className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-xs focus:outline-none"
            >
              <option value="115200">115200 (Safe standard)</option>
              <option value="230400">230400</option>
              <option value="460800">460800 (Fast)</option>
              <option value="921600">921600 (High-Speed Recommended for ESP32)</option>
              <option value="1500000">1500000 (Maximum)</option>
            </select>
          </div>

          {boardFamily !== 'Arduino' && (
            <>
              {/* Flash Mode */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Flash SPI Mode
                </label>
                <select
                  value={settings.flashMode}
                  disabled={disabled}
                  onChange={(e) => onSettingsChange({ ...settings, flashMode: e.target.value as any })}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium text-xs focus:outline-none"
                >
                  <option value="keep">Keep (Firmware header default)</option>
                  <option value="dio">DIO (Dual I/O - Most compatible)</option>
                  <option value="dout">DOUT (Dual Output)</option>
                  <option value="qio">QIO (Quad I/O)</option>
                  <option value="qout">QOUT (Quad Output)</option>
                </select>
              </div>

              {/* Flash Frequency */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Flash Frequency
                </label>
                <select
                  value={settings.flashFreq}
                  disabled={disabled}
                  onChange={(e) => onSettingsChange({ ...settings, flashFreq: e.target.value as any })}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium text-xs focus:outline-none"
                >
                  <option value="keep">Keep</option>
                  <option value="40m">40 MHz</option>
                  <option value="80m">80 MHz (High speed)</option>
                </select>
              </div>

              {/* Flash Size */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Flash Size Override
                </label>
                <select
                  value={settings.flashSize}
                  disabled={disabled}
                  onChange={(e) => onSettingsChange({ ...settings, flashSize: e.target.value as any })}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium text-xs focus:outline-none"
                >
                  <option value="detect">Auto-Detect Flash Size</option>
                  <option value="keep">Keep</option>
                  <option value="1MB">1 MB</option>
                  <option value="2MB">2 MB</option>
                  <option value="4MB">4 MB</option>
                  <option value="8MB">8 MB</option>
                  <option value="16MB">16 MB</option>
                </select>
              </div>
            </>
          )}

        </div>
      )}

    </div>
  );
};

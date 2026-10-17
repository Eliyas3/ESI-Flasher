import React from 'react';
import { EsiLogo } from '../common/EsiLogo';
import { 
  Sun, 
  Moon, 
  ShieldAlert, 
  HelpCircle, 
  Settings2, 
  Usb, 
  Radio, 
  CheckCircle2, 
  XCircle 
} from 'lucide-react';
import { ConnectionState } from '../../types/hardware';

interface HeaderProps {
  connectionState: ConnectionState;
  isDemoMode: boolean;
  onToggleDemoMode: () => void;
  onOpenAdmin: () => void;
  onOpenHelp: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  connectionState,
  isDemoMode,
  onToggleDemoMode,
  onOpenAdmin,
  onOpenHelp,
  darkMode,
  onToggleDarkMode,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/85 dark:bg-[#0b101b]/85 border-b border-slate-200/80 dark:border-slate-800/80 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand & Logo */}
        <div className="flex items-center gap-3">
          <EsiLogo size="md" showText={true} />
        </div>

        {/* Status & Controls */}
        <div className="flex items-center gap-3 sm:gap-4">
          
          {/* Demo Mode Toggle */}
          <button
            onClick={onToggleDemoMode}
            className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              isDemoMode
                ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700/60 shadow-sm'
                : 'bg-slate-100/70 text-slate-600 border-slate-200 hover:bg-slate-200/70 dark:bg-slate-800/60 dark:text-slate-400 dark:border-slate-700'
            }`}
            title="Toggle simulation mode for testing without hardware"
          >
            <Radio className={`w-3.5 h-3.5 ${isDemoMode ? 'text-amber-500 animate-pulse' : 'text-slate-400'}`} />
            <span>{isDemoMode ? 'Demo Mode (Simulated)' : 'Hardware Mode'}</span>
          </button>

          {/* Connection Status Pill */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-300 ${
              connectionState === 'connected'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60'
                : connectionState === 'connecting'
                ? 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/60'
                : connectionState === 'error'
                ? 'bg-red-50 text-red-700 border-red-300 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800/60'
                : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/60 dark:text-slate-400 dark:border-slate-700/60'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                connectionState === 'connected'
                  ? 'bg-emerald-500 animate-pulse'
                  : connectionState === 'connecting'
                  ? 'bg-blue-500 animate-ping'
                  : connectionState === 'error'
                  ? 'bg-red-500'
                  : 'bg-slate-400'
              }`}
            />
            <span className="capitalize">
              {connectionState === 'connected' ? '● Connected' : connectionState === 'connecting' ? 'Connecting...' : connectionState === 'error' ? 'Error' : '● Disconnected'}
            </span>
          </div>

          {/* Admin Button */}
          <button
            onClick={onOpenAdmin}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors"
            title="Manage Published Firmwares & Manifests"
          >
            <Settings2 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span className="hidden sm:inline">Admin</span>
          </button>

          {/* Help Button */}
          <button
            onClick={onOpenHelp}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Manual Bootloader Instructions & Troubleshooting"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={onToggleDarkMode}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle theme"
            title="Toggle Dark / Light Mode"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>
        </div>

      </div>
    </header>
  );
};

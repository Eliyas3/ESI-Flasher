import React, { useState, useEffect, useRef } from 'react';
import {
  Sun, Moon, Settings2, HelpCircle, Radio,
  Usb, Zap, Loader2, PowerOff, AlertCircle,
  CheckCircle2, RotateCcw, Terminal, Cpu,
  Info, FileCode2, UploadCloud,
  Tv, History, Trash2, Copy, Check, ArrowDownCircle, Pause, Play,
  Volume2, VolumeX, ShieldCheck, Filter, Lock, Sparkles
} from 'lucide-react';
import { EsiLogo } from './components/common/EsiLogo';
import { FirmwareSelector } from './components/dashboard/FirmwareSelector';
import { BootloaderHelpModal } from './components/modals/BootloaderHelpModal';
import { TechDetailsModal } from './components/modals/TechDetailsModal';
import { AdminModal } from './components/admin/AdminModal';
import { SerialMonitorPanel } from './components/console/SerialMonitorPanel';
import { HistoryPanel } from './components/console/HistoryPanel';
import { useFlasherStore } from './stores/useFlasherStore';
import { useTerminalStore } from './stores/useTerminalStore';
import { BoardFamily, TargetChip, ArduinoBoard, ESP32Chip, FlashBaudRate } from './types/hardware';
import { formatBytes, formatDuration, formatHexAddress } from './utils/formatters';
import { calculateSHA256 } from './flasher/checksum';
import { soundEffects } from './utils/soundEffects';

const ESP32_CHIPS: ESP32Chip[] = ['ESP32','ESP32-S2','ESP32-S3','ESP32-C2','ESP32-C3','ESP32-C5','ESP32-C6','ESP32-H2'];
const ARDUINO_BOARDS: ArduinoBoard[] = ['Arduino Uno (ATmega328P)','Arduino Nano (ATmega328P)','Arduino Nano (Old Bootloader)','Arduino Mega 2560','Arduino Leonardo'];

export const App: React.FC = () => {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('esi_theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('esi_admin_auth') === 'true';
    }
    return false;
  });

  const [soundOn, setSoundOn] = useState<boolean>(() => soundEffects.isEnabled());
  const [logFilter, setLogFilter] = useState<'all' | 'error' | 'warn' | 'success' | 'data'>('all');

  const {
    boardFamily, setBoardFamily,
    selectedChip, setSelectedChip,
    connectionState, flashState,
    deviceInfo, selectedImages, selectedMeta,
    flashProgress, flashSettings, setFlashSettings,
    isDemoMode, setIsDemoMode,
    errorMessage, techDetails,
    showBootloaderHelp, setShowBootloaderHelp,
    showTechModal, setShowTechModal,
    isAdminOpen, setIsAdminOpen,
    activeFlasher,
    handleConnect, handleDisconnect,
    selectPublishedFirmware,
    setCustomImages, clearSelectedFirmware,
    handleFlash,
    handleResetDevice,
  } = useFlasherStore();

  const {
    logs, clearLogs,
    activeTab: consoleTab, setActiveTab: setConsoleTab,
    autoScroll, setAutoScroll
  } = useTerminalStore();

  const [copied, setCopied] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  // Sync theme
  useEffect(() => {
    if (darkMode) { 
      document.documentElement.classList.add('dark'); 
      localStorage.setItem('esi_theme','dark'); 
    } else { 
      document.documentElement.classList.remove('dark'); 
      localStorage.setItem('esi_theme','light'); 
    }
  }, [darkMode]);

  // Audio cues on hardware state changes
  useEffect(() => {
    if (connectionState === 'connected') {
      soundEffects.connect();
    } else if (connectionState === 'disconnected') {
      soundEffects.disconnect();
    } else if (connectionState === 'error') {
      soundEffects.error();
    }
  }, [connectionState]);

  useEffect(() => {
    if (flashState === 'success') {
      soundEffects.flashSuccess();
    } else if (flashState === 'error') {
      soundEffects.error();
    }
  }, [flashState]);

  // Auto scroll console
  useEffect(() => {
    if (autoScroll && !isPaused && logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs, autoScroll, isPaused]);

  const handleCopyLogs = () => {
    soundEffects.click();
    const text = logs.map(l => `[${l.timestamp}] [${l.level.toUpperCase()}] ${l.message}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleSound = () => {
    const next = !soundOn;
    soundEffects.setEnabled(next);
    setSoundOn(next);
  };

  const isConnected = connectionState === 'connected';
  const isConnecting = connectionState === 'connecting';
  const isFlashing = ['writing','preparing','erasing','verifying'].includes(flashState);
  const isSuccess = flashState === 'success';
  const isError = flashState === 'error';
  const hasFirmware = selectedImages.length > 0;
  const canFlash = isConnected && hasFirmware && !isFlashing;

  // Step states
  const step1Done = isConnected;
  const step2Done = hasFirmware;
  const step3Active = isFlashing || isSuccess || isError;

  const webSerialSupported = typeof navigator !== 'undefined' && 'serial' in navigator;

  const filteredLogs = logs.filter(l => {
    if (logFilter === 'all') return true;
    return l.level === logFilter;
  });

  return (
    <div className="w-full min-h-screen flex flex-col bg-slate-100 dark:bg-[#0c0f17] text-slate-900 dark:text-slate-100 transition-colors duration-200 overflow-x-hidden">

      {/* ── HEADER (Full Width, Mobile & 16:9 Optimized) ── */}
      <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-[#121624]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div className="w-full px-3 sm:px-6 lg:px-8 xl:px-10 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">

          {/* Brand - Logo background is ALWAYS black in any theme */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <EsiLogo size="sm" />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-base leading-none tracking-tight truncate">
                  Eliyas Science Info
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-extrabold bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 uppercase tracking-wider flex-shrink-0">
                  FLASHER
                </span>
              </div>
              {/* Title below brand: Professional Web Serial Embedded Flasher */}
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium leading-tight mt-0.5 block truncate max-w-[190px] sm:max-w-none">
                Professional Web Serial Embedded Flasher
              </p>
            </div>
          </div>

          {/* Right Controls - Mobile & 16:9 Responsive */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
            {/* Demo mode switch */}
            <button
              onClick={() => {
                soundEffects.click();
                setIsDemoMode(!isDemoMode);
              }}
              className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                isDemoMode
                  ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700 shadow-xs'
                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
              }`}
            >
              <Radio className={`w-3.5 h-3.5 ${isDemoMode ? 'text-amber-500 animate-pulse' : 'text-slate-400'}`} />
              <span>{isDemoMode ? 'Demo Simulator' : 'Hardware Mode'}</span>
            </button>

            {/* Connection Status Pill */}
            <div className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-bold border transition-all ${
              isConnected ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800 shadow-xs'
              : connectionState === 'connecting' ? 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800'
              : connectionState === 'error' ? 'bg-red-50 text-red-700 border-red-300 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800'
              : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-emerald-500 animate-pulse'
                : connectionState === 'connecting' ? 'bg-blue-500 animate-ping'
                : connectionState === 'error' ? 'bg-red-500'
                : 'bg-slate-400'
              }`} />
              <span className="hidden sm:inline">
                {isConnected ? 'Connected' : connectionState === 'connecting' ? 'Connecting...' : connectionState === 'error' ? 'Error' : 'Disconnected'}
              </span>
              <span className="sm:hidden">
                {isConnected ? 'Online' : connectionState === 'connecting' ? 'Connecting' : connectionState === 'error' ? 'Error' : 'Offline'}
              </span>
            </div>

            {/* Admin Login Button */}
            <button 
              onClick={() => {
                soundEffects.click();
                setIsAdminOpen(true);
              }} 
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                isAdminLoggedIn
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700'
              }`}
              title={isAdminLoggedIn ? 'Admin session active (Eliyas)' : 'Administrator login (username: Eliyas)'}
            >
              {isAdminLoggedIn ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="hidden sm:inline">Eliyas (Admin)</span>
                </>
              ) : (
                <>
                  <Settings2 className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden sm:inline">Admin</span>
                </>
              )}
            </button>

            {/* Sound Toggle */}
            <button
              onClick={handleToggleSound}
              className="p-1.5 sm:p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={soundOn ? 'Sound effects enabled (Click to mute)' : 'Sound effects muted (Click to enable)'}
            >
              {soundOn ? <Volume2 className="w-4 h-4 text-blue-600 dark:text-blue-400" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            </button>

            {/* Help */}
            <button 
              onClick={() => {
                soundEffects.click();
                setShowBootloaderHelp(true);
              }} 
              className="p-1.5 sm:p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Bootloader manual wiring help"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {/* Theme Toggle */}
            <button 
              onClick={() => {
                soundEffects.click();
                setDarkMode(!darkMode);
              }} 
              className="p-1.5 sm:p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Toggle theme (White / Dark)"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>
          </div>
        </div>
      </header>

      {/* ── WORKFLOW STRIP (With Chip Logo & Mobile 16:9 Optimized) ── */}
      <div className="w-full bg-gradient-to-r from-white via-slate-50 to-white dark:from-[#121624] dark:via-[#161c2e] dark:to-[#121624] border-b border-slate-200 dark:border-slate-800 px-3 sm:px-6 lg:px-8 xl:px-10 py-3 sm:py-4 transition-colors">
        <div className="w-full">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                {/* Chip Logo replaces star/sparkle icon as requested */}
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800 shadow-xs">
                  <Cpu className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <span>Runs 100% Client-Side In Google Chrome</span>
                </span>
                <span className="text-[11px] text-slate-400 hidden sm:inline">• Web Serial High-Speed Flasher</span>
              </div>
              <h1 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                ESI <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">Hardware Flasher</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                Flash ESP32, ESP8266 and Arduino boards straight from Chrome — zero desktop software, drivers, or IDE installations needed.
              </p>
            </div>

            {/* 3-Step Interactive Workflow Bar (Mobile Responsive) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5 w-full lg:max-w-3xl">
              {[
                { n: 1, label: 'Connect Port', sub: isConnected ? `${boardFamily} connected` : 'Plug USB & Connect', done: step1Done, active: !step1Done },
                { n: 2, label: 'Select Firmware', sub: hasFirmware ? (selectedMeta?.name || 'Firmware ready') : 'Choose project / bin', done: step2Done, active: step1Done && !step2Done },
                { n: 3, label: 'Flash Hardware', sub: isSuccess ? 'Flash Success!' : isError ? 'Check wiring & retry' : 'Write to flash memory', done: isSuccess, active: step3Active, error: isError },
              ].map(s => (
                <div key={s.n} className={`flex items-center gap-2.5 sm:gap-3 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl border transition-all ${
                  s.done && !s.error ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/80 dark:bg-emerald-950/20 shadow-xs'
                  : s.error ? 'border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/20 shadow-xs'
                  : s.active ? 'border-blue-300 dark:border-blue-700 bg-blue-50/80 dark:bg-blue-950/20 shadow-xs'
                  : 'border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 opacity-75'
                }`}>
                  <div className={`relative w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-transform ${
                    s.done && !s.error ? 'bg-emerald-500 text-white'
                    : s.error ? 'bg-red-500 text-white'
                    : s.active ? 'bg-blue-600 text-white animate-pulse'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                  }`}>
                    <span>{s.error ? '!' : s.n}</span>
                    {s.done && !s.error && (
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs border border-white dark:border-slate-900">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider leading-none whitespace-nowrap">Step {s.n}</p>
                      {s.done && !s.error && (
                        <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                          <Check className="w-2.5 h-2.5 stroke-[2.5]" />
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5 truncate">{s.label}</p>
                    <p className={`text-[11px] truncate mt-0.5 ${
                      s.done && !s.error ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                      : s.error ? 'text-red-600 dark:text-red-400 font-semibold'
                      : 'text-slate-500 dark:text-slate-400'
                    }`}>{s.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN WORKSPACE (Full Width & Responsive 16:9) ── */}
      <main className="flex-1 w-full px-3 sm:px-6 lg:px-8 xl:px-10 py-3 sm:py-5 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">

        {/* ═══ LEFT COLUMN (Firmware Selection, Wiring Guide & Console) ═══ */}
        <div className="lg:col-span-7 space-y-4 sm:space-y-5">

          {/* Firmware Selector Card */}
          <div className="bg-white dark:bg-[#121624] rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
            <FirmwareSelector
              boardFamily={boardFamily}
              onSelectPublished={(fw) => {
                soundEffects.select();
                selectPublishedFirmware(fw);
              }}
              selectedFirmwareId={selectedMeta?.id}
              selectedFirmwareName={selectedMeta?.name}
              customImages={selectedImages.filter(i => i.isCustom)}
              onCustomImagesChange={(imgs) => {
                soundEffects.select();
                setCustomImages(imgs, imgs[0]?.name || 'Custom Firmware');
              }}
              onClearCustomImages={() => {
                soundEffects.click();
                clearSelectedFirmware();
              }}
            />
          </div>



          {/* Interactive Console / Serial Monitor / History Panel */}
          <div className="bg-[#0b101d] rounded-2xl border border-slate-800 shadow-xl overflow-hidden flex flex-col" style={{ minHeight: 420 }}>
            {/* Tab & Controls Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-3 sm:px-4 py-2.5 bg-[#0e1424] border-b border-slate-800 select-none">
              {/* Tab Pills */}
              <div className="flex items-center gap-1">
                {([
                  { id: 'console' as const, icon: Terminal, label: 'Console', count: logs.length },
                  { id: 'monitor' as const, icon: Tv, label: 'Serial Monitor', count: undefined },
                  { id: 'history' as const, icon: History, label: 'Flash History', count: undefined },
                ]).map(t => (
                  <button
                    key={t.id}
                    onClick={() => {
                      soundEffects.click();
                      setConsoleTab(t.id);
                    }}
                    className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      consoleTab === t.id 
                        ? 'bg-blue-600 text-white shadow-sm' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                    }`}
                  >
                    <t.icon className="w-3.5 h-3.5" />
                    <span className="hidden xs:inline sm:inline">{t.label}</span>
                    {t.count !== undefined && t.count > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-950 text-blue-300 font-mono">
                        {t.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Console Action Bar */}
              {consoleTab === 'console' && (
                <div className="flex items-center gap-1 text-xs">
                  {/* Log Filter Pills */}
                  <div className="hidden sm:flex items-center gap-1 mr-2 bg-slate-900/80 p-0.5 rounded-lg border border-slate-800">
                    {(['all', 'error', 'warn', 'success'] as const).map(f => (
                      <button
                        key={f}
                        onClick={() => {
                          soundEffects.click();
                          setLogFilter(f);
                        }}
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider transition-all ${
                          logFilter === f
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>

                  <button 
                    onClick={handleCopyLogs} 
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    title="Copy console logs to clipboard"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <button 
                    onClick={() => {
                      soundEffects.click();
                      setIsPaused(!isPaused);
                    }} 
                    className={`p-1.5 rounded-lg transition-colors ${
                      isPaused ? 'bg-amber-950/60 text-amber-400' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                    title={isPaused ? 'Resume auto-scroll' : 'Pause log output'}
                  >
                    {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                  </button>
                  <button 
                    onClick={() => {
                      soundEffects.click();
                      setAutoScroll(!autoScroll);
                    }} 
                    className={`px-2 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors ${
                      autoScroll ? 'bg-blue-950/80 text-blue-400 border border-blue-900/60' : 'text-slate-500 hover:bg-slate-800'
                    }`}
                  >
                    <ArrowDownCircle className="w-3 h-3" /> Auto
                  </button>
                  <button 
                    onClick={() => {
                      soundEffects.click();
                      clearLogs();
                    }} 
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                    title="Clear console output"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Screen Content */}
            <div className="flex-1 min-h-0 flex flex-col">
              {consoleTab === 'console' && (
                <div 
                  ref={logRef} 
                  className="flex-1 h-[340px] sm:h-[400px] p-3 sm:p-4 overflow-y-auto font-mono text-xs leading-relaxed select-text space-y-1 terminal-screen"
                >
                  {logs.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-2 p-4 text-center">
                      <Terminal className="w-8 h-8 opacity-40" />
                      <p className="italic text-xs">Ready for operations. Plug in a board and press Connect.</p>
                      <span className="text-[10px] text-slate-700">Serial logs and flashing handshake telemetry appear here</span>
                    </div>
                  )}
                  {filteredLogs.map(log => {
                    let c = 'text-slate-300';
                    if (log.level === 'error') c = 'text-red-400 font-bold';
                    else if (log.level === 'success') c = 'text-emerald-400 font-semibold';
                    else if (log.level === 'warn') c = 'text-amber-400';
                    else if (log.level === 'debug') c = 'text-slate-500';
                    else if (log.level === 'data') c = 'text-cyan-400';
                    return (
                      <div key={log.id} className="flex items-start gap-2 hover:bg-white/5 py-0.5 px-1 rounded transition-colors">
                        <span className="text-[10px] text-slate-600 flex-shrink-0 pt-0.5 select-none">{log.timestamp}</span>
                        <span className="text-slate-600 flex-shrink-0 select-none">›</span>
                        <span className={`break-all ${c}`}>{log.message}</span>
                      </div>
                    );
                  })}
                </div>
              )}
              {consoleTab === 'monitor' && (
                <SerialMonitorPanel
                  connectionState={connectionState}
                  flashState={flashState}
                  activePort={activeFlasher?.getSerialPort()}
                />
              )}
              {consoleTab === 'history' && <HistoryPanel />}
            </div>
          </div>
        </div>

        {/* ═══ RIGHT COLUMN (Hardware Target, Controls & Telemetry) ═══ */}
        <div className="lg:col-span-5 space-y-4 sm:space-y-5">

          {/* Active Flashing Progress Banner */}
          {(isFlashing || isSuccess || isError) && (
            <div className={`rounded-2xl border p-4 sm:p-5 shadow-lg transition-all animate-fade-in ${
              isSuccess ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
              : isError ? 'bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-800'
              : 'bg-white dark:bg-[#121624] border-blue-400 dark:border-blue-600 ring-2 ring-blue-500/20'
            }`}>
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  {isSuccess ? <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  : isError ? <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  : <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-pulse" />}
                  <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    {isSuccess ? 'Flash Completed Successfully!' : isError ? 'Flashing Interrupted' : `Flashing ${deviceInfo?.chip || selectedChip || boardFamily}`}
                  </span>
                </div>
                <span className="font-mono font-extrabold text-blue-600 dark:text-blue-400 text-sm sm:text-base">
                  {flashProgress?.percentage ?? (isSuccess ? 100 : 0)}%
                </span>
              </div>

              {/* Glowing animated progress bar */}
              <div className="w-full bg-slate-200 dark:bg-slate-700/80 rounded-full h-2.5 overflow-hidden shadow-inner">
                <div
                  className={`h-full rounded-full transition-all duration-200 ${
                    isSuccess ? 'bg-emerald-500' 
                    : isError ? 'bg-red-500' 
                    : 'bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400 animate-pulse'
                  }`}
                  style={{ width: `${flashProgress?.percentage ?? (isSuccess ? 100 : 0)}%` }}
                />
              </div>

              <p className="mt-2 text-xs font-mono text-slate-600 dark:text-slate-400 truncate">
                {flashProgress?.operation || (isSuccess ? 'Hardware flashed and verified.' : isError ? (errorMessage || 'Flashing error.') : 'Preparing device for binary write...')}
              </p>

              {isFlashing && flashProgress && (
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 p-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Written</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-[11px]">
                      {formatBytes(flashProgress.bytesWritten)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Speed</span>
                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-[11px]">
                      {flashProgress.speedKBps} KB/s
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Elapsed</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-[11px]">
                      {formatDuration(flashProgress.elapsedSeconds)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">ETA</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-[11px]">
                      ~{formatDuration(flashProgress.etaSeconds)}
                    </span>
                  </div>
                </div>
              )}

              {isSuccess && (
                <div className="mt-3 flex gap-2">
                  <button 
                    onClick={() => {
                      soundEffects.click();
                      handleResetDevice();
                    }} 
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-blue-500" /> Reset Device
                  </button>
                  <button 
                    onClick={() => {
                      soundEffects.click();
                      setConsoleTab('monitor');
                    }} 
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-xs"
                  >
                    <Terminal className="w-3.5 h-3.5" /> Launch Serial Monitor
                  </button>
                </div>
              )}

              {isError && (
                <div className="mt-2.5 flex items-center justify-between text-xs">
                  <span className="text-red-600 dark:text-red-400 font-semibold">Verify cable, port, and BOOT mode.</span>
                  {techDetails && (
                    <button 
                      onClick={() => {
                        soundEffects.click();
                        setShowTechModal(true);
                      }} 
                      className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                    >
                      Technical Diagnostics
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Flash Target Card */}
          <div className="bg-white dark:bg-[#121624] rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
            {!isConnected && (
              <div className="flex items-center gap-2.5 sm:gap-3 mb-4 p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50">
                <Cpu className="w-5 h-5 text-blue-500 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">No board connected yet</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Connect your board with USB data cable & click Connect USB</p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-blue-500" />
                Target Hardware Architecture
              </h3>
              <button 
                onClick={() => {
                  soundEffects.click();
                  setShowBootloaderHelp(true);
                }} 
                className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-semibold"
              >
                Pinout Guide
              </button>
            </div>

            {/* ESP32 / ESP8266 / Arduino tabs */}
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 mb-3">
              {(['ESP32','ESP8266','Arduino'] as BoardFamily[]).map(f => (
                <button
                  key={f}
                  disabled={isConnected || isFlashing}
                  onClick={() => {
                    soundEffects.select();
                    setBoardFamily(f);
                  }}
                  className={`py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-50 ${
                    boardFamily === f
                      ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Target chip dropdown */}
            <div className="mb-3">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                Target SoC / Microcontroller
              </label>
              <select
                value={selectedChip}
                disabled={isConnected || isFlashing}
                onChange={e => {
                  soundEffects.select();
                  setSelectedChip(e.target.value as TargetChip);
                }}
                className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:opacity-60"
              >
                {boardFamily === 'ESP32' && ESP32_CHIPS.map(c => <option key={c} value={c}>{c}</option>)}
                {boardFamily === 'ESP8266' && <option value="ESP8266">ESP8266EX / NodeMCU</option>}
                {boardFamily === 'Arduino' && ARDUINO_BOARDS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>

              {/* Interactive quick chip pills */}
              {boardFamily === 'ESP32' && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {(['ESP32', 'ESP32-S3', 'ESP32-C3', 'ESP32-C6', 'ESP32-S2'] as ESP32Chip[]).map(c => (
                    <button
                      key={c}
                      type="button"
                      disabled={isConnected || isFlashing}
                      onClick={() => {
                        soundEffects.select();
                        setSelectedChip(c);
                      }}
                      className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all ${
                        selectedChip === c
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}
              {boardFamily === 'Arduino' && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[
                    { label: 'Uno', val: 'Arduino Uno (ATmega328P)' as ArduinoBoard },
                    { label: 'Nano', val: 'Arduino Nano (ATmega328P)' as ArduinoBoard },
                    { label: 'Mega 2560', val: 'Arduino Mega 2560' as ArduinoBoard },
                  ].map(b => (
                    <button
                      key={b.label}
                      type="button"
                      disabled={isConnected || isFlashing}
                      onClick={() => {
                        soundEffects.select();
                        setSelectedChip(b.val);
                      }}
                      className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all ${
                        selectedChip === b.val
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Baud Rate Preset Switcher (ESP32 / ESP8266) */}
            {boardFamily !== 'Arduino' && (
              <div className="mb-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">SPI Flash Baud Rate</span>
                  <span className="font-mono text-xs text-blue-600 dark:text-blue-400 font-bold">
                    {flashSettings.baudRate.toLocaleString()} bps
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { baud: 921600 as FlashBaudRate, label: '921.6K Turbo' },
                    { baud: 460800 as FlashBaudRate, label: '460.8K Fast' },
                    { baud: 115200 as FlashBaudRate, label: '115.2K Safe' },
                  ].map(b => (
                    <button
                      key={b.baud}
                      type="button"
                      disabled={isConnected || isFlashing}
                      onClick={() => {
                        soundEffects.select();
                        setFlashSettings({ ...flashSettings, baudRate: b.baud });
                      }}
                      className={`py-1.5 rounded-lg text-[11px] font-semibold transition-all border ${
                        flashSettings.baudRate === b.baud
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700 shadow-xs'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Connect / Flash Action Buttons */}
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 mt-4">
              {isConnected ? (
                <button
                  onClick={() => {
                    soundEffects.click();
                    handleDisconnect();
                  }}
                  disabled={isFlashing}
                  className="flex items-center justify-center gap-1.5 py-2.5 sm:py-3 rounded-xl text-xs font-bold bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-800 transition-colors disabled:opacity-50 shadow-xs"
                >
                  <PowerOff className="w-4 h-4" /> Disconnect
                </button>
              ) : (
                <button
                  onClick={() => {
                    soundEffects.click();
                    handleConnect();
                  }}
                  disabled={isConnecting}
                  className="flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white transition-all disabled:opacity-60 shadow-md shadow-blue-500/25 active:scale-95"
                >
                  {isConnecting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Connecting...</>
                  ) : (
                    <><Usb className="w-4 h-4" /> Connect USB</>
                  )}
                </button>
              )}

              <button
                onClick={() => {
                  soundEffects.click();
                  handleFlash();
                }}
                disabled={!canFlash}
                className={`flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  canFlash
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md shadow-emerald-500/25 active:scale-95 cursor-pointer'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed border border-slate-200 dark:border-slate-700'
                }`}
              >
                {isFlashing ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Flashing...</>
                ) : (
                  <><Zap className="w-4 h-4" /> Flash Firmware</>
                )}
              </button>
            </div>

            {!canFlash && !isFlashing && (
              <p className="mt-2.5 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                <span>{!isConnected ? 'Plug USB cable and click Connect USB' : 'Pick a firmware from library or drop a .bin file'}</span>
              </p>
            )}
          </div>

          {/* Device Hardware Telemetry Card */}
          <div className="bg-white dark:bg-[#121624] rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-500" />
                Device Telemetry
              </h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isConnected ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
              }`}>
                {isConnected ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>

            <div className="space-y-0 text-xs">
              {[
                { label: 'Chipset', value: isConnected ? (deviceInfo?.chip || '—') : 'Not connected', highlight: isConnected },
                { label: 'USB Adapter', value: isConnected ? (deviceInfo?.adapter || '—') : '—' },
                { label: 'USB ID', value: isConnected ? (deviceInfo?.usbId || '—') : '—', mono: true },
                { label: 'MAC Address', value: isConnected ? (deviceInfo?.mac || '—') : '—', mono: true },
                { label: 'Flash Memory', value: isConnected ? (deviceInfo?.flashSize || '—') : '—' },
              ].map((r, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800/80 last:border-0">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">{r.label}</span>
                  <span className={`text-right truncate max-w-[200px] ${r.mono ? 'font-mono text-[11px]' : 'font-semibold'} ${
                    r.highlight ? 'text-blue-600 dark:text-blue-400 font-bold' : isConnected ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500'
                  }`}>{r.value}</span>
                </div>
              ))}
            </div>

            {/* Flash Settings Checkbox */}
            {flashSettings && (
              <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={flashSettings.eraseAll ?? false}
                    onChange={e => {
                      soundEffects.click();
                      setFlashSettings({ ...flashSettings, eraseAll: e.target.checked });
                    }}
                    className="rounded border-slate-300 dark:border-slate-600 text-blue-600"
                  />
                  <span>Erase entire flash before writing</span>
                </label>
              </div>
            )}
          </div>

          {/* Custom Firmware Drag & Dropzone */}
          <div className="bg-white dark:bg-[#121624] rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-blue-500" />
              Flash Custom Build (.bin / .hex)
            </h3>
            <div
              onClick={() => {
                soundEffects.click();
                document.getElementById('esi-file-input')?.click();
              }}
              className="cursor-pointer rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 p-4 sm:p-5 text-center transition-all bg-slate-50/60 dark:bg-slate-900/40 hover:bg-blue-50/20 group"
            >
              <UploadCloud className="w-7 h-7 sm:w-8 sm:h-8 text-slate-400 group-hover:text-blue-500 mx-auto mb-2 transition-colors" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Drag & drop your firmware file here</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                or <span className="text-blue-600 dark:text-blue-400 font-semibold underline">browse from computer</span>
              </p>
              <p className="text-[10px] text-slate-400 mt-2 font-mono">Accepts .bin .hex — parsed entirely locally</p>
              <input
                id="esi-file-input"
                type="file"
                accept=".bin,.hex"
                className="hidden"
                onChange={async (e) => {
                  if (e.target.files?.length) {
                    const file = e.target.files[0];
                    const buffer = await file.arrayBuffer();
                    const uint8 = new Uint8Array(buffer);
                    const sha256 = await calculateSHA256(uint8);
                    const addr = boardFamily === 'ESP32' ? 0x10000 : 0x0000;
                    const item = {
                      id: 'cust_' + Date.now(),
                      name: file.name, data: uint8,
                      address: addr, addressHex: formatHexAddress(addr),
                      size: uint8.length, sha256, isCustom: true,
                    };
                    soundEffects.select();
                    setCustomImages([item], file.name);
                  }
                }}
              />
            </div>
          </div>
        </div>

      </main>

      {/* ── FOOTER (Full Width, Mobile & 16:9 Optimized) ── */}
      <footer className="w-full border-t border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#121624] py-3.5 sm:py-4 transition-colors">
        <div className="w-full px-3 sm:px-6 lg:px-8 xl:px-10 flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <EsiLogo size="sm" />
            <span className="font-bold text-slate-800 dark:text-slate-200">ESI Flasher</span>
            <span>•</span>
            <span>Eliyas Science Info</span>
            <span className="hidden sm:inline">•</span>
            <span className="text-[11px] text-slate-400 hidden sm:inline">All rights reserved</span>
          </div>
          <div className="flex items-center gap-2.5 sm:gap-3 text-[11px] sm:text-xs">
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" /> Client-Side
            </span>
            <span>•</span>
            <span>Web Serial API</span>
            {webSerialSupported && (
              <span className="text-blue-600 dark:text-blue-400 font-semibold hidden xs:inline">✓ Chrome Supported</span>
            )}
          </div>
        </div>
      </footer>

      {/* Modals */}
      <BootloaderHelpModal 
        isOpen={showBootloaderHelp} 
        onClose={() => setShowBootloaderHelp(false)} 
        boardFamily={boardFamily} 
      />
      <TechDetailsModal 
        isOpen={showTechModal} 
        onClose={() => setShowTechModal(false)} 
        details={techDetails} 
      />
      <AdminModal 
        isOpen={isAdminOpen} 
        onClose={() => setIsAdminOpen(false)}
        onAuthChange={(isAuth) => setIsAdminLoggedIn(isAuth)}
      />
    </div>
  );
};

export default App;

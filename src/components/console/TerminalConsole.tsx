import React, { useRef, useEffect, useState } from 'react';
import { 
  Terminal, 
  Tv, 
  History, 
  Trash2, 
  Copy, 
  Check, 
  ArrowDownCircle, 
  Pause, 
  Play 
} from 'lucide-react';
import { useTerminalStore } from '../../stores/useTerminalStore';
import { SerialMonitorPanel } from './SerialMonitorPanel';
import { HistoryPanel } from './HistoryPanel';
import { ConnectionState, FlashState } from '../../types/hardware';

interface TerminalConsoleProps {
  connectionState: ConnectionState;
  flashState: FlashState;
  activePort?: SerialPort | null;
}

export const TerminalConsole: React.FC<TerminalConsoleProps> = ({
  connectionState,
  flashState,
  activePort,
}) => {
  const { 
    logs, 
    clearLogs, 
    activeTab, 
    setActiveTab, 
    autoScroll, 
    setAutoScroll 
  } = useTerminalStore();

  const [copied, setCopied] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && !isPaused && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll, isPaused]);

  const handleCopyLogs = () => {
    const text = logs.map(l => `[${l.timestamp}] [${l.level.toUpperCase()}] ${l.message}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#0b101d] rounded-2xl border border-slate-800 shadow-xl overflow-hidden flex flex-col h-[520px]">
      
      {/* Top Header & Tabs Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-[#0f172a] border-b border-slate-800/90 select-none">
        
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('console')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'console'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Console</span>
          </button>

          <button
            onClick={() => setActiveTab('monitor')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'monitor'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>Serial Monitor</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'history'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>History</span>
          </button>
        </div>

        {/* Global Action Buttons for Console */}
        {activeTab === 'console' && (
          <div className="flex items-center gap-1.5 text-xs">
            <button
              onClick={handleCopyLogs}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Copy console logs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={() => setIsPaused(!isPaused)}
              className={`p-1.5 rounded-lg border transition-colors ${
                isPaused
                  ? 'bg-amber-950/60 text-amber-400 border-amber-800'
                  : 'text-slate-400 hover:text-white border-transparent hover:bg-slate-800'
              }`}
              title={isPaused ? 'Resume auto log view' : 'Pause log view'}
            >
              {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={() => setAutoScroll(!autoScroll)}
              className={`px-2 py-1 rounded-lg text-[11px] font-semibold border flex items-center gap-1 transition-colors ${
                autoScroll
                  ? 'bg-blue-950/70 text-blue-400 border-blue-800'
                  : 'text-slate-500 border-slate-800'
              }`}
              title="Toggle Auto-Scroll"
            >
              <ArrowDownCircle className="w-3 h-3" />
              <span>Scroll</span>
            </button>

            <button
              onClick={clearLogs}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Clear Console"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

      </div>

      {/* Main Tab Views */}
      <div className="flex-1 min-h-0">
        {activeTab === 'console' && (
          <div
            ref={logContainerRef}
            className="h-full p-4 overflow-y-auto font-mono text-xs leading-relaxed select-text space-y-1 terminal-screen"
          >
            {logs.map((log) => {
              let colorClass = 'text-slate-300';
              if (log.level === 'error') colorClass = 'text-red-400 font-bold';
              else if (log.level === 'success') colorClass = 'text-emerald-400 font-semibold';
              else if (log.level === 'warn') colorClass = 'text-amber-400';
              else if (log.level === 'debug') colorClass = 'text-slate-500';
              else if (log.level === 'data') colorClass = 'text-cyan-400';

              return (
                <div key={log.id} className="flex items-start gap-2.5">
                  <span className="text-[10px] text-slate-600 select-none flex-shrink-0 pt-0.5">
                    {log.timestamp}
                  </span>
                  <span className="text-slate-600 select-none">›</span>
                  <span className={`break-all ${colorClass}`}>
                    {log.message}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'monitor' && (
          <SerialMonitorPanel
            connectionState={connectionState}
            flashState={flashState}
            activePort={activePort}
          />
        )}

        {activeTab === 'history' && (
          <HistoryPanel />
        )}
      </div>

    </div>
  );
};

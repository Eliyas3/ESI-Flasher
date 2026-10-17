import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal, 
  Send, 
  Trash2, 
  Play, 
  Pause, 
  Power, 
  PowerOff, 
  CornerDownLeft, 
  ArrowDownCircle,
  AlertCircle
} from 'lucide-react';
import { SerialMonitorManager } from '../../serial/SerialMonitor';
import { LineEnding } from '../../types/serial';
import { useTerminalStore } from '../../stores/useTerminalStore';
import { ConnectionState, FlashState } from '../../types/hardware';

interface SerialMonitorPanelProps {
  connectionState: ConnectionState;
  flashState: FlashState;
  activePort?: SerialPort | null;
  onDisconnectBoardFlasher?: () => void;
}

const monitorManager = new SerialMonitorManager();

export const SerialMonitorPanel: React.FC<SerialMonitorPanelProps> = ({
  connectionState,
  flashState,
  activePort,
  onDisconnectBoardFlasher,
}) => {
  const { 
    monitorText, 
    isMonitorConnected, 
    isMonitorPaused, 
    monitorBaud, 
    appendMonitor, 
    clearMonitor, 
    setMonitorConnected, 
    setMonitorPaused,
    setMonitorBaud 
  } = useTerminalStore();

  const [inputCommand, setInputCommand] = useState('');
  const [lineEnding, setLineEnding] = useState<LineEnding>('crlf');
  const [autoScroll, setAutoScroll] = useState(true);
  const logContainerRef = useRef<HTMLDivElement>(null);

  const isFlashing = flashState === 'writing' || flashState === 'preparing' || flashState === 'erasing' || flashState === 'verifying';

  useEffect(() => {
    monitorManager.setListener({
      onData: (chunk) => {
        appendMonitor(chunk);
      },
      onError: (err) => {
        appendMonitor(`\n[MONITOR ERROR: ${err}]\n`);
      },
      onConnectionChange: (connected) => {
        setMonitorConnected(connected);
      },
    });

    return () => {
      // Disconnect monitor on unmount if needed
    };
  }, [appendMonitor, setMonitorConnected]);

  // Auto scroll effect
  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [monitorText, autoScroll]);

  const handleToggleConnect = async () => {
    if (isMonitorConnected) {
      await monitorManager.disconnect();
    } else {
      if (isFlashing) {
        alert('Cannot open serial monitor while board flashing is actively in progress.');
        return;
      }
      try {
        await monitorManager.connect(monitorBaud);
      } catch (e: any) {
        // Handled in listener
      }
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputCommand.trim() && lineEnding === 'none') return;
    if (!isMonitorConnected) {
      appendMonitor('\n[WARNING: Serial monitor not connected. Click Connect first.]\n');
      return;
    }

    try {
      await monitorManager.send(inputCommand, lineEnding);
      setInputCommand('');
    } catch (e: any) {
      appendMonitor(`\n[TX ERROR: ${e.message}]\n`);
    }
  };

  const handleTogglePause = () => {
    const next = !isMonitorPaused;
    setMonitorPaused(next);
    monitorManager.setPaused(next);
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0f1d] text-slate-200 font-mono text-xs">
      
      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-[#0d1424] border-b border-slate-800">
        
        {/* Left: Baud Rate & Line Ending */}
        <div className="flex items-center gap-3">
          
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400">Baud:</span>
            <select
              value={monitorBaud}
              disabled={isMonitorConnected}
              onChange={(e) => setMonitorBaud(Number(e.target.value))}
              className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none disabled:opacity-60"
            >
              {[9600, 19200, 38400, 57600, 115200, 230400, 460800, 921600].map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400">Ending:</span>
            <select
              value={lineEnding}
              onChange={(e) => setLineEnding(e.target.value as LineEnding)}
              className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none"
            >
              <option value="none">No line ending</option>
              <option value="lf">Newline (LF)</option>
              <option value="cr">Carriage Return (CR)</option>
              <option value="crlf">Both (CRLF)</option>
            </select>
          </div>

        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          
          <button
            onClick={handleToggleConnect}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
              isMonitorConnected
                ? 'bg-red-950/80 text-red-400 border border-red-800/80 hover:bg-red-900'
                : 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 hover:bg-emerald-900'
            }`}
          >
            {isMonitorConnected ? (
              <>
                <PowerOff className="w-3.5 h-3.5" />
                <span>Disconnect</span>
              </>
            ) : (
              <>
                <Power className="w-3.5 h-3.5" />
                <span>Connect Port</span>
              </>
            )}
          </button>

          <button
            onClick={handleTogglePause}
            className={`p-1.5 rounded-lg border transition-colors ${
              isMonitorPaused
                ? 'bg-amber-950/60 text-amber-400 border-amber-800'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
            }`}
            title={isMonitorPaused ? 'Resume monitor stream' : 'Pause monitor stream'}
          >
            {isMonitorPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={clearMonitor}
            className="p-1.5 rounded-lg bg-slate-900 text-slate-400 border border-slate-800 hover:text-white transition-colors"
            title="Clear monitor buffer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`px-2 py-1 rounded-lg border text-[11px] flex items-center gap-1 transition-colors ${
              autoScroll
                ? 'bg-blue-950 text-blue-400 border-blue-800'
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
            title="Toggle Auto-Scroll"
          >
            <ArrowDownCircle className="w-3 h-3" />
            <span className="hidden sm:inline">Scroll</span>
          </button>

        </div>

      </div>

      {/* Terminal View */}
      <div 
        ref={logContainerRef}
        className="flex-1 p-4 overflow-y-auto whitespace-pre-wrap break-all leading-relaxed select-text font-mono text-emerald-400 bg-[#090d18]"
      >
        {monitorText || (
          <div className="text-slate-600 italic select-none py-12 text-center">
            {isMonitorConnected 
              ? 'Serial port connected. Waiting for serial data...' 
              : 'Serial Monitor offline. Click "Connect Port" to view live device logs & interactive serial output.'}
          </div>
        )}
      </div>

      {/* Command Input Bar */}
      <form
        onSubmit={handleSend}
        className="flex items-center gap-2 p-2.5 bg-[#0d1424] border-t border-slate-800"
      >
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Send command to device (e.g. help, AT, status)..."
            value={inputCommand}
            disabled={!isMonitorConnected}
            onChange={(e) => setInputCommand(e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 text-xs disabled:opacity-50"
          />
        </div>

        <button
          type="submit"
          disabled={!isMonitorConnected}
          className="flex items-center gap-1 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold disabled:opacity-50 transition-colors"
        >
          <span>Send</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>

    </div>
  );
};

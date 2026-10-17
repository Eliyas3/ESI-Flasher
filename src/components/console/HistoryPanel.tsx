import React from 'react';
import { History, Trash2, CheckCircle2, XCircle, Clock, HardDrive, Calendar } from 'lucide-react';
import { useHistoryStore } from '../../stores/useHistoryStore';
import { formatBytes } from '../../utils/formatters';

export const HistoryPanel: React.FC = () => {
  const { history, clearHistory, loading } = useHistoryStore();

  if (loading) {
    return (
      <div className="p-8 text-center text-xs text-slate-400">
        Loading flash history records...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#0a0f1d] text-slate-200">
      
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800 bg-[#0d1424] text-xs">
        <div className="flex items-center gap-2 text-slate-300 font-semibold">
          <History className="w-3.5 h-3.5 text-blue-400" />
          <span>Local Flash History ({history.length} records)</span>
        </div>

        {history.length > 0 && (
          <button
            onClick={clearHistory}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-red-400 transition-colors"
            title="Clear all stored history records"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {/* History Items List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
        {history.length === 0 ? (
          <div className="text-center py-16 text-slate-500 text-xs">
            <History className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>No firmware flashing operations recorded yet.</p>
            <p className="text-[11px] text-slate-600 mt-1">
              Flashing records with duration and metadata are saved locally on this machine.
            </p>
          </div>
        ) : (
          history.map((item) => (
            <div
              key={item.id}
              className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {item.result === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">
                      {item.firmwareName}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-950 text-blue-300 border border-blue-800 font-mono">
                      {item.chip}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {item.version}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      {item.dateStr}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {item.durationSec}s
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <HardDrive className="w-3 h-3 text-slate-500" />
                      {formatBytes(item.sizeBytes)}
                    </span>
                  </div>

                  {item.details && (
                    <p className="mt-1 text-[11px] text-red-400 font-mono">
                      {item.details}
                    </p>
                  )}
                </div>
              </div>

              <div className="self-end sm:self-center">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  item.result === 'success'
                    ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                    : 'bg-red-950/80 text-red-400 border border-red-800/60'
                }`}>
                  {item.result}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
};
